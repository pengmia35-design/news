const express = require('express')
const router = express.Router()
const { getDatabase } = require('../database')

// GET /api/faq/categories - FAQ 分类列表
router.get('/categories', (req, res) => {
  try {
    const db = getDatabase()
    const list = db.prepare(`
      SELECT fc.*,
        (SELECT COUNT(*) FROM faq_articles WHERE category_id = fc.id AND is_published = 1) AS article_count
      FROM faq_categories fc
      ORDER BY fc.sort_order
    `).all()
    res.success(list, 'ok')
  } catch (e) {
    console.error('获取FAQ分类失败:', e)
    res.fail('获取FAQ分类失败', 500)
  }
})

// GET /api/faq/articles - FAQ 文章列表
router.get('/articles', (req, res) => {
  try {
    const db = getDatabase()
    const { category_id, keyword, page = 1, pageSize = 20 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(pageSize)

    let where = 'WHERE a.is_published = 1'
    const params = []

    if (category_id) {
      where += ' AND a.category_id = ?'
      params.push(category_id)
    }
    if (keyword) {
      where += ' AND (a.title LIKE ? OR a.content LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }

    const total = db.prepare(
      `SELECT COUNT(*) AS cnt FROM faq_articles a ${where}`
    ).get(...params).cnt

    const list = db.prepare(`
      SELECT a.*, fc.name AS category_name
      FROM faq_articles a
      LEFT JOIN faq_categories fc ON a.category_id = fc.id
      ${where}
      ORDER BY a.sort_order, a.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(pageSize), offset)

    res.success({
      list, total, page: parseInt(page), pageSize: parseInt(pageSize),
      totalPages: Math.ceil(total / parseInt(pageSize))
    }, 'ok')
  } catch (e) {
    console.error('获取FAQ文章失败:', e)
    res.fail('获取FAQ文章失败', 500)
  }
})

// GET /api/faq/articles/search - 全文搜索
router.get('/articles/search', (req, res) => {
  try {
    const db = getDatabase()
    const { keyword } = req.query
    if (!keyword) return res.fail('请输入搜索关键词', 400)

    const list = db.prepare(`
      SELECT a.*, fc.name AS category_name
      FROM faq_articles a
      LEFT JOIN faq_categories fc ON a.category_id = fc.id
      WHERE a.is_published = 1 AND (a.title LIKE ? OR a.content LIKE ?)
      ORDER BY a.sort_order, a.created_at DESC
      LIMIT 20
    `).all(`%${keyword}%`, `%${keyword}%`)

    res.success(list, 'ok')
  } catch (e) {
    console.error('搜索FAQ失败:', e)
    res.fail('搜索FAQ失败', 500)
  }
})

// GET /api/faq/articles/:id - 文章详情
router.get('/articles/:id', (req, res) => {
  try {
    const db = getDatabase()
    const article = db.prepare(`
      SELECT a.*, fc.name AS category_name
      FROM faq_articles a
      LEFT JOIN faq_categories fc ON a.category_id = fc.id
      WHERE a.id = ?
    `).get(req.params.id)

    if (!article) return res.fail('文章不存在', 404)

    // 阅读量 +1
    db.prepare('UPDATE faq_articles SET view_count = view_count + 1 WHERE id = ?').run(req.params.id)

    // 上一篇/下一篇文章
    const prev = db.prepare(
      'SELECT id, title FROM faq_articles WHERE is_published = 1 AND sort_order < ? ORDER BY sort_order DESC LIMIT 1'
    ).get(article.sort_order)
    const next = db.prepare(
      'SELECT id, title FROM faq_articles WHERE is_published = 1 AND sort_order > ? ORDER BY sort_order ASC LIMIT 1'
    ).get(article.sort_order)

    // 同分类相关文章
    const related = db.prepare(`
      SELECT id, title FROM faq_articles
      WHERE is_published = 1 AND category_id = ? AND id != ?
      ORDER BY sort_order LIMIT 5
    `).all(article.category_id, article.id)

    db.save()
    res.success({ ...article, prev, next, related }, 'ok')
  } catch (e) {
    console.error('获取FAQ文章详情失败:', e)
    res.fail('获取FAQ文章详情失败', 500)
  }
})

// POST /api/faq/articles/:id/feedback - 有用/无用反馈
router.post('/articles/:id/feedback', (req, res) => {
  try {
    const db = getDatabase()
    const { helpful } = req.body

    if (helpful) {
      db.prepare('UPDATE faq_articles SET helpful_count = helpful_count + 1 WHERE id = ?').run(req.params.id)
    } else {
      db.prepare('UPDATE faq_articles SET unhelpful_count = unhelpful_count + 1 WHERE id = ?').run(req.params.id)
    }
    db.save()
    res.success(null, '感谢反馈')
  } catch (e) {
    console.error('提交反馈失败:', e)
    res.fail('提交反馈失败', 500)
  }
})

// GET /api/faq/favorites - 用户收藏列表
router.get('/favorites', (req, res) => {
  try {
    const db = getDatabase()
    const { user_id } = req.query
    if (!user_id) return res.fail('缺少用户标识', 400)

    const list = db.prepare(`
      SELECT f.id AS favorite_id, a.*, fc.name AS category_name
      FROM faq_favorites f
      JOIN faq_articles a ON f.article_id = a.id
      LEFT JOIN faq_categories fc ON a.category_id = fc.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `).all(user_id)
    res.success(list, 'ok')
  } catch (e) {
    console.error('获取收藏列表失败:', e)
    res.fail('获取收藏列表失败', 500)
  }
})

// POST /api/faq/favorites - 添加收藏
router.post('/favorites', (req, res) => {
  try {
    const db = getDatabase()
    const { user_id, article_id } = req.body
    if (!user_id || !article_id) return res.fail('参数不完整', 400)

    db.prepare(
      'INSERT OR IGNORE INTO faq_favorites (user_id, article_id) VALUES (?, ?)'
    ).run(user_id, article_id)
    db.save()
    res.success(null, '已收藏')
  } catch (e) {
    console.error('添加收藏失败:', e)
    res.fail('添加收藏失败', 500)
  }
})

// DELETE /api/faq/favorites/:articleId - 取消收藏
router.delete('/favorites/:articleId', (req, res) => {
  try {
    const db = getDatabase()
    const { user_id } = req.query
    if (!user_id) return res.fail('缺少用户标识', 400)

    db.prepare(
      'DELETE FROM faq_favorites WHERE user_id = ? AND article_id = ?'
    ).run(user_id, req.params.articleId)
    db.save()
    res.success(null, '已取消收藏')
  } catch (e) {
    console.error('取消收藏失败:', e)
    res.fail('取消收藏失败', 500)
  }
})

module.exports = router
