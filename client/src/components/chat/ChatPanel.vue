<template>
  <div class="chat-panel">
    <!-- Header -->
    <div class="panel-header">
      <button v-if="['chat', 'prechat', 'rating', 'offline'].includes(chatStore.widgetStep)" class="panel-back" @click="handleBack">
        <el-icon><ArrowLeft /></el-icon>
      </button>
      <span class="panel-title">{{ headerTitle }}</span>
      <button class="panel-close" @click="chatStore.closeWidget()">
        <el-icon><Close /></el-icon>
      </button>
    </div>

    <!-- Body -->
    <div class="panel-body">
      <PreChatForm v-if="chatStore.widgetStep === 'prechat'" />
      <ConversationList v-else-if="chatStore.widgetStep === 'conversations'" />
      <ChatWindow v-else-if="chatStore.widgetStep === 'chat'" />
      <RatingDialog v-else-if="chatStore.widgetStep === 'rating'" />
      <OfflineForm v-else-if="chatStore.widgetStep === 'offline'" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useChatStore } from '@/stores/chat'
import PreChatForm from './PreChatForm.vue'
import ConversationList from './ConversationList.vue'
import ChatWindow from './ChatWindow.vue'
import RatingDialog from './RatingDialog.vue'
import OfflineForm from './OfflineForm.vue'

const chatStore = useChatStore()

const headerTitle = computed(() => {
  switch (chatStore.widgetStep) {
    case 'prechat': return '发起咨询'
    case 'conversations': return '我的对话'
    case 'chat': return chatStore.activeConversation?.problem_tag_name || '在线客服'
    case 'rating': return '服务评价'
    case 'offline': return '离线留言'
    default: return '在线客服'
  }
})

function handleBack() {
  if (chatStore.widgetStep === 'prechat' || chatStore.widgetStep === 'conversations' || chatStore.widgetStep === 'offline') {
    return
  }
  if (chatStore.widgetStep === 'rating') {
    chatStore.widgetStep = 'button'
    chatStore.closeWidget()
    return
  }
  chatStore.goToConversations()
}
</script>

<style scoped>
.chat-panel {
  width: 380px;
  height: 520px;
  background: var(--color-card);
  border-radius: 12px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--color-border, #E2E8F0);
}

.panel-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: var(--color-ink-700);
  color: #fff;
  gap: 8px;
  flex-shrink: 0;
}

.panel-title {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
}

.panel-back,
.panel-close {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background 0.2s;
}

.panel-back:hover,
.panel-close:hover {
  background: rgba(255, 255, 255, 0.15);
}

.panel-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

@media (max-width: 768px) {
  .chat-panel {
    width: 100vw;
    height: 100vh;
    border-radius: 0;
    position: fixed;
    inset: 0;
  }
}
</style>
