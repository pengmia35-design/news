<template>
  <div class="rating-dialog">
    <p class="rating-title">本次服务体验如何？</p>

    <div class="star-row">
      <span
        v-for="s in 5"
        :key="s"
        class="star"
        :class="{ active: rating >= s }"
        @click="rating = s"
      >
        <el-icon :size="28"><StarFilled v-if="rating >= s" /><Star v-else /></el-icon>
      </span>
    </div>

    <div class="rating-tags">
      <span
        v-for="tag in ratingTags"
        :key="tag.value"
        class="r-tag"
        :class="{ active: selectedTags.includes(tag.value) }"
        @click="toggleTag(tag.value)"
      >{{ tag.label }}</span>
    </div>

    <el-input
      v-model="ratingText"
      type="textarea"
      :rows="2"
      placeholder="补充更多反馈（选填）"
      :maxlength="500"
      show-word-limit
    />

    <el-button
      type="primary"
      :loading="submitting"
      :disabled="!rating"
      @click="handleSubmit"
      style="width: 100%; margin-top: 16px;"
    >
      提交评价
    </el-button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useChatStore } from '@/stores/chat'
import { ElMessage } from 'element-plus'

const chatStore = useChatStore()
const rating = ref(0)
const selectedTags = ref([])
const ratingText = ref('')
const submitting = ref(false)

const ratingTags = [
  { label: '回复及时', value: '回复及时' },
  { label: '解决问题', value: '解决问题' },
  { label: '态度良好', value: '态度良好' },
  { label: '回复较慢', value: '回复较慢' },
  { label: '未解决问题', value: '未解决问题' }
]

function toggleTag(val) {
  const idx = selectedTags.value.indexOf(val)
  if (idx >= 0) {
    selectedTags.value.splice(idx, 1)
  } else {
    selectedTags.value.push(val)
  }
}

async function handleSubmit() {
  if (!rating.value) return
  submitting.value = true
  await chatStore.submitRating(
    chatStore.ratingPending,
    rating.value,
    selectedTags.value,
    ratingText.value
  )
  submitting.value = false
  ElMessage.success('感谢您的评价！')
}
</script>

<style scoped>
.rating-dialog {
  padding: 20px 16px;
  text-align: center;
}

.rating-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-foreground, #0F172A);
  margin-bottom: 16px;
}

.star-row {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-bottom: 16px;
}

.star {
  cursor: pointer;
  color: #E2E8F0;
  transition: color 0.2s;
}

.star.active {
  color: #F59E0B;
}

.rating-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  margin-bottom: 16px;
}

.r-tag {
  padding: 4px 12px;
  border-radius: 20px;
  background: #F1F5F9;
  color: #475569;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.r-tag:hover {
  border-color: var(--color-primary, #1E40AF);
}

.r-tag.active {
  background: var(--color-primary, #1E40AF);
  color: #fff;
}
</style>
