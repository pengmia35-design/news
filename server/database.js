// ========================================
// 数据库初始化 - sql.js (纯JS SQLite)
// 自动创建表结构，无需手动建表
// ========================================

const initSqlJs = require('sql.js')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')

const DB_PATH = path.join(__dirname, 'news.db')
let db = null

// sql.js 包装器 - 提供类似 better-sqlite3 的 API
class StatementWrapper {
  constructor(sqlDb, sql) {
    this.db = sqlDb
    this.sql = sql
  }

  run(...params) {
    try {
      this.db.run(this.sql, params)
      const result = this.db.exec("SELECT changes() AS changes, last_insert_rowid() AS id")
      return {
        changes: result.length > 0 ? result[0].values[0][0] : 0,
        lastInsertRowid: result.length > 0 ? result[0].values[0][1] : 0
      }
    } catch (e) {
      console.error('SQL run error:', e.message, '\nSQL:', this.sql, '\nParams:', params)
      throw e
    }
  }

  get(...params) {
    try {
      const stmt = this.db.prepare(this.sql)
      if (params.length > 0) stmt.bind(params)
      if (stmt.step()) {
        const result = stmt.getAsObject()
        stmt.free()
        return result
      }
      stmt.free()
      return undefined
    } catch (e) {
      console.error('SQL get error:', e.message, '\nSQL:', this.sql, '\nParams:', params)
      throw e
    }
  }

  all(...params) {
    try {
      const stmt = this.db.prepare(this.sql)
      if (params.length > 0) stmt.bind(params)
      const results = []
      while (stmt.step()) {
        results.push(stmt.getAsObject())
      }
      stmt.free()
      return results
    } catch (e) {
      console.error('SQL all error:', e.message, '\nSQL:', this.sql, '\nParams:', params)
      throw e
    }
  }
}

function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized.')
  }
  return {
    prepare: (sql) => new StatementWrapper(db, sql),
    run: (sql, params) => new StatementWrapper(db, sql).run(...params),
    exec: (sql) => db.exec(sql),
    save: saveDatabase,
    // 简易事务
    transaction: (fn) => {
      return (...args) => {
        db.exec('BEGIN')
        try {
          const result = fn(...args)
          db.exec('COMMIT')
          return result
        } catch (e) {
          db.exec('ROLLBACK')
          throw e
        }
      }
    }
  }
}

function saveDatabase() {
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(DB_PATH, buffer)
}

async function initDatabase() {
  const SQL = await initSqlJs()

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH)
    db = new SQL.Database(fileBuffer)
  } else {
    db = new SQL.Database()
  }

  db.exec('PRAGMA journal_mode=WAL')
  db.exec('PRAGMA foreign_keys=ON')

  // 创建表结构
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      summary TEXT DEFAULT '',
      content TEXT DEFAULT '',
      cover_url TEXT DEFAULT '',
      source_name TEXT DEFAULT '',
      source_url TEXT DEFAULT '',
      category_id INTEGER,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published')),
      is_featured INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      published_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
    CREATE TABLE IF NOT EXISTS article_tags (
      article_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (article_id, tag_id),
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      nickname TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS carousel_slides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_url TEXT NOT NULL,
      title TEXT DEFAULT '',
      description TEXT DEFAULT '',
      link TEXT DEFAULT '',
      tag TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 客服系统：问题分类标签
    CREATE TABLE IF NOT EXISTS problem_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      parent_id INTEGER,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES problem_tags(id)
    );

    -- 客服系统：对话会话
    CREATE TABLE IF NOT EXISTS chat_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      user_name TEXT DEFAULT '',
      status TEXT DEFAULT 'waiting' CHECK(status IN ('waiting','active','resolved','closed')),
      problem_tag_id INTEGER,
      rating INTEGER,
      rating_tags TEXT DEFAULT '',
      rating_text TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      closed_at DATETIME,
      FOREIGN KEY (problem_tag_id) REFERENCES problem_tags(id)
    );

    -- 客服系统：消息
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      sender_type TEXT NOT NULL CHECK(sender_type IN ('user','agent')),
      sender_id TEXT NOT NULL,
      content TEXT NOT NULL,
      content_type TEXT DEFAULT 'text' CHECK(content_type IN ('text','image')),
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
    );

    -- 客服系统：FAQ 分类
    CREATE TABLE IF NOT EXISTS faq_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 客服系统：FAQ 文章
    CREATE TABLE IF NOT EXISTS faq_articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      helpful_count INTEGER DEFAULT 0,
      unhelpful_count INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      is_published INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES faq_categories(id)
    );

    -- 客服系统：FAQ 收藏
    CREATE TABLE IF NOT EXISTS faq_favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      article_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (article_id) REFERENCES faq_articles(id) ON DELETE CASCADE,
      UNIQUE(user_id, article_id)
    );

    -- 客服系统：快捷回复
    CREATE TABLE IF NOT EXISTS quick_replies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      is_public INTEGER DEFAULT 1,
      agent_id TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 客服系统：系统配置
    CREATE TABLE IF NOT EXISTS system_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      config_key TEXT NOT NULL UNIQUE,
      config_value TEXT DEFAULT '',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 客服系统：离线留言
    CREATE TABLE IF NOT EXISTS offline_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      user_name TEXT DEFAULT '',
      problem_tag_id INTEGER,
      content TEXT NOT NULL,
      contact_info TEXT DEFAULT '',
      is_converted INTEGER DEFAULT 0,
      converted_conversation_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // 插入默认分类
  const catResult = db.exec("SELECT COUNT(*) AS cnt FROM categories")
  if (catResult.length > 0 && catResult[0].values[0][0] === 0) {
    const categories = [
      ['AI行业资讯', 'ai-news', 'AI大模型、人工智能行业最新动态', 1],
      ['算力&云服务', 'cloud-computing', '算力、云服务套餐、数据中心', 2],
      ['芯片&英伟达', 'nvidia-chip', '英伟达GPU、芯片行业、算力硬件', 3],
      ['开发工具', 'dev-tools', 'Cursor、Claude Code、GitHub、开发工具', 4],
      ['前沿科技动态', 'tech-trends', '前沿科技、编程开发、技术趋势', 5],
    ]
    for (const cat of categories) {
      db.run('INSERT INTO categories (name, slug, description, sort_order) VALUES (?, ?, ?, ?)', cat)
    }
  }

  // 插入默认管理员
  const admResult = db.exec("SELECT COUNT(*) AS cnt FROM admins")
  if (admResult.length > 0 && admResult[0].values[0][0] === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10)
    db.run('INSERT INTO admins (username, password, nickname) VALUES (?, ?, ?)', ['admin', hashedPassword, '管理员'])
  }

  // === 客服系统：种子数据 ===

  // 插入问题分类标签
  const tagResult = db.exec("SELECT COUNT(*) AS cnt FROM problem_tags")
  if (tagResult.length > 0 && tagResult[0].values[0][0] === 0) {
    const parentTags = [
      ['订阅扣费', 'subscription-billing', 1],
      ['充值支付', 'payment', 2],
      ['账号问题', 'account', 3],
      ['工具使用', 'tool-usage', 4],
      ['售后反馈', 'after-sales', 5],
      ['其他问题', 'other', 6]
    ]
    const childTags = {
      'subscription-billing': [['取消自动续费', 'cancel-auto-renew'], ['扣费失败', 'charge-failed'], ['订阅失效', 'subscription-expired'], ['账单查询', 'bill-inquiry']],
      'payment': [['充值失败', 'topup-failed'], ['到账延迟', 'payment-delay'], ['退款咨询', 'refund-inquiry'], ['支付异常', 'payment-error']],
      'account': [['登录解绑', 'login-unbind'], ['验证码异常', 'verification-error'], ['设备限制', 'device-limit']],
      'tool-usage': [['AI功能异常', 'ai-error'], ['API绑定问题', 'api-binding'], ['权限异常', 'permission-error']],
      'after-sales': [['退款进度', 'refund-progress'], ['服务投诉', 'service-complaint'], ['意见建议', 'feedback']],
      'other': [['通用咨询', 'general'], ['其他疑问', 'other-misc']]
    }
    for (const [i, p] of parentTags.entries()) {
      db.run('INSERT INTO problem_tags (name, slug, sort_order) VALUES (?, ?, ?)', p)
      const parentId = i + 1
      for (const [j, c] of (childTags[p[1]] || []).entries()) {
        db.run('INSERT INTO problem_tags (name, slug, parent_id, sort_order) VALUES (?, ?, ?, ?)', [c[0], c[1], parentId, j])
      }
    }
  }

  // 插入默认 FAQ 分类
  const faqCatResult = db.exec("SELECT COUNT(*) AS cnt FROM faq_categories")
  if (faqCatResult.length > 0 && faqCatResult[0].values[0][0] === 0) {
    db.run('INSERT INTO faq_categories (name, slug, sort_order) VALUES (?, ?, ?)', ['通用问题', 'general', 1])
  }

  // 插入系统默认配置
  const cfgResult = db.exec("SELECT COUNT(*) AS cnt FROM system_config")
  if (cfgResult.length > 0 && cfgResult[0].values[0][0] === 0) {
    const configs = [
      ['welcome_message', '您好！欢迎使用 TechAI 客服，请问有什么可以帮您？'],
      ['response_time_hint', '我们会在 20 分钟内回复您，请耐心等待'],
      ['offline_hours_message', '当前为非工作时间，我们会在下一个工作日尽快回复您'],
      ['ai_enabled', '0'],
      ['ai_api_endpoint', 'https://api.openai.com/v1/chat/completions'],
      ['ai_api_key', ''],
      ['ai_model', 'gpt-4o-mini'],
      ['agent_online', '0']
    ]
    for (const c of configs) {
      db.run('INSERT INTO system_config (config_key, config_value) VALUES (?, ?)', c)
    }
  }

  // === 迁移：补种新增的 system_config 键 ===
  const newConfigs = [
    ['ai_enabled', '0'],
    ['ai_api_endpoint', 'https://api.openai.com/v1/chat/completions'],
    ['ai_api_key', ''],
    ['ai_model', 'gpt-4o-mini'],
    ['agent_online', '0']
  ]
  for (const [key, val] of newConfigs) {
    const exists = db.exec(`SELECT COUNT(*) AS cnt FROM system_config WHERE config_key = '${key}'`)
    if (exists.length > 0 && exists[0].values[0][0] === 0) {
      db.run('INSERT INTO system_config (config_key, config_value) VALUES (?, ?)', [key, val])
    }
  }

  // === 迁移：offline_messages 添加 updated_at 列 ===
  (() => {
    const cols = db.exec("SELECT name FROM pragma_table_info('offline_messages')")
    const colNames = cols[0]?.values.map(v => v[0]) || []
    if (!colNames.includes('updated_at')) {
      db.exec("ALTER TABLE offline_messages ADD COLUMN updated_at DATETIME")
    }
  })();

  // === 迁移：为 articles 表添加 like_count 和 comment_count 字段 ===
  const cols = db.exec("SELECT name FROM pragma_table_info('articles')")
  const colNames = cols[0]?.values.map(v => v[0]) || []
  if (!colNames.includes('like_count')) {
    db.exec("ALTER TABLE articles ADD COLUMN like_count INTEGER DEFAULT 0")
  }
  if (!colNames.includes('comment_count')) {
    db.exec("ALTER TABLE articles ADD COLUMN comment_count INTEGER DEFAULT 0")
  }

  // === 创建评论表 ===
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL,
      nickname TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    );
  `)

  // === 初始化随机点赞/评论数据（首次迁移） ===
  const migrateFlag = db.exec("SELECT COUNT(*) as cnt FROM pragma_table_info('articles') WHERE name='like_count'")
  if (migrateFlag.length > 0) {
    const existingLikes = db.exec("SELECT COUNT(*) as cnt FROM articles WHERE like_count > 0")
    const needsSeed = existingLikes.length === 0 || existingLikes[0].values[0][0] === 0
    if (needsSeed) {
      const articles = db.exec("SELECT id FROM articles")
      if (articles.length > 0) {
        const ids = articles[0].values.map(v => v[0])
        for (const id of ids) {
          const likes = Math.floor(Math.random() * 5000) + 100
          const comments = Math.floor(Math.random() * 300) + 10
          db.run('UPDATE articles SET like_count = ?, comment_count = ? WHERE id = ?', [likes, comments, id])
        }
        console.log('  ✅ 已初始化点赞/评论数据')
      }
    }
  }

  // === 迁移：为 chat_conversations 表添加 queue_position 字段 ===
  const convCols = db.exec("SELECT name FROM pragma_table_info('chat_conversations')")
  const convColNames = convCols[0]?.values.map(v => v[0]) || []
  if (!convColNames.includes('queue_position')) {
    db.exec("ALTER TABLE chat_conversations ADD COLUMN queue_position INTEGER DEFAULT 0")
  }

  saveDatabase()
  console.log('  ✅ 数据库初始化完成')
  return getDatabase()
}

function closeDatabase() {
  if (db) {
    saveDatabase()
    db.close()
    db = null
  }
}

module.exports = { getDatabase, initDatabase, closeDatabase, saveDatabase }
