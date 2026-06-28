<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { apiv1 } from '@/api'
import type { Category } from '@/api/v1'
import { useFetch, usePagination } from '@/composable'
import { useMessage } from '@/composable/use_naiveui_discrete_api'
import EditableCell from '@/components/common/EditableCell.vue'
import {
  NCard, NButton, NInput, NPopconfirm, NPagination, NDataTable, NModal, NForm, NFormItem, NSpace
} from 'naive-ui'
import type { DataTableColumn } from 'naive-ui'
import { Plus, Delete } from '@icon-park/vue-next'

const message = useMessage()
const pagination = usePagination(20)

const { loading, fetch: loadCategories, response } = useFetch(
  () => apiv1.getCategories({ page: pagination.page.value, limit: pagination.pageSize.value }),
)

async function fetchData() {
  await loadCategories()
  const total = (response.value?.meta?.total as number) || 0
  pagination.setTotal(total)
}

pagination.onNotify(() => fetchData())
fetchData()

const categoryList = computed(() => response.value?.data ?? [])

// ── 更新字段 ──
async function handleUpdate(id: number, field: 'categoryName' | 'description', value: string) {
  const { fetch: doUpdate } = useFetch(
    () => apiv1.updateCategory(String(id), { [field]: value || undefined }),
  )
  await doUpdate()
  message.success('已更新')
  await fetchData()
}

// ── 删除 ──
async function handleDelete(id: number) {
  const { fetch: doDelete } = useFetch(
    () => apiv1.deleteCategories([id]),
  )
  await doDelete()
  message.success('已删除')
  await fetchData()
}

// ── 创建 ──
const showCreateModal = ref(false)
const createForm = ref({ categoryName: '', description: '' })
const creating = ref(false)

async function handleCreate() {
  const name = createForm.value.categoryName.trim()
  if (!name) { message.warning('请输入分类名称'); return }

  const { fetch: doCreate } = useFetch(
    () => apiv1.createCategory({
      categoryName: name,
      description: createForm.value.description.trim() || undefined,
    }),
  )
  creating.value = true
  try {
    await doCreate()
    message.success('分类已创建')
    showCreateModal.value = false
    createForm.value = { categoryName: '', description: '' }
    await fetchData()
  } finally {
    creating.value = false
  }
}

// ── 表格列 ──
const columns: DataTableColumn<Category>[] = [
  {
    title: 'ID',
    key: 'id',
    width: 80,
    render: (row) => h('span', { class: 'mono text-xs text-tertiary' }, `#${row.id}`),
  },
  {
    title: '分类名称',
    key: 'categoryName',
    width: 260,
    render: (row) => h(EditableCell, {
      value: row.categoryName,
      emptyText: '点击设置名称',
      onUpdate: (v: string) => handleUpdate(row.id, 'categoryName', v),
    }),
  },
  {
    title: '描述',
    key: 'description',
    render: (row) => h(EditableCell, {
      value: row.description,
      emptyText: '点击设置描述',
      onUpdate: (v: string) => handleUpdate(row.id, 'description', v),
    }),
  },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    render: (row) => h(
      NPopconfirm,
      { onPositiveClick: () => handleDelete(row.id) },
      {
        trigger: () => h(
          NButton,
          { size: 'small', quaternary: true, circle: true },
          { icon: () => h(Delete) },
        ),
        default: () => `确定删除分类「${row.categoryName}」？`,
      },
    ),
  },
]
</script>

<template>
  <div class="categories-manager">
    <NCard class="main-card">
      <div class="page-header">
        <div>
          <h1 class="page-title">文章分类管理</h1>
          <p class="page-desc">共 {{ pagination.total.value }} 个分类</p>
        </div>
        <NButton type="primary" @click="showCreateModal = true">
          <template #icon>
            <Plus />
          </template>
          新建分类
        </NButton>
      </div>

      <NDataTable :columns="columns" :data="categoryList" :loading="loading" :row-key="(row: Category) => row.id"
        :bordered="true" single-line />

      <div v-if="pagination.total.value > pagination.pageSize.value" class="pagination-wrap">
        <NPagination :page="pagination.page.value" :page-size="pagination.pageSize.value"
          :item-count="pagination.total.value" @update:page="pagination.setPage" />
      </div>
    </NCard>

    <!-- 创建弹窗 -->
    <NModal v-model:show="showCreateModal" title="新建分类" :mask-closable="false" preset="card" style="max-width: 460px;"
      :bordered="false">
      <NForm>
        <NFormItem label="分类名称">
          <NInput v-model:value="createForm.categoryName" placeholder="请输入分类名称" @keyup.enter="handleCreate" />
        </NFormItem>
        <NFormItem label="分类描述">
          <NInput v-model:value="createForm.description" placeholder="分类描述（可选）" type="textarea" :rows="2" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showCreateModal = false">取消</NButton>
          <NButton type="primary" :loading="creating" @click="handleCreate">创建</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.categories-manager {
  width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-2);
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 4px 0;
  letter-spacing: -0.02em;
}

.page-desc {
  font-size: 14px;
  color: var(--color-text-tertiary);
  margin: 0;
}

.main-card {
  overflow: hidden;
}

.mono {
  font-family: 'Ubuntu Mono', monospace;
}

.text-xs {
  font-size: 12px;
}

.text-tertiary {
  color: var(--color-text-tertiary);
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
  margin-top: 12px;
}
</style>