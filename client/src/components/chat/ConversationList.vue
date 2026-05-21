<template>
  <div class="conversation-list">
    <el-button type="primary" size="small" @click="chatStore.goToPreChat()" style="margin-bottom: 12px; width: 100%">
      <el-icon><Plus /></el-icon> 新建对话
    </el-button>

    <div v-if="chatStore.conversations.length === 0" class="empty-state">
      <el-icon :size="40" color="#94A3B8"><ChatSquare /></el-icon>
      <p>暂无对话记录</p>
      <p class="empty-hint">点击上方按钮发起新的咨询</p>
    </div>

    <div v-else class="conv-list">
      <div
        v-for="conv in chatStore.conversations"
        :key="conv.id"
        class="conv-item"
        :class="{ unread: conv.unread_count > 0 }"
        @click="chatStore.selectConversation(conv)"
      >
        <div class="conv-top">
          <span class="conv-tag">{{ conv.problem_tag_name || '未分类' }}</span>
          <span class="conv-time">{{ formatTime(conv.updated_at) }}</span>
        </div>
        <div class="conv-preview">{{ conv.last_message || '等待客服接入...' }}</div>
        <div class="conv-status">
          <span class="status-dot" :class="'status-' + conv.status"></span>
          <span class="status-text">{{ statusLabel(conv.status) }}</span>
          <span v-if="conv.unread_count > 0" class="unread-badge">{{ conv.unread_count }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useChatStore } from '@/stores/chat'

const chatStore = useChatStore()

function statusLabel(status) {
  const map = { waiting: '等待接入', active: '处理中', resolved: '已解决', closed: '已关闭' }
  return map[status] || status
}

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return (d.getMonth() + 1) + '/' + d.getDate()
}
</script>

<style scoped>
.conversation-list {
  padding: 12px;
  overflow-y: auto;
  height: 100%;
}

.empty-state {
  text-align: center;
  padding: 40px 16px;
  color: #94A3B8;
}

.empty-state p {
  margin-top: 12px;
  font-size: 14px;
}

.empty-hint {
  font-size: 12px !important;
}

.conv-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.conv-item {
  padding: 12px;
  border: 1px solid var(--color-border, #E2E8F0);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.conv-item:hover {
  border-color: var(--color-primary, #1E40AF);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.conv-item.unread {
  border-left: 3px solid var(--color-primary, #1E40AF);
  background: #F8FAFC;
}

.conv-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.conv-tag {
  font-size: 12px;
  color: var(--color-primary, #1E40AF);
  background: var(--color-accent, #EFF6FF);
  padding: 1px 8px;
  border-radius: 4px;
}

.conv-time {
  font-size: 11px;
  color: #94A3B8;
}

.conv-preview {
  font-size: 13px;
  color: #64748B;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 6px;
}

.conv-status {
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-waiting { background: #F59E0B; }
.status-active { background: #10B981; }
.status-resolved { background: #3B82F6; }
.status-closed { background: #94A3B8; }

.status-text {
  font-size: 11px;
  color: #94A3B8;
  flex: 1;
}

.unread-badge {
  background: #DC2626;
  color: #fff;
  font-size: 10px;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}
</style>
