<template>
  <header class="site-header">
    <div class="header-inner page-container">
      <!-- Logo -->
      <router-link to="/" class="logo">
        <span class="logo-icon">▲</span>
        <span class="logo-text">TechAI <small>资讯</small></span>
      </router-link>

      <!-- Desktop Navigation -->
      <nav class="nav-menu">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-link"
          :class="{ active: isActive(item.path) }"
        >
          {{ item.name }}
        </router-link>
      </nav>

      <!-- Search -->
      <div class="header-search">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索文章..."
          :prefix-icon="Search"
          size="small"
          clearable
          @keyup.enter="doSearch"
        />
      </div>

      <!-- Mobile menu toggle -->
      <button class="mobile-menu-btn" @click="showMobileMenu = !showMobileMenu">
        <el-icon :size="22"><Menu /></el-icon>
      </button>
    </div>

    <!-- Mobile navigation -->
    <transition name="slide-down">
      <div v-if="showMobileMenu" class="mobile-menu">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="mobile-nav-link"
          :class="{ active: isActive(item.path) }"
          @click="showMobileMenu = false"
        >
          {{ item.name }}
        </router-link>
      </div>
    </transition>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, Menu } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const searchKeyword = ref('')
const showMobileMenu = ref(false)

const navItems = [
  { name: '首页', path: '/' },
  { name: 'AI资讯', path: '/category/ai-news' },
  { name: '算力芯片', path: '/category/cloud-computing' },
  { name: '英伟达专区', path: '/category/nvidia-chip' },
  { name: '开发工具', path: '/category/dev-tools' },
  { name: '帮助中心', path: '/faq' },
  { name: '关于本站', path: '/about' }
]

function isActive(path) {
  if (path === '/') return route.path === '/'
  if (path.startsWith('/category')) return route.path.startsWith('/category')
  return route.path === path
}

function doSearch() {
  if (searchKeyword.value.trim()) {
    router.push({ name: 'Search', query: { q: searchKeyword.value.trim() } })
    showMobileMenu.value = false
  }
}
</script>

<style scoped>
.site-header {
  background: rgba(255, 253, 247, 0.97);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(8px);
}

.header-inner {
  display: flex;
  align-items: center;
  height: 64px;
  gap: 32px;
}

/* Logo */
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  flex-shrink: 0;
}

.logo-icon {
  font-size: 22px;
  color: var(--color-primary);
  font-weight: 700;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-foreground);
  letter-spacing: 1px;
}

.logo-text small {
  font-size: 14px;
  font-weight: 400;
  color: var(--color-muted-foreground);
}

/* Navigation */
.nav-menu {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.nav-link {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-muted-foreground);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.nav-link:hover {
  color: var(--color-primary);
  background: var(--color-accent);
}

.nav-link.active {
  color: var(--color-primary);
  background: var(--color-accent);
  font-weight: 600;
}

.header-search {
  width: 240px;
  flex-shrink: 0;
}

.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-foreground);
  padding: 4px;
}

/* Mobile menu */
.mobile-menu {
  display: none;
  flex-direction: column;
  padding: 8px 16px 16px;
  border-top: 1px solid var(--color-border);
  background: var(--color-background);
}

.mobile-nav-link {
  padding: 12px 16px;
  font-size: 15px;
  color: var(--color-muted-foreground);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.mobile-nav-link:hover,
.mobile-nav-link.active {
  color: var(--color-primary);
  background: var(--color-accent);
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Responsive */
@media (max-width: 768px) {
  .nav-menu, .header-search { display: none; }
  .mobile-menu-btn { display: flex; }
  .mobile-menu { display: flex; }
}

@media (min-width: 769px) {
  .mobile-menu-btn { display: none; }
  .mobile-menu { display: none !important; }
}
</style>
