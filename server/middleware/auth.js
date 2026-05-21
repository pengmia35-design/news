// ========================================
// JWT 身份校验中间件
// ========================================

const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'techai-news-secret-key-2024'

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.fail('未登录或Token已过期', 401)
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.admin = decoded
    next()
  } catch (err) {
    return res.fail('Token无效或已过期', 401)
  }
}

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

module.exports = { authMiddleware, generateToken, JWT_SECRET }
