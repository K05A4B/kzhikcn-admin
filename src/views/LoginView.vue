<script setup lang="ts">
import { NCard, NInput, NFormItem, NButton, NForm, NSpin, NInputOtp } from 'naive-ui';
import { User, Lock, SettingConfig } from '@icon-park/vue-next';
import { reactive, ref, computed, watch } from 'vue';
import { useFetch } from '@/composable';
import { apiv1 } from '@/api';
import { useAuthStore } from '@/stores/auth';
import { useMessage } from '@/composable/use_naiveui_discrete_api';

const authStore = useAuthStore()
const message = useMessage()

type LoginStep = 'credentials' | 'mfa'

const step = ref<LoginStep>('credentials')
const challengeId = ref('')
const otpArr = ref<string[]>([])
const otp = computed(() => otpArr.value.join(''))

const loginModel = reactive({
  username: '',
  password: '',
})

const showAdvanced = ref(false)

const { fetch: login } = useFetch(() => {
  return apiv1.login(loginModel.username, loginModel.password)
})

async function handleLogin() {
  const resp = await login()
  if (!resp) return

  if (resp.data.status === 'authorized') {
    authStore.setToken(resp.data.token)
    return
  }

  if (resp.data.status === 'needMFA') {
    challengeId.value = resp.data.challengeId
    step.value = 'mfa'
    otpArr.value = []
  }
}

const { fetch: verifyMFA, error: mfaError, loading: mfaLoading } = useFetch(() => {
  return apiv1.totpVerify(challengeId.value, otp.value)
})

watch(mfaError, (err) => {
  if (!err) {
    return
  }

  otpArr.value = []
})

async function handleMFA() {
  if (otp.value.length !== 6) {
    message.warning('请输入 6 位验证码')
    return
  }
  const resp = await verifyMFA()
  if (resp?.data.token) {
    authStore.setToken(resp.data.token)
  }
}

function backToLogin() {
  step.value = 'credentials'
  challengeId.value = ''
  otpArr.value = []
}

const cardTitle = computed(() => step.value === 'mfa' ? '双因素认证' : '登录')
const cardSubtitle = computed(() => step.value === 'mfa'
  ? '输入验证器应用生成的 6 位验证码'
  : '请输入您的账号信息')

</script>

<template>
  <div class="login-page">
    <div class="bg-gradient" />
    <div class="bg-dot-pattern" />
    <div class="bg-orb bg-orb-1" />
    <div class="bg-orb bg-orb-2" />

    <div class="login-container">
      <div class="login-brand">
        <img src="/logo.svg" alt="Logo" class="login-logo" />
        <span class="login-brand-text">管理面板</span>
      </div>

      <NCard class="login-card" :bordered="false">
        <template #header>
          <div class="card-header">
            <h2 class="card-title">{{ cardTitle }}</h2>
            <p class="card-subtitle">{{ cardSubtitle }}</p>
          </div>
        </template>

        <!-- 步骤 1：账号密码 -->
        <NForm v-if="step === 'credentials'" @keyup.enter="handleLogin">
          <div class="form-fields">
            <NFormItem label="用户名">
              <NInput
                v-model:value="loginModel.username"
                placeholder="请输入用户名"
                :input-props="{ autocomplete: 'username' }"
              >
                <template #prefix>
                  <User />
                </template>
              </NInput>
            </NFormItem>

            <NFormItem label="密码">
              <NInput
                v-model:value="loginModel.password"
                show-password-on="mousedown"
                type="password"
                placeholder="请输入密码"
                :input-props="{ autocomplete: 'current-password' }"
              >
                <template #prefix>
                  <Lock />
                </template>
              </NInput>
            </NFormItem>

            <div class="advanced-toggle">
              <NButton text size="tiny" @click="showAdvanced = !showAdvanced">
                <SettingConfig style="margin-right: 4px;" />
                {{ showAdvanced ? '收起' : '高级选项' }}
              </NButton>
            </div>

            <div v-if="showAdvanced" class="advanced-section">
              <NFormItem label="API BaseURL">
                <NInput v-model:value="authStore.baseUrl" placeholder="http://localhost:5083" />
              </NFormItem>
              <div class="connection-status">
                <span v-if="authStore.baseUrl" class="status-dot" :class="authStore.baseUrlConnected ? 'connected' : 'disconnected'" />
                <span v-if="authStore.baseUrl" class="status-text">{{ authStore.baseUrlConnected ? '已连接' : '未连接' }}</span>
                <span v-else class="status-text">未配置</span>
                <NButton text size="tiny" @click="authStore.testConnection">测试连接</NButton>
              </div>
            </div>
          </div>

          <div class="form-footer">
            <NButton
              type="primary"
              size="large"
              block
              @click="handleLogin"
            >
              登录
            </NButton>
          </div>
        </NForm>

        <!-- 步骤 2：MFA 验证 -->
        <NSpin v-else :show="mfaLoading">
          <div class="mfa-section">
            <NFormItem label="验证码">
              <NInputOtp
                v-model:value="otpArr"
                maxlength="6"
                block
                @keyup.enter="handleMFA"
                @finish="handleMFA"
              />
            </NFormItem>
          </div>

          <div class="form-footer">
            <NButton
              type="primary"
              size="large"
              block
              :loading="mfaLoading"
              @click="handleMFA"
            >
              验证
            </NButton>
            <NButton
              text
              size="small"
              style="margin-top: 12px; width: 100%;"
              @click="backToLogin"
            >
              返回登录
            </NButton>
          </div>
        </NSpin>
      </NCard>

      <p class="login-footer">kzhikcn 内容管理系统</p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: var(--color-bg);
}

/* ── 背景 ── */
.bg-gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(18, 115, 235, 0.12), transparent),
    radial-gradient(ellipse 50% 60% at 80% 80%, rgba(99, 102, 241, 0.08), transparent);
}

.bg-dot-pattern {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(var(--color-border) 1px, transparent 1px);
  background-size: 32px 32px;
  opacity: 0.4;
}

.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
}

.bg-orb-1 {
  width: 400px; height: 400px;
  background: rgba(18, 115, 235, 0.08);
  top: -100px; right: -100px;
}

.bg-orb-2 {
  width: 300px; height: 300px;
  background: rgba(99, 102, 241, 0.06);
  bottom: -80px; left: -80px;
}

/* ── Container ── */
.login-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ── Brand ── */
.login-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 32px;
}

.login-logo { width: 36px; height: 36px; }

.login-brand-text {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}

/* ── Card ── */
.login-card {
  width: 100%;
  border-radius: 16px !important;
  box-shadow: var(--shadow-lg) !important;
  background: var(--color-bg-elevated) !important;
}

.card-header { text-align: center; padding-bottom: 4px; }

.card-title {
  font-size: 24px; font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 4px 0; letter-spacing: -0.02em;
}

.card-subtitle {
  font-size: 14px; color: var(--color-text-tertiary); margin: 0;
}

/* ── Form ── */
.form-fields { display: flex; flex-direction: column; gap: 2px; }

.form-fields :deep(.n-form-item-label) {
  font-weight: 500; font-size: 13px;
}

.form-fields :deep(.n-input) { --n-height: 42px; }

.form-fields :deep(.n-input__prefix) {
  font-size: 16px; color: var(--color-text-tertiary); margin-right: 4px;
}

.advanced-toggle {
  display: flex; justify-content: center; margin: 4px 0 8px 0;
}

.advanced-section {
  background: var(--color-surface-hover);
  border-radius: var(--radius-md);
  padding: 12px 16px; margin-bottom: 8px;
}

.advanced-section :deep(.n-form-item) { margin-bottom: 0; }

.connection-status {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 0 0 2px;
}

.status-dot {
  width: 8px; height: 8px; border-radius: 50%;
  flex-shrink: 0;
}
.status-dot.connected { background: #10b981; }
.status-dot.disconnected { background: #94a3b8; }

.status-text { font-size: 12px; color: var(--color-text-tertiary); }

.form-footer { margin-top: 20px; }

.form-footer :deep(.n-button) {
  --n-height: 42px; font-size: 15px; font-weight: 600; border-radius: 10px;
}

/* ── MFA ── */
.mfa-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.mfa-icon {
  font-size: 48px;
  color: var(--color-primary);
  margin-bottom: 8px;
  opacity: 0.8;
}

.mfa-section :deep(.n-form-item) {
  width: 100%;
}

.mfa-section :deep(.n-input) {
  --n-height: 48px;
  font-family: 'Ubuntu Mono', monospace;
}

/* ── Footer ── */
.login-footer {
  margin-top: 24px;
  font-size: 13px;
  color: var(--color-text-tertiary);
  text-align: center;
}

/* ── Dark mode ── */
[data-theme='dark'] .bg-gradient {
  background:
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(18, 115, 235, 0.15), transparent),
    radial-gradient(ellipse 50% 60% at 80% 80%, rgba(99, 102, 241, 0.10), transparent);
}

[data-theme='dark'] .bg-orb-1 { background: rgba(18, 115, 235, 0.10); }
[data-theme='dark'] .bg-orb-2 { background: rgba(99, 102, 241, 0.08); }
</style>