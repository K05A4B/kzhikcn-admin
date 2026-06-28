<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useArticleEditor } from '@/composable'
import { usePanelStore } from '@/stores/panel'
import CategorySelect from '@/components/articles/CategorySelect.vue'
import ArticleStatusSelect from '@/components/articles/ArticleStatusSelect.vue'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import {
  NCard, NButton, NInput, NSpace, NSpin, NTag, NAlert, NDivider
} from 'naive-ui'
import { ArrowLeft, Save, Send } from '@icon-park/vue-next'

const route = useRoute()
const router = useRouter()
const panelStore = usePanelStore()

const articleId = route.params.articleId as string
const { article, title, content, loading, load, save, markDirty, loadError } = useArticleEditor(articleId)

onMounted(() => load())

const editorTheme = computed(() => panelStore.themeMode === 'dark' ? 'dark' : 'light')

async function handleSave() {
  await save()
}

async function handlePublish() {
  await save('published')
}

function goBack() {
  router.push('/content/articles')
}
</script>

<template>
  <div class="editor-page">
    <!-- 工具栏 -->
    <header class="editor-toolbar">
      <NButton text @click="goBack">
        <template #icon><ArrowLeft /></template>
        返回
      </NButton>

      <div class="toolbar-center">
        <NInput v-model:value="title" placeholder="输入文章标题…" class="title-input" size="large" @input="markDirty" />
      </div>

      <NSpace :size="8">
        <NButton secondary :loading="saving" @click="handleSave">
          <template #icon><Save /></template>
          保存草稿
        </NButton>
        <NButton type="primary" :loading="saving" @click="handlePublish">
          <template #icon><Send /></template>
          发布
        </NButton>
      </NSpace>
    </header>

    <!-- 加载态 -->
    <div v-if="loading" class="editor-loading">
      <NSpin size="large" />
    </div>

    <!-- 错误态 -->
    <NCard v-else-if="loadError" class="editor-error">
      <NAlert type="error" :bordered="false">文章加载失败，请检查文章是否存在</NAlert>
      <NButton secondary size="small" style="margin-top: 12px;" @click="load">重新加载</NButton>
    </NCard>

    <!-- 编辑器主体 -->
    <div v-else class="editor-body">
      <div class="editor-main">
        <MdEditor
          v-model="content"
          :theme="editorTheme"
          :toolbars="[
            'bold', 'italic', 'strikeThrough', '|',
            'title', 'quote', '|',
            'unorderedList', 'orderedList', '|',
            'link', 'image', 'table', 'code', '|',
            'preview', 'fullscreen',
          ]"
          language="zh-CN"
          style="height: 100%"
          @on-change="markDirty"
        />
      </div>

      <!-- 元数据侧边栏 -->
      <aside class="editor-sidebar">
        <NCard title="文章信息" size="small">
          <div class="meta-row">
            <span class="meta-label">状态</span>
            <ArticleStatusSelect @update="(s: string) => { if (article) article.status = s as any }" />
          </div>

          <NDivider style="margin: 12px 0;" />

          <div class="meta-row">
            <span class="meta-label">分类</span>
            <CategorySelect
              v-if="article"
              :category="article.category"
              @update:category="(c: any) => { if (article) article.category = c }"
            />
          </div>

          <NDivider style="margin: 12px 0;" />

          <div class="meta-row column">
            <span class="meta-label">自定义 ID</span>
            <NInput
              v-if="article"
              :value="article.customID"
              size="small"
              placeholder="自动生成"
              @update:value="(v: string) => { if (article) article.customID = v; markDirty() }"
            />
          </div>

          <NDivider style="margin: 12px 0;" />

          <div class="meta-row column">
            <span class="meta-label">描述</span>
            <NInput
              v-if="article"
              :value="article.description"
              type="textarea" size="small" :rows="3"
              placeholder="文章描述"
              @update:value="(v: string) => { if (article) article.description = v; markDirty() }"
            />
          </div>
        </NCard>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.editor-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--header-height) - 80px);
}

.editor-toolbar {
  display: flex; align-items: center; gap: 16px;
  padding-bottom: 16px; flex-shrink: 0;
}

.toolbar-center { flex: 1; min-width: 0; }

.title-input :deep(.n-input__input) {
  font-size: 20px; font-weight: 600;
}

.editor-loading {
  display: flex; align-items: center; justify-content: center; flex: 1;
}

.editor-error { margin: 40px auto; max-width: 400px; }

.editor-body {
  display: flex; gap: 16px; flex: 1; min-height: 0;
}

.editor-main {
  flex: 1; min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.editor-sidebar { width: 280px; flex-shrink: 0; }

.meta-row {
  display: flex; align-items: center; gap: 8px;
}
.meta-row.column { flex-direction: column; align-items: stretch; }

.meta-label {
  font-size: 13px; font-weight: 500;
  color: var(--color-text-secondary); white-space: nowrap;
}

@media (max-width: 900px) {
  .editor-sidebar { display: none; }
}
</style>
