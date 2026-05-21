<template>
  <div class="prechat-form">
    <p class="prechat-desc">请选择您的问题类型，我们将为您精准匹配客服</p>

    <div class="tag-categories">
      <div
        v-for="cat in chatStore.problemTags"
        :key="cat.id"
        class="tag-card"
        :class="{ active: selectedParentId === cat.id }"
        @click="selectParent(cat)"
      >
        <span class="tag-icon">{{ cat.name.charAt(0) }}</span>
        <span class="tag-name">{{ cat.name }}</span>
      </div>
    </div>

    <div v-if="subTags.length > 0" class="sub-tags">
      <span
        v-for="sub in subTags"
        :key="sub.id"
        class="sub-tag"
        :class="{ active: selectedSubId === sub.id }"
        @click="selectedSubId = sub.id"
      >
        {{ sub.name }}
      </span>
    </div>

    <div class="prechat-footer">
      <el-input
        v-model="userName"
        placeholder="您的昵称（选填）"
        size="medium"
        :maxlength="20"
      />
      <el-button
        type="primary"
        :disabled="!canStart"
        :loading="starting"
        @click="handleStart"
        style="width: 100%; margin-top: 12px;"
      >
        开始咨询
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useChatStore } from '@/stores/chat'
import { ElMessage } from 'element-plus'

const chatStore = useChatStore()

const selectedParentId = ref(null)
const selectedSubId = ref(null)
const userName = ref(localStorage.getItem('chat_user_name') || '')
const starting = ref(false)

const subTags = computed(() => {
  if (!selectedParentId.value) return []
  const parent = chatStore.problemTags.find(t => t.id === selectedParentId.value)
  return parent?.children || []
})

const canStart = computed(() => selectedSubId.value)

function selectParent(cat) {
  selectedParentId.value = cat.id
  selectedSubId.value = null
  // 如果没有子标签，直接用父标签
  if (!cat.children || cat.children.length === 0) {
    selectedSubId.value = cat.id
  }
}

async function handleStart() {
  if (!canStart.value) return
  starting.value = true
  if (userName.value) {
    localStorage.setItem('chat_user_name', userName.value)
  }
  const conv = await chatStore.startConversation(userName.value, selectedSubId.value)
  starting.value = false
  if (!conv) {
    ElMessage.error('发起对话失败，请重试')
  }
}
</script>

<style scoped>
.prechat-form {
  padding: 16px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}

.prechat-desc {
  font-size: 13px;
  color: var(--color-muted-foreground, #64748B);
  margin-bottom: 16px;
  text-align: center;
}

.tag-categories {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.tag-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--color-border, #E2E8F0);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.tag-card:hover {
  border-color: var(--color-primary, #1E40AF);
}

.tag-card.active {
  border-color: var(--color-primary, #1E40AF);
  background: var(--color-accent, #EFF6FF);
}

.tag-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--color-accent, #EFF6FF);
  color: var(--color-primary, #1E40AF);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}

.tag-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-foreground, #0F172A);
}

.sub-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}

.sub-tag {
  padding: 4px 12px;
  border-radius: 20px;
  background: #F1F5F9;
  color: #475569;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.sub-tag:hover {
  border-color: var(--color-primary, #1E40AF);
}

.sub-tag.active {
  background: var(--color-primary, #1E40AF);
  color: #fff;
}

.prechat-footer {
  margin-top: auto;
  padding-top: 12px;
}
</style>
