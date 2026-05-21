<template>
  <div class="faq-mgmt">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="文章管理" name="articles">
        <div class="toolbar">
          <el-input v-model="filters.keyword" placeholder="搜索标题/内容" size="default" clearable style="width: 240px" @input="fetchArticles" />
          <el-select v-model="filters.category_id" placeholder="分类筛选" size="default" clearable style="width: 160px; margin-left: 8px" @change="fetchArticles">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
          <el-select v-model="filters.status" placeholder="发布状态" size="default" clearable style="width: 120px; margin-left: 8px" @change="fetchArticles">
            <el-option label="已发布" value="published" />
            <el-option label="草稿" value="draft" />
          </el-select>
          <el-button type="primary" @click="openEdit(null)" style="margin-left: auto">新增文章</el-button>
        </div>

        <el-table :data="articles" v-loading="loading" stripe style="margin-top: 16px">
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="title" label="标题" show-overflow-tooltip />
          <el-table-column prop="category_name" label="分类" width="120" />
          <el-table-column prop="view_count" label="阅读" width="80" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.is_published ? 'success' : 'info'" size="small">{{ row.is_published ? '已发布' : '草稿' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="更新时间" width="160">
            <template #default="{ row }">{{ formatDate(row.updated_at || row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="240" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="openEdit(row)">编辑</el-button>
              <el-button size="small" @click="handleToggle(row)">{{ row.is_published ? '下架' : '上架' }}</el-button>
              <el-popconfirm title="确定删除？" @confirm="handleDelete(row.id)">
                <template #reference>
                  <el-button size="small" type="danger">删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination v-if="total > pageSize" v-model:current-page="page" :page-size="pageSize" :total="total" layout="total, prev, pager, next" style="margin-top:16px;justify-content:flex-end" @current-change="fetchArticles" />
      </el-tab-pane>

      <el-tab-pane label="分类管理" name="categories">
        <el-button type="primary" @click="openCatEdit(null)" style="margin-bottom: 16px">新增分类</el-button>
        <el-table :data="categories" stripe>
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="slug" label="标识" />
          <el-table-column prop="sort_order" label="排序" width="80" />
          <el-table-column prop="article_count" label="文章数" width="80" />
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <el-button size="small" @click="openCatEdit(row)">编辑</el-button>
              <el-popconfirm title="确定删除？" @confirm="handleCatDelete(row.id)">
                <template #reference>
                  <el-button size="small" type="danger">删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 文章编辑 Dialog -->
    <el-dialog v-model="editVisible" :title="editingArticle?.id ? '编辑文章' : '新增文章'" width="700px" :close-on-click-modal="false">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="文章标题" />
        </el-form-item>
        <el-form-item label="分类" prop="category_id">
          <el-select v-model="form.category_id" placeholder="选择分类">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" :min="0" />
        </el-form-item>
        <el-form-item label="发布">
          <el-switch v-model="form.is_published" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="12" placeholder="支持 Markdown 格式" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 分类编辑 Dialog -->
    <el-dialog v-model="catEditVisible" :title="editingCat?.id ? '编辑分类' : '新增分类'" width="500px">
      <el-form :model="catForm" ref="catFormRef" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="catForm.name" placeholder="分类名称" />
        </el-form-item>
        <el-form-item label="标识">
          <el-input v-model="catForm.slug" placeholder="URL 标识" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="catForm.sort_order" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="catEditVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleCatSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'
import { ElMessage } from 'element-plus'

const adminStore = useAdminStore()
const activeTab = ref('articles')
const loading = ref(false)
const saving = ref(false)
const articles = ref([])
const categories = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const filters = reactive({ keyword: '', category_id: '', status: '' })

const editVisible = ref(false)
const editingArticle = ref(null)
const form = reactive({ title: '', content: '', category_id: null, sort_order: 0, is_published: 1 })
const formRef = ref(null)
const rules = { title: [{ required: true, message: '请输入标题' }], content: [{ required: true, message: '请输入内容' }] }

const catEditVisible = ref(false)
const editingCat = ref(null)
const catForm = reactive({ name: '', slug: '', sort_order: 0 })
const catFormRef = ref(null)

onMounted(() => { fetchCategories(); fetchArticles() })

async function fetchCategories() {
  const res = await adminStore.fetchFaqCategories()
  if (res.code === 200) categories.value = res.data || []
}

async function fetchArticles() {
  loading.value = true
  const res = await adminStore.fetchFaqArticles({ ...filters, page: page.value, pageSize: pageSize.value })
  if (res.code === 200) { articles.value = res.data.list || []; total.value = res.data.total || 0 }
  loading.value = false
}

function openEdit(row) {
  editingArticle.value = row
  if (row) {
    Object.assign(form, { title: row.title, content: row.content, category_id: row.category_id, sort_order: row.sort_order, is_published: row.is_published })
  } else {
    Object.assign(form, { title: '', content: '', category_id: null, sort_order: 0, is_published: 1 })
  }
  editVisible.value = true
}

async function handleSave() {
  try { await formRef.value.validate() } catch { return }
  saving.value = true
  let res
  if (editingArticle.value?.id) {
    res = await adminStore.updateFaqArticle(editingArticle.value.id, { ...form })
  } else {
    res = await adminStore.createFaqArticle({ ...form })
  }
  saving.value = false
  if (res.code === 200) { editVisible.value = false; fetchArticles(); ElMessage.success('保存成功') } else { ElMessage.error(res.message) }
}

async function handleToggle(row) {
  const res = await adminStore.toggleFaqArticleStatus(row.id)
  if (res.code === 200) { fetchArticles(); ElMessage.success(res.message) }
}

async function handleDelete(id) {
  const res = await adminStore.deleteFaqArticle(id)
  if (res.code === 200) { fetchArticles(); ElMessage.success('已删除') } else { ElMessage.error(res.message) }
}

function openCatEdit(row) {
  editingCat.value = row
  if (row) {
    Object.assign(catForm, { name: row.name, slug: row.slug, sort_order: row.sort_order })
  } else {
    Object.assign(catForm, { name: '', slug: '', sort_order: 0 })
  }
  catEditVisible.value = true
}

async function handleCatSave() {
  if (!catForm.name || !catForm.slug) { ElMessage.error('名称和标识不能为空'); return }
  saving.value = true
  let res
  if (editingCat.value?.id) {
    res = await adminStore.updateFaqCategory(editingCat.value.id, { ...catForm })
  } else {
    res = await adminStore.createFaqCategory({ ...catForm })
  }
  saving.value = false
  if (res.code === 200) { catEditVisible.value = false; fetchCategories(); ElMessage.success('保存成功') } else { ElMessage.error(res.message) }
}

async function handleCatDelete(id) {
  const res = await adminStore.deleteFaqCategory(id)
  if (res.code === 200) { fetchCategories(); ElMessage.success('已删除') } else { ElMessage.error(res.message) }
}

function formatDate(t) {
  if (!t) return ''
  const d = new Date(t)
  return d.getFullYear() + '-' + (d.getMonth() + 1).toString().padStart(2, '0') + '-' + d.getDate().toString().padStart(2, '0') + ' ' + d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0')
}
</script>

<style scoped>
.faq-mgmt { height: 100%; }
.toolbar { display: flex; align-items: center; }
</style>
