// ========================================
// 数据库初始化脚本
// 创建表结构和默认数据
// ========================================

const { initDatabase } = require('./database')

async function main() {
  console.log('正在初始化数据库...')
  await initDatabase()
  console.log('  ✅ 数据库初始化完成')
  process.exit(0)
}

main().catch(err => {
  console.error('❌ 数据库初始化失败:', err)
  process.exit(1)
})
