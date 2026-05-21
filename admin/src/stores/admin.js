import { defineStore } from 'pinia'
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000
})

// 请求拦截器 - 添加Token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器 - Token过期处理
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_info')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const useAdminStore = defineStore('admin', {
  state: () => ({
    token: localStorage.getItem('admin_token') || '',
    adminInfo: JSON.parse(localStorage.getItem('admin_info') || 'null')
  }),

  getters: {
    isLoggedIn: (state) => !!state.token
  },

  actions: {
    async login(username, password) {
      const res = await api.post('/admin/login', { username, password })
      if (res.data.code === 200) {
        this.token = res.data.data.token
        this.adminInfo = res.data.data.admin
        localStorage.setItem('admin_token', res.data.data.token)
        localStorage.setItem('admin_info', JSON.stringify(res.data.data.admin))
        return true
      }
      throw new Error(res.data.message)
    },

    logout() {
      this.token = ''
      this.adminInfo = null
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_info')
    },

    async fetchDashboard() {
      const res = await api.get('/admin/dashboard')
      return res.data
    },

    async fetchArticles(params = {}) {
      const res = await api.get('/admin/articles', { params })
      return res.data
    },

    async fetchArticle(id) {
      const res = await api.get(`/admin/articles/${id}`)
      return res.data
    },

    async createArticle(data) {
      const res = await api.post('/admin/articles', data)
      return res.data
    },

    async updateArticle(id, data) {
      const res = await api.put(`/admin/articles/${id}`, data)
      return res.data
    },

    async deleteArticle(id) {
      const res = await api.delete(`/admin/articles/${id}`)
      return res.data
    },

    async toggleStatus(id, status) {
      const res = await api.patch(`/admin/articles/${id}/status`, { status })
      return res.data
    },

    async toggleFeatured(id) {
      const res = await api.patch(`/admin/articles/${id}/featured`)
      return res.data
    },

    async fetchCategories() {
      const res = await api.get('/categories')
      return res.data
    },

    async fetchTags() {
      const res = await api.get('/tags')
      return res.data
    },

    // ========== 客服对话管理 ==========

    async fetchConversations(params = {}) {
      const res = await api.get('/admin/chat/conversations', { params })
      return res.data
    },

    async fetchConversationDetail(id) {
      const res = await api.get(`/admin/chat/conversations/${id}`)
      return res.data
    },

    async replyToConversation(id, content, contentType = 'text') {
      const res = await api.post(`/admin/chat/conversations/${id}/messages`, { content, content_type: contentType })
      return res.data
    },

    async updateConversationStatus(id, status) {
      const res = await api.patch(`/admin/chat/conversations/${id}/status`, { status })
      return res.data
    },

    async updateConversationTag(id, problemTagId) {
      const res = await api.patch(`/admin/chat/conversations/${id}/tag`, { problem_tag_id: problemTagId })
      return res.data
    },

    async takeNextConversation() {
      const res = await api.post('/admin/chat/conversations/take-next')
      return res.data
    },

    async setAgentOnline() {
      const res = await api.post('/admin/chat/agent/online')
      return res.data
    },

    async setAgentOffline() {
      const res = await api.post('/admin/chat/agent/offline')
      return res.data
    },

    async fetchAgentStatus() {
      const res = await api.get('/admin/chat/agent/status')
      return res.data
    },

    async fetchOfflineMessages(params = {}) {
      const res = await api.get('/admin/chat/offline-messages', { params })
      return res.data
    },

    async convertOfflineMessage(id) {
      const res = await api.post(`/admin/chat/offline-messages/${id}/convert`)
      return res.data
    },

    async ignoreOfflineMessage(id) {
      const res = await api.delete(`/admin/chat/offline-messages/${id}`)
      return res.data
    },

    // ========== 评价管理 ==========

    async fetchRatings(params = {}) {
      const res = await api.get('/admin/chat/ratings', { params })
      return res.data
    },

    async fetchRatingsSummary() {
      const res = await api.get('/admin/chat/ratings/summary')
      return res.data
    },

    async fetchChatStats() {
      const res = await api.get('/admin/chat/stats')
      return res.data
    },

    // ========== FAQ 管理 ==========

    async fetchFaqCategories() {
      const res = await api.get('/admin/faq/categories')
      return res.data
    },

    async createFaqCategory(data) {
      const res = await api.post('/admin/faq/categories', data)
      return res.data
    },

    async updateFaqCategory(id, data) {
      const res = await api.put(`/admin/faq/categories/${id}`, data)
      return res.data
    },

    async deleteFaqCategory(id) {
      const res = await api.delete(`/admin/faq/categories/${id}`)
      return res.data
    },

    async fetchFaqArticles(params = {}) {
      const res = await api.get('/admin/faq/articles', { params })
      return res.data
    },

    async fetchFaqArticle(id) {
      const res = await api.get(`/admin/faq/articles/${id}`)
      return res.data
    },

    async createFaqArticle(data) {
      const res = await api.post('/admin/faq/articles', data)
      return res.data
    },

    async updateFaqArticle(id, data) {
      const res = await api.put(`/admin/faq/articles/${id}`, data)
      return res.data
    },

    async deleteFaqArticle(id) {
      const res = await api.delete(`/admin/faq/articles/${id}`)
      return res.data
    },

    async toggleFaqArticleStatus(id) {
      const res = await api.patch(`/admin/faq/articles/${id}/status`)
      return res.data
    },

    // ========== 系统管理 ==========

    async fetchSystemConfig() {
      const res = await api.get('/admin/system/config')
      return res.data
    },

    async updateSystemConfig(configs) {
      const res = await api.put('/admin/system/config', { configs })
      return res.data
    },

    async fetchProblemTags() {
      const res = await api.get('/admin/system/problem-tags')
      return res.data
    },

    async createProblemTag(data) {
      const res = await api.post('/admin/system/problem-tags', data)
      return res.data
    },

    async updateProblemTag(id, data) {
      const res = await api.put(`/admin/system/problem-tags/${id}`, data)
      return res.data
    },

    async deleteProblemTag(id) {
      const res = await api.delete(`/admin/system/problem-tags/${id}`)
      return res.data
    },

    async toggleProblemTag(id) {
      const res = await api.patch(`/admin/system/problem-tags/${id}/toggle`)
      return res.data
    },

    async fetchQuickReplies(params = {}) {
      const res = await api.get('/admin/system/quick-replies', { params })
      return res.data
    },

    async createQuickReply(data) {
      const res = await api.post('/admin/system/quick-replies', data)
      return res.data
    },

    async updateQuickReply(id, data) {
      const res = await api.put(`/admin/system/quick-replies/${id}`, data)
      return res.data
    },

    async deleteQuickReply(id) {
      const res = await api.delete(`/admin/system/quick-replies/${id}`)
      return res.data
    },

    async exportRatings(params = {}) {
      const res = await api.get('/admin/system/ratings/export', { params })
      return res.data
    }
  }
})

export { api }
