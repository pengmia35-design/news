// ========================================
// 分类路由 - 获取全部分类
// ========================================

const express = require('express')
const { getDatabase } = require('../database')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

// 获取全部分类（含文章数）
router.get('/', (req, res) => {
  const db = getDatabase()
  const categories = db.prepare(`
    SELECT c.*, (SELECT COUNT(*) FROM articles a WHERE a.category_id = c.id AND a.status = 'published') as article_count
    FROM categories c
    ORDER BY c.sort_order ASC
  `).all()
  res.success(categories)
})

// 获取单个分类
router.get('/:id', (req, res) => {
  const db = getDatabase()
  const category = db.prepare('SELECT * FROM categories WHERE id = ? OR slug = ?').get(req.params.id, req.params.id)
  if (!category) return res.fail('分类不存在', 404)
  res.success(category)
})

// 更新分类（名称、描述、排序）
router.put('/:id', authMiddleware, (req, res) => {
  const { name, description, sort_order } = req.body || {}
  if (!name) return res.fail('分类名称不能为空')

  const db = getDatabase()
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id)
  if (!existing) return res.fail('分类不存在', 404)

  // 检查名称是否与其他分类冲突
  const dup = db.prepare('SELECT id FROM categories WHERE name = ? AND id != ?').get(name, req.params.id)
  if (dup) return res.fail('分类名称已存在')

  db.prepare(`
    UPDATE categories SET name = ?, description = ?, sort_order = ? WHERE id = ?
  `).run(
    name,
    description ?? existing.description,
    sort_order ?? existing.sort_order,
    req.params.id
  )
  db.save()

  const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id)
  res.success(updated, '更新成功')
})

// 删除分类
router.delete('/:id', authMiddleware, (req, res) => {
  const db = getDatabase()
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id)
  if (!existing) return res.fail('分类不存在', 404)

  const articleCount = db.prepare("SELECT COUNT(*) as c FROM articles WHERE category_id = ?").get(req.params.id)
  if (articleCount.c > 0) {
    return res.fail(`该分类下有 ${articleCount.c} 篇文章，无法删除。请先转移或删除文章`, 400)
  }

  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id)
  db.save()
  res.success(null, '删除成功')
})

module.exports = router
