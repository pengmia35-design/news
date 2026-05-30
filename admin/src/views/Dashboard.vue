<template>
  <div class="dashboard">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon blue">
          <el-icon :size="28"><Document /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ data.articleCount }}</span>
          <span class="stat-label">文章总数</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon green">
          <el-icon :size="28"><SuccessFilled /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ data.publishedCount }}</span>
          <span class="stat-label">已发布</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon orange">
          <el-icon :size="28"><Edit /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ data.draftCount }}</span>
          <span class="stat-label">草稿</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon purple">
          <el-icon :size="28"><Collection /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ data.categoryCount }}</span>
          <span class="stat-label">分类数量</span>
        </div>
      </div>
    </div>

    <div class="stats-grid" style="margin-top: 16px;">
      <div class="stat-card">
        <div class="stat-icon cyan">
          <el-icon :size="28"><PriceTag /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ data.tagCount }}</span>
          <span class="stat-label">标签数量</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon red">
          <el-icon :size="28"><View /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ data.totalViews }}</span>
          <span class="stat-label">总阅读量</span>
        </div>
      </div>
    </div>

    <!-- 快速操作 -->
    <el-card class="quick-card" style="margin-top: 24px;">
      <template #header>
        <span>快捷操作</span>
      </template>
      <div class="quick-actions">
        <el-button type="primary" @click="$router.push('/articles/create')">
          <el-icon><Plus /></el-icon> 新增文章
        </el-button>
        <el-button @click="$router.push('/articles')">
          <el-icon><List /></el-icon> 管理文章
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'
import { Document, SuccessFilled, Edit, Collection, PriceTag, View, Plus, List } from '@element-plus/icons-vue'

const adminStore = useAdminStore()
const data = ref({
  articleCount: 0,
  publishedCount: 0,
  draftCount: 0,
  categoryCount: 0,
  tagCount: 0,
  totalViews: 0
})

onMounted(async () => {
  try {
    const res = await adminStore.fetchDashboard()
    if (res.code === 200) {
      data.value = res.data
    }
  } catch (e) {
    console.error(e)
  }
})
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  border-color: #2563EB;
  box-shadow: 0 0 20px rgba(37, 99, 235, 0.08);
}

.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.stat-icon.blue { background: rgba(37, 99, 235, 0.15); color: #60A5FA; }
.stat-icon.green { background: rgba(37, 99, 235, 0.15); color: #3B82F6; }
.stat-icon.orange { background: rgba(234, 88, 12, 0.15); color: #FB923C; }
.stat-icon.purple { background: rgba(147, 51, 234, 0.15); color: #C084FC; }
.stat-icon.cyan { background: rgba(8, 145, 178, 0.15); color: #22D3EE; }
.stat-icon.red { background: rgba(220, 38, 38, 0.15); color: #F87171; }

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #2563EB;
  line-height: 1.2;
  font-family: 'JetBrains Mono', monospace;
}

.stat-label {
  font-size: 13px;
  color: #64748B;
  margin-top: 2px;
}

.quick-actions {
  display: flex;
  gap: 12px;
}
</style>
