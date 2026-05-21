<template>
  <div class="page-container admin-page">
    <!-- 登录 -->
    <div v-if="!isLoggedIn" class="admin-login">
      <div class="login-card">
        <h2 class="login-title">管理员登录</h2>
        <el-form @submit.prevent="handleLogin" label-width="80px">
          <el-form-item label="用户名">
            <el-input v-model="loginForm.username" placeholder="请输入用户名" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" show-password />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" native-type="submit" :loading="loginLoading" style="width:100%">登录</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 管理面板 -->
    <template v-else>
      <div class="admin-header">
        <h2>后台管理</h2>
        <el-button size="small" @click="handleLogout">退出登录</el-button>
      </div>

      <el-tabs v-model="activeTab" type="card" class="admin-tabs">
        <!-- ===== 轮播图管理 ===== -->
        <el-tab-pane label="轮播图管理" name="carousel">
          <div class="section-toolbar">
            <span class="section-count">共 {{ slides.length }} 张轮播图</span>
            <el-button type="primary" size="small" @click="showSlideDialog = true">+ 添加轮播图</el-button>
          </div>

          <div class="slide-grid">
            <div v-for="(slide, i) in slides" :key="slide.id" class="slide-card">
              <div class="slide-preview">
                <img :src="slide.image_url" :alt="slide.title" @error="e => e.target.src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22800%22 height=%22400%22><rect fill=%22%233b82f6%22 width=%22800%22 height=%22400%22/><text x=%22400%22 y=%22200%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2220%22>加载失败</text></svg>'" />
                <div class="slide-order">{{ i + 1 }}</div>
                <div class="slide-status" :class="{ active: slide.is_active }">
                  {{ slide.is_active ? '启用' : '禁用' }}
                </div>
              </div>
              <div class="slide-info">
                <div class="slide-title">{{ slide.title || '无标题' }}</div>
                <div class="slide-desc">{{ slide.description || '无描述' }}</div>
              </div>
              <div class="slide-actions">
                <el-button size="small" @click="editSlide(slide)">编辑</el-button>
                <el-button size="small" :type="slide.is_active ? 'warning' : 'success'" @click="toggleSlide(slide)">
                  {{ slide.is_active ? '禁用' : '启用' }}
                </el-button>
                <el-button size="small" type="danger" @click="deleteSlide(slide)">删除</el-button>
              </div>
            </div>

            <div class="slide-card add-card" @click="showSlideDialog = true">
              <div class="add-icon">+</div>
              <span>添加轮播图</span>
            </div>
          </div>

          <!-- 轮播图编辑对话框 -->
          <el-dialog v-model="showSlideDialog" :title="editingSlide ? '编辑轮播图' : '添加轮播图'" width="520px">
            <el-form ref="slideFormRef" :model="slideForm" label-width="90px">
              <el-form-item label="图片" required>
                <div class="upload-area">
                  <el-input v-model="slideForm.image_url" placeholder="图片URL" style="flex:1" />
                  <el-upload
                    :action="uploadUrl"
                    :headers="uploadHeaders"
                    :show-file-list="false"
                    :on-success="handleUploadSuccess"
                    :on-error="() => ElMessage.error('上传失败')"
                    accept="image/*"
                    :limit="1"
                  >
                    <el-button size="small" type="primary">上传</el-button>
                  </el-upload>
                </div>
                <div v-if="slideForm.image_url" class="img-preview-sm">
                  <img :src="slideForm.image_url" alt="preview" @error="e => e.target.style.display='none'" />
                  <div class="img-remove" @click="slideForm.image_url = ''">×</div>
                </div>
              </el-form-item>
              <el-form-item label="标题">
                <el-input v-model="slideForm.title" placeholder="轮播标题" />
              </el-form-item>
              <el-form-item label="描述">
                <el-input v-model="slideForm.description" placeholder="轮播描述文字" type="textarea" :rows="2" />
              </el-form-item>
              <el-form-item label="标签">
                <el-input v-model="slideForm.tag" placeholder="如: AI前沿" />
              </el-form-item>
              <el-form-item label="链接">
                <el-input v-model="slideForm.link" placeholder="点击跳转链接" />
              </el-form-item>
              <el-form-item label="排序">
                <el-input-number v-model="slideForm.sort_order" :min="0" size="small" />
              </el-form-item>
            </el-form>
            <template #footer>
              <el-button @click="showSlideDialog = false">取消</el-button>
              <el-button type="primary" :loading="saving" @click="saveSlide">保存</el-button>
            </template>
          </el-dialog>
        </el-tab-pane>

        <!-- ===== 分类管理 ===== -->
        <el-tab-pane label="分类管理" name="categories">
          <div class="section-toolbar">
            <span class="section-count">共 {{ categories.length }} 个分类</span>
          </div>

          <el-table :data="categories" stripe style="width:100%">
            <el-table-column label="ID" prop="id" width="60" />
            <el-table-column label="名称" width="200">
              <template #default="{ row }">
                <el-input v-if="editingCatId === row.id" v-model="catEditForm.name" size="small" />
                <span v-else>{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column label="标识" prop="slug" width="160" />
            <el-table-column label="描述">
              <template #default="{ row }">
                <el-input v-if="editingCatId === row.id" v-model="catEditForm.description" size="small" />
                <span v-else>{{ row.description }}</span>
              </template>
            </el-table-column>
            <el-table-column label="排序" width="100">
              <template #default="{ row }">
                <el-input-number v-if="editingCatId === row.id" v-model="catEditForm.sort_order" :min="0" size="small" style="width:80px" />
                <span v-else>{{ row.sort_order }}</span>
              </template>
            </el-table-column>
            <el-table-column label="文章数" prop="article_count" width="80" />
            <el-table-column label="操作" width="240">
              <template #default="{ row }">
                <template v-if="editingCatId === row.id">
                  <el-button size="small" type="primary" :loading="catSaving" @click="saveCategory">保存</el-button>
                  <el-button size="small" @click="editingCatId = null">取消</el-button>
                </template>
                <template v-else>
                  <el-button size="small" @click="startEditCat(row)">编辑</el-button>
                  <el-button size="small" type="danger" @click="deleteCategory(row)">删除</el-button>
                </template>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '@/stores/app'

const TOKEN_KEY = 'admin_token'

const uploadUrl = computed(() => '/api/upload/image')
const uploadHeaders = computed(() => ({ Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` }))

// 登录状态
const isLoggedIn = ref(!!localStorage.getItem(TOKEN_KEY))
const loginLoading = ref(false)
const loginForm = reactive({ username: '', password: '' })

async function handleLogin() {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  loginLoading.value = true
  try {
    const res = await api.post('/admin/login', loginForm)
    if (res.data.code === 200) {
      localStorage.setItem(TOKEN_KEY, res.data.data.token)
      isLoggedIn.value = true
      ElMessage.success('登录成功')
      loadData()
    } else {
      ElMessage.error(res.data.message || '登录失败')
    }
  } catch (e) {
    ElMessage.error('登录失败: ' + (e.response?.data?.message || e.message))
  }
  loginLoading.value = false
}

function handleLogout() {
  localStorage.removeItem(TOKEN_KEY)
  isLoggedIn.value = false
  slides.value = []
  categories.value = []
}

// 带Token的API请求
function authApi() {
  const token = localStorage.getItem(TOKEN_KEY)
  return {
    get: (url) => api.get(url, { headers: { Authorization: `Bearer ${token}` } }),
    post: (url, data) => api.post(url, data, { headers: { Authorization: `Bearer ${token}` } }),
    put: (url, data) => api.put(url, data, { headers: { Authorization: `Bearer ${token}` } }),
    delete: (url) => api.delete(url, { headers: { Authorization: `Bearer ${token}` } })
  }
}

// ===== 轮播图管理 =====
const slides = ref([])

function handleUploadSuccess(res) {
  if (res.code === 200 && res.data?.url) {
    slideForm.image_url = res.data.url
    ElMessage.success('上传成功')
  } else {
    ElMessage.error(res.message || '上传失败')
  }
}
const showSlideDialog = ref(false)
const saving = ref(false)
const editingSlide = ref(null)
const slideForm = reactive({
  image_url: '', title: '', description: '', link: '', tag: '', sort_order: 0
})

async function loadSlides() {
  try {
    const res = await authApi().get('/carousel')
    if (res.data.code === 200) slides.value = res.data.data
  } catch (e) {
    if (e.response?.status !== 401) console.error(e)
  }
}

function editSlide(slide) {
  editingSlide.value = slide
  Object.assign(slideForm, {
    image_url: slide.image_url,
    title: slide.title || '',
    description: slide.description || '',
    link: slide.link || '',
    tag: slide.tag || '',
    sort_order: slide.sort_order ?? 0
  })
  showSlideDialog.value = true
}

async function saveSlide() {
  if (!slideForm.image_url) { ElMessage.warning('请输入图片地址'); return }
  saving.value = true
  try {
    if (editingSlide.value) {
      await authApi().put(`/carousel/${editingSlide.value.id}`, slideForm)
      ElMessage.success('更新成功')
    } else {
      await authApi().post('/carousel', slideForm)
      ElMessage.success('添加成功')
    }
    showSlideDialog.value = false
    resetSlideForm()
    await loadSlides()
  } catch (e) {
    ElMessage.error('操作失败: ' + (e.response?.data?.message || e.message))
  }
  saving.value = false
}

async function toggleSlide(slide) {
  try {
    await authApi().put(`/carousel/${slide.id}`, { is_active: slide.is_active ? 0 : 1 })
    ElMessage.success(slide.is_active ? '已禁用' : '已启用')
    await loadSlides()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

async function deleteSlide(slide) {
  try {
    await ElMessageBox.confirm(`确定删除轮播图"${slide.title || '未命名'}"？`, '确认删除')
    await authApi().delete(`/carousel/${slide.id}`)
    ElMessage.success('已删除')
    await loadSlides()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

function resetSlideForm() {
  editingSlide.value = null
  slideForm.image_url = ''
  slideForm.title = ''
  slideForm.description = ''
  slideForm.link = ''
  slideForm.tag = ''
  slideForm.sort_order = 0
}

// ===== 分类管理 =====
const categories = ref([])
const editingCatId = ref(null)
const catSaving = ref(false)
const catEditForm = reactive({ name: '', description: '', sort_order: 0 })

async function loadCategories() {
  try {
    const res = await api.get('/categories')
    if (res.data.code === 200) categories.value = res.data.data
  } catch (e) { console.error(e) }
}

function startEditCat(cat) {
  editingCatId.value = cat.id
  catEditForm.name = cat.name
  catEditForm.description = cat.description
  catEditForm.sort_order = cat.sort_order
}

async function saveCategory() {
  if (!catEditForm.name) { ElMessage.warning('分类名称不能为空'); return }
  catSaving.value = true
  try {
    await authApi().put(`/categories/${editingCatId.value}`, catEditForm)
    ElMessage.success('更新成功')
    editingCatId.value = null
    await loadCategories()
  } catch (e) {
    ElMessage.error('更新失败: ' + (e.response?.data?.message || e.message))
  }
  catSaving.value = false
}

async function deleteCategory(cat) {
  try {
    await ElMessageBox.confirm(`确定删除分类"${cat.name}"？该操作不可恢复。`, '确认删除', { type: 'warning' })
    await authApi().delete(`/categories/${cat.id}`)
    ElMessage.success('已删除')
    await loadCategories()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败: ' + (e.response?.data?.message || e.message))
  }
}

// ===== 初始化 =====
const activeTab = ref('carousel')

onMounted(() => {
  if (isLoggedIn.value) loadData()
})

function loadData() {
  loadSlides()
  loadCategories()
}
</script>

<style scoped>
.admin-page {
  max-width: 1100px;
}

.admin-login {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.login-card {
  width: 380px;
  padding: 40px;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
}

.login-title {
  text-align: center;
  margin-bottom: 28px;
  font-size: 22px;
  color: var(--color-foreground);
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.admin-header h2 {
  font-size: 22px;
  margin: 0;
  color: var(--color-foreground);
}

.admin-tabs {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--card-radius);
  padding: 20px;
}

.section-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-count {
  font-size: 13px;
  color: var(--color-muted-foreground);
}

/* 轮播图网格 */
.slide-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.slide-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.slide-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
}

.slide-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 1;
  background: #1a1a2e;
  overflow: hidden;
}

.slide-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.slide-order {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.6);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  border-radius: 8px;
  font-family: 'JetBrains Mono', monospace;
}

.slide-status {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 10px;
  background: rgba(255,255,255,0.15);
  color: rgba(255,255,255,0.6);
}

.slide-status.active {
  background: rgba(52,199,89,0.3);
  color: #34c759;
}

.slide-info {
  padding: 12px 14px 8px;
}

.slide-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-foreground);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.slide-desc {
  font-size: 12px;
  color: var(--color-muted-foreground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.slide-actions {
  padding: 8px 14px 12px;
  display: flex;
  gap: 6px;
}

.add-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  min-height: 200px;
  border: 2px dashed var(--color-border);
  color: var(--color-muted-foreground);
  font-size: 14px;
  transition: all 0.2s ease;
}

.add-card:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-accent);
}

.add-icon {
  font-size: 40px;
  font-weight: 300;
  line-height: 1;
}

.img-preview-sm {
  position: relative;
  margin-top: 6px;
  width: 120px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.img-preview-sm img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.img-remove {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ef4444;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  border-radius: 50%;
  cursor: pointer;
  line-height: 1;
}

.upload-area {
  display: flex;
  gap: 8px;
}
</style>
