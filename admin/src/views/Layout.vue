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
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import { DataBoard, Document, Edit } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()

const activeMenu = computed(() => route.path)

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
