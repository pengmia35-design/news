// ========================================
// 标签路由
// ========================================

const express = require('express')
const { getDatabase } = require('../database')

const router = express.Router()

// 获取标签列表（含文章数）
router.get('/', (req, res) => {
  const db = getDatabase()
  const tags = db.prepare(`
    SELECT t.*, (SELECT COUNT(*) FROM article_tags at INNER JOIN articles a ON at.article_id = a.id WHERE at.tag_id = t.id AND a.status = 'published') as article_count
    FROM tags t
    ORDER BY article_count DESC
  `).all()
  res.success(tags)
})

// 按标签获取文章
router.get('/:slug/articles', (req, res) => {
  const db = getDatabase()
  const tag = db.prepare('SELECT * FROM tags WHERE slug = ?').get(req.params.slug)
  if (!tag) return res.fail('标签不存在', 404)

  const page = parseInt(req.query.page) || 1
  const pageSize = parseInt(req.query.pageSize) || 20
  const offset = (page - 1) * pageSize

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM article_tags at
    INNER JOIN articles a ON at.article_id = a.id
    WHERE at.tag_id = ? AND a.status = 'published'
  `).get(tag.id)

  const articles = db.prepare(`
    SELECT a.*, c.name as category_name, c.slug as category_slug
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    INNER JOIN article_tags at ON a.id = at.article_id
    WHERE at.tag_id = ? AND a.status = 'published'
    ORDER BY a.published_at DESC
    LIMIT ? OFFSET ?
  `).all(tag.id, pageSize, offset)

  const getTags = db.prepare('SELECT t.* FROM tags t INNER JOIN article_tags at ON t.id = at.tag_id WHERE at.article_id = ?')
  const list = articles.map(a => ({ ...a, tags: getTags.all(a.id) }))

  res.success({ list, total: total.count, page, pageSize, totalPages: Math.ceil(total.count / pageSize), tag })
})

module.exports = router
