<template>
  <div class="sc-mgmt">
    <el-card shadow="never">
      <template #header>客服系统配置</template>
      <el-form :model="form" label-width="140px" label-position="left" style="max-width: 700px">
        <el-divider content-position="left">聊天设置</el-divider>
        <el-form-item label="欢迎语">
          <el-input v-model="form.welcome_message" type="textarea" :rows="2" placeholder="用户进入聊天时的欢迎语" />
        </el-form-item>
        <el-form-item label="回复时效提示">
          <el-input v-model="form.response_time_hint" placeholder="例如：我们会在20分钟内回复" />
        </el-form-item>
        <el-form-item label="离线提示语">
          <el-input v-model="form.offline_hours_message" type="textarea" :rows="2" placeholder="非工作时间提示语" />
        </el-form-item>

        <el-divider content-position="left">AI 自动应答</el-divider>
        <el-form-item label="启用 AI 应答">
          <el-switch v-model="form.ai_enabled" active-value="1" inactive-value="0" />
        </el-form-item>
        <el-form-item label="API Endpoint">
          <el-input v-model="form.ai_api_endpoint" placeholder="OpenAI 兼容 API 地址" />
        </el-form-item>
        <el-form-item label="API Key">
          <el-input v-model="form.ai_api_key" type="password" placeholder="API Key" show-password />
        </el-form-item>
        <el-form-item label="模型">
          <el-input v-model="form.ai_model" placeholder="例如 gpt-4o-mini" />
        </el-form-item>

        <el-form-item style="margin-top: 24px">
          <el-button type="primary" :loading="saving" @click="handleSave">保存配置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'
import { ElMessage } from 'element-plus'

const adminStore = useAdminStore()
const saving = ref(false)
const form = reactive({
  welcome_message: '',
  response_time_hint: '',
  offline_hours_message: '',
  ai_enabled: '0',
  ai_api_endpoint: '',
  ai_api_key: '',
  ai_model: ''
})

onMounted(async () => {
  const res = await adminStore.fetchSystemConfig()
  if (res.code === 200) {
    const cfg = res.data || {}
    form.welcome_message = cfg.welcome_message || ''
    form.response_time_hint = cfg.response_time_hint || ''
    form.offline_hours_message = cfg.offline_hours_message || ''
    form.ai_enabled = cfg.ai_enabled || '0'
    form.ai_api_endpoint = cfg.ai_api_endpoint || ''
    form.ai_api_key = cfg.ai_api_key || ''
    form.ai_model = cfg.ai_model || ''
  }
})

async function handleSave() {
  saving.value = true
  const configs = [
    { config_key: 'welcome_message', config_value: form.welcome_message },
    { config_key: 'response_time_hint', config_value: form.response_time_hint },
    { config_key: 'offline_hours_message', config_value: form.offline_hours_message },
    { config_key: 'ai_enabled', config_value: form.ai_enabled },
    { config_key: 'ai_api_endpoint', config_value: form.ai_api_endpoint },
    { config_key: 'ai_api_key', config_value: form.ai_api_key },
    { config_key: 'ai_model', config_value: form.ai_model }
  ]
  const res = await adminStore.updateSystemConfig(configs)
  saving.value = false
  if (res.code === 200) { ElMessage.success('配置已保存') } else { ElMessage.error(res.message) }
}
</script>

<style scoped>
.sc-mgmt { height: 100%; }
</style>
