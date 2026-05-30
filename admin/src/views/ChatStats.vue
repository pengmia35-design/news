<template>
  <div class="stats-mgmt">
    <!-- 统计卡片 -->
    <el-row :gutter="16" style="margin-bottom: 24px">
      <el-col :span="6" v-for="card in statCards" :key="card.label">
        <el-card shadow="never">
          <div class="stat-card">
            <div class="stat-icon" :style="{ background: card.color }">
              <el-icon :size="20"><component :is="card.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-num">{{ card.value }}</span>
              <span class="stat-label">{{ card.label }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区 -->
    <el-row :gutter="16" style="margin-bottom: 16px">
      <!-- 趋势图 -->
      <el-col :span="14">
        <el-card shadow="never">
          <template #header>30 天咨询趋势</template>
          <div class="trend-chart">
            <div v-if="trend.length === 0" style="text-align:center;color:#64748B;padding:40px">暂无数据</div>
            <div v-else class="bar-chart">
              <div v-for="t in trend" :key="t.day" class="bar-col">
                <div class="bar" :style="{ height: maxTrend > 0 ? (t.cnt / maxTrend * 160) + 'px' : '0' }">
                  <span class="bar-val">{{ t.cnt }}</span>
                </div>
                <span class="bar-label">{{ t.day.substring(5) }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 分类占比 -->
      <el-col :span="10">
        <el-card shadow="never">
          <template #header>问题分类占比</template>
          <div class="tag-dist">
            <div v-if="tagDist.length === 0" style="text-align:center;color:#64748B;padding:40px">暂无数据</div>
            <div v-for="t in tagDist" :key="t.slug" class="tag-row">
              <span class="tag-name">{{ t.name }}</span>
              <div class="tag-bar-bg"><div class="tag-bar-fill" :style="{ width: maxTag > 0 ? (t.cnt / maxTag * 100) + '%' : '0%' }"></div></div>
              <span class="tag-cnt">{{ t.cnt }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- FAQ 排行 + 状态分布 -->
    <el-row :gutter="16">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>FAQ 阅读排行 TOP 10</template>
          <div class="faq-rank" v-if="topFaq.length > 0">
            <div v-for="(f, i) in topFaq" :key="f.id" class="faq-row">
              <span class="rank-num" :class="{ top3: i < 3 }">{{ i + 1 }}</span>
              <span class="faq-title">{{ f.title }}</span>
              <span class="faq-views">{{ f.view_count }} 次</span>
            </div>
          </div>
          <div v-else style="text-align:center;color:#64748B;padding:40px">暂无数据</div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>对话状态分布</template>
          <div class="status-dist" v-if="statusDist.length > 0">
            <div v-for="s in statusDist" :key="s.status" class="status-row">
              <span :class="'status-dot status-' + s.status"></span>
              <span>{{ statusLabel(s.status) }}</span>
              <span style="margin-left:auto;font-weight:600">{{ s.cnt }}</span>
            </div>
          </div>
          <div v-else style="text-align:center;color:#64748B;padding:40px">暂无数据</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'
import { DataBoard, ChatDotRound, Star, Document } from '@element-plus/icons-vue'

const adminStore = useAdminStore()
const todayConv = ref(0)
const weekConv = ref(0)
const totalConv = ref(0)
const avgRating = ref(0)
const trend = ref([])
const tagDist = ref([])
const statusDist = ref([])
const topFaq = ref([])

const statCards = computed(() => [
  { label: '今日对话', value: todayConv.value, icon: ChatDotRound, color: '#EFF6FF' },
  { label: '本周对话', value: weekConv.value, icon: DataBoard, color: '#F0FDF4' },
  { label: '对话总数', value: totalConv.value, icon: Document, color: '#FFF7ED' },
  { label: '平均评分', value: avgRating.value, icon: Star, color: '#FEF2F2' }
])

const maxTrend = computed(() => Math.max(...trend.value.map(t => t.cnt), 1))
const maxTag = computed(() => Math.max(...tagDist.value.map(t => t.cnt), 1))

onMounted(async () => {
  const res = await adminStore.fetchChatStats()
  if (res.code === 200) {
    const d = res.data
    todayConv.value = d.todayConv || 0
    weekConv.value = d.weekConv || 0
    totalConv.value = d.totalConv || 0
    avgRating.value = d.avgRating || 0
    trend.value = d.trend || []
    tagDist.value = d.tagDist || []
    statusDist.value = d.statusDist || []
    topFaq.value = d.topFaq || []
  }
})

function statusLabel(s) {
  const m = { waiting: '等待接入', active: '处理中', resolved: '已解决', closed: '已关闭' }
  return m[s] || s
}
</script>

<style scoped>
.stats-mgmt { height: 100%; }
.stat-card { display: flex; align-items: center; gap: 16px; }
.stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--color-primary, #1E40AF); }
.stat-info { display: flex; flex-direction: column; }
.stat-num { font-size: 24px; font-weight: 700; color: var(--color-foreground, #0F172A); }
.stat-label { font-size: 13px; color: #64748B; }
.bar-chart { display: flex; align-items: flex-end; gap: 4px; height: 200px; padding: 0 8px; }
.bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; }
.bar { width: 100%; max-width: 24px; background: #2563EB; border-radius: 4px 4px 0 0; position: relative; min-height: 4px; transition: height 0.5s; }
.bar-val { position: absolute; top: -18px; left: 50%; transform: translateX(-50%); font-size: 10px; color: #64748B; }
.bar-label { font-size: 10px; color: #64748B; margin-top: 4px; transform: rotate(-45deg); transform-origin: left; white-space: nowrap; }
.tag-dist { padding: 8px 0; }
.tag-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; font-size: 13px; }
.tag-name { width: 80px; flex-shrink: 0; color: #1E293B; }
.tag-bar-bg { flex: 1; height: 16px; background: #E2E8F0; border-radius: 8px; overflow: hidden; }
.tag-bar-fill { height: 100%; background: #2563EB; border-radius: 8px; transition: width 0.5s; }
.tag-cnt { font-weight: 600; color: #2563EB; width: 30px; text-align: right; }
.faq-rank { padding: 4px 0; }
.faq-row { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid #E2E8F0; font-size: 13px; }
.rank-num { width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 600; background: #E2E8F0; color: #64748B; font-size: 12px; }
.rank-num.top3 { background: #2563EB; color: #fff; }
.faq-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #1E293B; }
.faq-views { color: #64748B; font-size: 12px; }
.status-dist { padding: 8px 0; }
.status-row { display: flex; align-items: center; gap: 8px; padding: 10px 0; font-size: 14px; }
.status-dot { width: 10px; height: 10px; border-radius: 50%; }
.status-waiting { background: #F59E0B; } .status-active { background: #2563EB; } .status-resolved { background: #3B82F6; } .status-closed { background: #94A3B8; }
</style>
