import { defineStore } from 'pinia'
import { api } from '@/stores/app'

export const useChatStore = defineStore('chat', {
  state: () => ({
    conversations: [],
    activeConversation: null,
    messages: [],
    problemTags: [],
    widgetOpen: false,
    widgetStep: 'button',      // 'button' | 'prechat' | 'conversations' | 'chat' | 'rating'
    ratingPending: null,       // conversation id awaiting rating
    unreadCount: 0,
    userId: '',
    pollingTimer: null
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
      return uid
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
          // 开始轮询
          this._startPolling(res.data.data.id)
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
          // 计算未读总数
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
          // 更新列表中的未读计数
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
          this._stopPolling()
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
      // Check agent online status
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
      this._stopPolling()
    },

    selectConversation(conv) {
      this.activeConversation = conv
      this.widgetStep = 'chat'
      this.loadMessages(conv.id)
      this._startPolling(conv.id)
    },

    goToConversations() {
      this.widgetStep = 'conversations'
      this.loadConversations()
      this._stopPolling()
    },

    goToPreChat() {
      this.loadProblemTags()
      this.widgetStep = 'prechat'
      this._stopPolling()
    },

    // 5秒轮询新消息
    _startPolling(convId) {
      this._stopPolling()
      this.pollingTimer = setInterval(async () => {
        try {
          const res = await api.get(`/chat/conversations/${convId}`)
          if (res.data.code === 200) {
            this.messages = res.data.data.messages || []
            this.activeConversation = res.data.data.conversation
          }
        } catch (e) { /* silent */ }
      }, 5000)
    },

    _stopPolling() {
      if (this.pollingTimer) {
        clearInterval(this.pollingTimer)
        this.pollingTimer = null
      }
    }
  }
})
