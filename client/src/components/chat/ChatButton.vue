<template>
  <button class="chat-float-btn" @click="$emit('click')">
    <el-icon :size="24"><ChatDotRound /></el-icon>
    <span v-if="chatStore.unreadCount > 0" class="chat-badge">{{ chatStore.unreadCount > 99 ? '99+' : chatStore.unreadCount }}</span>
  </button>
</template>

<script setup>
import { useChatStore } from '@/stores/chat'

defineEmits(['click'])
const chatStore = useChatStore()
</script>

<style scoped>
.chat-float-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #D97706;
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(217, 119, 6, 0.4);
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
}

.chat-float-btn:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 30px rgba(217, 119, 6, 0.55);
}

.chat-float-btn:active {
  transform: scale(0.96);
}

.chat-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  background: #DC2626;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  line-height: 1;
}
</style>
