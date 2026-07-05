<script setup lang="ts">
import { ref, watch, computed, h } from 'vue'
import {
  NDrawer, NDrawerContent, NDataTable, NButton, NPopconfirm,
  NSpin, NEmpty, NInput, NSpace,
} from 'naive-ui'
import { UploadOne } from '@icon-park/vue-next'
import { useFetch, useMessage } from '@/composable'
import { apiv1 } from '@/api'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  show: boolean
  articleId: string
}>()

const emit = defineEmits<{
  (e: 'update:show', val: boolean): void
}>()

const message = useMessage()
const authStore = useAuthStore()

// ── 资源列表 ──
const {
  data: assets,
  loading,
  fetch: fetchAssets,
} = useFetch(() => apiv1.listArticleAssets(props.articleId), { showError: false })

watch(() => props.show, (val) => {
  if (val) fetchAssets()
})

const assetList = computed(() => (assets.value ?? []).map(name => ({ name })))

// ── 上传 ──
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const pendingFile = ref<File | null>(null)
const pendingFileName = ref('')

function triggerUpload() {
  fileInput.value?.click()
}

function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // 记住文件，等待用户确认文件名
  pendingFile.value = file
  pendingFileName.value = file.name
  input.value = ''
}

function cancelPending() {
  pendingFile.value = null
  pendingFileName.value = ''
}

async function confirmUpload() {
  const file = pendingFile.value
  if (!file || !pendingFileName.value.trim()) return

  const name = pendingFileName.value.trim()
  const renamed = new File([file], name, { type: file.type })

  uploading.value = true
  pendingFile.value = null

  try {
    const { fetch: doUpload } = useFetch(() => apiv1.uploadArticleAsset(props.articleId, renamed))
    await doUpload()
    message.success('上传成功')
    fetchAssets()
  } catch {
    message.error('上传失败')
  } finally {
    uploading.value = false
    pendingFileName.value = ''
  }
}

// ── 删除 ──
async function handleDelete(name: string) {
  const { fetch: doDelete } = useFetch(() => apiv1.deleteArticleAsset(props.articleId, name))
  try {
    await doDelete()
    message.success('已删除')
    fetchAssets()
  } catch {
    message.error('删除失败')
  }
}

// ── 复制 URL ──
function copyUrl(name: string) {
  const baseUrl = authStore.baseUrl ?? window.location.origin
  const url = `${baseUrl.replace(/\/+$/, '')}/v1/articles/${props.articleId}/assets/${name}`
  navigator.clipboard.writeText(url).then(() => {
    message.success('已复制链接')
  })
}

// ── 表格列定义 ──
const columns = [
  {
    title: '文件名',
    key: 'name',
    ellipsis: true,
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render(row: { name: string }) {
      return [
        h(
          NButton,
          {
            size: 'small',
            tertiary: true,
            type: 'primary',
            onClick: () => copyUrl(row.name),
          },
          { default: () => '复制链接' },
        ),
        ' ',
        h(
          NPopconfirm,
          {
            onPositiveClick: () => handleDelete(row.name),
          },
          {
            trigger: () => h(
              NButton,
              { size: 'small', tertiary: true, type: 'error' },
              { default: () => '删除' },
            ),
            default: () => '确定要删除此资源吗？',
          },
        ),
      ]
    },
  },
]
</script>

<template>
  <NDrawer
    :show="show"
    :width="600"
    @update:show="val => emit('update:show', val)"
  >
    <NDrawerContent title="文章资源管理" closable>
      <div class="asset-manager">
        <div class="upload-area">
          <input
            ref="fileInput"
            type="file"
            style="display: none"
            @change="onFileSelected"
          />
          <div v-if="pendingFile" class="upload-form">
            <NInput
              v-model:value="pendingFileName"
              placeholder="输入文件名"
              size="small"
              clearable
            />
            <NSpace>
              <NButton size="small" @click="cancelPending">取消</NButton>
              <NButton
                size="small"
                type="primary"
                :loading="uploading"
                @click="confirmUpload"
              >
                确认上传
              </NButton>
            </NSpace>
          </div>
          <NButton
            v-else
            type="primary"
            :loading="uploading"
            @click="triggerUpload"
          >
            <template #icon><UploadOne /></template>
            上传资源
          </NButton>
        </div>

        <div class="table-area">
          <NSpin :show="loading">
            <NEmpty
              v-if="!loading && (!assets || assets.length === 0)"
              description="暂无资源"
            />
            <NDataTable
              v-else
              :columns="columns"
              :data="assetList"
              :loading="loading"
              :bordered="false"
              :single-line="true"
              size="small"
            />
          </NSpin>
        </div>
      </div>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped>
.asset-manager {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.upload-area {
  flex-shrink: 0;
}

.upload-form {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-area {
  flex: 1;
  min-height: 0;
}
</style>
