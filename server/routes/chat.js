const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const { getDatabase } = require('../database')
const { generateAIReply } = require('../services/ai-reply')

// 图片上传配置
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `chat-${Date.now()}${ext}`)
  }
})
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, allowed.includes(ext))
  }
})

// POST /api/chat/upload - 聊天图片上传（公开）
router.post('/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.fail('请选择图片', 400)
    const url = `/uploads/${req.file.filename}`
    res.success({ url }, '上传成功')
  } catch (e) {
    console.error('图片上传失败:', e)
    res.fail('图片上传失败', 500)
  }
})

// POST /api/chat/conversations - 创建新对话
router.post('/conversations', (req, res) => {
  try {
    const db = getDatabase()
    let { user_id, user_name, problem_tag_id } = req.body

    if (!user_id) user_id = 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
    if (!user_name) user_name = '匿名用户'

    // 计算排队号：当前所有 waiting 对话数
    const queuePos = db.prepare(
      "SELECT COUNT(*) AS cnt FROM chat_conversations WHERE status = 'waiting'"
    ).get().cnt + 1

    const result = db.prepare(
      `INSERT INTO chat_conversations (user_id, user_name, problem_tag_id, status, queue_position)
       VALUES (?, ?, ?, 'waiting', ?)`
    ).run(user_id, user_name, problem_tag_id || null, queuePos)

    const conversation = db.prepare('SELECT * FROM chat_conversations WHERE id = ?').get(result.lastInsertRowid)
    db.save()
    res.success(conversation, '对话创建成功')
  } catch (e) {
    console.error('创建对话失败:', e)
    res.fail('创建对话失败', 500)
  }
})

// GET /api/chat/conversations - 用户对话列表
router.get('/conversations', (req, res) => {
  try {
    const db = getDatabase()
    const { user_id, page = 1, pageSize = 20 } = req.query
    if (!user_id) return res.fail('缺少用户标识', 400)

    const offset = (parseInt(page) - 1) * parseInt(pageSize)
    const total = db.prepare(
      'SELECT COUNT(*) AS cnt FROM chat_conversations WHERE user_id = ?'
    ).get(user_id).cnt

    const list = db.prepare(`
      SELECT c.*, pt.name AS problem_tag_name,
        (SELECT COUNT(*) FROM chat_messages WHERE conversation_id = c.id AND sender_type = 'agent' AND is_read = 0) AS unread_count
      FROM chat_conversations c
      LEFT JOIN problem_tags pt ON c.problem_tag_id = pt.id
      WHERE c.user_id = ?
      ORDER BY c.updated_at DESC
      LIMIT ? OFFSET ?
    `).all(user_id, parseInt(pageSize), offset)

    res.success({ list, total, page: parseInt(page), pageSize: parseInt(pageSize), totalPages: Math.ceil(total / parseInt(pageSize)) }, 'ok')
  } catch (e) {
    console.error('获取对话列表失败:', e)
    res.fail('获取对话列表失败', 500)
  }
})

// GET /api/chat/conversations/:id - 对话详情 + 消息
router.get('/conversations/:id', (req, res) => {
  try {
    const db = getDatabase()
    const conversation = db.prepare(`
      SELECT c.*, pt.name AS problem_tag_name
      FROM chat_conversations c
      LEFT JOIN problem_tags pt ON c.problem_tag_id = pt.id
      WHERE c.id = ?
    `).get(req.params.id)

    if (!conversation) return res.fail('对话不存在', 404)

    const messages = db.prepare(
      'SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC'
    ).all(req.params.id)

    // 标记 agent 消息为已读
    db.prepare(
      `UPDATE chat_messages SET is_read = 1
       WHERE conversation_id = ? AND sender_type = 'agent' AND is_read = 0`
    ).run(req.params.id)
    db.save()

    res.success({ conversation, messages }, 'ok')
  } catch (e) {
    console.error('获取对话详情失败:', e)
    res.fail('获取对话详情失败', 500)
  }
})

// POST /api/chat/conversations/:id/messages - 发送消息
router.post('/conversations/:id/messages', (req, res) => {
  try {
    const db = getDatabase()
    const { content, content_type = 'text', user_id } = req.body
    if (!content) return res.fail('消息内容不能为空', 400)
    if (!user_id) return res.fail('缺少用户标识', 400)

    const conv = db.prepare('SELECT * FROM chat_conversations WHERE id = ?').get(req.params.id)
    if (!conv) return res.fail('对话不存在', 404)
    if (conv.status === 'closed') return res.fail('对话已关闭', 400)

    const result = db.prepare(
      `INSERT INTO chat_messages (conversation_id, sender_type, sender_id, content, content_type)
       VALUES (?, 'user', ?, ?, ?)`
    ).run(req.params.id, user_id, content, content_type)

    // 更新对话时间，如果 waiting 则变为 active
    db.prepare(
      `UPDATE chat_conversations SET updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(req.params.id)

    db.save()
    const msg = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(result.lastInsertRowid)

    // 如果对话仍在等待且 AI 已启用，触发 AI 自动回复
    if (conv.status === 'waiting') {
      const allMessages = db.prepare(
        'SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC'
      ).all(req.params.id)

      generateAIReply(allMessages, user_id).then(async (aiReply) => {
        if (aiReply) {
          try {
            const db2 = getDatabase()
            db2.prepare(
              `INSERT INTO chat_messages (conversation_id, sender_type, sender_id, content, content_type)
               VALUES (?, 'agent', 'ai-bot', ?, 'text')`
            ).run(req.params.id, aiReply)
            db2.prepare(
              'UPDATE chat_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?'
            ).run(req.params.id)
            db2.save()
          } catch (e) { /* silent */ }
        }
      }).catch(() => {})
    }

    res.success(msg, '发送成功')
  } catch (e) {
    console.error('发送消息失败:', e)
    res.fail('发送消息失败', 500)
  }
})

// PATCH /api/chat/conversations/:id/close - 关闭对话
router.patch('/conversations/:id/close', (req, res) => {
  try {
    const db = getDatabase()
    const conv = db.prepare('SELECT * FROM chat_conversations WHERE id = ?').get(req.params.id)
    if (!conv) return res.fail('对话不存在', 404)

    db.prepare(
      `UPDATE chat_conversations SET status = 'closed', closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(req.params.id)
    db.save()

    res.success(null, '对话已关闭')
  } catch (e) {
    console.error('关闭对话失败:', e)
    res.fail('关闭对话失败', 500)
  }
})

// POST /api/chat/conversations/:id/rate - 提交评价
router.post('/conversations/:id/rate', (req, res) => {
  try {
    const db = getDatabase()
    const { rating, rating_tags, rating_text } = req.body
    if (!rating || rating < 1 || rating > 5) return res.fail('请选择1-5星评分', 400)

    const conv = db.prepare('SELECT * FROM chat_conversations WHERE id = ?').get(req.params.id)
    if (!conv) return res.fail('对话不存在', 404)

    const tagsJson = rating_tags ? JSON.stringify(rating_tags) : ''

    db.prepare(
      `UPDATE chat_conversations
       SET rating = ?, rating_tags = ?, rating_text = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(rating, tagsJson, rating_text || '', req.params.id)
    db.save()

    res.success(null, '评价提交成功')
  } catch (e) {
    console.error('提交评价失败:', e)
    res.fail('提交评价失败', 500)
  }
})

// POST /api/chat/offline - 提交离线留言
router.post('/offline', (req, res) => {
  try {
    const db = getDatabase()
    let { user_id, user_name, problem_tag_id, content, contact_info } = req.body
    if (!content) return res.fail('留言内容不能为空', 400)
    if (!user_id) user_id = 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
    if (!user_name) user_name = '匿名用户'

    db.prepare(
      `INSERT INTO offline_messages (user_id, user_name, problem_tag_id, content, contact_info)
       VALUES (?, ?, ?, ?, ?)`
    ).run(user_id, user_name, problem_tag_id || null, content, contact_info || '')
    db.save()
    res.success(null, '留言已提交，客服上线后将尽快回复')
  } catch (e) {
    console.error('提交离线留言失败:', e)
    res.fail('提交离线留言失败', 500)
  }
})

module.exports = router
