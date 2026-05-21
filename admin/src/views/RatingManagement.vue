<template>
  <div class="rating-mgmt">
    <!-- 汇总 -->
    <el-row :gutter="16" style="margin-bottom: 24px">
      <el-col :span="6">
        <el-card shadow="never">
          <div class="stat-card">
            <span class="stat-num">{{ summary.total || 0 }}</span>
            <span class="stat-label">评价总数</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div class="stat-card">
            <span class="stat-num">{{ summary.avgRating || 0 }}</span>
            <span class="stat-label">平均评分</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <div class="dist-bars">
            <div v-for="d in distribution" :key="d.rating" class="dist-row">
              <span>{{ d.rating }} 星</span>
              <div class="dist-bar-bg"><div class="dist-bar-fill" :style="{ width: maxCount > 0 ? (d.cnt / maxCount * 100) + '%' : '0%' }"></div></div>
              <span>{{ d.cnt }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选 + 导出 -->
    <div class="toolbar">
      <el-select v-model="filters.rating" placeholder="星级筛选" size="default" clearable style="width: 120px" @change="fetchList">
        <el-option v-for="i in 5" :key="i" :label="i + ' 星'" :value="i" />
      </el-select>
      <el-select v-model="filters.problem_tag_id" placeholder="问题分类" size="default" clearable style="width: 160px; margin-left: 8px" @change="fetchList">
        <el-option v-for="t in flatTags" :key="t.id" :label="t.name" :value="t.id" />
      </el-select>
      <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" size="default" style="margin-left:8px" @change="onDateChange" />
      <el-button @click="handleExport" style="margin-left: auto">导出评价</el-button>
    </div>

    <el-table :data="list" v-loading="loading" stripe style="margin-top: 16px">
      <el-table-column prop="id" label="对话ID" width="80" />
      <el-table-column prop="user_name" label="用户" width="120" />
      <el-table-column prop="problem_tag_name" label="问题分类" width="120" />
      <el-table-column label="评分" width="140">
        <template #default="{ row }">
          <span v-for="i in 5" :key="i" :style="{ color: i <= row.rating ? '#F59E0B' : '#E2E8F0', marginRight: '2px' }">&#9733;</span>
        </template>
      </el-table-column>
      <el-table-column label="评价标签" width="200">
        <template #default="{ row }">
          <el-tag v-for="t in parseTags(row.rating_tags)" :key="t" size="small" style="margin: 2px">{{ t }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="rating_text" label="文字评价" show-overflow-tooltip />
      <el-table-column label="评价时间" width="160">
        <template #default="{ row }">{{ formatDate(row.closed_at) }}</template>
      </el-table-column>
    </el-table>

    <el-pagination v-if="total > pageSize" v-model:current-page="page" :page-size="pageSize" :total="total" layout="total, prev, pager, next" style="margin-top:16px;justify-content:flex-end" @current-change="fetchList" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'
import { ElMessage } from 'element-plus'

const adminStore = useAdminStore()
const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const filters = reactive({ rating: '', problem_tag_id: '', start_date: '', end_date: '' })
const dateRange = ref(null)
const summary = ref({ total: 0, avgRating: 0, distribution: [], tagCount: {} })
const flatTags = ref([])

const distribution = computed(() => {
  const dist = []
  for (let i = 1; i <= 5; i++) {
    const found = (summary.value.distribution || []).find(d => d.rating == i)
    dist.push({ rating: i, cnt: found ? found.cnt : 0 })
  }
  return dist
})

const maxCount = computed(() => Math.max(...distribution.value.map(d => d.cnt), 1))

onMounted(async () => {
  await loadTags()
  fetchSummary()
  fetchList()
})

async function loadTags() {
  const res = await adminStore.fetchProblemTags()
  if (res.code === 200) {
    const arr = []
    function flatten(items, p = '') {
      for (const t of items) { arr.push({ id: t.id, name: p + t.name }); if (t.children) flatten(t.children, p + '  ') }
    }
    flatten(res.data || [])
    flatTags.value = arr
  }
}

async function fetchSummary() {
  const res = await adminStore.fetchRatingsSummary()
  if (res.code === 200) summary.value = res.data
}

async function fetchList() {
  loading.value = true
  const params = { page: page.value, pageSize: pageSize.value }
  if (filters.rating) params.rating = filters.rating
  if (filters.problem_tag_id) params.problem_tag_id = filters.problem_tag_id
  if (filters.start_date) params.start_date = filters.start_date
  if (filters.end_date) params.end_date = filters.end_date
  const res = await adminStore.fetchRatings(params)
  if (res.code === 200) { list.value = res.data.list || []; total.value = res.data.total || 0 }
  loading.value = false
}

function onDateChange(vals) {
  if (vals && vals.length === 2) {
    filters.start_date = vals[0].toISOString().split('T')[0]
    filters.end_date = vals[1].toISOString().split('T')[0]
  } else {
    filters.start_date = ''
    filters.end_date = ''
  }
  fetchList()
}

async function handleExport() {
  const res = await adminStore.exportRatings({ start_date: filters.start_date || undefined, end_date: filters.end_date || undefined })
  if (res.code === 200) {
    const csv = ['ID,用户名,评分,评价标签,文字评价,问题分类,时间']
    for (const r of res.data) {
      csv.push([r.id, r.user_name, r.rating, r.rating_tags, r.rating_text, r.problem_tag_name, r.closed_at].join(','))
    }
    const blob = new Blob(['﻿' + csv.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'ratings.csv'; a.click(); URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  }
}

function parseTags(tags) {
  if (!tags) return []
  try { return JSON.parse(tags) } catch { return [] }
}

function formatDate(t) {
  if (!t) return ''
  const d = new Date(t)
  return d.getFullYear() + '-' + (d.getMonth() + 1).toString().padStart(2, '0') + '-' + d.getDate().toString().padStart(2, '0') + ' ' + d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0')
}
</script>

<style scoped>
.rating-mgmt { height: 100%; }
.stat-card { text-align: center; padding: 12px 0; }
.stat-num { font-size: 32px; font-weight: 700; color: #10B981; display: block; font-family: 'JetBrains Mono', monospace; }
.stat-label { font-size: 13px; color: #6B6B78; margin-top: 4px; display: block; }
.dist-bars { padding: 8px 0; }
.dist-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 12px; color: #E4E4E7; }
.dist-bar-bg { flex: 1; height: 12px; background: #1C1C21; border-radius: 6px; overflow: hidden; }
.dist-bar-fill { height: 100%; background: #F59E0B; border-radius: 6px; transition: width 0.5s; }
.toolbar { display: flex; align-items: center; }
</style>
