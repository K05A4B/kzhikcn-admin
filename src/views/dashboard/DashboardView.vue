<script setup lang="ts">
import { computed } from 'vue'
import { apiv1 } from '@/api'
import { useFetch } from '@/composable'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { Book, CategoryManagement, TagOne, PreviewOpen, BookOpen, Setting, Agreement,
  Time, ArrowRight, Edit } from '@icon-park/vue-next'
import {
  NCard, NSpin, NEmpty, NButton, NText, NTag
} from 'naive-ui'

const router = useRouter()
const userStore = useUserStore()

// ── 三个独立请求，useFetch 管理各自的 loading/error ──
const {
  data: articlesData,
  loading: articlesLoading,
  error: articlesError,
  fetch: fetchArticles,
  response: articlesResp,
} = useFetch(
  () => apiv1.getArticles({ limit: 5, orderBy: 'publishedAt:desc' }),
  { showError: false },
)

const {
  loading: categoriesLoading,
  error: categoriesError,
  fetch: fetchCategories,
  response: categoriesResp,
} = useFetch(
  () => apiv1.getCategories({ limit: 1 }),
  { showError: false },
)

const {
  loading: tagsLoading,
  error: tagsError,
  fetch: fetchTags,
  response: tagsResp,
} = useFetch(
  () => apiv1.getTags({ limit: 1 }),
  { showError: false },
)

// ── 合并状态 ──
const loading = computed(() => articlesLoading.value || categoriesLoading.value || tagsLoading.value)
const error = computed(() => articlesError.value || categoriesError.value || tagsError.value)

const articleCount = computed(() => (articlesResp.value?.meta?.total as number) ?? 0)
const categoriesCount = computed(() => (categoriesResp.value?.meta?.total as number) ?? 0)
const tagsCount = computed(() => (tagsResp.value?.meta?.total as number) ?? 0)
const recentArticles = computed(() => articlesData.value ?? [])

// ── 时间问候 ──
function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 9) return '早上好'
  if (h < 12) return '上午好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
}

const greeting = computed(getGreeting)

const now = computed(() => {
  const d = new Date()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 周${weekdays[d.getDay()]}`
})

const username = computed(() => userStore?.userInfo?.username ?? '管理员')

// ── 相对时间 ──
function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.floor(diff / 3600000)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(diff / 86400000)
  if (days < 30) return `${days}天前`
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

// ── 状态标签 ──
function statusTag(status: string) {
  const map: Record<string, { type: 'success' | 'warning' | 'info' | 'default', label: string }> = {
    published: { type: 'success', label: '已发布' },
    draft: { type: 'warning', label: '草稿' },
    hidden: { type: 'info', label: '隐藏' },
  }
  return map[status] ?? { type: 'default' as const, label: status }
}

// ── 并发请求 ──
function reload() {
  Promise.all([fetchArticles(), fetchCategories(), fetchTags()])
}
reload()

// ── 快捷操作 ──
const quickActions = [
  { label: '文章管理', icon: BookOpen, color: '#1273eb', bg: 'rgba(18,115,235,0.08)', action: () => router.push('/content/articles') },
  { label: '管理分类', icon: CategoryManagement, color: '#10b981', bg: 'rgba(16,185,129,0.08)', action: () => router.push('/content/articles/categories') },
  { label: '管理标签', icon: TagOne, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', action: () => router.push('/content/articles/tags') },
  { label: '系统设置', icon: Setting, color: '#6366f1', bg: 'rgba(99,102,241,0.08)', action: () => router.push('/settings/general') },
]

// ── 统计卡片 ──
const statCards = computed(() => [
  {
    label: '文章总数',
    value: articleCount.value,
    icon: Book,
    color: '#1273eb',
    bg: `linear-gradient(135deg, rgba(18,115,235,0.10) 0%, rgba(18,115,235,0.02) 100%)`,
  },
  {
    label: '分类数',
    value: categoriesCount.value,
    icon: CategoryManagement,
    color: '#10b981',
    bg: `linear-gradient(135deg, rgba(16,185,129,0.10) 0%, rgba(16,185,129,0.02) 100%)`,
  },
  {
    label: '标签数',
    value: tagsCount.value,
    icon: TagOne,
    color: '#f59e0b',
    bg: `linear-gradient(135deg, rgba(245,158,11,0.10) 0%, rgba(245,158,11,0.02) 100%)`,
  },
  {
    label: '总浏览量',
    value: recentArticles.value.reduce((s, a) => s + a.views, 0).toLocaleString(),
    icon: PreviewOpen,
    color: '#6366f1',
    bg: `linear-gradient(135deg, rgba(99,102,241,0.10) 0%, rgba(99,102,241,0.02) 100%)`,
  },
])

</script>

<template>
  <div class="dashboard">
    <!-- 头部问候区 -->
    <header class="dashboard-header">
      <div class="greeting-area">
        <h1 class="greeting">{{ greeting }} 👋</h1>
        <p class="subtitle">欢迎回来，{{ username }}</p>
      </div>
      <div class="header-meta">
        <div class="date-badge">
          <Time class="date-icon" />
          <span>{{ now }}</span>
        </div>
      </div>
    </header>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <NSpin size="large" />
      <p class="loading-text">正在加载数据…</p>
    </div>

    <!-- 错误状态 -->
    <NCard v-else-if="error" class="error-card">
      <div class="error-state">
        <NText depth="3">数据加载失败，请检查网络连接后重试</NText>
        <NButton secondary size="small" @click="reload" style="margin-top: 12px;">
          重新加载
        </NButton>
      </div>
    </NCard>

    <!-- 主内容区 -->
    <template v-else>
      <!-- 统计卡片 -->
      <div class="stats-grid">
        <NCard v-for="card in statCards" :key="card.label" class="stat-card">
          <div class="stat-inner">
            <div class="stat-icon" :style="{ color: card.color, background: card.bg }">
              <component :is="card.icon" />
            </div>
            <div class="stat-body">
              <span class="stat-value">{{ card.value }}</span>
              <span class="stat-label">{{ card.label }}</span>
            </div>
          </div>
        </NCard>
      </div>

      <!-- 下部分内容 -->
      <div class="dashboard-panels">
        <!-- 最近文章 -->
        <NCard title="最近文章" class="recent-card">
          <template #header-extra>
            <NButton text size="small" @click="router.push('/content/articles')">
              查看全部
              <template #icon>
                <ArrowRight />
              </template>
            </NButton>
          </template>

          <div v-if="recentArticles.length === 0" class="empty-state">
            <NEmpty description="还没有文章">
              <template #extra>
                <NButton size="small" @click="router.push('/content/articles')">
                  写第一篇文章
                </NButton>
              </template>
            </NEmpty>
          </div>

          <div v-else class="article-list">
            <div
              v-for="(article, index) in recentArticles"
              :key="article.id"
              class="article-item"
              :class="{ 'is-last': index === recentArticles.length - 1 }"
              @click="router.push(`/article-editor/${article.id}`)"
            >
              <div class="article-item-main">
                <div class="article-title-row">
                  <Agreement class="article-icon" />
                  <span class="article-title">{{ article.title }}</span>
                  <NTag
                    :type="statusTag(article.status).type"
                    size="tiny"
                    style="margin-left: 8px; flex-shrink: 0;"
                  >
                    {{ statusTag(article.status).label }}
                  </NTag>
                </div>
                <div class="article-meta">
                  <span class="meta-time">{{ relativeTime(article.publishedAt || article.createdAt) }}</span>
                  <span class="meta-sep">·</span>
                  <span class="meta-views">{{ article.views }} 次浏览</span>
                </div>
              </div>
              <div class="article-arrow">
                <Edit />
              </div>
            </div>
          </div>
        </NCard>

        <!-- 快捷操作 -->
        <div class="quick-actions-panel">
          <NCard title="快捷操作" class="actions-card">
            <div class="actions-grid">
              <button
                v-for="action in quickActions"
                :key="action.label"
                class="action-btn"
                :style="{ '--accent': action.color, '--accent-bg': action.bg }"
                @click="action.action"
              >
                <div class="action-icon">
                  <component :is="action.icon" />
                </div>
                <span class="action-label">{{ action.label }}</span>
              </button>
            </div>
          </NCard>

          <!-- 小提示 / 系统状态 -->
          <NCard class="tip-card">
            <div class="tip-content">
              <span class="tip-text">提示：点击文章可直接进入编辑</span>
            </div>
          </NCard>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.dashboard {
  width: 100%;
  padding: 8px;
}

/* ── Header ── */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: var(--spacing-6);
}

.greeting-area {
  flex: 1;
}

.greeting {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.03em;
  line-height: 1.2;
  margin: 0 0 4px 0;
}

.subtitle {
  font-size: 15px;
  color: var(--color-text-secondary);
  margin: 0;
}

.header-meta {
  flex-shrink: 0;
}

.date-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-tertiary);
  padding: 6px 14px;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.date-icon {
  font-size: 15px;
}

/* ── Loading ── */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  gap: 16px;
}

.loading-text {
  color: var(--color-text-tertiary);
  font-size: 14px;
  margin: 0;
}

/* ── Error ── */
.error-card {
  margin-bottom: var(--spacing-6);
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
}

/* ── Stats Cards ── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

.stat-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: default;
}

.stat-icon {
  font-size: 24px;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.stat-label {
  font-size: 13px;
  color: var(--color-text-secondary);
}

/* ── Dashboard panels (2-column) ── */
.dashboard-panels {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: var(--spacing-6);
  align-items: start;
}

@media (max-width: 900px) {
  .dashboard-panels {
    grid-template-columns: 1fr;
  }
}

/* ── Recent Articles ── */
.recent-card {
  overflow: hidden;
}

.article-list {
  display: flex;
  flex-direction: column;
}

.article-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background var(--transition-fast);
  border-radius: var(--radius-sm);
  margin: 0 -8px;
  padding: 12px 8px;
}

.article-item:hover {
  background: var(--color-surface-hover);
}

.article-item.is-last {
  border-bottom: none;
}

.article-item-main {
  flex: 1;
  min-width: 0;
}

.article-title-row {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.article-icon {
  flex-shrink: 0;
  font-size: 16px;
  color: var(--color-text-tertiary);
  margin-right: 8px;
}

.article-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-left: 24px;
}

.meta-sep {
  opacity: 0.4;
}

.article-arrow {
  flex-shrink: 0;
  font-size: 14px;
  color: var(--color-text-tertiary);
  opacity: 0;
  transition: opacity var(--transition-fast);
  margin-left: 8px;
}

.article-item:hover .article-arrow {
  opacity: 1;
}

/* ── Quick Actions ── */
.quick-actions-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 12px;
  background: var(--accent-bg);
  border: 1px solid transparent;
  border-color: var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-family: inherit;
  font-size: 13px;
  color: var(--color-text-primary);
}

.action-btn:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.action-icon {
  font-size: 24px;
  color: var(--accent);
}

.action-label {
  font-weight: 500;
  white-space: nowrap;
}

/* ── Tip Card ── */
.tip-card {
  background: var(--color-surface-hover) !important;
}

.tip-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tip-text {
  font-size: 13px;
  color: var(--color-text-tertiary);
}

/* ── Empty State ── */
.empty-state {
  padding: 32px 0;
}

/* ── Dark mode tweaks ── */
[data-theme='dark'] .tip-card {
  background: var(--color-surface) !important;
}
</style>