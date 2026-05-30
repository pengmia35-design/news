<template>
  <div class="article-edit-page">
    <div class="page-header">
      <h2>{{ isEdit ? '编辑文章' : '新增文章' }}</h2>
    </div>

    <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
      <el-row :gutter="24">
        <el-col :span="16">
          <!-- 标题 -->
          <el-form-item label="标题" prop="title">
            <el-input v-model="form.title" placeholder="请输入文章标题" size="large" />
          </el-form-item>

          <!-- 摘要 -->
          <el-form-item label="摘要" prop="summary">
            <el-input
              v-model="form.summary"
              type="textarea"
              :rows="3"
              placeholder="文章摘要（可选）"
            />
          </el-form-item>

          <!-- 正文 -->
          <el-form-item label="正文" prop="content">
            <el-input
              v-model="form.content"
              type="textarea"
              :rows="16"
              placeholder="支持 Markdown 格式&#10;## 标题&#10;**加粗** *斜体*&#10;- 列表&#10;> 引用&#10;```代码```"
            />
          </el-form-item>
        </el-col>

        <el-col :span="8">
          <!-- 分类 -->
          <el-form-item label="分类" prop="category_id">
            <el-select v-model="form.category_id" placeholder="选择分类" style="width: 100%">
              <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
            </el-select>
          </el-form-item>

          <!-- 状态 -->
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="form.status">
              <el-radio value="draft">草稿</el-radio>
              <el-radio value="published">发布</el-radio>
            </el-radio-group>
          </el-form-item>

          <!-- 置顶 -->
          <el-form-item label="置顶">
            <el-switch v-model="form.is_featured" />
          </el-form-item>

          <!-- 来源名称 -->
          <el-form-item label="来源">
            <el-input v-model="form.source_name" placeholder="来源名称（可选）" />
          </el-form-item>

          <!-- 来源链接 -->
          <el-form-item label="来源链接">
            <el-input v-model="form.source_url" placeholder="原文链接（可选）" />
          </el-form-item>

          <!-- 封面图 -->
          <el-form-item label="封面图">
            <el-input v-model="form.cover_url" placeholder="封面图片URL（可选）" />
          </el-form-item>

          <!-- 标签 -->
          <el-form-item label="标签">
            <el-select
              v-model="form.tags"
              multiple
              filterable
              allow-create
              default-first-option
              placeholder="输入标签后回车"
              style="width: 100%"
            >
              <el-option v-for="tag in allTags" :key="tag.name" :label="tag.name" :value="tag.name" />
            </el-select>
          </el-form-item>

          <!-- 提交 -->
          <el-form-item>
            <el-button type="primary" :loading="submitting" @click="handleSubmit">
              {{ submitting ? '提交中...' : (isEdit ? '保存修改' : '创建文章') }}
            </el-button>
            <el-button @click="$router.back()">取消</el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <!-- 预览区 -->
    <el-card v-if="form.content" class="preview-card" header="Markdown 预览">
      <div class="preview-content article-content" v-html="renderedContent"></div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import { ElMessage } from 'element-plus'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()

const isEdit = computed(() => !!route.params.id)
const formRef = ref()
const submitting = ref(false)
const categories = ref([])
const allTags = ref([])

const form = reactive({
  title: '',
  summary: '',
  content: '',
  category_id: null,
  status: 'draft',
  is_featured: false,
  source_name: '',
  source_url: '',
  cover_url: '',
  tags: []
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入正文', trigger: 'blur' }]
}

marked.setOptions({ breaks: true, gfm: true })

const renderedContent = computed(() => {
  if (!form.content) return ''
  return DOMPurify.sanitize(marked(form.content))
})

onMounted(async () => {
  try {
    const catRes = await adminStore.fetchCategories()
    if (catRes.code === 200) categories.value = catRes.data

    const tagRes = await adminStore.fetchTags()
    if (tagRes.code === 200) allTags.value = tagRes.data
  } catch (e) { /* ignore */ }

  if (isEdit.value) {
    await loadArticle()
  }
})

async function loadArticle() {
  try {
    const res = await adminStore.fetchArticle(route.params.id)
    if (res.code === 200) {
      const a = res.data
      form.title = a.title
      form.summary = a.summary || ''
      form.content = a.content
      form.category_id = a.category_id
      form.status = a.status
      form.is_featured = !!a.is_featured
      form.source_name = a.source_name || ''
      form.source_url = a.source_url || ''
      form.cover_url = a.cover_url || ''
      form.tags = (a.tags || []).map(t => t.name)
    }
  } catch (e) {
    ElMessage.error('加载文章失败')
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (isEdit.value) {
      await adminStore.updateArticle(route.params.id, { ...form })
      ElMessage.success('文章更新成功')
    } else {
      await adminStore.createArticle({ ...form })
      ElMessage.success('文章创建成功')
    }
    router.push('/articles')
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '提交失败')
  }
  submitting.value = false
}
</script>

<style scoped>
.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-foreground);
  margin: 0;
}

.preview-card {
  margin-top: 24px;
}

.preview-content {
  padding: 16px;
  line-height: 1.8;
}
</style>
