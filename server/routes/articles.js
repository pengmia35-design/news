// ========================================
// 新闻文章路由 - 公开接口
// ========================================

// 行业分类主图映射
const CATEGORY_COVERS = {
  'ai-news': 'https://picsum.photos/seed/ai2026/800/400',
  'cloud-computing': 'https://picsum.photos/seed/cloud2026/800/400',
  'nvidia-chip': 'https://picsum.photos/seed/chip2026/800/400',
  'dev-tools': 'https://picsum.photos/seed/devtool2026/800/400',
  'ai-applications': 'https://picsum.photos/seed/aiapp2026/800/400',
  'tech-trends': 'https://picsum.photos/seed/tech2026/800/400'
}

const express = require('express')
const { getDatabase } = require('../database')

const router = express.Router()

// 获取文章列表（分页）
router.get('/', (req, res) => {
  const db = getDatabase()
  const page = parseInt(req.query.page) || 1
  const pageSize = parseInt(req.query.pageSize) || 20
  const category = req.query.category || ''
  const tag = req.query.tag || ''
  const keyword = req.query.keyword || ''
  const status = req.query.status || 'published'
  const featured = req.query.featured || ''

  let where = "WHERE a.status = ?"
  let params = [status]

  if (category) {
    where += " AND c.slug = ?"
    params.push(category)
  }

  if (tag) {
    where += " AND t.slug = ?"
    params.push(tag)
  }

  if (keyword) {
    where += " AND (a.title LIKE ? OR a.summary LIKE ? OR a.content LIKE ?)"
    const kw = `%${keyword}%`
    params.push(kw, kw, kw)
  }

  if (featured === 'true') {
    where += " AND a.is_featured = 1"
  }

  const joinTag = tag ? " LEFT JOIN article_tags at2 ON a.id = at2.article_id LEFT JOIN tags t ON at2.tag_id = t.id" : ""
  const joinCondition = tag ? "" : ""

  const countSql = `SELECT COUNT(DISTINCT a.id) as count FROM articles a LEFT JOIN categories c ON a.category_id = c.id${joinTag} ${where}`
  const total = db.prepare(countSql).get(...params)

  const offset = (page - 1) * pageSize
  const sql = `
    SELECT DISTINCT a.id, a.title, a.summary, SUBSTR(a.content, 1, 300) as content_preview,
           a.cover_url, a.source_name, a.source_url,
           a.status, a.is_featured, a.view_count, a.like_count, a.comment_count,
           a.published_at, a.created_at, a.updated_at,
           c.id as category_id, c.name as category_name, c.slug as category_slug
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    ${joinTag}
    ${where}
    ORDER BY a.is_featured DESC, a.published_at DESC
    LIMIT ? OFFSET ?
  `

  const articles = db.prepare(sql).all(...params, pageSize, offset)

  // 查询每篇文章的标签
  const getTags = db.prepare(`
    SELECT t.id, t.name, t.slug FROM tags t
    INNER JOIN article_tags at ON t.id = at.tag_id
    WHERE at.article_id = ?
  `)

  const list = articles.map(article => ({
    ...article,
    tags: getTags.all(article.id),
    cover_url: CATEGORY_COVERS[article.category_slug] || article.cover_url
  }))

  res.success({
    list,
    total: total.count,
    page,
    pageSize,
    totalPages: Math.ceil(total.count / pageSize)
  })
})

// 获取文章评论（分页）
router.get('/:id/comments', (req, res) => {
  const db = getDatabase()
  const page = parseInt(req.query.page) || 1
  const pageSize = parseInt(req.query.pageSize) || 20
  const offset = (page - 1) * pageSize

  const total = db.prepare('SELECT COUNT(*) as count FROM comments WHERE article_id = ?').get(req.params.id)
  const comments = db.prepare('SELECT id, nickname, content, created_at FROM comments WHERE article_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(req.params.id, pageSize, offset)

  res.success({ list: comments, total: total.count, page, pageSize, totalPages: Math.ceil(total.count / pageSize) })
})

// 发表评论
router.post('/:id/comments', (req, res) => {
  const { nickname, content } = req.body
  if (!nickname || !nickname.trim()) return res.fail('请输入昵称')
  if (!content || !content.trim()) return res.fail('请输入评论内容')
  if (nickname.length > 20) return res.fail('昵称不能超过20个字符')
  if (content.length > 1000) return res.fail('评论内容不能超过1000个字符')

  const db = getDatabase()
  db.prepare('INSERT INTO comments (article_id, nickname, content) VALUES (?, ?, ?)').run(req.params.id, nickname.trim(), content.trim())
  db.prepare('UPDATE articles SET comment_count = comment_count + 1 WHERE id = ?').run(req.params.id)
  db.save()

  res.success(null, '评论发表成功')
})

// 点赞
router.post('/:id/like', (req, res) => {
  const db = getDatabase()
  db.prepare('UPDATE articles SET like_count = like_count + 1 WHERE id = ?').run(req.params.id)
  db.save()

  const article = db.prepare('SELECT like_count FROM articles WHERE id = ?').get(req.params.id)
  res.success({ like_count: article.like_count })
})

// 获取文章详情
router.get('/:id', (req, res) => {
  const db = getDatabase()
  const article = db.prepare(`
    SELECT a.*, c.name as category_name, c.slug as category_slug
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.id = ?
  `).get(req.params.id)

  if (!article) {
    return res.fail('文章不存在', 404)
  }

  // 行业主图
  article.cover_url = CATEGORY_COVERS[article.category_slug] || article.cover_url

  // 获取标签
  article.tags = db.prepare(`
    SELECT t.id, t.name, t.slug FROM tags t
    INNER JOIN article_tags at ON t.id = at.tag_id
    WHERE at.article_id = ?
  `).all(article.id)

  // 上一篇/下一篇
  article.prev = db.prepare(`
    SELECT id, title FROM articles
    WHERE status = 'published' AND published_at < ?
    ORDER BY published_at DESC LIMIT 1
  `).get(article.published_at) || null

  article.next = db.prepare(`
    SELECT id, title FROM articles
    WHERE status = 'published' AND published_at > ?
    ORDER BY published_at ASC LIMIT 1
  `).get(article.published_at) || null

  // 增加阅读量
  db.prepare('UPDATE articles SET view_count = view_count + 1 WHERE id = ?').run(article.id)
  db.save()
  article.view_count += 1

  res.success(article)
})

// 按分类获取文章
router.get('/category/:slug', (req, res) => {
  req.query.category = req.params.slug
  // 复用列表路由逻辑 - 直接转发
  const db = getDatabase()
  const page = parseInt(req.query.page) || 1
  const pageSize = parseInt(req.query.pageSize) || 20

  const category = db.prepare('SELECT * FROM categories WHERE slug = ?').get(req.params.slug)
  if (!category) return res.fail('分类不存在', 404)

  const total = db.prepare("SELECT COUNT(*) as count FROM articles WHERE category_id = ? AND status = 'published'").get(category.id)
  const offset = (page - 1) * pageSize
  const articles = db.prepare(`
    SELECT a.id, a.title, a.summary, SUBSTR(a.content, 1, 300) as content_preview,
           a.cover_url, a.source_name, a.source_url,
           a.status, a.is_featured, a.view_count, a.like_count, a.comment_count,
           a.published_at, a.created_at, a.updated_at,
           c.name as category_name, c.slug as category_slug
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.category_id = ? AND a.status = 'published'
    ORDER BY a.published_at DESC
    LIMIT ? OFFSET ?
  `).all(category.id, pageSize, offset)

  const getTags = db.prepare('SELECT t.id, t.name, t.slug FROM tags t INNER JOIN article_tags at ON t.id = at.tag_id WHERE at.article_id = ?')
  const list = articles.map(a => ({
    ...a,
    tags: getTags.all(a.id),
    cover_url: CATEGORY_COVERS[a.category_slug || category.slug] || a.cover_url
  }))

  res.success({ list, total: total.count, page, pageSize, totalPages: Math.ceil(total.count / pageSize), category })
})

module.exports = router
