<script setup lang="ts">
import { computed, h } from 'vue'
import { apiv1 } from '@/api'
import type { Tag } from '@/api/v1'
import { useFetch, usePagination } from '@/composable'
import { useMessage } from '@/composable/use_naiveui_discrete_api'
import EditableCell from '@/components/common/EditableCell.vue'
import {
  NCard, NButton, NPopconfirm, NPagination, NDataTable
} from 'naive-ui'
import type { DataTableColumn } from 'naive-ui'
import { Delete } from '@icon-park/vue-next'

const message = useMessage()
const pagination = usePagination(20)

const { loading, fetch: loadTags, response } = useFetch(
  () => apiv1.getTags({ page: pagination.page.value, limit: pagination.pageSize.value }),
)

async function fetchData() {
  await loadTags()
  const total = (response.value?.meta?.total as number) || 0
  pagination.setTotal(total)
}

pagination.onNotify(() => fetchData())
fetchData()

const tagList = computed<Tag[]>(() => response.value?.data ?? [])

// ── 更新标签名称 ──
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

// ── 删除 ──
async function handleDelete(id: number) {
  const { fetch: doDelete } = useFetch(
    () => apiv1.deleteTags([id]),
  )
  await doDelete()
  message.success('已删除')
  await fetchData()
}

// ── 表格列 ──
const columns: DataTableColumn<Tag>[] = [
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
    width: 100,
    render: (row) => h(
      NPopconfirm,
      { onPositiveClick: () => handleDelete(row.id) },
      {
        trigger: () => h(
          NButton,
          { size: 'tiny', secondary: true, type: 'error' },
          { icon: () => h(Delete) },
        ),
        default: () => `确定删除标签「${row.tagName}」？`,
      },
    ),
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
      </div>

      <div class="info-bar">
        <span class="info-text">标签在创建文章时自动生成，此处进行编辑和删除操作</span>
      </div>

      <NDataTable :columns="columns" :data="tagList" :loading="loading" :row-key="(row: Tag) => row.id" :bordered="true"
        single-line />

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
</style>