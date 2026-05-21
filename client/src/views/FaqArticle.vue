<template>
  <div class="faq-article-page">
    <div class="page-container" style="max-width: 800px">
      <el-breadcrumb separator="/" style="margin-bottom: 24px">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/faq' }">帮助中心</el-breadcrumb-item>
        <el-breadcrumb-item>{{ article.title }}</el-breadcrumb-item>
      </el-breadcrumb>

      <article v-if="article.id">
        <h1 class="article-title">{{ article.title }}</h1>
        <div class="article-meta">
          <span>{{ article.category_name }}</span>
          <span>{{ formatDate(article.created_at) }}</span>
          <span>{{ article.view_count }} 次阅读</span>
        </div>
        <div class="article-body" v-html="renderedContent"></div>

        <!-- 反馈区 -->
        <div class="feedback-area">
          <p v-if="!feedbackGiven">这篇文章帮到您了吗？</p>
          <p v-else class="feedback-thanks">感谢您的反馈！</p>
          <div class="feedback-btns" v-if="!feedbackGiven">
            <el-button @click="submitFeedback(true)" :icon="Check" type="success" plain>有帮助</el-button>
            <el-button @click="submitFeedback(false)" :icon="Close" type="danger" plain>没帮助</el-button>
          </div>
          <div v-if="showChatOption" class="chat-option">
            <p>未找到解决方案，需要客服协助吗？</p>
            <el-button type="primary" @click="openChat">联系在线客服</el-button>
          </div>
        </div>

        <!-- 相关文章 -->
        <div v-if="article.related && article.related.length > 0" class="related-articles">
          <h3>相关文章</h3>
          <div v-for="r in article.related" :key="r.id" class="related-item" @click="$router.push(`/faq/${r.id}`)">
            {{ r.title }}
          </div>
        </div>
      </article>

      <div v-else class="not-found">
        <el-icon :size="48" color="#94A3B8"><Warning /></el-icon>
        <p>文章不存在或已下架</p>
        <el-button @click="$router.push('/faq')">返回帮助中心</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/stores/app'
import { useChatStore } from '@/stores/chat'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const route = useRoute()
const chatStore = useChatStore()
const article = ref({})
const feedbackGiven = ref(false)
const showChatOption = ref(false)

const renderedContent = computed(() => {
  if (!article.value.content) return ''
  const raw = marked.parse(article.value.content)
  return DOMPurify.sanitize(raw)
})

async function fetchArticle(id) {
  try {
    const res = await api.get(`/faq/articles/${id}`)
    if (res.data.code === 200) {
      article.value = res.data.data
    } else {
      article.value = {}
    }
  } catch (e) {
    article.value = {}
  }
}

async function submitFeedback(helpful) {
  feedbackGiven.value = true
  try {
    await api.post(`/faq/articles/${article.value.id}/feedback`, { helpful })
  } catch (e) { /* silent */ }
  if (!helpful) {
    showChatOption.value = true
  }
}

function openChat() {
  chatStore.initUserId()
  chatStore.loadProblemTags()
  chatStore.widgetOpen = true
  chatStore.widgetStep = 'prechat'
}

function formatDate(t) {
  if (!t) return ''
  const d = new Date(t)
  return d.getFullYear() + '-' + (d.getMonth() + 1).toString().padStart(2, '0') + '-' + d.getDate().toString().padStart(2, '0')
}

watch(() => route.params.id, (n) => {
  if (n) fetchArticle(n)
})

onMounted(() => {
  fetchArticle(route.params.id)
})
</script>

<style scoped>
.faq-article-page {
  padding-bottom: 48px;
}

.article-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-foreground, #0F172A);
  margin-bottom: 12px;
}

.article-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #94A3B8;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--color-border, #E2E8F0);
  margin-bottom: 24px;
}

.article-body {
  font-size: 15px;
  line-height: 1.8;
  color: var(--color-foreground, #0F172A);
}

.article-body :deep(h2) { font-size: 1.25rem; font-weight: 600; margin: 24px 0 12px; }
.article-body :deep(h3) { font-size: 1.1rem; font-weight: 600; margin: 20px 0 10px; }
.article-body :deep(p) { margin-bottom: 12px; }
.article-body :deep(ul), .article-body :deep(ol) { padding-left: 20px; margin-bottom: 12px; }
.article-body :deep(li) { margin-bottom: 4px; }
.article-body :deep(code) { background: #F1F5F9; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
.article-body :deep(pre) { background: #1E293B; color: #E2E8F0; padding: 16px; border-radius: 8px; overflow-x: auto; margin-bottom: 16px; }
.article-body :deep(blockquote) { border-left: 3px solid var(--color-primary); padding-left: 16px; color: #64748B; margin-bottom: 16px; }

.feedback-area {
  margin-top: 40px;
  padding: 24px;
  text-align: center;
  background: var(--color-accent, #EFF6FF);
  border-radius: var(--card-radius, 12px);
}

.feedback-area p {
  margin-bottom: 12px;
  font-size: 15px;
}

.feedback-btns {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.feedback-thanks {
  color: var(--color-primary, #1E40AF);
  font-weight: 600;
}

.chat-option {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed var(--color-border, #E2E8F0);
}

.related-articles {
  margin-top: 40px;
}

.related-articles h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
}

.related-item {
  padding: 10px 16px;
  border: 1px solid var(--color-border, #E2E8F0);
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  color: var(--color-primary, #1E40AF);
  transition: all 0.2s;
}

.related-item:hover {
  background: var(--color-accent, #EFF6FF);
  border-color: var(--color-primary, #1E40AF);
}

.not-found {
  text-align: center;
  padding: 80px 0;
  color: #94A3B8;
}

.not-found p {
  margin: 16px 0;
}
</style>
