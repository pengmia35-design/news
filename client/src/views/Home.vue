<template>
  <div class="page-container">
    <!-- 科技风轮播 -->
    <section class="hero-carousel">
      <el-carousel :interval="5000" height="336px" indicator-position="none" arrow="always">
        <el-carousel-item v-for="(slide, i) in carouselSlides" :key="i">
          <div class="carousel-slide" :style="{ background: slide.bg }">
            <div class="carousel-overlay"></div>
            <div class="carousel-content">
              <span class="carousel-tag">{{ slide.tag }}</span>
              <h2 class="carousel-title">{{ slide.title }}</h2>
              <p class="carousel-desc">{{ slide.desc }}</p>
              <router-link :to="slide.link" class="carousel-btn">了解更多 →</router-link>
            </div>
          </div>
        </el-carousel-item>
      </el-carousel>
    </section>

    <!-- 快捷分类导航 -->
    <section class="category-nav">
      <router-link
        v-for="cat in visibleCategories"
        :key="cat.id"
        :to="`/category/${cat.slug}`"
        class="cat-nav-item"
      >
        <span class="cat-icon">{{ categoryIcons[cat.slug] || '📰' }}</span>
        <span class="cat-name">{{ cat.name }}</span>
        <span class="cat-count">{{ cat.article_count || 0 }} 篇</span>
      </router-link>
    </section>

    <!-- 主内容区 -->
    <div class="content-layout">
      <!-- 文章列表 -->
      <section class="article-list">
        <div class="section-header">
          <h2 class="section-title">最新资讯</h2>
          <router-link to="/search" class="section-more">查看更多 →</router-link>
        </div>

        <div v-if="loading" class="loading-state">
          <el-skeleton :rows="5" animated />
        </div>

        <div v-else-if="articles.length === 0" class="empty-state">
          <p>暂无文章</p>
        </div>

        <template v-else>
          <TransitionGroup name="card-reveal" tag="div" class="card-list">
            <NewsCard v-for="article in articles" :key="article.id" :article="article" />
          </TransitionGroup>
        </template>

        <!-- 加载更多 -->
        <div v-if="hasMore" class="load-more">
          <button class="btn-primary" @click="loadMore" :disabled="loadingMore">
            {{ loadingMore ? '加载中...' : '加载更多' }}
          </button>
        </div>
      </section>

      <!-- 侧边栏 -->
      <Sidebar />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { api } from '@/stores/app'
import NewsCard from '@/components/common/NewsCard.vue'
import Sidebar from '@/components/common/Sidebar.vue'

const store = useAppStore()
const articles = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const page = ref(1)
const hasMore = ref(true)

const categories = computed(() => store.categories)
const visibleCategories = computed(() => store.categories.filter(c => c.slug !== 'tech-trends'))

const defaultSlides = [
  { bg: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 40%, #93C5FD 70%, #F8FAFC 100%)', tag: 'AI 前沿', title: '探索人工智能的无限可能', desc: '从大模型到具身智能，AI 技术正在重塑每一个行业。掌握前沿动态，洞察未来趋势。', link: '/category/ai-news' },
  { bg: 'linear-gradient(135deg, #ECFEFF 0%, #CFFAFE 40%, #67E8F9 70%, #F8FAFC 100%)', tag: '算力革命', title: '算力即生产力', desc: 'GPU 云租赁、智算中心、边缘推理 — 算力基础设施正在经历前所未有的变革与升级。', link: '/category/cloud-computing' },
  { bg: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 40%, #C4B5FD 70%, #F8FAFC 100%)', tag: '芯片突破', title: '芯片竞争白热化，国产崛起正当时', desc: 'Blackwell 大规模出货、昇腾 920 流片成功、HBM4 标准发布 — AI 芯片格局加速重塑。', link: '/category/nvidia-chip' }
]
const carouselSlides = ref([...defaultSlides])

const categoryIcons = {
  'ai-news': '🤖',
  'cloud-computing': '☁️',
  'nvidia-chip': '💠',
  'dev-tools': '🛠️',
  'tech-trends': '🔬',
  'ai-applications': '🧩'
}

onMounted(async () => {
  await Promise.all([
    store.fetchCategories(),
    store.fetchSidebarData(),
    fetchArticles(),
    fetchCarouselSlides()
  ])
  loading.value = false
})

async function fetchCarouselSlides() {
  try {
    const res = await api.get('/carousel/active')
    if (res.data.code === 200 && res.data.data?.length > 0) {
      carouselSlides.value = res.data.data.map(s => ({
        bg: `url('${s.image_url}') center/cover no-repeat`,
        tag: s.tag || '',
        title: s.title || '',
        desc: s.description || '',
        link: s.link || '/'
      }))
    }
  } catch (e) { /* use defaults */ }
}

async function fetchArticles() {
  try {
    const res = await api.get('/articles', { params: { page: 1, pageSize: 10 } })
    if (res.data.code === 200) {
      articles.value = res.data.data.list
      hasMore.value = res.data.data.page < res.data.data.totalPages
    }
  } catch (e) {
    console.error(e)
  }
}

async function loadMore() {
  loadingMore.value = true
  page.value++
  try {
    const res = await api.get('/articles', { params: { page: page.value, pageSize: 10 } })
    if (res.data.code === 200) {
      articles.value.push(...res.data.data.list)
      hasMore.value = res.data.data.page < res.data.data.totalPages
    }
  } catch (e) {
    console.error(e)
  }
  loadingMore.value = false
}

</script>

<style scoped>
/* 分类导航 */
.category-nav {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.cat-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 28px 16px;
  background: var(--color-card);
  border: 1.5px solid var(--color-border);
  border-radius: 14px;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.cat-nav-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-cyan-500));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.cat-nav-item:hover::before {
  opacity: 1;
}

.cat-nav-item:hover {
  border-color: var(--color-primary);
  box-shadow: 0 8px 32px rgba(37, 99, 235, 0.12);
  transform: translateY(-4px);
  background: var(--color-accent);
}

.cat-icon {
  font-size: 34px;
  transition: transform 0.3s ease;
}

.cat-nav-item:hover .cat-icon {
  transform: scale(1.15);
}

.cat-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-foreground);
  letter-spacing: 0.5px;
}

.cat-count {
  font-size: 13px;
  color: var(--color-muted-foreground);
  font-weight: 500;
}

/* 内容布局 */
.content-layout {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

.article-list {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-foreground);
  position: relative;
  padding-left: 14px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 4px;
  bottom: 4px;
  width: 4px;
  background: linear-gradient(to bottom, var(--color-primary), var(--color-cyan-500));
  border-radius: 2px;
}

.section-more {
  font-size: 14px;
  color: var(--color-primary);
  text-decoration: none;
}

.load-more {
  text-align: center;
  padding: 20px 0;
}

.loading-state, .empty-state {
  padding: 60px 0;
  text-align: center;
  color: var(--color-muted-foreground);
}

/* Card list + reveal */
.card-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-reveal-enter-active {
  transition: all 0.4s ease-out;
}
.card-reveal-enter-from {
  opacity: 0;
  transform: translateY(16px);
}

/* 科技风轮播 */
.hero-carousel {
  margin-bottom: 32px;
  border-radius: var(--card-radius);
  overflow: hidden;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
}

.carousel-slide {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 60px;
  overflow: hidden;
}

.carousel-overlay {
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='g' patternUnits='userSpaceOnUse' width='60' height='60'%3E%3Ccircle cx='30' cy='30' r='1' fill='rgba(37,99,235,0.06)'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='60' height='60' fill='url(%23g)'/%3E%3C/svg%3E");
  pointer-events: none;
}

.carousel-content {
  position: relative;
  z-index: 1;
  max-width: 560px;
}

.carousel-tag {
  display: inline-block;
  padding: 4px 14px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: var(--color-primary);
  border-radius: 20px;
  margin-bottom: 16px;
  letter-spacing: 1px;
}

.carousel-title {
  font-size: 36px;
  font-weight: 800;
  font-family: 'DM Sans', 'Noto Sans SC', 'PingFang SC', sans-serif;
  color: #0F172A;
  line-height: 1.2;
  margin: 0 0 12px;
}

.carousel-desc {
  font-size: 15px;
  color: #475569;
  line-height: 1.7;
  margin: 0 0 24px;
}

.carousel-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.3s ease;
}

.carousel-btn:hover {
  background: var(--color-primary-hover);
  transform: translateX(4px);
  box-shadow: var(--glow-primary);
}

/* 响应式 */
@media (max-width: 768px) {
  .content-layout { flex-direction: column; }
  .category-nav {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .cat-nav-item { padding: 20px 12px; }
  .cat-icon { font-size: 28px; }
  .cat-name { font-size: 14px; }
}
</style>
