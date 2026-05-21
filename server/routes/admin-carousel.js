// ========================================
// 后台管理 - 轮播图管理
// ========================================

const express = require('express')
const { getDatabase } = require('../database')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

// 获取所有轮播图
router.get('/', authMiddleware, (req, res) => {
  const db = getDatabase()
  const slides = db.prepare(`
    SELECT * FROM carousel_slides ORDER BY sort_order ASC, id ASC
  `).all()
  res.success(slides)
})

// 公开接口 - 获取启用的轮播图
router.get('/active', (req, res) => {
  const db = getDatabase()
  const slides = db.prepare(`
    SELECT * FROM carousel_slides WHERE is_active = 1 ORDER BY sort_order ASC, id ASC
  `).all()
  res.success(slides)
})

// 新增轮播图
router.post('/', authMiddleware, (req, res) => {
  const { image_url, title, description, link, tag, sort_order } = req.body || {}
  if (!image_url) return res.fail('图片地址不能为空')

  const db = getDatabase()
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), 0) as m FROM carousel_slides').get()
  db.prepare(`
    INSERT INTO carousel_slides (image_url, title, description, link, tag, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(image_url, title || '', description || '', link || '', tag || '', sort_order ?? (maxOrder.m + 1))
  db.save()
  res.success(null, '添加成功')
})

// 更新轮播图
router.put('/:id', authMiddleware, (req, res) => {
  const { image_url, title, description, link, tag, sort_order, is_active } = req.body || {}
  const db = getDatabase()
  const existing = db.prepare('SELECT * FROM carousel_slides WHERE id = ?').get(req.params.id)
  if (!existing) return res.fail('轮播图不存在', 404)

  db.prepare(`
    UPDATE carousel_slides SET
      image_url = ?, title = ?, description = ?, link = ?, tag = ?,
      sort_order = ?, is_active = ?
    WHERE id = ?
  `).run(
    image_url ?? existing.image_url,
    title ?? existing.title,
    description ?? existing.description,
    link ?? existing.link,
    tag ?? existing.tag,
    sort_order ?? existing.sort_order,
    is_active ?? existing.is_active,
    req.params.id
  )
  db.save()
  res.success(null, '更新成功')
})

// 删除轮播图
router.delete('/:id', authMiddleware, (req, res) => {
  const db = getDatabase()
  const existing = db.prepare('SELECT * FROM carousel_slides WHERE id = ?').get(req.params.id)
  if (!existing) return res.fail('轮播图不存在', 404)
  db.prepare('DELETE FROM carousel_slides WHERE id = ?').run(req.params.id)
  db.save()
  res.success(null, '删除成功')
})

module.exports = router
