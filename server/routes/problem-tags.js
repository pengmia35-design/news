const express = require('express')
const router = express.Router()
const { getDatabase } = require('../database')

router.get('/', (req, res) => {
  try {
    const db = getDatabase()
    const tags = db.prepare(
      'SELECT * FROM problem_tags WHERE is_active = 1 ORDER BY sort_order'
    ).all()

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

    res.success({ categories: tree }, 'ok')
  } catch (e) {
    console.error('获取问题标签失败:', e)
    res.fail('获取问题标签失败', 500)
  }
})

module.exports = router
