<template>
  <div class="chat-window">
    <!-- 消息区 -->
    <div class="msg-area" ref="msgAreaRef">
      <div v-if="chatStore.messages.length === 0" class="empty-msg">
        <p>对话已创建</p>
        <p v-if="activeConv && activeConv.status === 'waiting' && activeConv.queue_position" class="sub">排队中，前方 {{ activeConv.queue_position - 1 }} 人</p>
        <p v-else class="sub">客服将在 20 分钟内回复您</p>
      </div>
      <MessageBubble
        v-for="msg in chatStore.messages"
        :key="msg.id"
        :message="msg"
        :is-own="msg.sender_type === 'user'"
      />
    </div>

    <!-- 输入区 -->
    <div class="input-area" v-if="activeConv && activeConv.status !== 'closed'">
      <div v-if="imagePreview" class="image-preview">
        <img :src="imagePreview" alt="preview" />
        <el-icon class="preview-remove" @click="imagePreview = null; imageFile = null"><Close /></el-icon>
      </div>
      <div class="input-row">
        <el-popover placement="top-start" :width="320" trigger="click" :show-arrow="false">
          <template #reference>
            <button class="emoji-btn" title="表情">
              <el-icon><Smile /></el-icon>
            </button>
          </template>
          <EmojiPicker @select="insertEmoji" />
        </el-popover>
        <label class="upload-btn" title="发送图片">
          <el-icon><Picture /></el-icon>
          <input type="file" accept="image/*" hidden @change="handleImage" />
        </label>
        <textarea
          v-model="textMsg"
          class="msg-input"
          placeholder="输入消息...（可直接粘贴图片）"
          rows="1"
          @keydown.enter.exact.prevent="handleSend"
          @paste="handlePaste"
          ref="inputRef"
        ></textarea>
        <button class="send-btn" :disabled="!canSend" @click="handleSend">
          <el-icon><Promotion /></el-icon>
        </button>
      </div>
    </div>

    <div v-else class="closed-bar">对话已关闭</div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useChatStore } from '@/stores/chat'
import MessageBubble from './MessageBubble.vue'
import EmojiPicker from './EmojiPicker.vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const chatStore = useChatStore()
const textMsg = ref('')
const imageFile = ref(null)
const imagePreview = ref('')
const msgAreaRef = ref(null)
const inputRef = ref(null)

const activeConv = computed(() => chatStore.activeConversation)
const canSend = computed(() => textMsg.value.trim() || imageFile.value)

// 图片选择
function handleImage(e) {
  const file = e.target.files[0]
  if (!file) return
  setImageFile(file)
}

// 粘贴图片
function handlePaste(e) {
  const items = e.clipboardData?.items
  if (!items) return
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault()
      const file = item.getAsFile()
      setImageFile(file)
      break
    }
  }
}

function setImageFile(file) {
  if (imagePreview.value) URL.revokeObjectURL(imagePreview.value)
  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
}

function insertEmoji(emoji) {
  textMsg.value += emoji
  inputRef.value?.focus()
}

// 发送
async function handleSend() {
  if (!canSend.value) return

  if (imageFile.value) {
    const formData = new FormData()
    formData.append('image', imageFile.value)
    try {
      const res = await axios.post('/api/chat/upload', formData)
      if (res.data.code === 200) {
        await chatStore.sendMessage(res.data.data.url, 'image')
      }
    } catch (e) {
      ElMessage.error('图片上传失败')
    }
    imageFile.value = null
    imagePreview.value = ''
  }

  if (textMsg.value.trim()) {
    await chatStore.sendMessage(textMsg.value.trim())
    textMsg.value = ''
  }

  scrollToBottom()
}

// 自动滚底
watch(() => chatStore.messages.length, () => {
  nextTick(scrollToBottom)
})

function scrollToBottom() {
  if (msgAreaRef.value) {
    msgAreaRef.value.scrollTop = msgAreaRef.value.scrollHeight
  }
}
</script>

<style scoped>
.chat-window {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.msg-area {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: #F8FAFC;
}

.empty-msg {
  text-align: center;
  padding: 40px 16px;
  color: #94A3B8;
  font-size: 14px;
}

.empty-msg .sub {
  font-size: 12px;
  margin-top: 4px;
}

.input-area {
  border-top: 1px solid var(--color-border, #E2E8F0);
  padding: 8px;
}

.image-preview {
  position: relative;
  display: inline-block;
  margin-bottom: 8px;
}

.image-preview img {
  max-height: 100px;
  border-radius: 8px;
}

.preview-remove {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #DC2626;
  color: #fff;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  padding: 2px;
}

.input-row {
  display: flex;
  align-items: flex-end;
  gap: 6px;
}

.emoji-btn {
  cursor: pointer;
  color: #64748B;
  padding: 8px;
  display: flex;
  align-items: center;
  border-radius: 6px;
  transition: color 0.2s;
  background: none;
  border: none;
}

.emoji-btn:hover {
  color: var(--color-primary, #2563EB);
}

.upload-btn {
  cursor: pointer;
  color: #64748B;
  padding: 8px;
  display: flex;
  align-items: center;
  border-radius: 6px;
  transition: color 0.2s;
}

.upload-btn:hover {
  color: var(--color-primary, #1E40AF);
}

.msg-input {
  flex: 1;
  border: 1px solid var(--color-border, #E2E8F0);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  resize: none;
  outline: none;
  font-family: inherit;
  max-height: 80px;
}

.msg-input:focus {
  border-color: var(--color-primary, #1E40AF);
}

.send-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-primary, #2563EB);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: opacity 0.2s;
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.closed-bar {
  padding: 12px;
  text-align: center;
  color: #94A3B8;
  font-size: 13px;
  border-top: 1px solid var(--color-border, #E2E8F0);
}
</style>
