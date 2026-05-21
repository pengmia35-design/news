// ========================================
// 爬虫入库接口 - 预留外部POST入库
// 外部系统/爬虫可通过此接口入库新闻
// ========================================

const express = require('express')
const { getDatabase } = require('../database')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

// 爬虫入库 - 需要管理员Token认证（或可配置API Key）
router.post('/import', authMiddleware, (req, res) => {
  const { title, summary, content, cover_url, source_name, source_url, category_slug, tags } = req.body

  if (!title || !content) {
    return res.fail('标题和正文不能为空')
  }

  const db = getDatabase()

  // 解析分类
  let categoryId = null
  if (category_slug) {
    const category = db.prepare('SELECT id FROM categories WHERE slug = ?').get(category_slug)
    if (category) categoryId = category.id
  }

  // 插入文章
  const result = db.prepare(`
    INSERT INTO articles (title, summary, content, cover_url, source_name, source_url, category_id, status, published_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'published', datetime('now'), datetime('now'), datetime('now'))
  `).run(title, summary || '', content, cover_url || '', source_name || '', source_url || '', categoryId)

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
  res.success({ id: articleId }, '文章入库成功')
})

// 批量入库
router.post('/import/batch', authMiddleware, (req, res) => {
  const { articles } = req.body
  if (!articles || !Array.isArray(articles) || articles.length === 0) {
    return res.fail('文章列表不能为空')
  }

  const db = getDatabase()
  let successCount = 0
  let failCount = 0

  const insertArticle = db.prepare(`
    INSERT INTO articles (title, summary, content, cover_url, source_name, source_url, category_id, status, published_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'published', datetime('now'), datetime('now'), datetime('now'))
  `)

  const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?)')
  const linkTag = db.prepare('INSERT OR IGNORE INTO article_tags (article_id, tag_id) VALUES (?, ?)')

  const transaction = db.transaction((items) => {
    for (const article of items) {
      try {
        if (!article.title || !article.content) {
          failCount++
          continue
        }

        let categoryId = null
        if (article.category_slug) {
          const category = db.prepare('SELECT id FROM categories WHERE slug = ?').get(article.category_slug)
          if (category) categoryId = category.id
        }

        const result = insertArticle.run(
          article.title, article.summary || '', article.content,
          article.cover_url || '', article.source_name || '', article.source_url || '',
          categoryId
        )

        const articleId = result.lastInsertRowid

        if (article.tags && Array.isArray(article.tags)) {
          for (const tagName of article.tags) {
            const slug = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w一-龥-]/g, '')
            insertTag.run(tagName, slug)
            const tag = db.prepare('SELECT id FROM tags WHERE slug = ?').get(slug)
            if (tag) linkTag.run(articleId, tag.id)
          }
        }

        successCount++
      } catch (e) {
        failCount++
      }
    }
  })

  transaction(articles)
  db.save()
  res.success({ successCount, failCount, total: articles.length }, `批量入库完成，成功${successCount}篇，失败${failCount}篇`)
})

module.exports = router
