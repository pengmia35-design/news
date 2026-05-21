<template>
  <div class="article-like" :class="{ liked }" @click="handleLike">
    <svg class="heart-icon" :class="{ 'heart-animate': animating }" viewBox="0 0 24 24" width="22" height="22" :fill="liked ? '#ff4757' : 'none'" :stroke="liked ? '#ff4757' : 'currentColor'" stroke-width="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
    <span class="like-text">{{ liked ? '已点赞' : '点赞' }}</span>
    <span class="like-count">{{ count }}</span>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { api } from '@/stores/app'

const props = defineProps({
  articleId: { type: [Number, String], required: true },
  initialCount: { type: Number, default: 0 }
})

const emit = defineEmits(['update:count'])

const liked = ref(false)
const animating = ref(false)
const count = ref(props.initialCount)
const loading = ref(false)

async function handleLike() {
  if (loading.value) return
  loading.value = true

  try {
    const res = await api.post(`/articles/${props.articleId}/like`)
    if (res.data.code === 200) {
      if (!liked.value) {
        animating.value = true
        setTimeout(() => { animating.value = false }, 600)
      }
      liked.value = true
      count.value = res.data.data.like_count
      emit('update:count', count.value)
    }
  } catch (e) {
    console.error('点赞失败:', e)
  }
  loading.value = false
}
</script>

<style scoped>
.article-like {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  color: var(--color-muted-foreground);
  font-size: 14px;
}

.article-like:hover {
  border-color: #ff4757;
  color: #ff4757;
  background: #fff5f5;
}

.article-like.liked {
  border-color: #ff4757;
  color: #ff4757;
  background: #fff0f0;
}

.heart-icon {
  transition: transform 0.2s ease;
}

.heart-animate {
  animation: heartPop 0.6s ease;
}

@keyframes heartPop {
  0% { transform: scale(1); }
  30% { transform: scale(1.4); }
  50% { transform: scale(0.9); }
  70% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.like-count {
  font-weight: 600;
  min-width: 20px;
}
</style>
