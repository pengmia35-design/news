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

  }
})

export { api }
