<template>
  <footer class="site-footer">
    <div class="page-container">
      <div class="footer-content">
        <div class="footer-info">
          <div class="footer-logo">
            <span class="logo-icon">▲</span>
            <span>TechAI 资讯</span>
          </div>
          <p class="footer-desc">专注科技、AI大模型、算力、开发工具行业新闻。极简科技阅读，洞见AI未来。</p>
        </div>

        <div class="footer-links">
          <div class="link-group">
            <h4>分类</h4>
            <router-link v-for="cat in categories" :key="cat.id" :to="`/category/${cat.slug}`">
              {{ cat.name }}
            </router-link>
          </div>
          <div class="link-group">
            <h4>关于</h4>
            <router-link to="/about">关于本站</router-link>
            <a href="#">隐私声明</a>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <p>&copy; {{ new Date().getFullYear() }} TechAI 资讯. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { api } from '@/stores/app'

const categories = ref([])

onMounted(async () => {
  try {
    const res = await api.get('/categories')
    if (res.data.code === 200) {
      categories.value = res.data.data
    }
  } catch (e) { /* ignore */ }
})
</script>

<style scoped>
.site-footer {
  background: var(--color-ink-900);
  color: #C5C5D2;
  padding: 48px 0 24px;
  margin-top: 48px;
}

.footer-content {
  display: flex;
  gap: 64px;
  flex-wrap: wrap;
}

.footer-info {
  flex: 1;
  min-width: 280px;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 12px;
}

.logo-icon {
  color: var(--color-amber-500);
}

.footer-desc {
  font-size: 14px;
  line-height: 1.7;
  color: #9D9DB5;
}

.footer-links {
  display: flex;
  gap: 48px;
  flex-wrap: wrap;
}

.link-group h4 {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 12px;
}

.link-group a,
.link-group router-link {
  display: block;
  font-size: 14px;
  color: #9D9DB5;
  text-decoration: none;
  padding: 4px 0;
  transition: color var(--transition-fast);
}

.link-group a:hover,
.link-group router-link:hover {
  color: var(--color-amber-400);
}

.footer-bottom {
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid #334155;
  text-align: center;
}

.footer-bottom p {
  font-size: 13px;
  color: #64748B;
}
</style>
