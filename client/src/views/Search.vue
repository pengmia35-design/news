<template>
  <div class="page-container">
    <div class="content-layout">
      <section class="article-list">
        <!-- 搜索框 -->
        <div class="search-section">
          <el-input
            v-model="keyword"
            placeholder="搜索文章标题、摘要、内容..."
            size="large"
            clearable
            @keyup.enter="doSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
            <template #append>
              <el-button @click="doSearch">搜索</el-button>
            </template>
          </el-input>
        </div>

        <!-- 结果统计 -->
        <div class="result-info" v-if="searched">
          共找到 <strong>{{ total }}</strong> 篇相关文章
        </div>

        <!-- 标签快捷筛选 -->
        <div class="tag-filter" v-if="tags.length > 0">
          <span class="filter-label">热门标签:</span>
          <router-link
            v-for="tag in tags.slice(0, 12)" :key="tag.id"
            :to="`/search?tag=${tag.slug}`"
            class="tag-filter-item"
            :class="{ active: currentTag === tag.slug }"
          >
            {{ tag.name }}
          </router-link>
        </div>

        <div v-if="loading" class="loading-state">
          <el-skeleton :rows="5" animated />
        </div>

        <div v-else-if="articles.length === 0 && searched" class="empty-state">
          <p>未找到相关文章，试试其他关键词</p>
        </div>

        <template v-else>
          <NewsCard v-for="article in articles" :key="article.id" :article="article" />
        </template>

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

const keyword = ref('')
const articles = ref([])
const loading = ref(false)
const searched = ref(false)
const page = ref(1)
const total = ref(0)
const pageSize = ref(20)
const totalPages = ref(0)
const currentTag = ref('')
const tags = ref([])

onMounted(async () => {
  store.fetchSidebarData()
  await fetchTags()

  if (route.query.q) {
    keyword.value = route.query.q
    doSearch()
  } else if (route.query.tag) {
    currentTag.value = route.query.tag
    searchByTag()
  }
})

watch(() => route.query, (q) => {
  if (q.q) {
    keyword.value = q.q
    doSearch()
  } else if (q.tag) {
    currentTag.value = q.tag
    searchByTag()
  }
})

async function fetchTags() {
  try {
    const res = await api.get('/tags')
    if (res.data.code === 200) tags.value = res.data.data
  } catch (e) { /* ignore */ }
}

function doSearch() {
  if (!keyword.value.trim()) return
  page.value = 1
  currentTag.value = ''
  fetchByKeyword()
}

function searchByTag() {
  page.value = 1
  fetchByTag()
}

function changePage(p) {
  page.value = p
  if (currentTag.value) fetchByTag()
  else fetchByKeyword()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function fetchByKeyword() {
  loading.value = true
  searched.value = true
  try {
    const res = await api.get('/articles', {
      params: { keyword: keyword.value, page: page.value, pageSize: pageSize.value }
    })
    if (res.data.code === 200) {
      articles.value = res.data.data.list
      total.value = res.data.data.total
      totalPages.value = res.data.data.totalPages
    }
  } catch (e) { console.error(e) }
  loading.value = false
}

async function fetchByTag() {
  loading.value = true
  searched.value = true
  try {
    const res = await api.get(`/tags/${currentTag.value}/articles`, {
      params: { page: page.value, pageSize: pageSize.value }
    })
    if (res.data.code === 200) {
      articles.value = res.data.data.list
      total.value = res.data.data.total
      totalPages.value = res.data.data.totalPages
    }
  } catch (e) { console.error(e) }
  loading.value = false
}
</script>

<style scoped>
.search-section {
  margin-bottom: 20px;
}

.result-info {
  font-size: 14px;
  color: var(--color-muted-foreground);
  margin-bottom: 16px;
}

.tag-filter {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--card-radius);
}

.filter-label {
  font-size: 13px;
  color: var(--color-muted-foreground);
  flex-shrink: 0;
}

.tag-filter-item {
  padding: 4px 12px;
  font-size: 12px;
  border-radius: var(--radius-full);
  background: var(--color-muted);
  color: var(--color-muted-foreground);
  text-decoration: none;
  transition: all var(--transition-fast);
}

.tag-filter-item:hover,
.tag-filter-item.active {
  background: var(--color-primary);
  color: #fff;
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
