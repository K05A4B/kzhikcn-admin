<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { apiv1 } from '@/api'
import type { Category } from '@/api/v1'
import { useFetch, usePagination } from '@/composable'
import { useMessage } from '@/composable/use_naiveui_discrete_api'
import EditableCell from '@/components/common/EditableCell.vue'
import {
  NCard, NButton, NInput, NPopconfirm, NPagination, NDataTable, NModal, NForm, NFormItem, NFlex, NEmpty, NInputGroup, NCheckbox
} from 'naive-ui'
import type { DataTableColumn, DataTableRowKey } from 'naive-ui'
import { Plus, DeleteFive, Refresh, Right } from '@icon-park/vue-next'
import { useTabStore } from '@/stores/tab'

const tab = useTabStore()
const message = useMessage()
const pagination = usePagination(20)

const expr = ref<string | undefined>(undefined)
const searchInput = ref('')

const { loading, fetch: loadCategories, response } = useFetch(
  () => apiv1.getCategories({ page: pagination.page.value, limit: pagination.pageSize.value, expr: expr.value }),
)

async function fetchData() {
  await loadCategories()
  const total = (response.value?.meta?.total as number) || 0
  pagination.setTotal(total)
}

pagination.onNotify(() => fetchData())
fetchData()

const categoryList = computed(() => response.value?.data ?? [])

const checkedRowIds = ref<number[]>([])

function updateChecked(keys: DataTableRowKey[]) {
  checkedRowIds.value = keys as number[]
}

const allIds = computed(() => categoryList.value.map(v => v.id))

async function handlePatchDelete() {
  if (checkedRowIds.value.length === 0) {
    message.warning('请选择要删除的分类')
    return
  }

  const { fetch: doDelete } = useFetch(
    () => apiv1.deleteCategories(checkedRowIds.value),
  )
  await doDelete()
  message.success(`已删除 ${checkedRowIds.value.length} 个分类`)
  checkedRowIds.value = []
  await fetchData()
}

async function handleUpdate(id: number, field: 'categoryName' | 'description', value: string) {
  const { fetch: doUpdate } = useFetch(
    () => apiv1.updateCategory(String(id), { [field]: value || undefined }),
  )
  await doUpdate()
  message.success('已更新')
  await fetchData()
}

async function handleDelete(id: number) {
  const { fetch: doDelete } = useFetch(
    () => apiv1.deleteCategories([id]),
  )
  await doDelete()
  message.success('已删除')
  await fetchData()
}

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

function handleSearch() {
  expr.value = searchInput.value || undefined
  pagination.setPage(1)
  fetchData()
}

function handleRefresh() {
  fetchData()
}

function viewCategoryArticles(id: number, categoryName: string) {
  tab.openTab(`/content/articles/categories/${id}`, {
    position: 'currentNext',
    label: `@${id} [${categoryName}] 文章列表`,
  })
}

const columns: DataTableColumn<Category>[] = [
  {
    type: 'selection',
    width: 40,
  },
  {
    title: 'ID',
    key: 'id',
    width: 80,
    render: (row) => h('span', { class: 'mono text-xs text-tertiary' }, `@${row.id}`),
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
    width: 130,
    render: (row) => h('div', { style: 'display: inline-flex; gap: 4px; align-items: center;' }, [
      h(NButton, {
        size: 'tiny',
        secondary: true,
        title: '查看文章列表',
        onClick: () => viewCategoryArticles(row.id, row.categoryName),
      }, { icon: () => h(Right) }),
      h(
        NPopconfirm,
        { onPositiveClick: () => handleDelete(row.id) },
        {
          trigger: () => h(
            NButton,
            { size: 'tiny', type: 'error', secondary: true },
            { icon: () => h(DeleteFive) },
          ),
          default: () => `确定删除分类「${row.categoryName}」？`,
        },
      ),
    ]),
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
        <NSpace>
          <NButton @click="handleRefresh">
            <template #icon>
              <Refresh />
            </template>
          </NButton>
          <NButton type="primary" @click="showCreateModal = true">
            <template #icon>
              <Plus />
            </template>
            新建分类
          </NButton>
        </NSpace>
      </div>

      <div class="toolbar">
        <NFlex align="center" :wrap="false">
          <NCheckbox
            :checked="checkedRowIds.length === categoryList.length && categoryList.length > 0"
            :indeterminate="checkedRowIds.length > 0 && checkedRowIds.length < categoryList.length"
            @update:checked="v => checkedRowIds = v ? [...allIds] : []"
          />
          <NPopconfirm
            v-if="checkedRowIds.length > 0"
            @positive-click="handlePatchDelete"
          >
            <template #trigger>
              <NButton size="small" secondary type="error">
                <template #icon>
                  <DeleteFive />
                </template>
                删除选中 ({{ checkedRowIds.length }})
              </NButton>
            </template>
            确定删除选中的 {{ checkedRowIds.length }} 个分类？
          </NPopconfirm>

          <NInputGroup size="small" style="flex: 1; max-width: 100%;">
            <NInput size="small" v-model:value="searchInput" clearable placeholder="过滤表达式，如 id=1 或 categoryName='技术'" @keyup.enter="handleSearch" />
            <NButton type="primary" secondary size="small" @click="handleSearch">应用</NButton>
          </NInputGroup>
        </NFlex>
      </div>

      <NDataTable
        :columns="columns"
        :data="categoryList"
        :loading="loading"
        :row-key="(row: Category) => row.id"
        :checked-row-keys="checkedRowIds"
        @update:checked-row-keys="updateChecked"
        :bordered="true"
        single-line
      >
        <template #empty>
          <NEmpty description="暂无分类数据" />
        </template>
      </NDataTable>

      <div v-if="pagination.total.value > pagination.pageSize.value" class="pagination-wrap">
        <NPagination :page="pagination.page.value" :page-size="pagination.pageSize.value"
          :item-count="pagination.total.value" @update:page="pagination.setPage" />
      </div>
    </NCard>

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

.toolbar {
  margin-bottom: 12px;
}
</style>
