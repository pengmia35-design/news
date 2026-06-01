import { defineStore } from 'pinia'
import { api } from '@/stores/app'

const WS_URL = `ws://${window.location.hostname}:3001/ws`

export const useChatStore = defineStore('chat', {
  state: () => ({
    conversations: [],
    activeConversation: null,
    messages: [],
    problemTags: [],
    widgetOpen: false,
    widgetStep: 'button',      // 'button' | 'prechat' | 'conversations' | 'chat' | 'rating' | 'offline'
    ratingPending: null,
    unreadCount: 0,
    userId: '',
    ws: null,
    wsReconnectTimer: null,
    subscribedConvId: null
  }),

  getters: {
    hasConversations: (state) => state.conversations.length > 0,
    currentRatingConv: (state) => state.ratingPending
      ? state.conversations.find(c => c.id === state.ratingPending)
      : null
  },

  actions: {
    // 初始化用户标识（存 localStorage）
    initUserId() {
      let uid = localStorage.getItem('chat_user_id')
      if (!uid) {
        uid = 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
        localStorage.setItem('chat_user_id', uid)
      }
      this.userId = uid
      this._connectWebSocket()
      return uid
    },

    // WebSocket 连接
    _connectWebSocket() {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) return
      try {
        this.ws = new WebSocket(WS_URL)
        this.ws.onopen = () => {
          this.ws.send(JSON.stringify({ type: 'auth_user', userId: this.userId }))
          // 重新订阅当前对话
          if (this.subscribedConvId) {
            this.ws.send(JSON.stringify({ type: 'subscribe', conversation_id: this.subscribedConvId }))
          }
        }
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            this._handleWsEvent(data)
          } catch (e) { /* ignore */ }
        }
        this.ws.onclose = () => {
          // 5秒后自动重连
          if (this.wsReconnectTimer) clearTimeout(this.wsReconnectTimer)
          this.wsReconnectTimer = setTimeout(() => this._connectWebSocket(), 5000)
        }
        this.ws.onerror = () => {}
      } catch (e) { /* ignore */ }
    },

    _handleWsEvent(data) {
      switch (data.type) {
        case 'new_message':
          // 用户消息确认（自己发的回显已经 optimistic 了，这里处理 AI 自动回复）
          if (data.conversation_id === this.activeConversation?.id) {
            // 避免重复添加（optimistic 已添加的消息无需再 push）
            const exists = this.messages.some(m => m.id === data.message.id)
            if (!exists) {
              this.messages.push(data.message)
            }
          }
          // 更新对话列表中的最后消息
          this._updateConvLastMsg(data.conversation_id, data.message)
          break
        case 'admin_reply':
          if (data.conversation_id === this.activeConversation?.id) {
            const exists = this.messages.some(m => m.id === data.message.id)
            if (!exists) {
              this.messages.push(data.message)
              // 标记管理员消息为已读
              this.messages = [...this.messages]
            }
          }
          this._updateConvLastMsg(data.conversation_id, data.message)
          break
        case 'status_change':
          if (data.conversation_id === this.activeConversation?.id && this.activeConversation) {
            this.activeConversation.status = data.status
          }
          const ci = this.conversations.findIndex(c => c.id == data.conversation_id)
          if (ci >= 0) this.conversations[ci].status = data.status
          break
      }
    },

    _updateConvLastMsg(convId, msg) {
      const idx = this.conversations.findIndex(c => c.id == convId)
      if (idx >= 0) {
        this.conversations[idx].last_message = msg.content
        this.conversations[idx].updated_at = msg.created_at
      }
    },

    // 订阅/取消订阅对话
    _subscribeConv(convId) {
      if (this.subscribedConvId && this.subscribedConvId !== convId) {
        this._sendWs({ type: 'unsubscribe', conversation_id: this.subscribedConvId })
      }
      this.subscribedConvId = convId
      this._sendWs({ type: 'subscribe', conversation_id: convId })
    },

    _unsubscribeConv() {
      if (this.subscribedConvId) {
        this._sendWs({ type: 'unsubscribe', conversation_id: this.subscribedConvId })
        this.subscribedConvId = null
      }
    },

    _sendWs(msg) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(msg))
      }
    },

    async loadProblemTags() {
      try {
        const res = await api.get('/problem-tags')
        if (res.data.code === 200) {
          this.problemTags = res.data.data.categories || []
        }
      } catch (e) {
        console.error('获取问题标签失败:', e)
      }
    },

    async startConversation(userName, problemTagId) {
      try {
        const res = await api.post('/chat/conversations', {
          user_id: this.userId,
          user_name: userName || '',
          problem_tag_id: problemTagId
        })
        if (res.data.code === 200) {
          this.activeConversation = res.data.data
          this.messages = []
          this.widgetStep = 'chat'
          this._subscribeConv(res.data.data.id)
          return res.data.data
        }
      } catch (e) {
        console.error('创建对话失败:', e)
      }
      return null
    },

    async loadConversations() {
      try {
        const res = await api.get('/chat/conversations', {
          params: { user_id: this.userId, pageSize: 50 }
        })
        if (res.data.code === 200) {
          this.conversations = res.data.data.list || []
          this.unreadCount = this.conversations.reduce(
            (sum, c) => sum + (c.unread_count || 0), 0
          )
        }
      } catch (e) {
        console.error('获取对话列表失败:', e)
      }
    },

    async loadMessages(conversationId) {
      try {
        const res = await api.get(`/chat/conversations/${conversationId}`)
        if (res.data.code === 200) {
          this.activeConversation = res.data.data.conversation
          this.messages = res.data.data.messages || []
          const idx = this.conversations.findIndex(c => c.id == conversationId)
          if (idx >= 0) this.conversations[idx].unread_count = 0
        }
      } catch (e) {
        console.error('获取消息失败:', e)
      }
    },

    async sendMessage(content, contentType = 'text') {
      if (!this.activeConversation) return null
      try {
        const res = await api.post(
          `/chat/conversations/${this.activeConversation.id}/messages`,
          { user_id: this.userId, content, content_type: contentType }
        )
        if (res.data.code === 200) {
          this.messages.push(res.data.data)
          return res.data.data
        }
      } catch (e) {
        console.error('发送消息失败:', e)
      }
      return null
    },

    async closeConversation(conversationId) {
      try {
        const res = await api.patch(`/chat/conversations/${conversationId}/close`)
        if (res.data.code === 200) {
          this.ratingPending = conversationId
          this.widgetStep = 'rating'
          this._unsubscribeConv()
        }
      } catch (e) {
        console.error('关闭对话失败:', e)
      }
    },

    async submitRating(conversationId, rating, ratingTags, ratingText) {
      try {
        const res = await api.post(`/chat/conversations/${conversationId}/rate`, {
          rating, rating_tags: ratingTags, rating_text: ratingText
        })
        if (res.data.code === 200) {
          this.ratingPending = null
          this.widgetStep = 'button'
          this.activeConversation = null
          this.messages = []
          await this.loadConversations()
        }
      } catch (e) {
        console.error('提交评价失败:', e)
      }
    },

    async openWidget() {
      this.widgetOpen = true
      try {
        const res = await api.get('/admin/chat/agent/status')
        if (res.data.code === 200 && !res.data.data.agent_online && this.conversations.length === 0) {
          this.loadProblemTags()
          this.widgetStep = 'offline'
          return
        }
      } catch (e) { /* fall through */ }

      if (this.hasConversations) {
        this.widgetStep = 'conversations'
        this.loadConversations()
      } else {
        this.loadProblemTags()
        this.widgetStep = 'prechat'
      }
    },

    closeWidget() {
      this.widgetOpen = false
      this.widgetStep = 'button'
      this._unsubscribeConv()
    },

    selectConversation(conv) {
      this.activeConversation = conv
      this.widgetStep = 'chat'
      this.loadMessages(conv.id)
      this._subscribeConv(conv.id)
    },

    goToConversations() {
      this.widgetStep = 'conversations'
      this.loadConversations()
      this._unsubscribeConv()
    },

    goToPreChat() {
      this.loadProblemTags()
      this.widgetStep = 'prechat'
      this._unsubscribeConv()
    }
  }
})
