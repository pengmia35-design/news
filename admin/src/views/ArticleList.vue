<template>
  <div class="article-list-page">
    <!-- 操作栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="$router.push('/articles/create')">
        <el-icon><Plus /></el-icon> 新增文章
      </el-button>

      <div class="toolbar-right">
        <el-select v-model="filters.status" placeholder="状态" clearable style="width: 120px" @change="fetchData">
          <el-option label="全部" value="" />
          <el-option label="已发布" value="published" />
          <el-option label="草稿" value="draft" />
        </el-select>

        <el-select v-model="filters.category" placeholder="分类" clearable style="width: 150px" @change="fetchData">
          <el-option label="全部" value="" />
          <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
        </el-select>

        <el-input
          v-model="filters.keyword"
          placeholder="搜索标题..."
          clearable
          style="width: 200px"
          @keyup.enter="fetchData"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-button @click="fetchData">搜索</el-button>
      </div>
    </div>

    <!-- 文章表格 -->
    <el-table :data="articles" v-loading="loading" stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="title" label="标题" min-width="300" show-overflow-tooltip />
      <el-table-column prop="category_name" label="分类" width="130" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'published' ? 'success' : 'info'" size="small">
            {{ row.status === 'published' ? '已发布' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="置顶" width="70" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.is_featured" type="warning" size="small">顶</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="view_count" label="阅读" width="70" align="center" />
      <el-table-column label="发布时间" width="170">
        <template #default="{ row }">
          {{ row.published_at ? new Date(row.published_at).toLocaleString() : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="$router.push(`/articles/edit/${row.id}`)">编辑</el-button>
          <el-button
            size="small"
            :type="row.status === 'published' ? 'warning' : 'success'"
            @click="toggleStatus(row)"
          >
            {{ row.status === 'published' ? '下架' : '发布' }}
          </el-button>
          <el-button size="small" @click="toggleFeatured(row)">
            {{ row.is_featured ? '取消置顶' : '置顶' }}
          </el-button>
          <el-popconfirm title="确定删除？" @confirm="deleteArticle(row.id)">
            <template #reference>
              <el-button size="small" type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrap" v-if="total > 0">
      <el-pagination
        background
        layout="total, prev, pager, next"
        :total="total"
        :page-size="pageSize"
        v-model:current-page="page"
        @current-change="fetchData"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'
import { ElMessage } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'

const adminStore = useAdminStore()
const articles = ref([])
const categories = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const filters = reactive({
  status: '',
  category: '',
  keyword: ''
})

onMounted(async () => {
  try {
    const catRes = await adminStore.fetchCategories()
    if (catRes.code === 200) categories.value = catRes.data
  } catch (e) { /* ignore */ }
  fetchData()
})

async function fetchData() {
  loading.value = true
  try {
    const res = await adminStore.fetchArticles({
      page: page.value,
      pageSize,
      ...filters
    })
    if (res.code === 200) {
      articles.value = res.data.list
      total.value = res.data.total
    }
  } catch (e) {
    console.error(e)
  }
  loading.value = false
}

async function toggleStatus(row) {
  const newStatus = row.status === 'published' ? 'draft' : 'published'
  try {
    await adminStore.toggleStatus(row.id, newStatus)
    ElMessage.success(newStatus === 'published' ? '文章已发布' : '文章已下架')
    fetchData()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

async function toggleFeatured(row) {
  try {
    await adminStore.toggleFeatured(row.id)
    ElMessage.success(row.is_featured ? '已取消置顶' : '已置顶')
    fetchData()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

async function deleteArticle(id) {
  try {
    await adminStore.deleteArticle(id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (e) {
    ElMessage.error('删除失败')
  }
}
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}
</style>
