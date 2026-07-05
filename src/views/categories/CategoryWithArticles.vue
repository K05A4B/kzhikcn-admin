<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { apiv1 } from '@/api'
import type { ArticleOrderBy, EditableArticle } from '@/api/v1'
import { useFetch, usePagination } from '@/composable'
import ArticleCard from '@/components/articles/ArticleCard.vue'
import { toArticleViews, type ArticleView } from '@/composable/use_article_card_state'
import { Edit, Refresh } from '@icon-park/vue-next'
import {
  NCard, NSpin, NEmpty, NGrid, NGi, NFlex, NPagination, NTag, NButton, NInputGroup, NInput, NSelect
} from 'naive-ui'
import { useTabStore } from '@/stores/tab'

const route = useRoute()
const tab = useTabStore()

const categoryId = route.params.categoryId as string
const pagination = usePagination(20)

const orderBy = ref<ArticleOrderBy | undefined>('createdAt:desc')
const expr = ref<string | undefined>(undefined)
const searchInput = ref('')

const { loading, fetch: loadData, response } = useFetch(
  () => apiv1.getCategoryArticles(categoryId, {
    page: pagination.page.value,
    limit: pagination.pageSize.value,
    orderBy: orderBy.value,
    expr: expr.value,
  }),
)

const categoryInfo = computed(() => response.value?.data ?? null)
const articles = computed<ArticleView[]>(() => {
  const raw = response.value?.data?.articles
  return raw ? toArticleViews(raw) : []
})

async function fetchData() {
  await loadData()
  const total = (response.value?.meta?.total as number) || 0
  pagination.setTotal(total)
}

pagination.onNotify(() => fetchData())
fetchData()

async function handleUpdate(id: string, options: EditableArticle) {
  const { fetch: doUpdate } = useFetch(
    () => apiv1.updateArticle(id, options),
  )
  await doUpdate()
  await fetchData()
}

function handleDelete() {
}

function handleSearch() {
  expr.value = searchInput.value || undefined
  pagination.setPage(1)
  fetchData()
}

function handleRefresh() {
  fetchData()
}

function navigateToEditor(id: string) {
  tab.openTab(`/article-editor/${id}`)
}

const orderByOptions = [
  { label: '创建时间', value: 'createdAt' },
  { label: '更新时间', value: 'updatedAt' },
  { label: '发布时间', value: 'publishedAt' },
  { label: '点赞数', value: 'likes' },
  { label: '浏览量', value: 'views' },
  { label: '创建时间（降序）', value: 'createdAt:desc' },
  { label: '更新时间（降序）', value: 'updatedAt:desc' },
  { label: '发布时间（降序）', value: 'publishedAt:desc' },
  { label: '点赞数（降序）', value: 'likes:desc' },
  { label: '浏览量（降序）', value: 'views:desc' },
]
</script>

<template>
  <div class="category-articles">
    <NCard class="main-card">
      <NFlex align="center" justify="space-between" class="info-header">
        <div>
          <NFlex align="center" gap="8">
            <h1 class="page-title">{{ categoryInfo?.categoryName || '加载中...' }}</h1>
            <NTag size="small" type="info" v-if="categoryInfo">{{ pagination.total.value }} 篇文章</NTag>
          </NFlex>
          <p class="page-desc" v-if="categoryInfo?.description">{{ categoryInfo.description }}</p>
        </div>
      </NFlex>
    </NCard>

    <NCard class="articles-card" style="margin-top: 8px;">
      <div class="toolbar">
        <NFlex align="center" :wrap="false" style="width: 100%;">
          <NButton @click="handleRefresh" size="small" quaternary circle>
            <template #icon>
              <Refresh />
            </template>
          </NButton>

          <NSelect
            :options="orderByOptions"
            :value="orderBy"
            @update:value="v => { orderBy = v; pagination.setPage(1); fetchData() }"
            size="small"
            style="max-width: 160px;"
          />

          <NInputGroup size="small" style="flex: 1; max-width: 100%;">
            <NInput
              size="small"
              v-model:value="searchInput"
              clearable
              placeholder="过滤表达式"
              @keyup.enter="handleSearch"
            />
            <NButton type="primary" secondary size="small" @click="handleSearch">应用</NButton>
          </NInputGroup>
        </NFlex>
      </div>

      <NSpin :show="loading">
        <NFlex>
          <NGrid x-gap="8" y-gap="8" cols="1 l:2 xl:3" responsive="screen" v-if="articles.length > 0">
            <NGi v-for="article in articles" :key="article.id">
              <ArticleCard
                :info="article"
                :show="['actionButtons']"
                @update="handleUpdate"
                @delete="handleDelete"
              >
                <template #action-buttons>
                  <NButton secondary size="small" @click="navigateToEditor(article.id)"
                    title="编辑文章" type="primary">
                    <Edit />
                  </NButton>
                </template>
              </ArticleCard>
            </NGi>
          </NGrid>
          <NEmpty style="width: 100%" v-else-if="!loading" description="无文章" />

          <NPagination
            v-if="pagination.total.value > pagination.pageSize.value"
            :page-size="pagination.pageSize.value"
            :item-count="pagination.total.value"
            @update:page="pagination.setPage"
            :page-sizes="[10, 20, 40, 50]"
            @update-page-size="pagination.setPageSize"
            show-size-picker
            style="width: 100%; justify-content: center;"
          />
        </NFlex>
      </NSpin>
    </NCard>
  </div>
</template>

<style scoped>
.category-articles {
  width: 100%;
}

.info-header {
  margin-bottom: 0;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
  letter-spacing: -0.02em;
}

.page-desc {
  font-size: 14px;
  color: var(--color-text-tertiary);
  margin: 4px 0 0 0;
}

.main-card {
  overflow: hidden;
}

.articles-card {
  overflow: hidden;
}

.toolbar {
  margin-bottom: 12px;
}
</style>
