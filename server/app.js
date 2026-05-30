// ========================================
// TechAI 资讯 - 服务端入口
// Express + SQLite (sql.js) + JWT 认证
// ========================================

const express = require('express')
const cors = require('cors')
const path = require('path')
const { initDatabase, closeDatabase } = require('./database')

async function main() {
  await initDatabase()

  const app = express()
  const PORT = process.env.PORT || 3001

  // 中间件
  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177'],
    credentials: true
  }))
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))

  // 静态文件 - 上传目录
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

  // SAAS 后台管理面板
  app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin-dashboard.html'))
  })

  // 微信 H5 移动端
  app.get('/wechat', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'wechat-h5.html'))
  })

  // 请求日志
  app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`)
    next()
  })

  // 统一返回格式
  function success(data = null, message = 'ok') {
    return { code: 200, message, data }
  }

  function fail(message = 'error', code = 400) {
    return { code, message, data: null }
  }

  // 挂载到 res
  app.use((req, res, next) => {
    res.success = (data, message) => res.json(success(data, message))
    res.fail = (message, code) => res.status(code).json(fail(message, code))
    next()
  })

  // ===================== 路由 =====================
  app.use('/api/admin', require('./routes/admin'))
  app.use('/api/admin/articles', require('./routes/admin-articles'))
  app.use('/api/articles', require('./routes/articles'))
  app.use('/api/categories', require('./routes/categories'))
  app.use('/api/carousel', require('./routes/admin-carousel'))
  app.use('/api/tags', require('./routes/tags'))
  app.use('/api/upload', require('./routes/upload'))
  app.use('/api/crawler', require('./routes/crawler'))
app.use('/api/problem-tags', require('./routes/problem-tags'))
app.use('/api/chat', require('./routes/chat'))
app.use('/api/faq', require('./routes/faq'))
app.use('/api/admin/chat', require('./routes/admin-chat'))
app.use('/api/admin/faq', require('./routes/admin-faq'))
app.use('/api/admin/system', require('./routes/admin-system'))

  // 全局错误处理
  app.use((err, req, res, next) => {
    console.error('Server Error:', err)
    res.status(500).json(fail(err.message || '服务器内部错误', 500))
  })

  const server = app.listen(PORT, () => {
    console.log(`\n  🚀 TechAI 资讯服务已启动`)
    console.log(`  📡 接口地址: http://localhost:${PORT}/api`)
    console.log(`  📦 数据库: SQLite (sql.js)`)
    console.log(`  🔧 环境: ${process.env.NODE_ENV || 'development'}\n`)
  })

  // 优雅退出
  process.on('SIGINT', () => {
    console.log('\n  👋 正在关闭服务...')
    closeDatabase()
    server.close()
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    closeDatabase()
    server.close()
    process.exit(0)
  })
}

main().catch(err => {
  console.error('❌ 服务器启动失败:', err)
  process.exit(1)
})
