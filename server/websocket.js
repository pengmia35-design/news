// WebSocket 实时消息推送
const { WebSocketServer } = require('ws')

let wss = null
// conversation_id → Set<WebSocket>
const convClients = new Map()
// admin WebSocket clients (接收全局通知)
const adminClients = new Set()

function initWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws' })

  wss.on('connection', (ws, req) => {
    let clientType = null
    let clientId = null
    let subscribedConvs = []

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString())
        switch (msg.type) {
          case 'auth_user':
            clientType = 'user'
            clientId = msg.userId
            break
          case 'auth_admin':
            clientType = 'admin'
            clientId = 'admin'
            adminClients.add(ws)
            break
          case 'subscribe':
            // 订阅指定对话
            const convId = msg.conversation_id
            if (convId && !subscribedConvs.includes(convId)) {
              subscribedConvs.push(convId)
              if (!convClients.has(convId)) convClients.set(convId, new Set())
              convClients.get(convId).add(ws)
            }
            break
          case 'unsubscribe':
            const cid = msg.conversation_id
            if (cid && convClients.has(cid)) {
              convClients.get(cid).delete(ws)
            }
            subscribedConvs = subscribedConvs.filter(id => id !== cid)
            break
        }
      } catch (e) { /* ignore invalid messages */ }
    })

    ws.on('close', () => {
      // 清理订阅
      subscribedConvs.forEach(cid => {
        if (convClients.has(cid)) convClients.get(cid).delete(ws)
      })
      adminClients.delete(ws)
    })

    ws.on('error', () => {})
  })

  console.log('  🔌 WebSocket 服务已启动 (路径: /ws)')
  return wss
}

// 向指定对话的所有订阅者广播
function broadcastToConversation(conversationId, event) {
  const clients = convClients.get(conversationId)
  if (!clients) return
  const payload = JSON.stringify(event)
  clients.forEach(ws => {
    if (ws.readyState === 1) ws.send(payload)
  })
}

// 向所有管理员广播
function broadcastToAdmins(event) {
  const payload = JSON.stringify(event)
  adminClients.forEach(ws => {
    if (ws.readyState === 1) ws.send(payload)
  })
}

// 新消息事件
function emitNewMessage(conversationId, message) {
  const event = { type: 'new_message', conversation_id: conversationId, message }
  broadcastToConversation(conversationId, event)
  broadcastToAdmins({ type: 'admin_unread_update', conversation_id: conversationId })
}

// 对话状态变更
function emitStatusChange(conversationId, status) {
  const event = { type: 'status_change', conversation_id: conversationId, status }
  broadcastToConversation(conversationId, event)
  broadcastToAdmins(event)
}

// 管理员回复
function emitAdminReply(conversationId, message) {
  const event = { type: 'admin_reply', conversation_id: conversationId, message }
  broadcastToConversation(conversationId, event)
}

module.exports = { initWebSocket, emitNewMessage, emitStatusChange, emitAdminReply, broadcastToAdmins }
