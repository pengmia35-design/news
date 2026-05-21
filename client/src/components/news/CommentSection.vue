<template>
  <div class="comment-section">
    <h3 class="comment-heading">评论区 <span class="comment-count">({{ total }})</span></h3>

    <!-- 评论表单 -->
    <div class="comment-form">
      <div class="form-row">
        <input
          v-model="form.nickname"
          class="form-input nickname-input"
          placeholder="输入昵称（必填）"
          maxlength="20"
        />
      </div>
      <div class="form-row">
        <textarea
          v-model="form.content"
          class="form-textarea"
          placeholder="写下你的想法..."
          maxlength="1000"
          rows="4"
        ></textarea>
        <div class="form-footer">
          <span class="char-count">{{ form.content.length }}/1000</span>
          <button
            class="submit-btn"
            :disabled="submitting || !form.nickname.trim() || !form.content.trim()"
            @click="submitComment"
          >
            {{ submitting ? '提交中...' : '发表评论' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 评论列表 -->
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="3" animated />
    </div>

    <div v-else-if="comments.length === 0" class="empty-comments">
      <p>暂无评论，快来抢沙发吧~</p>
    </div>

    <template v-else>
      <div class="comment-list">
        <div v-for="comment in comments" :key="comment.id" class="comment-item">
          <div class="comment-avatar">
            {{ comment.nickname.charAt(0).toUpperCase() }}
          </div>
          <div class="comment-body">
            <div class="comment-header">
              <span class="comment-nickname">{{ comment.nickname }}</span>
              <span class="comment-time">{{ formatTime(comment.created_at) }}</span>
            </div>
            <div class="comment-content">{{ comment.content }}</div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="comment-pagination">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="total"
          :page-size="pageSize"
          :current-page="page"
          @current-change="loadComments"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { api } from '@/stores/app'
import { ElMessage } from 'element-plus'

const props = defineProps({
  articleId: { type: [Number, String], required: true }
})

const comments = ref([])
const loading = ref(false)
const submitting = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const totalPages = ref(0)

const form = reactive({
  nickname: '',
  content: ''
})

onMounted(() => {
  loadComments(1)
})

async function loadComments(p) {
  page.value = p
  loading.value = true
  try {
    const res = await api.get(`/articles/${props.articleId}/comments`, {
      params: { page: p, pageSize: pageSize.value }
    })
    if (res.data.code === 200) {
      const d = res.data.data
      // 从 localStorage 恢复昵称
      const saved = localStorage.getItem('comment_nickname')
      if (saved) form.nickname = saved

      comments.value = d.list
      total.value = d.total
      totalPages.value = d.totalPages
    }
  } catch (e) {
    console.error('加载评论失败:', e)
  }
  loading.value = false
}

async function submitComment() {
  if (!form.nickname.trim() || !form.content.trim()) return
  submitting.value = true
  try {
    const res = await api.post(`/articles/${props.articleId}/comments`, {
      nickname: form.nickname.trim(),
      content: form.content.trim()
    })
    if (res.data.code === 200) {
      ElMessage.success('评论发表成功！')
      // 保存昵称
      localStorage.setItem('comment_nickname', form.nickname.trim())
      form.content = ''
      // 刷新评论列表第一页
      loadComments(1)
    }
  } catch (e) {
    console.error('评论失败:', e)
    ElMessage.error('评论发表失败，请重试')
  }
  submitting.value = false
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  if (diff < 2592000000) return `${Math.floor(diff / 86400000)} 天前`
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}
</script>

<style scoped>
.comment-section {
  margin-top: 32px;
  padding: 32px;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--card-radius);
}

.comment-heading {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-foreground);
  margin: 0 0 24px;
}

.comment-count {
  font-weight: 400;
  color: var(--color-muted-foreground);
  font-size: 15px;
}

/* 表单 */
.comment-form {
  margin-bottom: 28px;
  padding-bottom: 28px;
  border-bottom: 1px solid var(--color-border);
}

.form-row {
  margin-bottom: 12px;
}

.nickname-input {
  width: 100%;
  max-width: 280px;
  padding: 8px 14px;
  border: 1px solid var(--color-input);
  border-radius: var(--radius-md);
  font-size: 14px;
  outline: none;
  background: var(--color-background);
  color: var(--color-foreground);
  transition: border-color var(--transition-fast);
}

.nickname-input:focus {
  border-color: var(--color-primary);
}

.form-textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--color-input);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-family: inherit;
  outline: none;
  resize: vertical;
  background: var(--color-background);
  color: var(--color-foreground);
  transition: border-color var(--transition-fast);
  box-sizing: border-box;
}

.form-textarea:focus {
  border-color: var(--color-primary);
}

.form-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.char-count {
  font-size: 12px;
  color: var(--color-muted-foreground);
}

.submit-btn {
  background: var(--color-primary);
  color: #fff;
  border: none;
  padding: 8px 24px;
  border-radius: var(--radius-md);
  font-size: 14px;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.submit-btn:hover {
  background: var(--color-primary-hover);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 列表 */
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-item {
  display: flex;
  gap: 14px;
}

.comment-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 600;
  flex-shrink: 0;
}

.comment-body {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.comment-nickname {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-foreground);
}

.comment-time {
  font-size: 12px;
  color: var(--color-muted-foreground);
}

.comment-content {
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-foreground);
  word-break: break-word;
}

/* 空状态 */
.empty-comments {
  text-align: center;
  padding: 40px 0;
  color: var(--color-muted-foreground);
  font-size: 14px;
}

.loading-state {
  padding: 20px 0;
}

/* 分页 */
.comment-pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

@media (max-width: 768px) {
  .comment-section {
    padding: 20px;
  }
}
</style>
