<template>
  <div class="faq-center">
    <div class="page-container">
      <!-- 搜索栏 -->
      <div class="faq-search">
        <h1 class="faq-title">帮助中心</h1>
        <el-input
          v-model="keyword"
          size="large"
          placeholder="搜索常见问题..."
          :prefix-icon="Search"
          clearable
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #append>
            <el-button :icon="Search" @click="handleSearch">搜索</el-button>
          </template>
        </el-input>
      </div>

      <div class="faq-layout">
        <!-- 分类侧栏 -->
        <aside class="faq-aside">
          <h3>文章分类</h3>
          <div
            v-for="cat in categories"
            :key="cat.id"
            class="faq-cat-item"
            :class="{ active: activeCatId === cat.id }"
            @click="activeCatId = cat.id; fetchArticles()"
          >
            <span>{{ cat.name }}</span>
            <span class="cat-count">{{ cat.article_count }}</span>
          </div>
        </aside>

        <!-- 文章列表 -->
        <main class="faq-main">
          <div v-if="articles.length === 0 && !loading" class="empty">
            <el-icon :size="40" color="#94A3B8"><FolderOpened /></el-icon>
            <p>暂无相关内容</p>
          </div>

          <div v-for="a in articles" :key="a.id" class="faq-card" @click="$router.push(`/faq/${a.id}`)">
            <h4>{{ a.title }}</h4>
            <p class="faq-card-meta">
              <span>{{ a.category_name }}</span>
              <span>{{ formatDate(a.updated_at || a.created_at) }}</span>
              <span>{{ a.view_count }} 次阅读</span>
            </p>
          </div>

          <el-pagination
            v-if="total > pageSize"
            v-model:current-page="page"
            :page-size="pageSize"
            :total="total"
            layout="prev, pager, next"
            style="margin-top: 24px; justify-content: center"
            @current-change="fetchArticles"
          />

          <!-- 联系客服 -->
          <div class="contact-banner">
            <p>没有找到答案？</p>
            <el-button type="primary" @click="openChat">联系在线客服</el-button>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '@/stores/app'
import { useChatStore } from '@/stores/chat'
import { Search, FolderOpened } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const chatStore = useChatStore()
const keyword = ref('')
const categories = ref([])
const articles = ref([])
const activeCatId = ref(null)
const page = ref(1)
const total = ref(0)
const pageSize = ref(10)
const loading = ref(false)

onMounted(async () => {
  // 加载分类
  try {
    const res = await api.get('/faq/categories')
    if (res.data.code === 200) {
      categories.value = res.data.data || []
      if (categories.value.length > 0) {
        activeCatId.value = categories.value[0].id
      }
    }
  } catch (e) { console.error(e) }

  fetchArticles()
})

async function fetchArticles() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (activeCatId.value) params.category_id = activeCatId.value
    if (keyword.value) params.keyword = keyword.value

    const res = await api.get('/faq/articles', { params })
    if (res.data.code === 200) {
      articles.value = res.data.data.list || []
      total.value = res.data.data.total || 0
    }
  } catch (e) { console.error(e) }
  loading.value = false
}

async function handleSearch() {
  page.value = 1
  if (keyword.value) {
    try {
      const res = await api.get('/faq/articles/search', { params: { keyword: keyword.value } })
      if (res.data.code === 200) {
        articles.value = res.data.data || []
        total.value = articles.value.length
      }
    } catch (e) { console.error(e) }
  } else {
    fetchArticles()
  }
}

function openChat() {
  chatStore.initUserId()
  chatStore.openWidget()
}

function formatDate(t) {
  if (!t) return ''
  const d = new Date(t)
  return d.getFullYear() + '-' + (d.getMonth() + 1).toString().padStart(2, '0') + '-' + d.getDate().toString().padStart(2, '0')
}
</script>

<style scoped>
.faq-center {
  min-height: 70vh;
}

.faq-search {
  text-align: center;
  padding: 40px 0 32px;
}

.faq-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-foreground, #0F172A);
  margin-bottom: 20px;
}

.faq-search :deep(.el-input) {
  max-width: 560px;
  margin: 0 auto;
}

.faq-layout {
  display: flex;
  gap: 32px;
  max-width: 1100px;
  margin: 0 auto;
}

.faq-aside {
  width: 200px;
  flex-shrink: 0;
}

.faq-aside h3 {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--color-foreground, #0F172A);
}

.faq-cat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #475569;
  transition: all 0.2s;
  margin-bottom: 4px;
}

.faq-cat-item:hover,
.faq-cat-item.active {
  background: var(--color-accent, #EFF6FF);
  color: var(--color-primary, #1E40AF);
}

.cat-count {
  font-size: 11px;
  color: #94A3B8;
  background: #F1F5F9;
  padding: 1px 6px;
  border-radius: 10px;
}

.faq-main {
  flex: 1;
  min-width: 0;
}

.empty {
  text-align: center;
  padding: 60px 0;
  color: #94A3B8;
}

.faq-card {
  padding: 20px 24px;
  border: 1px solid var(--color-border, #E2E8F0);
  border-radius: var(--card-radius, 12px);
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.faq-card:hover {
  border-color: var(--color-primary, #1E40AF);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.faq-card h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-foreground, #0F172A);
  margin-bottom: 8px;
}

.faq-card-meta {
  font-size: 12px;
  color: #94A3B8;
  display: flex;
  gap: 16px;
}

.contact-banner {
  margin-top: 32px;
  padding: 32px;
  text-align: center;
  background: var(--color-accent, #EFF6FF);
  border-radius: var(--card-radius, 12px);
}

.contact-banner p {
  font-size: 15px;
  color: var(--color-foreground, #0F172A);
  margin-bottom: 12px;
}

@media (max-width: 768px) {
  .faq-layout {
    flex-direction: column;
    gap: 16px;
  }
  .faq-aside {
    width: 100%;
  }
}
</style>
