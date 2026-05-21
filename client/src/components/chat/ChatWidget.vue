<template>
  <div v-if="chatStore.widgetOpen || chatStore.widgetStep === 'button'" class="chat-widget-root">
    <!-- 浮动按钮 -->
    <ChatButton v-if="!chatStore.widgetOpen" @click="chatStore.openWidget()" />

    <!-- 展开面板 -->
    <Transition name="panel-slide">
      <ChatPanel v-if="chatStore.widgetOpen" />
    </Transition>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useChatStore } from '@/stores/chat'
import ChatButton from './ChatButton.vue'
import ChatPanel from './ChatPanel.vue'

const chatStore = useChatStore()

onMounted(() => {
  chatStore.initUserId()
})
</script>

<style scoped>
.chat-widget-root {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
}

.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: all 0.3s ease;
}

.panel-slide-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.95);
}

.panel-slide-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.95);
}

@media (max-width: 768px) {
  .chat-widget-root {
    bottom: 0;
    right: 0;
  }
}
</style>
