<template>
  <article class="news-card" @click="$router.push(`/article/${article.id}`)">
    <div class="card-body">
      <!-- 分类标签 -->
      <div class="card-meta-top">
        <span class="category-tag">{{ article.category_name }}</span>
        <span v-if="article.is_featured" class="featured-badge">置顶</span>
      </div>

      <!-- 标题 -->
      <h2 class="card-title">{{ article.title }}</h2>

      <!-- 摘要 -->
      <p class="card-summary" v-if="displaySummary">{{ displaySummary }}</p>

      <!-- 底部信息 -->
      <div class="card-footer">
        <span class="card-date">
          <el-icon :size="12"><Calendar /></el-icon>
          {{ formatDate(article.published_at) }}
        </span>
        <span class="card-source" v-if="article.source_name">
          <el-icon :size="12"><Link /></el-icon>
          {{ article.source_name }}
        </span>
        <span class="card-views">
          <el-icon :size="12"><View /></el-icon>
          {{ article.view_count || 0 }}
        </span>
      </div>

      <!-- 标签 -->
      <div class="card-tags" v-if="article.tags && article.tags.length > 0">
        <span class="tag-item" v-for="tag in article.tags.slice(0, 3)" :key="tag.id">
          {{ tag.name }}
        </span>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { Calendar, Link, View } from '@element-plus/icons-vue'

const props = defineProps({
  article: { type: Object, required: true }
})

const displaySummary = computed(() => {
  return props.article.content_preview || props.article.summary || ''
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}
</script>

<style scoped>
.news-card {
  cursor: pointer;
}

.card-body {
  padding: 28px;
}

.card-meta-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.featured-badge {
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: #D97706;
  padding: 2px 8px;
  border-radius: 4px;
}

.card-title {
  font-size: 20px;
  font-weight: 600;
  font-family: 'DM Serif Display', 'Noto Serif SC', serif;
  color: var(--color-card-foreground);
  line-height: 1.35;
  margin: 0 0 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color var(--transition-fast);
}

.news-card:hover .card-title {
  text-decoration: underline;
  text-decoration-color: var(--color-accent-foreground);
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
}

.card-summary {
  font-size: 14px;
  color: var(--color-muted-foreground);
  line-height: 1.6;
  margin: 0 0 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: var(--color-muted-foreground);
}

.card-footer span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 11px;
  border-radius: 4px;
  background: var(--color-muted);
  color: var(--color-muted-foreground);
}
</style>
