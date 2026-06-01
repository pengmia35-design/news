const express = require('express')
const router = express.Router()
const { getDatabase } = require('../database')
const { authMiddleware } = require('../middleware/auth')
const { emitAdminReply, emitStatusChange, emitNewMessage } = require('../websocket')
const { generateSuggestions } = require('../services/ai-reply')

router.use(authMiddleware)

// GET /api/admin/chat/conversations - 全部对话列表
router.get('/conversations', (req, res) => {
  try {
    const db = getDatabase()
    const { status, keyword, page = 1, pageSize = 20 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(pageSize)

    let where = 'WHERE 1=1'
    const params = []

    if (status) {
      where += ' AND c.status = ?'
      params.push(status)
    }
    if (keyword) {
      where += ' AND (c.user_name LIKE ? OR c.user_id LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }

    const total = db.prepare(
      `SELECT COUNT(*) AS cnt FROM chat_conversations c ${where}`
    ).get(...params).cnt

    const list = db.prepare(`
      SELECT c.*, pt.name AS problem_tag_name,
        (SELECT COUNT(*) FROM chat_messages WHERE conversation_id = c.id AND sender_type = 'user' AND is_read = 0) AS unread_count,
        (SELECT content FROM chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message
      FROM chat_conversations c
      LEFT JOIN problem_tags pt ON c.problem_tag_id = pt.id
      ${where}
      ORDER BY
        CASE WHEN c.status = 'waiting' THEN 1 WHEN c.status = 'active' THEN 2 ELSE 3 END,
        c.updated_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(pageSize), offset)

    res.success({
      list, total, page: parseInt(page), pageSize: parseInt(pageSize),
      totalPages: Math.ceil(total / parseInt(pageSize))
    }, 'ok')
  } catch (e) {
    console.error('获取对话列表失败:', e)
    res.fail('获取对话列表失败', 500)
  }
})

// GET /api/admin/chat/conversations/:id - 对话详情
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

    // 标记用户消息为已读
    db.prepare(
      `UPDATE chat_messages SET is_read = 1
       WHERE conversation_id = ? AND sender_type = 'user' AND is_read = 0`
    ).run(req.params.id)
    db.save()

    res.success({ conversation, messages }, 'ok')
  } catch (e) {
    console.error('获取对话详情失败:', e)
    res.fail('获取对话详情失败', 500)
  }
})

// POST /api/admin/chat/conversations/:id/messages - 客服回复
router.post('/conversations/:id/messages', (req, res) => {
  try {
    const db = getDatabase()
    const { content, content_type = 'text' } = req.body
    if (!content) return res.fail('消息内容不能为空', 400)

    const conv = db.prepare('SELECT * FROM chat_conversations WHERE id = ?').get(req.params.id)
    if (!conv) return res.fail('对话不存在', 404)
    if (conv.status === 'closed') return res.fail('对话已关闭', 400)

    const agentId = req.admin?.username || 'agent'

    db.prepare(
      `INSERT INTO chat_messages (conversation_id, sender_type, sender_id, content, content_type)
       VALUES (?, 'agent', ?, ?, ?)`
    ).run(req.params.id, agentId, content, content_type)

    // 如果 waiting 则变为 active
    if (conv.status === 'waiting') {
      db.prepare("UPDATE chat_conversations SET status = 'active' WHERE id = ?").run(req.params.id)
    }
    db.prepare(
      'UPDATE chat_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(req.params.id)
    db.save()

    const msg = db.prepare(
      'SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 1'
    ).get(req.params.id)
    res.success(msg, '发送成功')
    emitAdminReply(req.params.id, msg)
  } catch (e) {
    console.error('回复消息失败:', e)
    res.fail('回复消息失败', 500)
  }
})

// PATCH /api/admin/chat/conversations/:id/status - 修改状态
router.patch('/conversations/:id/status', (req, res) => {
  try {
    const db = getDatabase()
    const { status } = req.body
    const validStatuses = ['waiting', 'active', 'resolved', 'closed']
    if (!validStatuses.includes(status)) return res.fail('无效状态', 400)

    const closedAt = status === 'closed' ? ', closed_at = CURRENT_TIMESTAMP' : ''

    db.prepare(
      `UPDATE chat_conversations SET status = ?, updated_at = CURRENT_TIMESTAMP${closedAt} WHERE id = ?`
    ).run(status, req.params.id)
    db.save()
    res.success(null, '状态已更新')
    emitStatusChange(req.params.id, status)
  } catch (e) {
    console.error('更新状态失败:', e)
    res.fail('更新状态失败', 500)
  }
})

// PATCH /api/admin/chat/conversations/:id/tag - 修改问题标签
router.patch('/conversations/:id/tag', (req, res) => {
  try {
    const db = getDatabase()
    const { problem_tag_id } = req.body
    db.prepare(
      'UPDATE chat_conversations SET problem_tag_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(problem_tag_id, req.params.id)
    db.save()
    res.success(null, '标签已更新')
  } catch (e) {
    console.error('更新标签失败:', e)
    res.fail('更新标签失败', 500)
  }
})

// GET /api/admin/chat/ratings - 评价列表
router.get('/ratings', (req, res) => {
  try {
    const db = getDatabase()
    const { rating, problem_tag_id, start_date, end_date, page = 1, pageSize = 20 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(pageSize)

    let where = 'WHERE c.rating IS NOT NULL'
    const params = []

    if (rating) {
      where += ' AND c.rating = ?'
      params.push(rating)
    }
    if (problem_tag_id) {
      where += ' AND c.problem_tag_id = ?'
      params.push(problem_tag_id)
    }
    if (start_date) {
      where += ' AND c.closed_at >= ?'
      params.push(start_date)
    }
    if (end_date) {
      where += ' AND c.closed_at <= ?'
      params.push(end_date + ' 23:59:59')
    }

    const total = db.prepare(
      `SELECT COUNT(*) AS cnt FROM chat_conversations c ${where}`
    ).get(...params).cnt

    const list = db.prepare(`
      SELECT c.*, pt.name AS problem_tag_name
      FROM chat_conversations c
      LEFT JOIN problem_tags pt ON c.problem_tag_id = pt.id
      ${where}
      ORDER BY c.closed_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(pageSize), offset)

    res.success({
      list, total, page: parseInt(page), pageSize: parseInt(pageSize),
      totalPages: Math.ceil(total / parseInt(pageSize))
    }, 'ok')
  } catch (e) {
    console.error('获取评价列表失败:', e)
    res.fail('获取评价列表失败', 500)
  }
})

// GET /api/admin/chat/ratings/summary - 评价汇总
router.get('/ratings/summary', (req, res) => {
  try {
    const db = getDatabase()
    const total = db.prepare('SELECT COUNT(*) AS cnt FROM chat_conversations WHERE rating IS NOT NULL').get().cnt

    // 平均分
    const avgRow = db.prepare('SELECT AVG(rating) AS avg FROM chat_conversations WHERE rating IS NOT NULL').get()
    const avgRating = avgRow ? Math.round(avgRow.avg * 10) / 10 : 0

    // 分数分布
    const distribution = db.prepare(
      'SELECT rating, COUNT(*) AS cnt FROM chat_conversations WHERE rating IS NOT NULL GROUP BY rating ORDER BY rating'
    ).all()

    // 评价标签汇总
    const allRatings = db.prepare(
      'SELECT rating_tags FROM chat_conversations WHERE rating IS NOT NULL AND rating_tags != ?'
    ).all('')
    const tagCount = {}
    for (const r of allRatings) {
      try {
        const tags = JSON.parse(r.rating_tags)
        for (const t of tags) {
          tagCount[t] = (tagCount[t] || 0) + 1
        }
      } catch (e) { /* skip */ }
    }

    res.success({ total, avgRating, distribution, tagCount }, 'ok')
  } catch (e) {
    console.error('获取评价汇总失败:', e)
    res.fail('获取评价汇总失败', 500)
  }
})

// GET /api/admin/chat/stats - 客服统计
router.get('/stats', (req, res) => {
  try {
    const db = getDatabase()

    // 今日对话量
    const todayConv = db.prepare(
      "SELECT COUNT(*) AS cnt FROM chat_conversations WHERE date(created_at) = date('now')"
    ).get().cnt

    // 本周对话量
    const weekConv = db.prepare(
      "SELECT COUNT(*) AS cnt FROM chat_conversations WHERE created_at >= date('now', '-7 days')"
    ).get().cnt

    // 总计
    const totalConv = db.prepare('SELECT COUNT(*) AS cnt FROM chat_conversations').get().cnt

    // 状态分布
    const statusDist = db.prepare(
      'SELECT status, COUNT(*) AS cnt FROM chat_conversations GROUP BY status'
    ).all()

    // 标签分布（一级）
    const tagDist = db.prepare(`
      SELECT pt.name, pt.slug, COUNT(*) AS cnt
      FROM chat_conversations c
      JOIN problem_tags pt ON c.problem_tag_id = pt.id
      GROUP BY c.problem_tag_id
      ORDER BY cnt DESC
    `).all()

    // 30 天趋势
    const trend = db.prepare(`
      SELECT date(created_at) AS day, COUNT(*) AS cnt
      FROM chat_conversations
      WHERE created_at >= date('now', '-30 days')
      GROUP BY date(created_at)
      ORDER BY day
    `).all()

    // 平均评价
    const avgRating = db.prepare(
      'SELECT AVG(rating) AS avg FROM chat_conversations WHERE rating IS NOT NULL'
    ).get().avg || 0

    // FAQ 热度排行
    const topFaq = db.prepare(
      'SELECT id, title, view_count FROM faq_articles ORDER BY view_count DESC LIMIT 10'
    ).all()

    res.success({
      todayConv, weekConv, totalConv, statusDist, tagDist, trend,
      avgRating: Math.round(avgRating * 10) / 10, topFaq
    }, 'ok')
  } catch (e) {
    console.error('获取统计数据失败:', e)
    res.fail('获取统计数据失败', 500)
  }
})

// ========== 排队叫号 ==========

// POST /api/admin/chat/conversations/take-next - 取队首 waiting 对话
router.post('/conversations/take-next', (req, res) => {
  try {
    const db = getDatabase()
    const next = db.prepare(
      "SELECT * FROM chat_conversations WHERE status = 'waiting' ORDER BY queue_position ASC LIMIT 1"
    ).get()

    if (!next) return res.fail('当前没有等待中的对话', 404)

    db.prepare(
      "UPDATE chat_conversations SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(next.id)

    // 重新计算排队号
    const waiting = db.prepare(
      "SELECT id FROM chat_conversations WHERE status = 'waiting' ORDER BY queue_position ASC"
    ).all()
    for (let i = 0; i < waiting.length; i++) {
      db.prepare('UPDATE chat_conversations SET queue_position = ? WHERE id = ?').run(i + 1, waiting[i].id)
    }

    db.save()

    const conv = db.prepare(`
      SELECT c.*, pt.name AS problem_tag_name
      FROM chat_conversations c
      LEFT JOIN problem_tags pt ON c.problem_tag_id = pt.id
      WHERE c.id = ?
    `).get(next.id)

    res.success(conv, '已取下一对话')
  } catch (e) {
    console.error('取号失败:', e)
    res.fail('取号失败', 500)
  }
})

// ========== 客服上下线 ==========

// POST /api/admin/chat/agent/online
router.post('/agent/online', (req, res) => {
  try {
    const db = getDatabase()
    const existing = db.prepare(
      "SELECT * FROM system_config WHERE config_key = 'agent_online'"
    ).get()
    if (existing) {
      db.prepare(
        "UPDATE system_config SET config_value = '1', updated_at = CURRENT_TIMESTAMP WHERE config_key = 'agent_online'"
      ).run()
    } else {
      db.prepare(
        "INSERT INTO system_config (config_key, config_value) VALUES ('agent_online', '1')"
      ).run()
    }
    db.save()

    const pending = db.prepare(
      'SELECT COUNT(*) AS cnt FROM offline_messages WHERE is_converted = 0'
    ).get().cnt

    res.success({ pending_count: pending }, '已上线')
  } catch (e) {
    console.error('上线失败:', e)
    res.fail('操作失败', 500)
  }
})

// POST /api/admin/chat/agent/offline
router.post('/agent/offline', (req, res) => {
  try {
    const db = getDatabase()
    db.prepare(
      "UPDATE system_config SET config_value = '0', updated_at = CURRENT_TIMESTAMP WHERE config_key = 'agent_online'"
    ).run()
    db.save()
    res.success(null, '已离线')
  } catch (e) {
    console.error('离线失败:', e)
    res.fail('操作失败', 500)
  }
})

// GET /api/admin/chat/agent/status
router.get('/agent/status', (req, res) => {
  try {
    const db = getDatabase()
    const row = db.prepare(
      "SELECT config_value FROM system_config WHERE config_key = 'agent_online'"
    ).get()
    const agentOnline = row?.config_value === '1'

    const pending = db.prepare(
      'SELECT COUNT(*) AS cnt FROM offline_messages WHERE is_converted = 0'
    ).get().cnt

    res.success({ agent_online: agentOnline, offline_pending_count: pending }, 'ok')
  } catch (e) {
    console.error('获取状态失败:', e)
    res.fail('获取状态失败', 500)
  }
})

// GET /api/admin/chat/unread-count — 新消息未读总数
router.get('/unread-count', (req, res) => {
  try {
    const db = getDatabase()
    const row = db.prepare(
      "SELECT COUNT(*) AS cnt FROM chat_messages WHERE sender_type = 'user' AND is_read = 0"
    ).get()
    res.success({ total_unread: row.cnt }, 'ok')
  } catch (e) {
    console.error('获取未读数失败:', e)
    res.fail('获取未读数失败', 500)
  }
})

// ========== 离线留言管理 ==========

// GET /api/admin/chat/offline-messages
router.get('/offline-messages', (req, res) => {
  try {
    const db = getDatabase()
    const { page = 1, pageSize = 20 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(pageSize)

    const total = db.prepare(
      'SELECT COUNT(*) AS cnt FROM offline_messages WHERE is_converted = 0'
    ).get().cnt

    const list = db.prepare(`
      SELECT om.*, pt.name AS problem_tag_name
      FROM offline_messages om
      LEFT JOIN problem_tags pt ON om.problem_tag_id = pt.id
      WHERE om.is_converted = 0
      ORDER BY om.created_at DESC
      LIMIT ? OFFSET ?
    `).all(parseInt(pageSize), offset)

    res.success({
      list, total, page: parseInt(page), pageSize: parseInt(pageSize),
      totalPages: Math.ceil(total / parseInt(pageSize))
    }, 'ok')
  } catch (e) {
    console.error('获取离线留言失败:', e)
    res.fail('获取离线留言失败', 500)
  }
})

// POST /api/admin/chat/offline-messages/:id/convert - 转为对话
router.post('/offline-messages/:id/convert', (req, res) => {
  try {
    const db = getDatabase()
    const offline = db.prepare('SELECT * FROM offline_messages WHERE id = ?').get(req.params.id)
    if (!offline) return res.fail('留言不存在', 404)
    if (offline.is_converted) return res.fail('该留言已转为对话', 400)

    const wrapped = db.transaction(() => {
      const convResult = db.prepare(
        `INSERT INTO chat_conversations (user_id, user_name, problem_tag_id, status)
         VALUES (?, ?, ?, 'active')`
      ).run(offline.user_id, offline.user_name, offline.problem_tag_id)

      const convId = convResult.lastInsertRowid

      db.prepare(
        `INSERT INTO chat_messages (conversation_id, sender_type, sender_id, content, content_type)
         VALUES (?, 'user', ?, ?, 'text')`
      ).run(convId, offline.user_id, offline.content)

      db.prepare(
        `UPDATE offline_messages SET is_converted = 1, converted_conversation_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      ).run(convId, req.params.id)
    })

    wrapped()
    db.save()
    res.success(null, '已转为对话')
  } catch (e) {
    console.error('转化留言失败:', e)
    res.fail('转化留言失败', 500)
  }
})

// DELETE /api/admin/chat/offline-messages/:id - 忽略离线留言
router.delete('/offline-messages/:id', (req, res) => {
  try {
    const db = getDatabase()
    db.prepare('DELETE FROM offline_messages WHERE id = ?').run(req.params.id)
    db.save()
    res.success(null, '已忽略')
  } catch (e) {
    console.error('忽略留言失败:', e)
    res.fail('操作失败', 500)
  }
})

// ========== 数据导出 ==========

function escapeCSV(str) {
  if (!str) return ''
  const s = String(str).replace(/"/g, '""')
  return `"${s}"`
}

// GET /api/admin/chat/export/conversations - 导出对话 CSV
router.get('/export/conversations', (req, res) => {
  try {
    const db = getDatabase()
    const { status, start_date, end_date } = req.query

    let where = 'WHERE 1=1'
    const params = []

    if (status) { where += ' AND c.status = ?'; params.push(status) }
    if (start_date) { where += ' AND c.created_at >= ?'; params.push(start_date) }
    if (end_date) { where += ' AND c.created_at <= ?'; params.push(end_date + ' 23:59:59') }

    const rows = db.prepare(`
      SELECT c.id, c.user_id, c.user_name, c.status, c.queue_position,
        c.rating, c.rating_text, c.rating_tags,
        c.created_at, c.updated_at, c.closed_at,
        pt.name AS problem_tag_name,
        (SELECT COUNT(*) FROM chat_messages WHERE conversation_id = c.id) AS msg_count
      FROM chat_conversations c
      LEFT JOIN problem_tags pt ON c.problem_tag_id = pt.id
      ${where}
      ORDER BY c.created_at DESC
    `).all(...params)

    const header = 'ID,用户ID,用户名,状态,排队号,评分,评价内容,评价标签,创建时间,更新时间,关闭时间,问题类型,消息数'
    const lines = [header]
    for (const r of rows) {
      const line = [
        r.id, r.user_id, r.user_name, r.status, r.queue_position,
        r.rating, r.rating_text, r.rating_tags,
        r.created_at, r.updated_at, r.closed_at,
        r.problem_tag_name, r.msg_count
      ].map(escapeCSV).join(',')
      lines.push(line)
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="conversations-${Date.now()}.csv"`)
    res.send('﻿' + lines.join('\n'))
  } catch (e) {
    console.error('导出对话失败:', e)
    res.fail('导出失败', 500)
  }
})

// GET /api/admin/chat/export/ratings - 导出评价 CSV
router.get('/export/ratings', (req, res) => {
  try {
    const db = getDatabase()
    const { rating, problem_tag_id, start_date, end_date } = req.query

    let where = 'WHERE c.rating IS NOT NULL'
    const params = []

    if (rating) { where += ' AND c.rating = ?'; params.push(rating) }
    if (problem_tag_id) { where += ' AND c.problem_tag_id = ?'; params.push(problem_tag_id) }
    if (start_date) { where += ' AND c.closed_at >= ?'; params.push(start_date) }
    if (end_date) { where += ' AND c.closed_at <= ?'; params.push(end_date + ' 23:59:59') }

    const rows = db.prepare(`
      SELECT c.id, c.user_id, c.user_name, c.rating, c.rating_tags, c.rating_text,
        c.created_at, c.closed_at, pt.name AS problem_tag_name
      FROM chat_conversations c
      LEFT JOIN problem_tags pt ON c.problem_tag_id = pt.id
      ${where}
      ORDER BY c.closed_at DESC
    `).all(...params)

    const header = 'ID,用户ID,用户名,评分,评价标签,评价内容,创建时间,关闭时间,问题类型'
    const lines = [header]
    for (const r of rows) {
      const line = [
        r.id, r.user_id, r.user_name, r.rating, r.rating_tags, r.rating_text,
        r.created_at, r.closed_at, r.problem_tag_name
      ].map(escapeCSV).join(',')
      lines.push(line)
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="ratings-${Date.now()}.csv"`)
    res.send('﻿' + lines.join('\n'))
  } catch (e) {
    console.error('导出评价失败:', e)
    res.fail('导出失败', 500)
  }
})

// POST /api/admin/chat/conversations/:id/ai-suggest — AI 建议回复
router.post('/conversations/:id/ai-suggest', async (req, res) => {
  try {
    const db = getDatabase()
    const messages = db.prepare(
      'SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC'
    ).all(req.params.id)

    if (messages.length === 0) return res.fail('暂无消息记录', 400)

    const suggestions = await generateSuggestions(messages)
    res.success({ suggestions }, 'ok')
  } catch (e) {
    console.error('AI建议生成失败:', e)
    res.fail('生成失败', 500)
  }
})

module.exports = router
