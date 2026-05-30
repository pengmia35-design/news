<template>
  <div class="login-page">
    <div class="login-card">
      <div class="terminal-dots">
        <span class="dot dot-red"></span>
        <span class="dot dot-yellow"></span>
        <span class="dot dot-green"></span>
        <span class="terminal-label">admin@techauth ~ login</span>
      </div>
      <div class="login-header">
        <h1 class="login-title">TechAI_资讯</h1>
        <p class="login-subtitle">后台管理系统</p>
      </div>

      <el-form :model="form" :rules="rules" ref="formRef" @keyup.enter="handleLogin">
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="用户名"
            :prefix-icon="User"
            size="large"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            :prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            style="width: 100%"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登 录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <p class="login-hint">默认账号: admin / admin123</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import { User, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const adminStore = useAdminStore()
const formRef = ref()
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await adminStore.login(form.username, form.password)
    ElMessage.success('登录成功')
    router.push('/')
  } catch (e) {
    ElMessage.error(e.message || '登录失败')
  }
  loading.value = false
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #F4F6FA;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 40px 40px;
}

.login-card {
  width: 400px;
  padding: 0;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  box-shadow: 0 0 60px rgba(37, 99, 235, 0.06), 0 20px 60px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.terminal-dots {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 20px;
  background: #F8FAFC;
  border-bottom: 1px solid #E2E8F0;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot-red { background: #EF4444; }
.dot-yellow { background: #F59E0B; }
.dot-green { background: #2563EB; }

.terminal-label {
  margin-left: 12px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: #64748B;
}

.login-header {
  text-align: center;
  padding: 40px 40px 0;
  margin-bottom: 32px;
}

.login-title {
  font-size: 20px;
  font-weight: 700;
  color: #2563EB;
  margin: 0;
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: 1px;
}

.login-subtitle {
  font-size: 13px;
  color: #64748B;
  margin: 8px 0 0;
}

:deep(.el-form) {
  padding: 0 40px 40px;
}

:deep(.el-input__wrapper) {
  background: #F8FAFC;
  border-color: #E2E8F0;
  box-shadow: none;
}

:deep(.el-input__wrapper:hover) {
  border-color: #E2E8F0;
}

:deep(.el-input__wrapper.is-focus) {
  border-color: #2563EB;
  box-shadow: 0 0 0 1px #2563EB;
}

:deep(.el-input__inner) {
  color: #1E293B;
}

:deep(.el-input__inner::placeholder) {
  color: #64748B;
}

.login-hint {
  text-align: center;
  font-size: 12px;
  color: #94A3B8;
  margin: 0 0 24px;
}
</style>
