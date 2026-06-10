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
let saveInterval = null

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
      ['AI行业应用', 'ai-applications', 'AI在各行业的落地应用案例', 6],
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

  // === 创建评论表 ===
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


  saveDatabase()

  // 每 5 分钟自动持久化，防止意外退出丢数据
  saveInterval = setInterval(() => {
    try { saveDatabase() } catch (e) { /* silent */ }
  }, 300000)

  console.log('  ✅ 数据库初始化完成 (自动保存: 5min)')
  return getDatabase()
}

function closeDatabase() {
  if (saveInterval) { clearInterval(saveInterval); saveInterval = null }
  if (db) {
    saveDatabase()
    db.close()
    db = null
  }
}

module.exports = { getDatabase, initDatabase, closeDatabase, saveDatabase }
