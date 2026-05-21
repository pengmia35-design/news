<template>
  <div class="page-container article-page">
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="8" animated />
    </div>

    <div v-else-if="!article" class="empty-state">
      <h2>文章不存在</h2>
      <router-link to="/" class="btn-primary">返回首页</router-link>
    </div>

    <template v-else>
      <!-- 文章头部 -->
      <div class="article-header">
        <div class="breadcrumb">
          <router-link to="/">首页</router-link>
          <span class="sep">/</span>
          <router-link :to="`/category/${article.category_slug}`">{{ article.category_name }}</router-link>
          <span class="sep">/</span>
          <span>正文</span>
        </div>

        <h1 class="article-title">{{ article.title }}</h1>

        <div class="article-meta">
          <span class="category-tag">{{ article.category_name }}</span>
          <span>发布于 {{ formatDate(article.published_at) }}</span>
          <span v-if="article.source_name">来源: {{ article.source_name }}</span>
          <span>{{ article.view_count }} 阅读</span>
        </div>

        <!-- 标签 -->
        <div class="article-tags" v-if="article.tags && article.tags.length > 0">
          <span class="news-tag" v-for="tag in article.tags" :key="tag.id">{{ tag.name }}</span>
        </div>
      </div>

      <!-- 文章正文 -->
      <div class="article-body">
        <div class="article-content" v-html="renderedContent"></div>
      </div>

      <!-- 点赞 -->
      <div class="article-actions" v-if="article">
        <ArticleLike :article-id="article.id" :initial-count="article.like_count || 0" />
      </div>

      <!-- 上一篇/下一篇 -->
      <div class="article-nav">
        <div class="nav-prev" v-if="article.prev">
          <span class="nav-label">← 上一篇</span>
          <router-link :to="`/article/${article.prev.id}`" class="nav-link">{{ article.prev.title }}</router-link>
        </div>
        <div class="nav-next" v-if="article.next">
          <span class="nav-label">下一篇 →</span>
          <router-link :to="`/article/${article.next.id}`" class="nav-link">{{ article.next.title }}</router-link>
        </div>
      </div>

      <!-- 评论区 -->
      <CommentSection v-if="article" :article-id="article.id" />
    </template>

    <!-- 分享按钮 -->
    <ShareButtons v-if="article" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { api } from '@/stores/app'
import { useAppStore } from '@/stores/app'
import ShareButtons from '@/components/news/ShareButtons.vue'
import ArticleLike from '@/components/news/ArticleLike.vue'
import CommentSection from '@/components/news/CommentSection.vue'

const route = useRoute()
const store = useAppStore()
const article = ref(null)
const loading = ref(true)

// 配置 marked
marked.setOptions({
  breaks: true,
  gfm: true
})

const renderedContent = computed(() => {
  if (!article.value?.content) return ''
  return DOMPurify.sanitize(marked(article.value.content))
})

onMounted(() => {
  store.fetchSidebarData()
  fetchArticle()
})

watch(() => route.params.id, () => {
  fetchArticle()
})

async function fetchArticle() {
  loading.value = true
  try {
    const res = await api.get(`/articles/${route.params.id}`)
    if (res.data.code === 200) {
      article.value = res.data.data
      document.title = `${article.value.title} - TechAI 资讯`
    } else {
      article.value = null
    }
  } catch (e) {
    article.value = null
    console.error(e)
  }
  loading.value = false
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}
</script>

<style scoped>
.article-page {
  max-width: 900px;
}

.article-header {
  margin-bottom: 32px;
}

.breadcrumb {
  font-size: 13px;
  color: var(--color-muted-foreground);
  margin-bottom: 16px;
}

.breadcrumb a {
  color: var(--color-muted-foreground);
  text-decoration: none;
}

.breadcrumb a:hover {
  color: var(--color-primary);
}

.breadcrumb .sep {
  margin: 0 8px;
}

.article-title {
  font-size: 32px;
  font-weight: 600;
  font-family: 'DM Serif Display', 'Noto Serif SC', serif;
  line-height: 1.3;
  color: var(--color-foreground);
  margin: 0 0 16px;
}

.article-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  color: var(--color-muted-foreground);
  margin-bottom: 12px;
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.article-body {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-accent-foreground);
  border-radius: var(--card-radius);
  padding: 32px;
  margin-bottom: 24px;
}

.article-actions {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}

.article-nav {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 24px 0;
  border-top: 1px solid var(--color-border);
}

.nav-label {
  display: block;
  font-size: 12px;
  color: var(--color-muted-foreground);
  margin-bottom: 4px;
}

.nav-link {
  font-size: 14px;
  color: var(--color-foreground);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.nav-link:hover {
  color: var(--color-primary);
}

.loading-state, .empty-state {
  padding: 80px 0;
  text-align: center;
}

@media (max-width: 768px) {
  .article-title { font-size: 22px; }
  .article-body { padding: 20px; }
  .article-nav { flex-direction: column; }
}
</style>
