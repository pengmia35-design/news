<template>
  <div class="msg-row" :class="isOwn ? 'msg-own' : 'msg-other'">
    <div v-if="!isOwn" class="msg-avatar" :class="isAI ? 'ai-avatar' : 'agent-avatar'">{{ senderLabel.charAt(0) }}</div>
    <div class="msg-bubble" :class="isOwn ? 'bubble-own' : 'bubble-other'">
      <img v-if="message.content_type === 'image'" :src="message.content" class="msg-image" />
      <span v-else class="msg-text">{{ message.content }}</span>
      <div class="msg-time">{{ formatTime(message.created_at) }}</div>
    </div>
    <div v-if="isOwn" class="msg-avatar user-avatar">{{ senderLabel.charAt(0) }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  message: { type: Object, required: true },
  isOwn: { type: Boolean, default: false }
})

const senderLabel = computed(() => {
  if (props.isOwn) return '我'
  if (props.message.sender_id === 'ai-bot') return 'AI'
  return '客'
})

const isAI = computed(() => props.message.sender_id === 'ai-bot')

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0')
}
</script>

<style scoped>
.msg-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  align-items: flex-end;
}

.msg-own {
  justify-content: flex-end;
}

.msg-other {
  justify-content: flex-start;
}

.msg-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
  color: #fff;
}

.agent-avatar {
  background: #64748B;
}

.ai-avatar {
  background: #8B5CF6;
}

.user-avatar {
  background: var(--color-primary, #2563EB);
}

.msg-bubble {
  max-width: 220px;
  padding: 8px 12px;
  border-radius: 12px;
  position: relative;
}

.bubble-own {
  background: var(--color-primary, #2563EB);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.bubble-other {
  background: var(--color-card);
  color: var(--color-foreground, #0F172A);
  border: 1px solid var(--color-border, #E2E8F0);
  border-bottom-left-radius: 4px;
}

.msg-text {
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-wrap;
}

.msg-image {
  max-width: 180px;
  border-radius: 8px;
  cursor: pointer;
}

.msg-time {
  font-size: 10px;
  margin-top: 4px;
  opacity: 0.6;
  text-align: right;
}
</style>
