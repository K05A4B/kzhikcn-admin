<script setup lang="ts">
import { NCard, NSpace, NTag, NInput, NButton } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'
import { useMessage } from '@/composable/use_naiveui_discrete_api'
import { Check, Close, Reload } from '@icon-park/vue-next'
import { ref } from 'vue'

const authStore = useAuthStore()
const userStore = useUserStore()
const message = useMessage()

const editing = ref(false)
const editValue = ref('')
const testing = ref(false)

function startEdit() {
  editValue.value = authStore.baseUrl || ''
  editing.value = true
}

function saveUrl() {
  const url = editValue.value.trim()
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    message.warning('Base URL 需以 http:// 或 https:// 开头')
    return
  }
  authStore.baseUrl = url || null
  editing.value = false
  message.success('Base URL 已更新')
}

function cancelEdit() {
  editing.value = false
}
</script>

<template>
  <div class="general-settings">
    <div class="page-header">
      <h1 class="page-title">通用设置</h1>
      <p class="page-desc">系统配置信息</p>
    </div>

    <NSpace vertical :size="16">
      <!-- API 连接 -->
      <NCard title="API 连接" class="setting-card">
        <div class="setting-row">
          <span class="setting-label">Base URL</span>
          <div class="setting-value-row">
            <template v-if="editing">
              <NInput
                v-model:value="editValue"
                size="small" placeholder="http://localhost:5083"
                style="width: 320px"
                @keyup.enter="saveUrl"
                @keyup.escape="cancelEdit"
              />
              <NButton size="tiny" type="primary" @click="saveUrl">保存</NButton>
              <NButton size="tiny" @click="cancelEdit">取消</NButton>
            </template>
            <template v-else>
              <code class="mono">{{ authStore.baseUrl || '未配置' }}</code>
              <NButton text size="tiny" style="margin-left: 8px;" @click="startEdit">修改</NButton>
            </template>
          </div>
        </div>
        <div class="setting-row">
          <span class="setting-label">连接状态</span>
          <div class="setting-value-row">
            <NTag :type="authStore.baseUrlConnected ? 'success' : 'error'" size="small">
              <template #icon>
                <component :is="authStore.baseUrlConnected ? Check : Close" />
              </template>
              {{ authStore.baseUrlConnected ? '已连接' : '未连接' }}
            </NTag>
            <NButton text size="tiny" style="margin-left: 8px;" :loading="testing" @click="authStore.testConnection">
              <template #icon><Reload /></template>
              测试连接
            </NButton>
          </div>
        </div>
        <div class="setting-row">
          <span class="setting-label">当前用户</span>
          <span class="setting-value">{{ userStore.userInfo?.username || '—' }}</span>
        </div>
      </NCard>

      <!-- 系统信息 -->
      <NCard title="系统信息" class="setting-card">
        <div class="setting-row">
          <span class="setting-label">前端框架</span>
          <span class="setting-value">Vue 3 + Naive UI</span>
        </div>
        <div class="setting-row">
          <span class="setting-label">构建工具</span>
          <span class="setting-value">Vite 8</span>
        </div>
        <div class="setting-row">
          <span class="setting-label">后端版本</span>
          <span class="setting-value">kzhikcn-api (Go)</span>
        </div>
      </NCard>
    </NSpace>
  </div>
</template>

<style scoped>
.general-settings { max-width: 1400px; }

.page-header { margin-bottom: var(--spacing-6); }
.page-title {
  font-size: 24px; font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 4px 0; letter-spacing: -0.02em;
}
.page-desc { font-size: 14px; color: var(--color-text-tertiary); margin: 0; }

.setting-card { overflow: hidden; }

.setting-row {
  display: flex; align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);
}
.setting-row:last-of-type { border-bottom: none; }

.setting-label {
  font-size: 14px; color: var(--color-text-primary); font-weight: 500;
}

.setting-value {
  font-size: 14px; color: var(--color-text-secondary);
}

.setting-value-row {
  display: flex; align-items: center; gap: 6px;
}

.mono {
  font-family: 'Ubuntu Mono', monospace;
  font-size: 13px;
  background: var(--color-surface-hover);
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>