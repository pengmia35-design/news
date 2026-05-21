<template>
  <div class="page-container">
    <div class="content-layout">
      <!-- 主内容 -->
      <section class="article-list">
        <!-- 分类头部 -->
        <div class="category-header">
          <h1 class="category-title">{{ categoryInfo.name || '加载中...' }}</h1>
          <p class="category-desc" v-if="categoryInfo.description">{{ categoryInfo.description }}</p>
        </div>

        <div v-if="loading" class="loading-state">
          <el-skeleton :rows="5" animated />
        </div>

        <div v-else-if="articles.length === 0" class="empty-state">
          <p>该分类暂无文章</p>
        </div>

        <template v-else>
          <NewsCard v-for="article in articles" :key="article.id" :article="article" />
        </template>

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="pagination-wrap">
          <el-pagination
            background
            layout="prev, pager, next"
            :total="total"
            :page-size="pageSize"
            :current-page="page"
            @current-change="changePage"
          />
        </div>
      </section>

      <!-- 侧边栏 -->
      <Sidebar />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/stores/app'
import NewsCard from '@/components/common/NewsCard.vue'
import Sidebar from '@/components/common/Sidebar.vue'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const store = useAppStore()

const articles = ref([])
const categoryInfo = ref({})
const loading = ref(true)
const page = ref(1)
const total = ref(0)
const pageSize = ref(20)
const totalPages = ref(0)

onMounted(() => {
  store.fetchSidebarData()
  fetchData()
})

watch(() => route.params.slug, () => {
  page.value = 1
  fetchData()
})

function changePage(p) {
  page.value = p
  fetchData()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function fetchData() {
  loading.value = true
  try {
    const res = await api.get(`/articles`, {
      params: { category: route.params.slug, page: page.value, pageSize: pageSize.value }
    })
    if (res.data.code === 200) {
      articles.value = res.data.data.list
      total.value = res.data.data.total
      totalPages.value = res.data.data.totalPages
    }

    const catRes = await api.get('/categories')
    if (catRes.data.code === 200) {
      const found = catRes.data.data.find(c => c.slug === route.params.slug)
      if (found) categoryInfo.value = found
    }
  } catch (e) {
    console.error(e)
  }
  loading.value = false
}
</script>

<style scoped>
.category-header {
  margin-bottom: 24px;
}

.category-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-foreground);
  margin: 0 0 8px;
}

.category-desc {
  font-size: 14px;
  color: var(--color-muted-foreground);
  margin: 0;
}

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

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}

.loading-state, .empty-state {
  padding: 80px 0;
  text-align: center;
  color: var(--color-muted-foreground);
}

@media (max-width: 768px) {
  .content-layout { flex-direction: column; }
}
</style>
