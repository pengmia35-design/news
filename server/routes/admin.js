// ========================================
// 管理员路由 - 登录、校验、数据概览
// ========================================

const express = require('express')
const bcrypt = require('bcryptjs')
const { getDatabase } = require('../database')
const { authMiddleware, generateToken } = require('../middleware/auth')

const router = express.Router()

// 管理员登录
router.post('/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.fail('用户名和密码不能为空')
  }

  const db = getDatabase()
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username)
  if (!admin) {
    return res.fail('用户名或密码错误', 401)
  }

  const valid = bcrypt.compareSync(password, admin.password)
  if (!valid) {
    return res.fail('用户名或密码错误', 401)
  }

  const token = generateToken({ id: admin.id, username: admin.username })
  res.success({
    token,
    admin: { id: admin.id, username: admin.username, nickname: admin.nickname }
  }, '登录成功')
})

// 验证Token有效性
router.get('/verify', authMiddleware, (req, res) => {
  const db = getDatabase()
  const admin = db.prepare('SELECT id, username, nickname FROM admins WHERE id = ?').get(req.admin.id)
  if (!admin) return res.fail('管理员不存在', 401)
  res.success(admin)
})

// 数据概览
router.get('/dashboard', authMiddleware, (req, res) => {
  const db = getDatabase()
  const articleCount = db.prepare('SELECT COUNT(*) as count FROM articles').get()
  const publishedCount = db.prepare("SELECT COUNT(*) as count FROM articles WHERE status = 'published'").get()
  const draftCount = db.prepare("SELECT COUNT(*) as count FROM articles WHERE status = 'draft'").get()
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get()
  const tagCount = db.prepare('SELECT COUNT(*) as count FROM tags').get()
  const totalViews = db.prepare('SELECT SUM(view_count) as total FROM articles').get()

  res.success({
    articleCount: articleCount.count,
    publishedCount: publishedCount.count,
    draftCount: draftCount.count,
    categoryCount: categoryCount.count,
    tagCount: tagCount.count,
    totalViews: totalViews.total || 0
  })
})

// 修改密码
router.put('/password', authMiddleware, (req, res) => {
  const { oldPassword, newPassword } = req.body
  if (!oldPassword || !newPassword) {
    return res.fail('旧密码和新密码不能为空')
  }

  const db = getDatabase()
  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.id)
  if (!bcrypt.compareSync(oldPassword, admin.password)) {
    return res.fail('旧密码错误')
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10)
  db.prepare('UPDATE admins SET password = ? WHERE id = ?').run(hashedPassword, req.admin.id)
  db.save()
  res.success(null, '密码修改成功')
})

module.exports = router
