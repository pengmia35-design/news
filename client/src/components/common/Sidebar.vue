<template>
  <aside class="sidebar">
    <!-- 热门推荐 -->
    <div class="sidebar-card">
      <h3 class="sidebar-title">热门推荐</h3>
      <ul class="hot-list">
        <li v-for="(article, index) in hotArticles" :key="article.id" class="hot-item">
          <span class="hot-rank" :class="{ top: index < 3 }">{{ index + 1 }}</span>
          <router-link :to="`/article/${article.id}`" class="hot-link">
            {{ article.title }}
          </router-link>
        </li>
      </ul>
    </div>

    <!-- 最新文章 -->
    <div class="sidebar-card">
      <h3 class="sidebar-title">最新文章</h3>
      <ul class="latest-list">
        <li v-for="article in latestArticles" :key="article.id" class="latest-item">
          <router-link :to="`/article/${article.id}`" class="latest-link">
            {{ article.title }}
          </router-link>
          <span class="latest-time">{{ formatDate(article.published_at) }}</span>
        </li>
      </ul>
    </div>

    <!-- 标签云 -->
    <div class="sidebar-card" v-if="tags.length > 0">
      <h3 class="sidebar-title">标签云</h3>
      <div class="tag-cloud">
        <router-link
          v-for="tag in tags" :key="tag.id"
          :to="`/search?tag=${tag.slug}`"
          class="tag-item"
        >
          {{ tag.name }}
        </router-link>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'

const store = useAppStore()

const hotArticles = computed(() => store.hotArticles)
const latestArticles = computed(() => store.latestArticles)
const tags = computed(() => store.hotTags)

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now - d
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return `${d.getMonth() + 1}/${d.getDate()}`
}
</script>

<style scoped>
.sidebar {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.sidebar-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--card-radius);
  padding: 20px;
}

.sidebar-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-foreground);
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--color-primary);
}

/* 热门列表 */
.hot-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.hot-item {
  display: flex;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
}

.hot-item:last-child {
  border-bottom: none;
}

.hot-rank {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-muted-foreground);
  background: var(--color-muted);
  border-radius: 4px;
  margin-top: 2px;
}

.hot-rank.top {
  background: var(--color-primary);
  color: #fff;
}

.hot-link {
  font-size: 14px;
  color: var(--color-card-foreground);
  text-decoration: none;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color var(--transition-fast);
}

.hot-link:hover {
  color: var(--color-primary);
}

/* 最新列表 */
.latest-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.latest-item {
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border);
}

.latest-item:last-child {
  border-bottom: none;
}

.latest-link {
  display: block;
  font-size: 14px;
  color: var(--color-card-foreground);
  text-decoration: none;
  line-height: 1.5;
  margin-bottom: 4px;
  transition: color var(--transition-fast);
}

.latest-link:hover {
  color: var(--color-primary);
}

.latest-time {
  font-size: 12px;
  color: var(--color-muted-foreground);
}

/* 标签云 */
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  display: inline-block;
  padding: 4px 12px;
  font-size: 12px;
  color: var(--color-muted-foreground);
  background: var(--color-muted);
  border-radius: var(--radius-full);
  text-decoration: none;
  transition: all var(--transition-fast);
}

.tag-item:hover {
  background: var(--color-primary);
  color: #fff;
}

@media (max-width: 1024px) {
  .sidebar {
    width: 280px;
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: 100%;
  }
}
</style>
