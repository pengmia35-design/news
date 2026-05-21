// ========================================
// 文件上传路由
// ========================================

const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const name = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext
    cb(null, name)
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

// 上传图片
router.post('/image', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) return res.fail('请选择图片文件')
  const url = `/uploads/${req.file.filename}`
  res.success({ url, filename: req.file.filename }, '上传成功')
})

// 删除上传的图片
router.delete('/image/:filename', authMiddleware, (req, res) => {
  const filename = path.basename(req.params.filename)
  const filePath = path.join(UPLOAD_DIR, filename)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  res.success(null, '删除成功')
})

module.exports = router
