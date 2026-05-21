<template>
  <div class="qr-mgmt">
    <div class="toolbar">
      <el-select v-model="filters.category_id" placeholder="分类筛选" size="default" clearable style="width: 180px" @change="fetchList">
        <el-option v-for="t in flatTags" :key="t.id" :label="t.name" :value="t.id" />
      </el-select>
      <el-button type="primary" @click="openEdit(null)" style="margin-left: auto">新增快捷回复</el-button>
    </div>

    <el-table :data="list" v-loading="loading" stripe style="margin-top: 16px">
      <el-table-column prop="title" label="标题" width="180" />
      <el-table-column prop="content" label="回复内容" show-overflow-tooltip />
      <el-table-column prop="category_name" label="分类" width="120" />
      <el-table-column label="类型" width="100">
        <template #default="{ row }">
          <el-tag :type="row.is_public ? 'success' : 'info'" size="small">{{ row.is_public ? '公共模板' : '个人模板' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-popconfirm title="确定删除？" @confirm="handleDelete(row.id)">
            <template #reference>
              <el-button size="small" type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="editVisible" :title="editing?.id ? '编辑快捷回复' : '新增快捷回复'" width="550px" :close-on-click-modal="false">
      <el-form :model="form" ref="formRef" label-width="80px">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="模板标题" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category_id" placeholder="选择分类（可选）" clearable>
            <el-option v-for="t in flatTags" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="form.is_public">
            <el-radio :label="1">公共模板</el-radio>
            <el-radio :label="0">个人模板</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="回复内容" required>
          <el-input v-model="form.content" type="textarea" :rows="4" placeholder="回复话术内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'
import { ElMessage } from 'element-plus'

const adminStore = useAdminStore()
const loading = ref(false)
const saving = ref(false)
const list = ref([])
const flatTags = ref([])
const filters = reactive({ category_id: '' })
const editVisible = ref(false)
const editing = ref(null)
const form = reactive({ title: '', content: '', category_id: null, is_public: 1 })
const formRef = ref(null)

onMounted(async () => {
  await loadTags()
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

async function fetchList() {
  loading.value = true
  const res = await adminStore.fetchQuickReplies({ category_id: filters.category_id || undefined })
  if (res.code === 200) list.value = res.data || []
  loading.value = false
}

function openEdit(row) {
  editing.value = row
  if (row) {
    Object.assign(form, { title: row.title, content: row.content, category_id: row.category_id, is_public: row.is_public })
  } else {
    Object.assign(form, { title: '', content: '', category_id: null, is_public: 1 })
  }
  editVisible.value = true
}

async function handleSave() {
  if (!form.title || !form.content) { ElMessage.error('标题和内容不能为空'); return }
  saving.value = true
  let res
  if (editing.value?.id) {
    res = await adminStore.updateQuickReply(editing.value.id, { ...form })
  } else {
    res = await adminStore.createQuickReply({ ...form })
  }
  saving.value = false
  if (res.code === 200) { editVisible.value = false; fetchList(); ElMessage.success('保存成功') } else { ElMessage.error(res.message) }
}

async function handleDelete(id) {
  const res = await adminStore.deleteQuickReply(id)
  if (res.code === 200) { fetchList(); ElMessage.success('已删除') } else { ElMessage.error(res.message) }
}
</script>

<style scoped>
.qr-mgmt { height: 100%; }
.toolbar { display: flex; align-items: center; margin-bottom: 8px; }
</style>
