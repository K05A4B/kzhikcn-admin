<script setup lang="ts">
import { reactive, watch, ref } from 'vue'
import { apiv1 } from '@/api'
import { useFetch } from '@/composable'
import { useMessage } from '@/composable/use_naiveui_discrete_api'
import { useUserStore } from '@/stores/user'
import EditableCell from '@/components/common/EditableCell.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import MFASettings from '@/components/settings/MFASettings.vue'
import {
  NCard, NButton, NInput, NForm, NFormItem, NDivider, NSpace, NModal
} from 'naive-ui'

const message = useMessage()
const userStore = useUserStore()

// ── 用户信息 ──
const profile = reactive({ username: '', email: '', avatar: '' })

watch(() => userStore.userInfo, (info) => {
  if (info) {
    profile.username = info.username
    profile.email = info.email
    profile.avatar = info.avatar
  }
}, { immediate: true })

// ── 更新字段 ──
async function updateField(field: 'username' | 'email' | 'avatar', value: string) {
  const { fetch: doUpdate } = useFetch(
    () => apiv1.updateUserInfo({ [field]: value || undefined }),
  )
  await doUpdate()
  message.success('已更新')
  userStore.fetch()
}

// ── 修改密码 ──
const pwd = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const showPwdModal = ref(false)

const { loading: changingPwd, fetch: changePwd } = useFetch(
  () => apiv1.changePassword(pwd.oldPassword, pwd.newPassword),
  { errorMessageFormat: (err) => `修改密码失败: ${err}` },
)

async function handleChangePassword() {
  if (!pwd.oldPassword || !pwd.newPassword) { message.warning('请填完整'); return }
  if (pwd.newPassword !== pwd.confirmPassword) { message.warning('两次密码不一致'); return }
  if (pwd.newPassword.length < 6) { message.warning('密码至少6位'); return }

  await changePwd()
  message.success('密码已修改')
  showPwdModal.value = false
  pwd.oldPassword = ''; pwd.newPassword = ''; pwd.confirmPassword = ''
}

</script>

<template>
  <div class="profile-settings">
    <!-- 用户资料卡片 -->
    <NCard class="profile-card">
      <div class="page-header">
        <h1 class="page-title">资料管理</h1>
        <p class="page-desc">点击字段内容直接编辑</p>
      </div>

      <div class="profile-header">
        <UserAvatar :size="74" :info="userStore.userInfo ?? undefined" />
        <div class="profile-headline">
          <div class="profile-name">{{ profile.username || '用户' }}</div>
          <div class="profile-role">管理员</div>
        </div>
      </div>

      <NDivider style="margin: 16px 0;" />

      <div class="detail-list">
        <div class="detail-row">
          <span class="detail-label">用户名</span>
          <div class="detail-value">
            <EditableCell :value="profile.username" empty-text="点击设置用户名"
              @update="(v: string) => updateField('username', v)" />
          </div>
        </div>
        <div class="detail-row">
          <span class="detail-label">邮箱</span>
          <div class="detail-value">
            <EditableCell :value="profile.email" empty-text="点击设置邮箱" @update="(v: string) => updateField('email', v)" />
          </div>
        </div>
        <div class="detail-row">
          <span class="detail-label">头像 URL</span>
          <div class="detail-value">
            <EditableCell :value="profile.avatar" empty-text="点击设置头像链接"
              @update="(v: string) => updateField('avatar', v)" />
          </div>
        </div>
        <div class="detail-row">
          <span class="detail-label">密码</span>
          <div class="detail-value">
            <NButton text size="small" @click="showPwdModal = true">修改密码</NButton>
          </div>
        </div>
        <div class="detail-row">
          <span class="detail-label">双因素认证</span>
          <div class="detail-value">
            <MFASettings />
          </div>
        </div>
      </div>
    </NCard>

    <!-- 修改密码弹窗 -->
    <NModal v-model:show="showPwdModal" title="修改密码" preset="card" style="max-width: 420px;" :bordered="false"
      :mask-closable="false">
      <NForm label-placement="top">
        <NFormItem label="当前密码">
          <NInput v-model:value="pwd.oldPassword" type="password" show-password-on="mousedown" placeholder="输入当前密码" />
        </NFormItem>
        <NFormItem label="新密码">
          <NInput v-model:value="pwd.newPassword" type="password" show-password-on="mousedown" placeholder="至少6位" />
        </NFormItem>
        <NFormItem label="确认新密码">
          <NInput v-model:value="pwd.confirmPassword" type="password" show-password-on="mousedown" placeholder="再次输入" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showPwdModal = false">取消</NButton>
          <NButton type="primary" :loading="changingPwd" @click="handleChangePassword">确认修改</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.profile-settings {
  max-width: 1400px;
}

.page-header {
  margin-bottom: var(--spacing-6);
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

.profile-card {
  overflow: hidden;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 8px 0;
}

.profile-headline {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profile-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}

.profile-role {
  font-size: 13px;
  color: var(--color-text-tertiary);
}

/* ── Detail List ── */
.detail-list {
  display: flex;
  flex-direction: column;
}

.detail-row {
  display: flex;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid var(--color-border);
}

.detail-row:last-of-type {
  border-bottom: none;
}

.detail-label {
  width: 100px;
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.detail-value {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
}

/* ── Secret Display ── */
.secret-display {
  background: var(--color-surface-hover);
  border-radius: var(--radius-md);
  padding: 16px;
}

.secret-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.secret-row:first-child {
  padding-top: 0;
}

.secret-row:last-child {
  padding-bottom: 0;
}

.secret-label {
  font-size: 13px;
  color: var(--color-text-secondary);
  width: 40px;
  flex-shrink: 0;
}

.secret-value {
  font-size: 14px;
  color: var(--color-text-primary);
}

.secret-key {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-primary);
  letter-spacing: 2px;
  background: var(--color-bg);
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  user-select: all;
}

.mono {
  font-family: 'Ubuntu Mono', monospace;
}
</style>
