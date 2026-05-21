import { createRouter, createWebHistory } from 'vue-router'
import { useAdminStore } from '@/stores/admin'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '管理员登录' }
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '控制台' }
      },
      {
        path: 'articles',
        name: 'ArticleList',
        component: () => import('@/views/ArticleList.vue'),
        meta: { title: '文章管理' }
      },
      {
        path: 'articles/create',
        name: 'ArticleCreate',
        component: () => import('@/views/ArticleEdit.vue'),
        meta: { title: '新增文章' }
      },
      {
        path: 'articles/edit/:id',
        name: 'ArticleEdit',
        component: () => import('@/views/ArticleEdit.vue'),
        meta: { title: '编辑文章' }
      },
      {
        path: 'chat',
        name: 'ChatManagement',
        component: () => import('@/views/ChatManagement.vue'),
        meta: { title: '客服对话' }
      },
      {
        path: 'faq',
        name: 'FaqManagement',
        component: () => import('@/views/FaqManagement.vue'),
        meta: { title: 'FAQ管理' }
      },
      {
        path: 'quick-replies',
        name: 'QuickReplyManagement',
        component: () => import('@/views/QuickReplyManagement.vue'),
        meta: { title: '快捷回复' }
      },
      {
        path: 'ratings',
        name: 'RatingManagement',
        component: () => import('@/views/RatingManagement.vue'),
        meta: { title: '评价管理' }
      },
      {
        path: 'stats',
        name: 'ChatStats',
        component: () => import('@/views/ChatStats.vue'),
        meta: { title: '客服统计' }
      },
      {
        path: 'problem-tags',
        name: 'ProblemTagManagement',
        component: () => import('@/views/ProblemTagManagement.vue'),
        meta: { title: '问题标签' }
      },
      {
        path: 'settings',
        name: 'SystemConfig',
        component: () => import('@/views/SystemConfig.vue'),
        meta: { title: '系统配置' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - TechAI 管理` : 'TechAI 管理'

  const adminStore = useAdminStore()
  if (to.meta.requiresAuth && !adminStore.isLoggedIn) {
    next('/login')
  } else {
    next()
  }
})

export default router
