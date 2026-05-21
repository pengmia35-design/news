// ========================================
// 全局状态管理
// ========================================

import { defineStore } from 'pinia'
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

export const useAppStore = defineStore('app', {
  state: () => ({
    categories: [],
    hotTags: [],
    latestArticles: [],
    hotArticles: [],
    siteInfo: {
      articleCount: 0,
      categoryCount: 0
    }
  }),

  actions: {
    async fetchCategories() {
      try {
        const res = await api.get('/categories')
        if (res.data.code === 200) {
          this.categories = res.data.data
        }
      } catch (e) {
        console.error('获取分类失败:', e)
      }
    },

    async fetchHotTags() {
      try {
        const res = await api.get('/tags')
        if (res.data.code === 200) {
          this.hotTags = res.data.data.slice(0, 20)
        }
      } catch (e) {
        console.error('获取标签失败:', e)
      }
    },

    async fetchSidebarData() {
      try {
        const [latestRes, hotRes, tagsRes] = await Promise.all([
          api.get('/articles', { params: { page: 1, pageSize: 5 } }),
          api.get('/articles', { params: { page: 1, pageSize: 100 } }),
          api.get('/tags')
        ])

        if (latestRes.data.code === 200) {
          this.latestArticles = latestRes.data.data.list
        }
        if (hotRes.data.code === 200) {
          // 按阅读量排序取前8
          this.hotArticles = [...hotRes.data.data.list]
            .sort((a, b) => b.view_count - a.view_count)
            .slice(0, 8)
        }
        if (tagsRes.data.code === 200) {
          this.hotTags = tagsRes.data.data.slice(0, 20)
        }
      } catch (e) {
        console.error('获取侧边栏数据失败:', e)
      }
    }
  }
})

export { api }
