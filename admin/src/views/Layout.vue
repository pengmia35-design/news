<template>
  <el-container style="height: 100vh">
    <!-- 侧边栏 -->
    <el-aside width="220px" class="admin-aside">
      <div class="aside-header">
        <router-link to="/" class="aside-logo">TechAI 管理</router-link>
      </div>

      <el-menu
        :default-active="activeMenu"
        router
        class="admin-menu"
        background-color="#0F172A"
        text-color="#94A3B8"
        active-text-color="#60A5FA"
      >
        <el-menu-item index="/">
          <el-icon><DataBoard /></el-icon>
          <span>控制台</span>
        </el-menu-item>

        <el-menu-item index="/articles">
          <el-icon><Document /></el-icon>
          <span>文章管理</span>
        </el-menu-item>

        <el-menu-item index="/articles/create">
          <el-icon><Edit /></el-icon>
          <span>新增文章</span>
        </el-menu-item>

        <el-menu-item index="/chat">
          <el-icon><ChatDotRound /></el-icon>
          <span>客服对话</span>
          <span v-if="offlineBadge > 0" class="menu-badge">{{ offlineBadge }}</span>
        </el-menu-item>

        <el-sub-menu index="faq-sub">
          <template #title>
            <el-icon><QuestionFilled /></el-icon>
            <span>FAQ管理</span>
          </template>
          <el-menu-item index="/faq">文章管理</el-menu-item>
          <el-menu-item index="/quick-replies">快捷回复</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="data-sub">
          <template #title>
            <el-icon><DataAnalysis /></el-icon>
            <span>数据中心</span>
          </template>
          <el-menu-item index="/stats">客服统计</el-menu-item>
          <el-menu-item index="/ratings">评价管理</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="settings-sub">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统设置</span>
          </template>
          <el-menu-item index="/problem-tags">问题标签</el-menu-item>
          <el-menu-item index="/settings">系统配置</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <!-- 主区域 -->
    <el-container>
      <!-- 顶部栏 -->
      <el-header class="admin-header">
        <span class="header-title">{{ route.meta.title }}</span>
        <div class="header-right">
          <span class="admin-name">{{ adminStore.adminInfo?.nickname || adminStore.adminInfo?.username }}</span>
          <el-button size="small" @click="handleLogout">退出</el-button>
        </div>
      </el-header>

      <!-- 内容区 -->
      <el-main class="admin-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import { DataBoard, Document, Edit, ChatDotRound, QuestionFilled, DataAnalysis, Setting } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()

const activeMenu = computed(() => route.path)
const offlineBadge = ref(0)
let badgeTimer = null

onMounted(() => {
  fetchBadge()
  badgeTimer = setInterval(fetchBadge, 60000)
})

onUnmounted(() => {
  if (badgeTimer) clearInterval(badgeTimer)
})

async function fetchBadge() {
  try {
    const res = await adminStore.fetchAgentStatus()
    if (res.code === 200) {
      offlineBadge.value = res.data.offline_pending_count || 0
    }
  } catch (e) { /* silent */ }
}

function handleLogout() {
  adminStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.admin-aside {
  background: #0F172A;
  overflow-y: auto;
  border-right: 1px solid #1E293B;
}

.aside-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #1E293B;
}

.aside-logo {
  font-size: 18px;
  font-weight: 700;
  color: #60A5FA;
  text-decoration: none;
  letter-spacing: 1px;
  font-family: 'JetBrains Mono', monospace;
}

.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #FFFFFF;
  border-bottom: 1px solid #E2E8F0;
  padding: 0 24px;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #1E293B;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-name {
  font-size: 14px;
  color: #64748B;
}

.admin-main {
  background: #F4F6FA;
  padding: 24px;
}

.menu-badge {
  display: inline-block;
  background: #DC2626;
  color: #fff;
  border-radius: 10px;
  padding: 0 6px;
  font-size: 11px;
  line-height: 18px;
  min-width: 18px;
  text-align: center;
  margin-left: auto;
  margin-right: 4px;
}
</style>
