<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { apiv1 } from '@/api'
import type { Tag } from '@/api/v1'
import { useFetch, usePagination } from '@/composable'
import { useMessage } from '@/composable/use_naiveui_discrete_api'
import EditableCell from '@/components/common/EditableCell.vue'
import {
  NCard, NButton, NPopconfirm, NPagination, NDataTable, NEmpty, NInputGroup, NInput, NCheckbox,
  NFlex
} from 'naive-ui'
import type { DataTableColumn, DataTableRowKey } from 'naive-ui'
import { DeleteFive, Refresh, Right } from '@icon-park/vue-next'
import { useTabStore } from '@/stores/tab'

const tab = useTabStore()
const message = useMessage()
const pagination = usePagination(20)

const expr = ref<string | undefined>(undefined)
const searchInput = ref('')

const { loading, fetch: loadTags, response } = useFetch(
  () => apiv1.getTags({ page: pagination.page.value, limit: pagination.pageSize.value, expr: expr.value }),
)

async function fetchData() {
  await loadTags()
  const total = (response.value?.meta?.total as number) || 0
  pagination.setTotal(total)
}

pagination.onNotify(() => fetchData())
fetchData()

const tagList = computed<Tag[]>(() => response.value?.data ?? [])

const checkedRowIds = ref<number[]>([])

function updateChecked(keys: DataTableRowKey[]) {
  checkedRowIds.value = keys as number[]
}

const allIds = computed(() => tagList.value.map(v => v.id))

async function handlePatchDelete() {
  if (checkedRowIds.value.length === 0) {
    message.warning('请选择要删除的标签')
    return
  }

  const { fetch: doDelete } = useFetch(
    () => apiv1.deleteTags(checkedRowIds.value),
  )
  await doDelete()
  message.success(`已删除 ${checkedRowIds.value.length} 个标签`)
  checkedRowIds.value = []
  await fetchData()
}

async function handleUpdate(id: number, value: string) {
  const name = value.trim()
  if (!name) { message.warning('标签名称不能为空'); return }

  const { fetch: doUpdate } = useFetch(
    () => apiv1.updateTag(String(id), { tagName: name }),
  )
  await doUpdate()
  message.success('已更新')
  await fetchData()
}

async function handleDelete(id: number) {
  const { fetch: doDelete } = useFetch(
    () => apiv1.deleteTags([id]),
  )
  await doDelete()
  message.success('已删除')
  await fetchData()
}

function handleSearch() {
  expr.value = searchInput.value || undefined
  pagination.setPage(1)
  fetchData()
}

function handleRefresh() {
  fetchData()
}

function viewTagArticles(id: number, tagName: string) {
  tab.openTab(`/content/articles/tags/${id}`, {
    position: 'currentNext',
    label: `#${id} [${tagName}] 文章列表`,
  })
}

const columns: DataTableColumn<Tag>[] = [
  {
    type: 'selection',
    width: 40,
  },
  {
    title: 'ID',
    key: 'id',
    width: 80,
    render: (row) => h('span', { class: 'mono text-xs text-tertiary' }, `#${row.id}`),
  },
  {
    title: '标签名称',
    key: 'tagName',
    width: 300,
    render: (row) => h(EditableCell, {
      value: row.tagName,
      emptyText: '点击设置名称',
      onUpdate: (v: string) => handleUpdate(row.id, v),
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
        onClick: () => viewTagArticles(row.id, row.tagName),
      }, { icon: () => h(Right) }),
      h(
        NPopconfirm,
        { onPositiveClick: () => handleDelete(row.id) },
        {
          trigger: () => h(
            NButton,
            { size: 'tiny', secondary: true, type: 'error' },
            { icon: () => h(DeleteFive) },
          ),
          default: () => `确定删除标签「${row.tagName}」？`,
        },
      ),
    ]),
  },
]
</script>

<template>
  <div class="tags-manager">
    <NCard class="main-card">
      <div class="page-header">
        <div>
          <h1 class="page-title">文章标签管理</h1>
          <p class="page-desc">共 {{ pagination.total.value }} 个标签</p>
        </div>
        <NButton @click="handleRefresh">
          <template #icon>
            <Refresh />
          </template>
        </NButton>
      </div>

      <div class="info-bar">
        <span class="info-text">标签在创建文章时自动生成，此处进行编辑和删除操作</span>
      </div>

      <div class="toolbar">
        <NFlex align="center" :wrap="false">
          <NCheckbox
            :checked="checkedRowIds.length === tagList.length && tagList.length > 0"
            :indeterminate="checkedRowIds.length > 0 && checkedRowIds.length < tagList.length"
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
            确定删除选中的 {{ checkedRowIds.length }} 个标签？
          </NPopconfirm>

          <NInputGroup size="small" style="width: 100%">
            <NInput v-model:value="searchInput" size="small" clearable placeholder="过滤表达式，如 id=1 或 tagName='技术'" @keyup.enter="handleSearch" />
            <NButton type="primary" secondary size="small" @click="handleSearch">应用</NButton>
          </NInputGroup>
        </NFlex>
      </div>

      <NDataTable
        :columns="columns"
        :data="tagList"
        :loading="loading"
        :row-key="(row: Tag) => row.id"
        :checked-row-keys="checkedRowIds"
        @update:checked-row-keys="updateChecked"
        :bordered="true"
        single-line
      >
        <template #empty>
          <NEmpty description="暂无标签数据" />
        </template>
      </NDataTable>

      <div v-if="pagination.total.value > pagination.pageSize.value" class="pagination-wrap">
        <NPagination :page="pagination.page.value" :page-size="pagination.pageSize.value"
          :item-count="pagination.total.value" @update:page="pagination.setPage" />
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.tags-manager {
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

.info-bar {
  padding: 10px 0 6px 0;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 12px;
}

.info-text {
  font-size: 13px;
  color: var(--color-text-tertiary);
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
