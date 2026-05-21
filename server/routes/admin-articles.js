// ========================================
// 后台文章管理路由 - 需登录认证
// ========================================

const express = require('express')
const { getDatabase } = require('../database')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

// 所有接口需要登录
router.use(authMiddleware)

// 获取文章列表（后台管理用 - 包含草稿）
router.get('/', (req, res) => {
  const db = getDatabase()
  const page = parseInt(req.query.page) || 1
  const pageSize = parseInt(req.query.pageSize) || 20
  const category = req.query.category || ''
  const keyword = req.query.keyword || ''
  const status = req.query.status || ''
  const offset = (page - 1) * pageSize

  let where = 'WHERE 1=1'
  let params = []

  if (category) {
    where += ' AND a.category_id = ?'
    params.push(category)
  }
  if (keyword) {
    where += ' AND (a.title LIKE ? OR a.summary LIKE ?)'
    const kw = `%${keyword}%`
    params.push(kw, kw)
  }
  if (status) {
    where += ' AND a.status = ?'
    params.push(status)
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM articles a ${where}`).get(...params)
  const articles = db.prepare(`
    SELECT a.*, c.name as category_name, c.slug as category_slug
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    ${where}
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset)

  const getTags = db.prepare('SELECT t.* FROM tags t INNER JOIN article_tags at ON t.id = at.tag_id WHERE at.article_id = ?')
  const list = articles.map(a => ({ ...a, tags: getTags.all(a.id) }))

  res.success({ list, total: total.count, page, pageSize, totalPages: Math.ceil(total.count / pageSize) })
})

// 获取单篇文章
router.get('/:id', (req, res) => {
  const db = getDatabase()
  const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id)
  if (!article) return res.fail('文章不存在', 404)

  article.tags = db.prepare('SELECT t.* FROM tags t INNER JOIN article_tags at ON t.id = at.tag_id WHERE at.article_id = ?').all(article.id)
  res.success(article)
})

// 新增文章
router.post('/', (req, res) => {
  const { title, summary, content, cover_url, source_name, source_url, category_id, status, is_featured, tags, published_at } = req.body

  if (!title || !content) {
    return res.fail('标题和正文不能为空')
  }

  const db = getDatabase()
  const now = new Date().toISOString()

  const result = db.prepare(`
    INSERT INTO articles (title, summary, content, cover_url, source_name, source_url, category_id, status, is_featured, published_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title, summary || '', content, cover_url || '', source_name || '', source_url || '',
    category_id || null, status || 'draft', is_featured ? 1 : 0,
    published_at || (status === 'published' ? now : null),
    now, now
  )

  const articleId = result.lastInsertRowid

  // 处理标签
  if (tags && Array.isArray(tags) && tags.length > 0) {
    const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?)')
    const linkTag = db.prepare('INSERT OR IGNORE INTO article_tags (article_id, tag_id) VALUES (?, ?)')

    const transaction = db.transaction((tagsList) => {
      for (const tagName of tagsList) {
        const slug = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w一-龥-]/g, '')
        insertTag.run(tagName, slug)
        const tag = db.prepare('SELECT id FROM tags WHERE slug = ?').get(slug)
        if (tag) linkTag.run(articleId, tag.id)
      }
    })
    transaction(tags)
  }

  db.save()
  res.success({ id: articleId }, '文章创建成功')
})

// 编辑文章
router.put('/:id', (req, res) => {
  const { title, summary, content, cover_url, source_name, source_url, category_id, status, is_featured, tags } = req.body

  if (!title || !content) {
    return res.fail('标题和正文不能为空')
  }

  const db = getDatabase()
  const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id)
  if (!article) return res.fail('文章不存在', 404)

  const now = new Date().toISOString()
  const publishAt = status === 'published' && !article.published_at ? now : article.published_at

  db.prepare(`
    UPDATE articles SET title=?, summary=?, content=?, cover_url=?, source_name=?, source_url=?,
    category_id=?, status=?, is_featured=?, published_at=?, updated_at=?
    WHERE id=?
  `).run(
    title, summary || '', content, cover_url || '', source_name || '', source_url || '',
    category_id || null, status || 'draft', is_featured ? 1 : 0,
    publishAt, now, req.params.id
  )

  // 重新处理标签
  db.prepare('DELETE FROM article_tags WHERE article_id = ?').run(req.params.id)

  if (tags && Array.isArray(tags) && tags.length > 0) {
    const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?)')
    const linkTag = db.prepare('INSERT OR IGNORE INTO article_tags (article_id, tag_id) VALUES (?, ?)')

    const transaction = db.transaction((tagsList) => {
      for (const tagName of tagsList) {
        const slug = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w一-龥-]/g, '')
        insertTag.run(tagName, slug)
        const tag = db.prepare('SELECT id FROM tags WHERE slug = ?').get(slug)
        if (tag) linkTag.run(req.params.id, tag.id)
      }
    })
    transaction(tags)
  }

  db.save()
  res.success(null, '文章更新成功')
})

// 删除文章
router.delete('/:id', (req, res) => {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM articles WHERE id = ?').run(req.params.id)
  if (result.changes === 0) return res.fail('文章不存在', 404)
  db.save()
  res.success(null, '文章删除成功')
})

// 上下架切换
router.patch('/:id/status', (req, res) => {
  const { status } = req.body
  if (!['draft', 'published'].includes(status)) {
    return res.fail('状态值无效')
  }

  const db = getDatabase()
  const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id)
  if (!article) return res.fail('文章不存在', 404)

  const now = new Date().toISOString()
  const publishAt = status === 'published' && !article.published_at ? now : article.published_at

  db.prepare('UPDATE articles SET status=?, published_at=?, updated_at=? WHERE id=?')
    .run(status, publishAt, now, req.params.id)

  db.save()
  res.success(null, status === 'published' ? '文章已发布' : '文章已下架')
})

// 置顶切换
router.patch('/:id/featured', (req, res) => {
  const db = getDatabase()
  const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id)
  if (!article) return res.fail('文章不存在', 404)

  const newFeatured = article.is_featured ? 0 : 1
  db.prepare('UPDATE articles SET is_featured=?, updated_at=? WHERE id=?')
    .run(newFeatured, new Date().toISOString(), req.params.id)

  db.save()
  res.success(null, newFeatured ? '已设为置顶' : '已取消置顶')
})

module.exports = router
