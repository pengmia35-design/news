<template>
  <div class="chat-mgmt">
    <!-- 顶部工具栏 -->
    <div class="mgmt-toolbar">
      <div class="toolbar-left">
        <span class="toolbar-label">客服状态：</span>
        <el-switch
          v-model="agentOnline"
          active-text="在线"
          inactive-text="离线"
          @change="toggleAgentStatus"
        />
        <el-button
          type="primary"
          size="small"
          :disabled="!agentOnline"
          @click="handleTakeNext"
          style="margin-left: 12px"
        >
          接待下一位
        </el-button>
      </div>
    </div>

    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab" @tab-change="handleTabChange" class="mgmt-tabs">
      <el-tab-pane label="在线对话" name="chat" />
      <el-tab-pane name="offline">
        <template #label>
          离线留言
          <span v-if="offlineTotal > 0" class="offline-badge-tab">{{ offlineTotal }}</span>
        </template>
      </el-tab-pane>
    </el-tabs>

    <!-- 在线对话 Tab -->
    <div v-if="activeTab === 'chat'" class="chat-tab">
      <el-row :span="24" style="height: calc(100vh - 260px)">
        <!-- 左侧对话列表 -->
        <el-col :span="9" style="height: 100%">
          <el-card shadow="never" class="conv-list-card">
            <template #header>
              <div class="card-header">
                <span>对话列表</span>
                <el-select v-model="filters.status" placeholder="状态筛选" size="small" clearable style="width: 120px" @change="fetchList">
                  <el-option label="等待接入" value="waiting" />
                  <el-option label="处理中" value="active" />
                  <el-option label="已解决" value="resolved" />
                  <el-option label="已关闭" value="closed" />
                </el-select>
              </div>
            </template>
            <el-input v-model="filters.keyword" placeholder="搜索用户名/ID" size="small" clearable @input="fetchList" style="margin-bottom: 12px" />

            <div v-loading="loading" class="conv-items">
              <div v-if="list.length === 0" style="text-align:center;color:#6B6B78;padding:40px 0">暂无对话</div>
              <div
                v-for="c in list"
                :key="c.id"
                class="conv-item"
                :class="{ active: activeConv?.id === c.id, unread: c.unread_count > 0 }"
                @click="selectConv(c)"
              >
                <div class="ci-top">
                  <span class="ci-user">{{ c.user_name || '匿名用户' }}</span>
                  <span style="display:flex;align-items:center;gap:4px">
                    <el-tag v-if="c.status === 'waiting' && c.queue_position" type="danger" size="small">#{{ c.queue_position }}</el-tag>
                    <el-tag :type="statusType(c.status)" size="small">{{ statusLabel(c.status) }}</el-tag>
                  </span>
                </div>
                <div class="ci-tag">{{ c.problem_tag_name || '未分类' }}</div>
                <div class="ci-msg">{{ c.last_message || '暂无消息' }}</div>
                <div class="ci-time">{{ formatTime(c.updated_at) }}</div>
              </div>
            </div>

            <el-pagination
              v-if="total > pageSize"
              v-model:current-page="page"
              :page-size="pageSize"
              :total="total"
              layout="prev, pager, next"
              size="small"
              style="margin-top: 12px; justify-content: center"
              @current-change="fetchList"
            />
          </el-card>
        </el-col>

        <!-- 右侧对话区 -->
        <el-col :span="15" style="height: 100%">
          <el-card shadow="never" v-if="activeConv" class="chat-card">
            <template #header>
              <div class="chat-header">
                <div class="ch-left">
                  <strong>{{ activeConv.user_name || '匿名用户' }}</strong>
                  <el-select v-model="activeConv.problem_tag_id" size="small" style="width: 160px; margin-left: 12px" @change="handleTagChange">
                    <el-option v-for="t in flatTags" :key="t.id" :label="t.name" :value="t.id" />
                  </el-select>
                </div>
                <div class="ch-right">
                  <el-select v-model="activeConv.status" size="small" style="width: 100px" @change="handleStatusChange">
                    <el-option label="等待接入" value="waiting" />
                    <el-option label="处理中" value="active" />
                    <el-option label="已解决" value="resolved" />
                    <el-option label="已关闭" value="closed" />
                  </el-select>
                </div>
              </div>
            </template>

            <div class="msg-area" ref="msgArea">
              <div v-if="messages.length === 0" style="text-align:center;color:#6B6B78;padding:60px 0">暂无消息</div>
              <div
                v-for="m in messages"
                :key="m.id"
                class="msg-row"
                :class="m.sender_type === 'agent' ? 'msg-right' : 'msg-left'"
              >
                <div class="msg-bubble" :class="m.sender_type === 'agent' ? 'bubble-agent' : 'bubble-user'">
                  <img v-if="m.content_type === 'image'" :src="m.content" style="max-width:200px;border-radius:8px" />
                  <span v-else>{{ m.content }}</span>
                  <div class="msg-time">{{ formatTime(m.created_at) }}</div>
                </div>
              </div>
            </div>

            <div v-if="activeConv.status !== 'closed'" class="chat-input-area">
              <el-popover placement="top-start" :width="300" trigger="click">
                <template #reference>
                  <el-button size="small" style="margin-right:8px">快捷回复</el-button>
                </template>
                <div v-for="qr in quickReplies" :key="qr.id" class="qr-item" @click="insertQuickReply(qr.content)">
                  <strong>{{ qr.title }}</strong>
                  <span>{{ qr.content.substring(0, 40) }}...</span>
                </div>
                <div v-if="quickReplies.length === 0" style="color:#6B6B78;text-align:center">暂无可用的快捷回复</div>
              </el-popover>
              <el-input
                v-model="replyText"
                placeholder="输入回复..."
                @keyup.enter.ctrl="handleReply"
                style="flex:1"
              />
              <el-button type="primary" size="small" :disabled="!replyText.trim()" @click="handleReply" style="margin-left:8px">发送</el-button>
            </div>
            <div v-else class="closed-notice">对话已关闭</div>
          </el-card>

          <el-card shadow="never" v-else class="empty-card">
            <div style="text-align:center;color:#6B6B78;padding:80px 0">
              <el-icon :size="48"><ChatDotRound /></el-icon>
              <p style="margin-top:16px">选择左侧对话开始接待</p>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 离线留言 Tab -->
    <div v-else class="offline-tab">
      <el-card shadow="never">
        <div v-loading="offlineLoading" class="offline-table-wrap">
          <div v-if="offlineList.length === 0 && !offlineLoading" style="text-align:center;color:#6B6B78;padding:60px 0">
            <el-icon :size="40"><Message /></el-icon>
            <p style="margin-top:12px">暂无离线留言</p>
          </div>
          <el-table v-else :data="offlineList" stripe size="small">
            <el-table-column prop="user_name" label="用户名" width="100">
              <template #default="{ row }">{{ row.user_name || '匿名' }}</template>
            </el-table-column>
            <el-table-column prop="problem_tag_name" label="问题类型" width="120">
              <template #default="{ row }">{{ row.problem_tag_name || '未分类' }}</template>
            </el-table-column>
            <el-table-column prop="content" label="留言内容" min-width="200" show-overflow-tooltip />
            <el-table-column prop="contact_info" label="联系方式" width="140" show-overflow-tooltip>
              <template #default="{ row }">{{ row.contact_info || '-' }}</template>
            </el-table-column>
            <el-table-column label="时间" width="160">
              <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="handleConvert(row)">
                  转为对话
                </el-button>
                <el-button size="small" type="danger" @click="handleIgnore(row)">
                  忽略
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-if="offlineTotal > offlinePageSize"
            v-model:current-page="offlinePage"
            :page-size="offlinePageSize"
            :total="offlineTotal"
            layout="prev, pager, next"
            size="small"
            style="margin-top: 12px; justify-content: center"
            @current-change="fetchOfflineList"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { useAdminStore } from '@/stores/admin'
import { ChatDotRound, Message } from '@element-plus/icons-vue'
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus'

const adminStore = useAdminStore()

const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const filters = reactive({ status: '', keyword: '' })

const activeConv = ref(null)
const messages = ref([])
const replyText = ref('')
const flatTags = ref([])
const quickReplies = ref([])
const msgArea = ref(null)

// 新功能：agent 在线状态 / 排队 / 离线留言
const agentOnline = ref(false)
const activeTab = ref('chat')

const offlineList = ref([])
const offlineTotal = ref(0)
const offlinePage = ref(1)
const offlinePageSize = ref(20)
const offlineLoading = ref(false)

let statusPollTimer = null

onMounted(async () => {
  await loadTags()
  await loadQuickReplies()
  fetchList()
  initAgentStatus()
  checkPendingOffline()
  // 每 60 秒轮询 agent 状态
  statusPollTimer = setInterval(checkPendingOffline, 60000)
})

onUnmounted(() => {
  if (statusPollTimer) clearInterval(statusPollTimer)
})

async function initAgentStatus() {
  const res = await adminStore.fetchAgentStatus()
  if (res.code === 200) {
    agentOnline.value = res.data.agent_online
  }
}

async function checkPendingOffline() {
  const res = await adminStore.fetchAgentStatus()
  if (res.code === 200 && res.data.offline_pending_count > 0) {
    agentOnline.value = res.data.agent_online
    ElNotification({
      title: '离线留言提醒',
      message: `有 ${res.data.offline_pending_count} 条离线留言等待处理`,
      type: 'warning',
      duration: 0
    })
  }
}

async function toggleAgentStatus(val) {
  const res = val
    ? await adminStore.setAgentOnline()
    : await adminStore.setAgentOffline()
  if (res.code === 200) {
    ElMessage.success(val ? '已上线' : '已离线')
    if (val) {
      const statusRes = await adminStore.fetchAgentStatus()
      if (statusRes.code === 200 && statusRes.data.offline_pending_count > 0) {
        ElNotification({
          title: '离线留言提醒',
          message: `有 ${statusRes.data.offline_pending_count} 条离线留言等待处理`,
          type: 'warning',
          duration: 0
        })
      }
    }
  } else {
    ElMessage.error(res.message)
    agentOnline.value = !val
  }
}

async function handleTakeNext() {
  const res = await adminStore.takeNextConversation()
  if (res.code === 200) {
    ElMessage.success('已接待下一位')
    fetchList()
  } else {
    ElMessage.error(res.data?.message || '操作失败')
  }
}

function handleTabChange(tab) {
  if (tab === 'offline') {
    fetchOfflineList()
  }
}

async function fetchOfflineList() {
  offlineLoading.value = true
  const res = await adminStore.fetchOfflineMessages({
    page: offlinePage.value,
    pageSize: offlinePageSize.value
  })
  if (res.code === 200) {
    offlineList.value = res.data.list || []
    offlineTotal.value = res.data.total || 0
  }
  offlineLoading.value = false
}

async function handleConvert(row) {
  try {
    await ElMessageBox.confirm(`确定将「${row.user_name || '匿名用户'}」的留言转为对话吗？`, '确认转化', {
      type: 'info'
    })
  } catch {
    return
  }
  const res = await adminStore.convertOfflineMessage(row.id)
  if (res.code === 200) {
    ElMessage.success('已转为对话')
    fetchOfflineList()
  } else {
    ElMessage.error(res.message)
  }
}

async function handleIgnore(row) {
  try {
    await ElMessageBox.confirm('确定忽略该留言吗？将被永久删除。', '确认忽略', {
      type: 'warning'
    })
  } catch {
    return
  }
  const res = await adminStore.ignoreOfflineMessage(row.id)
  if (res.code === 200) {
    ElMessage.success('已忽略')
    fetchOfflineList()
  } else {
    ElMessage.error(res.message)
  }
}

async function loadTags() {
  const res = await adminStore.fetchProblemTags()
  if (res.code === 200) {
    const arr = []
    function flatten(items, prefix = '') {
      for (const t of items) {
        arr.push({ id: t.id, name: prefix + t.name })
        if (t.children) flatten(t.children, prefix + '  ')
      }
    }
    flatten(res.data || [])
    flatTags.value = arr
  }
}

async function loadQuickReplies() {
  const res = await adminStore.fetchQuickReplies()
  if (res.code === 200) {
    quickReplies.value = res.data || []
  }
}

async function fetchList() {
  loading.value = true
  const res = await adminStore.fetchConversations({ ...filters, page: page.value, pageSize: pageSize.value })
  if (res.code === 200) {
    list.value = res.data.list || []
    total.value = res.data.total || 0
  }
  loading.value = false
}

async function selectConv(conv) {
  activeConv.value = conv
  const res = await adminStore.fetchConversationDetail(conv.id)
  if (res.code === 200) {
    messages.value = res.data.messages || []
    activeConv.value = res.data.conversation
    nextTick(scrollBottom)
  }
}

async function handleReply() {
  if (!replyText.value.trim()) return
  const res = await adminStore.replyToConversation(activeConv.value.id, replyText.value.trim())
  if (res.code === 200) {
    messages.value.push(res.data)
    replyText.value = ''
    await fetchList()
    const detail = await adminStore.fetchConversationDetail(activeConv.value.id)
    if (detail.code === 200) {
      messages.value = detail.data.messages || []
      activeConv.value = detail.data.conversation
    }
    nextTick(scrollBottom)
  } else {
    ElMessage.error(res.message)
  }
}

async function handleStatusChange(status) {
  await adminStore.updateConversationStatus(activeConv.value.id, status)
  fetchList()
  ElMessage.success('状态已更新')
}

async function handleTagChange(tagId) {
  await adminStore.updateConversationTag(activeConv.value.id, tagId)
  fetchList()
  ElMessage.success('标签已更新')
}

function insertQuickReply(content) {
  replyText.value = content
}

function scrollBottom() {
  if (msgArea.value) {
    msgArea.value.scrollTop = msgArea.value.scrollHeight
  }
}

function statusLabel(s) {
  const m = { waiting: '等待接入', active: '处理中', resolved: '已解决', closed: '已关闭' }
  return m[s] || s
}

function statusType(s) {
  const m = { waiting: 'warning', active: 'success', resolved: '', closed: 'info' }
  return m[s] || ''
}

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0')
}
</script>

<style scoped>
.chat-mgmt { height: 100%; }

/* 工具栏 */
.mgmt-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: #141418;
  border-bottom: 1px solid #1C1C21;
  margin-bottom: 0;
}
.toolbar-label {
  font-size: 13px;
  color: #6B6B78;
  margin-right: 4px;
}
.toolbar-left {
  display: flex;
  align-items: center;
}

/* Tabs */
.mgmt-tabs {
  padding: 0 16px;
  background: #141418;
  border-bottom: 1px solid #1C1C21;
}
.offline-badge-tab {
  display: inline-block;
  background: #DC2626;
  color: #fff;
  border-radius: 10px;
  padding: 0 6px;
  font-size: 11px;
  line-height: 18px;
  margin-left: 4px;
  vertical-align: middle;
}

/* Chat tab */
.chat-tab { padding-top: 8px; }
.conv-list-card, .chat-card, .empty-card { height: 100%; display: flex; flex-direction: column; }
.conv-list-card :deep(.el-card__body), .chat-card :deep(.el-card__body) { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.conv-items { flex: 1; overflow-y: auto; }

.conv-item { padding: 12px; border: 1px solid #25252D; border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s; }
.conv-item:hover { border-color: #10B981; }
.conv-item.active { border-color: #10B981; background: rgba(16, 185, 129, 0.08); }
.conv-item.unread { border-left: 3px solid #10B981; }
.ci-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.ci-user { font-weight: 600; font-size: 14px; color: #E4E4E7; }
.ci-tag { font-size: 12px; color: #34D399; background: rgba(16, 185, 129, 0.12); display: inline-block; padding: 1px 8px; border-radius: 4px; margin: 4px 0; }
.ci-msg { font-size: 12px; color: #6B6B78; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ci-time { font-size: 11px; color: #52525B; text-align: right; }

.chat-header { display: flex; justify-content: space-between; align-items: center; }
.ch-left { display: flex; align-items: center; }
.msg-area { flex: 1; overflow-y: auto; padding: 12px; background: #0F0F12; }
.msg-row { margin-bottom: 16px; }
.msg-left { text-align: left; }
.msg-right { text-align: right; }
.msg-bubble { display: inline-block; max-width: 70%; padding: 8px 14px; border-radius: 12px; text-align: left; }
.bubble-user { background: #1C1C21; border: 1px solid #25252D; color: #E4E4E7; }
.bubble-agent { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); color: #E4E4E7; }
.msg-time { font-size: 10px; color: #52525B; margin-top: 4px; }
.chat-input-area { display: flex; align-items: center; padding: 12px 0 0; border-top: 1px solid #1C1C21; margin-top: 12px; }
.closed-notice { text-align: center; color: #6B6B78; padding: 12px 0 0; }
.qr-item { padding: 8px; border-radius: 6px; cursor: pointer; margin-bottom: 4px; display: flex; flex-direction: column; gap: 2px; }
.qr-item:hover { background: #1C1C21; }
.qr-item strong { font-size: 13px; color: #E4E4E7; }
.qr-item span { font-size: 12px; color: #6B6B78; }

/* Offline tab */
.offline-tab { padding-top: 8px; }
.offline-table-wrap { min-height: 300px; }
</style>
