const express = require('express')
const router = express.Router()
const { getDatabase } = require('../database')
const { authMiddleware } = require('../middleware/auth')

router.use(authMiddleware)

// ========== FAQ 分类 CRUD ==========

// GET /api/admin/faq/categories
router.get('/categories', (req, res) => {
  try {
    const db = getDatabase()
    const list = db.prepare(`
      SELECT fc.*,
        (SELECT COUNT(*) FROM faq_articles WHERE category_id = fc.id) AS article_count
      FROM faq_categories fc
      ORDER BY fc.sort_order
    `).all()
    res.success(list, 'ok')
  } catch (e) {
    console.error('获取FAQ分类失败:', e)
    res.fail('获取FAQ分类失败', 500)
  }
})

// POST /api/admin/faq/categories
router.post('/categories', (req, res) => {
  try {
    const db = getDatabase()
    const { name, slug, sort_order = 0 } = req.body
    if (!name || !slug) return res.fail('名称和标识不能为空', 400)

    const result = db.prepare(
      'INSERT INTO faq_categories (name, slug, sort_order) VALUES (?, ?, ?)'
    ).run(name, slug, sort_order)
    db.save()

    const cat = db.prepare('SELECT * FROM faq_categories WHERE id = ?').get(result.lastInsertRowid)
    res.success(cat, '分类创建成功')
  } catch (e) {
    console.error('创建FAQ分类失败:', e)
    res.fail('分类标识可能已存在', 500)
  }
})

// PUT /api/admin/faq/categories/:id
router.put('/categories/:id', (req, res) => {
  try {
    const db = getDatabase()
    const { name, slug, sort_order } = req.body

    db.prepare(
      'UPDATE faq_categories SET name = ?, slug = ?, sort_order = ? WHERE id = ?'
    ).run(name, slug, sort_order, req.params.id)
    db.save()

    const cat = db.prepare('SELECT * FROM faq_categories WHERE id = ?').get(req.params.id)
    res.success(cat, '分类已更新')
  } catch (e) {
    console.error('更新FAQ分类失败:', e)
    res.fail('更新分类失败', 500)
  }
})

// DELETE /api/admin/faq/categories/:id
router.delete('/categories/:id', (req, res) => {
  try {
    const db = getDatabase()
    const count = db.prepare(
      'SELECT COUNT(*) AS cnt FROM faq_articles WHERE category_id = ?'
    ).get(req.params.id).cnt
    if (count > 0) return res.fail('该分类下还有文章，无法删除', 400)

    db.prepare('DELETE FROM faq_categories WHERE id = ?').run(req.params.id)
    db.save()
    res.success(null, '分类已删除')
  } catch (e) {
    console.error('删除FAQ分类失败:', e)
    res.fail('删除分类失败', 500)
  }
})

// ========== FAQ 文章 CRUD ==========

// GET /api/admin/faq/articles
router.get('/articles', (req, res) => {
  try {
    const db = getDatabase()
    const { category_id, keyword, status, page = 1, pageSize = 20 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(pageSize)

    let where = 'WHERE 1=1'
    const params = []

    if (category_id) {
      where += ' AND a.category_id = ?'
      params.push(category_id)
    }
    if (keyword) {
      where += ' AND (a.title LIKE ? OR a.content LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }
    if (status === 'published') {
      where += ' AND a.is_published = 1'
    } else if (status === 'draft') {
      where += ' AND a.is_published = 0'
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

// GET /api/admin/faq/articles/:id
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
    res.success(article, 'ok')
  } catch (e) {
    console.error('获取FAQ文章失败:', e)
    res.fail('获取FAQ文章失败', 500)
  }
})

// POST /api/admin/faq/articles
router.post('/articles', (req, res) => {
  try {
    const db = getDatabase()
    const { category_id, title, content, is_published = 1, sort_order = 0 } = req.body
    if (!title) return res.fail('标题不能为空', 400)

    const result = db.prepare(
      `INSERT INTO faq_articles (category_id, title, content, is_published, sort_order)
       VALUES (?, ?, ?, ?, ?)`
    ).run(category_id || null, title, content || '', is_published, sort_order)
    db.save()

    const article = db.prepare('SELECT * FROM faq_articles WHERE id = ?').get(result.lastInsertRowid)
    res.success(article, '文章创建成功')
  } catch (e) {
    console.error('创建FAQ文章失败:', e)
    res.fail('创建文章失败', 500)
  }
})

// PUT /api/admin/faq/articles/:id
router.put('/articles/:id', (req, res) => {
  try {
    const db = getDatabase()
    const { category_id, title, content, is_published, sort_order } = req.body

    db.prepare(
      `UPDATE faq_articles
       SET category_id = ?, title = ?, content = ?, is_published = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(category_id || null, title, content || '', is_published, sort_order, req.params.id)
    db.save()

    const article = db.prepare('SELECT * FROM faq_articles WHERE id = ?').get(req.params.id)
    res.success(article, '文章已更新')
  } catch (e) {
    console.error('更新FAQ文章失败:', e)
    res.fail('更新文章失败', 500)
  }
})

// DELETE /api/admin/faq/articles/:id
router.delete('/articles/:id', (req, res) => {
  try {
    const db = getDatabase()
    db.prepare('DELETE FROM faq_articles WHERE id = ?').run(req.params.id)
    db.save()
    res.success(null, '文章已删除')
  } catch (e) {
    console.error('删除FAQ文章失败:', e)
    res.fail('删除文章失败', 500)
  }
})

// PATCH /api/admin/faq/articles/:id/status - 上下架
router.patch('/articles/:id/status', (req, res) => {
  try {
    const db = getDatabase()
    const article = db.prepare('SELECT * FROM faq_articles WHERE id = ?').get(req.params.id)
    if (!article) return res.fail('文章不存在', 404)

    const newStatus = article.is_published ? 0 : 1
    db.prepare(
      'UPDATE faq_articles SET is_published = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(newStatus, req.params.id)
    db.save()
    res.success({ is_published: newStatus }, newStatus ? '已上架' : '已下架')
  } catch (e) {
    console.error('切换状态失败:', e)
    res.fail('操作失败', 500)
  }
})

module.exports = router
