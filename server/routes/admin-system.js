const express = require('express')
const router = express.Router()
const { getDatabase } = require('../database')
const { authMiddleware } = require('../middleware/auth')

router.use(authMiddleware)

// ========== 系统配置 ==========

// GET /api/admin/system/config
router.get('/config', (req, res) => {
  try {
    const db = getDatabase()
    const rows = db.prepare('SELECT config_key, config_value FROM system_config').all()
    const config = {}
    for (const r of rows) {
      config[r.config_key] = r.config_value
    }
    res.success(config, 'ok')
  } catch (e) {
    console.error('获取系统配置失败:', e)
    res.fail('获取系统配置失败', 500)
  }
})

// PUT /api/admin/system/config
router.put('/config', (req, res) => {
  try {
    const db = getDatabase()
    const { configs } = req.body
    if (!configs || !Array.isArray(configs)) return res.fail('参数格式错误', 400)

    const wrapped = db.transaction((items) => {
      for (const item of items) {
        const result = db.prepare(
          'UPDATE system_config SET config_value = ?, updated_at = CURRENT_TIMESTAMP WHERE config_key = ?'
        ).run(item.config_value, item.config_key)
        if (result.changes === 0) {
          db.prepare(
            'INSERT INTO system_config (config_key, config_value) VALUES (?, ?)'
          ).run(item.config_key, item.config_value)
        }
      }
    })
    wrapped(configs)
    db.save()
    res.success(null, '配置已保存')
  } catch (e) {
    console.error('保存系统配置失败:', e)
    res.fail('保存系统配置失败', 500)
  }
})

// ========== 问题标签管理 ==========

// GET /api/admin/system/problem-tags - 全部标签（含未启用）
router.get('/problem-tags', (req, res) => {
  try {
    const db = getDatabase()
    const tags = db.prepare('SELECT * FROM problem_tags ORDER BY sort_order').all()

    const tree = []
    const map = {}
    for (const t of tags) {
      map[t.id] = { ...t, children: [] }
    }
    for (const t of tags) {
      if (t.parent_id && map[t.parent_id]) {
        map[t.parent_id].children.push(map[t.id])
      } else if (!t.parent_id) {
        tree.push(map[t.id])
      }
    }

    res.success(tree, 'ok')
  } catch (e) {
    console.error('获取问题标签失败:', e)
    res.fail('获取问题标签失败', 500)
  }
})

// POST /api/admin/system/problem-tags
router.post('/problem-tags', (req, res) => {
  try {
    const db = getDatabase()
    const { name, slug, parent_id, sort_order = 0 } = req.body
    if (!name || !slug) return res.fail('名称和标识不能为空', 400)

    const result = db.prepare(
      'INSERT INTO problem_tags (name, slug, parent_id, sort_order) VALUES (?, ?, ?, ?)'
    ).run(name, slug, parent_id || null, sort_order)
    db.save()

    const tag = db.prepare('SELECT * FROM problem_tags WHERE id = ?').get(result.lastInsertRowid)
    res.success(tag, '标签创建成功')
  } catch (e) {
    console.error('创建标签失败:', e)
    res.fail('标签标识可能已存在', 500)
  }
})

// PUT /api/admin/system/problem-tags/:id
router.put('/problem-tags/:id', (req, res) => {
  try {
    const db = getDatabase()
    const { name, slug, parent_id, sort_order } = req.body

    db.prepare(
      'UPDATE problem_tags SET name = ?, slug = ?, parent_id = ?, sort_order = ? WHERE id = ?'
    ).run(name, slug, parent_id || null, sort_order, req.params.id)
    db.save()

    const tag = db.prepare('SELECT * FROM problem_tags WHERE id = ?').get(req.params.id)
    res.success(tag, '标签已更新')
  } catch (e) {
    console.error('更新标签失败:', e)
    res.fail('更新标签失败', 500)
  }
})

// DELETE /api/admin/system/problem-tags/:id
router.delete('/problem-tags/:id', (req, res) => {
  try {
    const db = getDatabase()
    const children = db.prepare(
      'SELECT COUNT(*) AS cnt FROM problem_tags WHERE parent_id = ?'
    ).get(req.params.id).cnt
    if (children > 0) return res.fail('该标签下还有子标签，无法删除', 400)

    const used = db.prepare(
      'SELECT COUNT(*) AS cnt FROM chat_conversations WHERE problem_tag_id = ?'
    ).get(req.params.id).cnt
    if (used > 0) return res.fail('该标签已被对话使用，无法删除', 400)

    db.prepare('DELETE FROM problem_tags WHERE id = ?').run(req.params.id)
    db.save()
    res.success(null, '标签已删除')
  } catch (e) {
    console.error('删除标签失败:', e)
    res.fail('删除标签失败', 500)
  }
})

// PATCH /api/admin/system/problem-tags/:id/toggle
router.patch('/problem-tags/:id/toggle', (req, res) => {
  try {
    const db = getDatabase()
    const tag = db.prepare('SELECT * FROM problem_tags WHERE id = ?').get(req.params.id)
    if (!tag) return res.fail('标签不存在', 404)

    const val = tag.is_active ? 0 : 1
    db.prepare('UPDATE problem_tags SET is_active = ? WHERE id = ?').run(val, req.params.id)
    db.save()
    res.success({ is_active: val }, val ? '已启用' : '已禁用')
  } catch (e) {
    console.error('切换标签状态失败:', e)
    res.fail('操作失败', 500)
  }
})

// ========== 快捷回复管理 ==========

// GET /api/admin/system/quick-replies
router.get('/quick-replies', (req, res) => {
  try {
    const db = getDatabase()
    const { category_id } = req.query
    let sql = 'SELECT q.*, pt.name AS category_name FROM quick_replies q LEFT JOIN problem_tags pt ON q.category_id = pt.id'
    const params = []

    if (category_id) {
      sql += ' WHERE q.category_id = ?'
      params.push(category_id)
    }

    sql += ' ORDER BY q.created_at DESC'
    const list = db.prepare(sql).all(...params)
    res.success(list, 'ok')
  } catch (e) {
    console.error('获取快捷回复失败:', e)
    res.fail('获取快捷回复失败', 500)
  }
})

// POST /api/admin/system/quick-replies
router.post('/quick-replies', (req, res) => {
  try {
    const db = getDatabase()
    const { category_id, title, content, is_public = 1 } = req.body
    if (!title || !content) return res.fail('标题和内容不能为空', 400)

    const agentId = req.admin?.username || 'admin'
    const result = db.prepare(
      'INSERT INTO quick_replies (category_id, title, content, is_public, agent_id) VALUES (?, ?, ?, ?, ?)'
    ).run(category_id || null, title, content, is_public, agentId)
    db.save()

    const reply = db.prepare('SELECT * FROM quick_replies WHERE id = ?').get(result.lastInsertRowid)
    res.success(reply, '快捷回复创建成功')
  } catch (e) {
    console.error('创建快捷回复失败:', e)
    res.fail('创建快捷回复失败', 500)
  }
})

// PUT /api/admin/system/quick-replies/:id
router.put('/quick-replies/:id', (req, res) => {
  try {
    const db = getDatabase()
    const { category_id, title, content, is_public } = req.body

    db.prepare(
      'UPDATE quick_replies SET category_id = ?, title = ?, content = ?, is_public = ? WHERE id = ?'
    ).run(category_id || null, title, content, is_public, req.params.id)
    db.save()
    res.success(null, '快捷回复已更新')
  } catch (e) {
    console.error('更新快捷回复失败:', e)
    res.fail('更新快捷回复失败', 500)
  }
})

// DELETE /api/admin/system/quick-replies/:id
router.delete('/quick-replies/:id', (req, res) => {
  try {
    const db = getDatabase()
    db.prepare('DELETE FROM quick_replies WHERE id = ?').run(req.params.id)
    db.save()
    res.success(null, '快捷回复已删除')
  } catch (e) {
    console.error('删除快捷回复失败:', e)
    res.fail('删除快捷回复失败', 500)
  }
})

// ========== 评价导出 ==========

// GET /api/admin/system/ratings/export
router.get('/ratings/export', (req, res) => {
  try {
    const db = getDatabase()
    const { start_date, end_date } = req.query

    let where = 'WHERE c.rating IS NOT NULL'
    const params = []

    if (start_date) {
      where += ' AND c.closed_at >= ?'
      params.push(start_date)
    }
    if (end_date) {
      where += ' AND c.closed_at <= ?'
      params.push(end_date + ' 23:59:59')
    }

    const list = db.prepare(`
      SELECT c.id, c.user_name, c.rating, c.rating_tags, c.rating_text,
        pt.name AS problem_tag_name, c.closed_at
      FROM chat_conversations c
      LEFT JOIN problem_tags pt ON c.problem_tag_id = pt.id
      ${where}
      ORDER BY c.closed_at DESC
    `).all(...params)

    res.success(list, 'ok')
  } catch (e) {
    console.error('导出评价失败:', e)
    res.fail('导出评价失败', 500)
  }
})

module.exports = router
