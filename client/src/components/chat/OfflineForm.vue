<template>
  <div class="offline-form">
    <div class="offline-notice">
      <el-icon :size="36" color="#94A3B8"><Clock /></el-icon>
      <p class="offline-title">当前暂无客服在线</p>
      <p class="offline-desc">请留下您的问题，客服上线后将尽快通过对话回复您</p>
    </div>

    <el-form :model="form" ref="formRef" label-position="top" style="margin-top: 16px">
      <el-form-item label="问题类型">
        <div class="mini-tags">
          <el-select v-model="form.problem_tag_id" placeholder="选择问题类型" size="small" style="width: 100%">
            <el-option-group v-for="cat in chatStore.problemTags" :key="cat.id" :label="cat.name">
              <el-option v-for="sub in cat.children" :key="sub.id" :label="sub.name" :value="sub.id" />
              <el-option v-if="cat.children.length === 0" :label="cat.name" :value="cat.id" />
            </el-option-group>
          </el-select>
        </div>
      </el-form-item>
      <el-form-item label="昵称">
        <el-input v-model="form.user_name" placeholder="您的昵称（选填）" size="small" :maxlength="20" />
      </el-form-item>
      <el-form-item label="留言内容" required>
        <el-input v-model="form.content" type="textarea" :rows="3" placeholder="请详细描述您的问题..." :maxlength="500" show-word-limit />
      </el-form-item>
      <el-form-item label="联系方式（选填）">
        <el-input v-model="form.contact_info" placeholder="邮箱或手机号，方便我们联系您" size="small" />
      </el-form-item>
      <el-button type="primary" :disabled="!form.content" :loading="submitting" @click="handleSubmit" style="width: 100%">
        提交留言
      </el-button>
    </el-form>

    <div v-if="submitted" class="submitted">
      <el-icon :size="40" color="#10B981"><SuccessFilled /></el-icon>
      <p>留言已提交</p>
      <p class="sub-hint">客服上线后将尽快通过对话回复您，请留意消息</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useChatStore } from '@/stores/chat'
import { ElMessage } from 'element-plus'
import { Clock, SuccessFilled } from '@element-plus/icons-vue'
import axios from 'axios'

const chatStore = useChatStore()
const submitting = ref(false)
const submitted = ref(false)
const form = reactive({
  user_name: localStorage.getItem('chat_user_name') || '',
  problem_tag_id: null,
  content: '',
  contact_info: ''
})

onMounted(() => {
  if (chatStore.problemTags.length === 0) {
    chatStore.loadProblemTags()
  }
})

async function handleSubmit() {
  if (!form.content) return
  submitting.value = true
  try {
    const res = await axios.post('/api/chat/offline', {
      user_id: chatStore.userId,
      user_name: form.user_name || undefined,
      problem_tag_id: form.problem_tag_id,
      content: form.content,
      contact_info: form.contact_info || undefined
    })
    if (res.data.code === 200) {
      submitted.value = true
      localStorage.setItem('chat_user_name', form.user_name)
    } else {
      ElMessage.error(res.data.message)
    }
  } catch (e) {
    ElMessage.error('提交失败，请重试')
  }
  submitting.value = false
}
</script>

<style scoped>
.offline-form { padding: 16px; overflow-y: auto; height: 100%; }
.offline-notice { text-align: center; padding: 16px 0; }
.offline-title { font-size: 15px; font-weight: 600; color: var(--color-foreground, #0F172A); margin: 8px 0 4px; }
.offline-desc { font-size: 12px; color: #94A3B8; }
.submitted { text-align: center; padding: 32px 16px; }
.submitted p { font-size: 16px; font-weight: 600; margin: 8px 0; }
.sub-hint { font-size: 12px !important; color: #94A3B8; font-weight: 400 !important; }
</style>
