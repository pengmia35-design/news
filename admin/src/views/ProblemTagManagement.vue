<template>
  <div class="pt-mgmt">
    <div class="toolbar">
      <el-button type="primary" @click="openEdit(null, null)">新增顶级标签</el-button>
    </div>

    <el-table :data="tags" v-loading="loading" stripe row-key="id" style="margin-top: 16px">
      <el-table-column prop="name" label="名称" show-overflow-tooltip>
        <template #default="{ row }">
          <span :style="{ paddingLeft: row.parent_id ? '24px' : '0' }">{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="slug" label="标识" width="180" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.is_active ? 'success' : 'info'" size="small">{{ row.is_active ? '启用' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sort_order" label="排序" width="80" />
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button size="small" v-if="!row.parent_id" @click="openEdit(null, row.id)">添加子标签</el-button>
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" @click="handleToggle(row)">{{ row.is_active ? '禁用' : '启用' }}</el-button>
          <el-popconfirm title="确定删除？" @confirm="handleDelete(row.id)">
            <template #reference>
              <el-button size="small" type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="editVisible" :title="editing?.id ? '编辑标签' : '新增标签'" width="500px" :close-on-click-modal="false">
      <el-form :model="form" ref="formRef" label-width="80px">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" placeholder="标签名称" />
        </el-form-item>
        <el-form-item label="标识" required>
          <el-input v-model="form.slug" placeholder="URL 标识（英文）" />
        </el-form-item>
        <el-form-item label="父标签">
          <el-select v-model="form.parent_id" placeholder="无（顶级标签）" clearable :disabled="!!formParentId">
            <el-option v-for="t in parentTags" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" :min="0" />
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'
import { ElMessage } from 'element-plus'

const adminStore = useAdminStore()
const loading = ref(false)
const saving = ref(false)
const tags = ref([])
const editVisible = ref(false)
const editing = ref(null)
const formParentId = ref(null)
const form = reactive({ name: '', slug: '', parent_id: null, sort_order: 0 })
const formRef = ref(null)

const parentTags = computed(() => tags.value.filter(t => !t.parent_id))

onMounted(fetchTags)

async function fetchTags() {
  loading.value = true
  const res = await adminStore.fetchProblemTags()
  if (res.code === 200) {
    // 展开树形为扁平列表
    const arr = []
    function flatten(items) {
      for (const t of items) {
        arr.push({ id: t.id, name: t.name, slug: t.slug, parent_id: t.parent_id, sort_order: t.sort_order, is_active: t.is_active, children: t.children?.length || 0 })
        if (t.children && t.children.length > 0) flatten(t.children)
      }
    }
    flatten(res.data || [])
    tags.value = arr
  }
  loading.value = false
}

function openEdit(row, fixedParentId) {
  editing.value = row
  formParentId.value = fixedParentId || null
  if (row) {
    Object.assign(form, { name: row.name, slug: row.slug, parent_id: row.parent_id, sort_order: row.sort_order })
  } else {
    Object.assign(form, { name: '', slug: '', parent_id: fixedParentId || null, sort_order: 0 })
  }
  editVisible.value = true
}

async function handleSave() {
  if (!form.name || !form.slug) { ElMessage.error('名称和标识不能为空'); return }
  saving.value = true
  let res
  if (editing.value?.id) {
    res = await adminStore.updateProblemTag(editing.value.id, { ...form })
  } else {
    res = await adminStore.createProblemTag({ ...form })
  }
  saving.value = false
  if (res.code === 200) { editVisible.value = false; fetchTags(); ElMessage.success('保存成功') } else { ElMessage.error(res.message) }
}

async function handleToggle(row) {
  const res = await adminStore.toggleProblemTag(row.id)
  if (res.code === 200) { fetchTags(); ElMessage.success(res.message) } else { ElMessage.error(res.message) }
}

async function handleDelete(id) {
  const res = await adminStore.deleteProblemTag(id)
  if (res.code === 200) { fetchTags(); ElMessage.success('已删除') } else { ElMessage.error(res.message) }
}
</script>

<style scoped>
.pt-mgmt { height: 100%; }
.toolbar { margin-bottom: 8px; }
</style>
