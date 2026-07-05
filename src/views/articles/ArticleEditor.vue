<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, useTemplateRef } from 'vue'
import { useRoute } from 'vue-router'
import { useArticleEditor } from '@/composable'
import { usePanelStore } from '@/stores/panel'
import { useAuthStore } from '@/stores/auth'
import { useFetch, useMessage } from '@/composable'
import ArticleCard from '@/components/articles/ArticleCard.vue'
import ArticleAssetManager from '@/components/articles/ArticleAssetManager.vue'
import type { ArticleView } from '@/composable/use_article_card_state'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { NCard, NButton, NInput, NSpin, NAlert, NCollapse, NCollapseItem } from 'naive-ui'
import { Save, Send, FullScreen } from '@icon-park/vue-next'
import type { EditableArticle } from '@/api/v1'
import { apiv1 } from '@/api'

const route = useRoute()
const panelStore = usePanelStore()
const message = useMessage()

const articleId = route.params.articleId as string
const showAssetDrawer = ref(false)
const { article, title, content, loading, saving, load, save, markDirty, loadError, isDirty } = useArticleEditor(articleId)

// ── 自动保存 (60s 间隔) ──
const autoSaveInterval = 60
const countdown = ref(autoSaveInterval)
let autoSaveTimer: ReturnType<typeof setInterval> | null = null
let countdownTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  load()
  startAutoSave()
})

onUnmounted(() => {
  stopAutoSave()
  stopCountdown()
})

function startAutoSave() {
  if (autoSaveTimer !== null) return
  autoSaveTimer = setInterval(async () => {
    if (isDirty.value && !saving.value) {
      await save(undefined, true)
      resetCountdown()
    }
  }, autoSaveInterval * 1000)
}

function stopAutoSave() {
  if (autoSaveTimer !== null) {
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
}

// ── 倒计时 ──
function startCountdown() {
  stopCountdown()
  countdown.value = autoSaveInterval
  countdownTimer = setInterval(() => {
    if (isDirty.value && !saving.value && countdown.value > 0) {
      countdown.value--
    }
  }, 1000)
}

function stopCountdown() {
  if (countdownTimer !== null) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

function resetCountdown() {
  countdown.value = autoSaveInterval
}

watch(isDirty, (val) => {
  if (val) {
    startCountdown()
  } else {
    stopCountdown()
    countdown.value = autoSaveInterval
  }
})

// ── 手动发布 ──
async function handlePublish() {
  await save('published')
}

// ── 将 Article 适配为 ArticleView（供 ArticleCard 使用） ──
// 用 ref + watch 而非 computed，以便在请求期间保持 $state 加载标记
const articleView = ref<ArticleView | null>(null)

watch(article, (a) => {
  if (!a) {
    articleView.value = null
    return
  }
  articleView.value = {
    ...a,
    $state: {
      checked: false,
      loadings: {
        delete: false,
        updates: {
          status: false, title: false, description: false,
          customID: false, category: false, coverImage: false,
          tags: false, enableComment: false, restore: false,
        },
      },
    },
  }
}, { immediate: true })

// ── ArticleCard 的字段更新 → 显示加载动画 → 保存 ──
function handleCardUpdate(_id: string, options: EditableArticle) {
  const view = articleView.value
  if (!view) return

  // 标记对应字段加载中
  const keys = Object.keys(options) as (keyof EditableArticle)[]
  for (const key of keys) {
    if (key in view.$state.loadings.updates) {
      (view.$state.loadings.updates as Record<string, boolean>)[key] = true
    }
  }

  const { fetch: doUpdate, data } = useFetch(() => apiv1.updateArticle(articleId, options))
  doUpdate()
    .then(() => {
      message.success('已更新')
      if (data.value) article.value = data.value
    })
    .catch(() => {})
    .finally(() => {
      // 请求结束清除加载标记
      for (const key of keys) {
        if (key in view.$state.loadings.updates) {
          (view.$state.loadings.updates as Record<string, boolean>)[key] = false
        }
      }
    })
}

const editorTheme = computed(() => panelStore.themeMode === 'dark' ? 'dark' : 'light')
const authStore = useAuthStore()

// ── 插入图片 ──
async function handleUploadImg(files: File[], callback: (urls: string[]) => void) {
  try {
    const urls: string[] = []
    for (const file of files) {
      const { fetch: doUpload, data: uploadData } = useFetch(
        () => apiv1.uploadArticleAsset(articleId, file),
        { showError: false },
      )
      await doUpload()
      const filename = uploadData.value
      if (filename) {
        const baseUrl = authStore.baseUrl ?? window.location.origin
        urls.push(`${baseUrl.replace(/\/+$/, '')}/v1/articles/${articleId}/assets/${filename}`)
      }
    }
    callback(urls)
    message.success('图片上传成功')
  } catch {
    message.error('图片上传失败')
  }
}

// ── 全屏 ──
const editorPageRef = useTemplateRef<HTMLElement>('editorPageRef')
const isFullscreen = ref(false)

async function toggleFullscreen() {
  if (!document.fullscreenElement) {
    await editorPageRef.value?.requestFullscreen()
  } else {
    await document.exitFullscreen()
  }
}

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

function handleKeyUp(e: KeyboardEvent) {
  if (e.key === 's' && e.ctrlKey) {
    save()
  }
}

onMounted(() => {
  document.addEventListener('fullscreenchange', onFullscreenChange)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})
</script>

<template>
  <div ref="editorPageRef" @keyup="handleKeyUp" class="editor-page" :class="{ 'is-fullscreen': isFullscreen }">
    <!-- 加载态 -->
    <div v-if="loading" class="editor-loading">
      <NSpin size="large" />
    </div>

    <!-- 错误态 -->
    <NCard v-else-if="loadError" class="editor-error">
      <NAlert type="error" :bordered="false">文章加载失败</NAlert>
      <NButton secondary size="small" style="margin-top: 12px;" @click="load">重新加载</NButton>
    </NCard>

    <!-- 编辑器主体 -->
    <div v-else class="editor-body">
      <div class="editor-main">
        <!-- 标题 + 操作栏 -->
        <div class="editor-header">
          <NInput
            v-model:value="title"
            placeholder="输入文章标题…"
            class="title-input"
            size="large"
            @input="markDirty"
          />
          <div class="editor-actions">
            <div class="save-status" @click="countdown = 60">
              <span
                class="status-dot"
                :class="{ dirty: isDirty, saving }"
              />
              {{ saving ? '保存中…' : isDirty ? `${countdown}s 后自动保存` : '已保存' }}
            </div>
            <NButton
              secondary
              size="small"
              :loading="saving"
              @click="handlePublish"
            >
              <template #icon><Send /></template>
              保存并发布
            </NButton>

            <NButton
              secondary
              size="small"
              type="primary"
              :loading="saving"
              @click="() => save()"
            >
            <template #icon><Save /></template>
            保存
            </NButton>

            <NButton
              secondary
              size="small"
              @click="toggleFullscreen"
            >
              <template #icon><FullScreen /></template>
            </NButton>
          </div>
        </div>

        <!-- Markdown 编辑器 -->
        <div class="editor-content">
          <MdEditor
            v-model="content"
            :theme="editorTheme"
            :toolbars="[
              'bold', 'italic', 'strikeThrough', '-',
              'title', 'quote', '-',
              'unorderedList', 'orderedList', '-',
              'link', 'image', 'table', 'code', '-',
              'preview',
            ]"
            language="zh-CN"
            style="height: 100%"
            @on-change="markDirty"
            @on-upload-img="handleUploadImg"
          />
        </div>

        <!-- 元数据折叠面板 -->
        <NCollapse class="editor-footer" :default-expanded-names="[]" display-directive="show">
          <NCollapseItem name="metadata" title="文章信息">
            <ArticleCard
              v-if="articleView"
              :info="articleView"
              :show="['actionButtons']"
              :disabled="false"
              :bordered="false"
              @update="handleCardUpdate"
            >
              <template #action-buttons>
                <NButton style="margin-top: 8px;" type="primary" secondary block size="small" @click="showAssetDrawer = true">打开文章资源管理器</NButton>
              </template>
            </ArticleCard>
          </NCollapseItem>
        </NCollapse>
      </div>
    </div>
  </div>

  <!-- 资源管理器抽屉 -->
  <ArticleAssetManager
    v-model:show="showAssetDrawer"
    :article-id="articleId"
  />
</template>

<style scoped>
.editor-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--header-height) - 80px);
}

.editor-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.editor-error {
  margin: 40px auto;
  max-width: 400px;
}

.editor-body {
  flex: 1;
  min-height: 0;
}

.editor-main {
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

/* ── 标题区域 ── */
.editor-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.title-input {
  flex: 1;
  min-width: 0;
}

.title-input :deep(.n-input__input) {
  font-size: 20px;
  font-weight: 600;
}

.editor-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

/* ── 保存状态指示器 ── */
.save-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-tertiary);
  white-space: nowrap;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-success, #18a058);
  transition: background var(--transition-fast);
}

.status-dot.dirty {
  background: var(--color-warning, #f0a020);
}

.status-dot.saving {
  background: var(--color-info, #2080f0);
  animation: dot-pulse 1s ease-in-out infinite;
}

@keyframes dot-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ── 编辑器内容区 ── */
.editor-content {
  flex: 1;
  min-height: 0;
}

/* ── 元数据折叠面板 ── */
.editor-footer {
  flex-shrink: 0;
  border-top: 1px solid var(--color-border);
}

.editor-footer :deep(.n-collapse-item__content-inner) {
  max-height: 360px;
  overflow-y: auto;
}

/* ── 全屏模式 ── */
.editor-page.is-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 1000;
  height: 100vh;
  background: var(--color-bg);
  padding: 16px;
}

.editor-page.is-fullscreen .editor-main {
  height: 100%;
}
</style>
