<script setup lang="ts">
import { ref, computed } from 'vue'
import { apiv1 } from '@/api'
import { useFetch } from '@/composable'
import { useMessage } from '@/composable/use_naiveui_discrete_api'
import { useUserStore } from '@/stores/user'
import { NButton, NInput, NForm, NFormItem, NModal, NAlert, NSpace, NQrCode, NSwitch } from 'naive-ui'

const message = useMessage()
const userStore = useUserStore()
const emit = defineEmits<{ (e: 'updated'): void }>()

const enableMFA = computed(() => userStore.userInfo?.enableMFA ?? false)

// ── 启用 MFA ──
const showEnable = ref(false)
const step = ref<'password' | 'secret' | 'done'>('password')
const pwd = ref('')
const secret = ref('')
const account = ref('')
const issuer = ref('')
const otp = ref('')
const genLoading = ref(false)
const enableLoading = ref(false)

async function handleGenerate() {
  if (!pwd.value) { message.warning('请输入密码'); return }
  genLoading.value = true
  try {
    const { fetch: doGen, response: genResp } = useFetch(
      () => apiv1.generateTOTPSecret(pwd.value),
    )
    await doGen()
    const data = genResp.value?.data
    if (data) {
      secret.value = data.secret
      account.value = data.accountName
      issuer.value = data.issuer
      step.value = 'secret'
    }
  } finally {
    genLoading.value = false
  }
}

async function handleEnable() {
  if (!otp.value) { message.warning('请输入验证码'); return }
  enableLoading.value = true
  try {
    const { fetch: doEnable } = useFetch(() => apiv1.enableMFA(pwd.value, otp.value))
    await doEnable()
    message.success('双因素认证已启用')
    userStore.fetch()
    step.value = 'done'
    emit('updated')
  } finally {
    enableLoading.value = false
  }
}

function resetEnable() {
  showEnable.value = false
  step.value = 'password'
  pwd.value = ''
  secret.value = ''
  otp.value = ''
}

// ── 禁用 MFA ──
const showDisable = ref(false)
const disablePwd = ref('')
const disableOTP = ref('')
const disableLoading = ref(false)

async function handleDisable() {
  if (!disablePwd.value || !disableOTP.value) { message.warning('请填完整'); return }
  disableLoading.value = true
  try {
    const { fetch: doDisable } = useFetch(() => apiv1.disableMFA(disablePwd.value, disableOTP.value))
    await doDisable()
    message.success('双因素认证已禁用')
    userStore.fetch()
    showDisable.value = false
    disablePwd.value = ''
    disableOTP.value = ''
    emit('updated')
  } finally {
    disableLoading.value = false
  }
}

function handleEnableMFA() {
  if (enableMFA.value) {
    showDisable.value = true
  } else {
    showEnable.value = true
  }
}

</script>

<template>
  <NSwitch @change="handleEnableMFA" :value="enableMFA" />
  <!-- <span class="mfa-wrap">
    <span v-if="enableMFA">
      <NTag type="success" size="small">已启用</NTag>
      <NButton text size="small" style="margin-left: 8px;" @click="showDisable = true">禁用</NButton>
    </span>
    <span v-else>
      <NTag type="default" size="small">未启用</NTag>
      <NButton text size="small" style="margin-left: 8px;" @click="showEnable = true">启用</NButton>
    </span>
  </span> -->

  <!-- 启用弹窗 -->
  <NModal
    v-model:show="showEnable" title="启用双因素认证" preset="card"
    style="max-width: 480px;" :bordered="false" :mask-closable="false"
    @after-leave="resetEnable"
  >
    <template #default>
      <NAlert v-if="step === 'password'" type="info" :bordered="false" style="margin-bottom: 16px;">
        启用后登录时需额外输入验证器应用生成的动态验证码。
      </NAlert>
      <NAlert v-else-if="step === 'secret'" type="warning" :bordered="false" style="margin-bottom: 16px;">
        请使用验证器应用扫描下方密钥，然后输入应用生成的 6 位验证码完成绑定。
      </NAlert>
      <NAlert v-else type="success" :bordered="false">双因素认证已成功启用。</NAlert>

      <NForm v-if="step === 'password'" label-placement="top">
        <NFormItem label="输入密码以继续">
          <NInput v-model:value="pwd" type="password" show-password-on="mousedown"
            placeholder="输入当前密码" @keyup.enter="handleGenerate" />
        </NFormItem>
      </NForm>

      <div v-else-if="step === 'secret'" class="secret-box">
        <div class="secret-row">
          <span class="s-label">账户</span>
          <span class="s-value">{{ issuer }}:{{ account }}</span>
        </div>
        <div class="secret-row">
          <span class="s-label">密钥</span>
          <code class="s-key mono">{{ secret }}</code>
        </div>
        
        <NQrCode :value="secret" style="width: auto;height:auto"/>

        <NForm label-placement="top" style="margin-top: 16px;">
          <NFormItem label="验证码">
            <NInput v-model:value="otp" placeholder="输入 6 位验证码" maxlength="6"
              @keyup.enter="handleEnable" />
          </NFormItem>
        </NForm>
      </div>
    </template>

    <template #footer>
      <NSpace justify="end">
        <NButton v-if="step === 'password'" @click="showEnable = false">取消</NButton>
        <NButton v-if="step === 'password'" type="primary" :loading="genLoading" @click="handleGenerate">下一步</NButton>
        <NButton v-if="step === 'secret'" @click="showEnable = false">取消</NButton>
        <NButton v-if="step === 'secret'" type="primary" :loading="enableLoading" @click="handleEnable">验证并启用</NButton>
        <NButton v-if="step === 'done'" type="primary" @click="resetEnable">完成</NButton>
      </NSpace>
    </template>
  </NModal>

  <!-- 禁用弹窗 -->
  <NModal
    v-model:show="showDisable" title="禁用双因素认证" preset="card"
    style="max-width: 420px;" :bordered="false" :mask-closable="false"
  >
    <NAlert type="warning" :bordered="false" style="margin-bottom: 16px;">
      禁用后账号将仅通过密码保护。
    </NAlert>
    <NForm label-placement="top">
      <NFormItem label="密码">
        <NInput v-model:value="disablePwd" type="password" show-password-on="mousedown"
          placeholder="输入当前密码" />
      </NFormItem>
      <NFormItem label="验证码">
        <NInput v-model:value="disableOTP" placeholder="输入 6 位验证码" maxlength="6"
          @keyup.enter="handleDisable" />
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="showDisable = false">取消</NButton>
        <NButton type="error" :loading="disableLoading" @click="handleDisable">确认禁用</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.secret-box {
  background: var(--color-surface-hover);
  border-radius: var(--radius-md);
  padding: 16px;
}

.secret-row {
  display: flex; align-items: center; gap: 12px;
  padding: 8px 0;
}
.secret-row:first-child { padding-top: 0; }
.secret-row:last-child { padding-bottom: 0; }

.s-label {
  font-size: 13px; color: var(--color-text-secondary);
  width: 40px; flex-shrink: 0;
}

.s-value { font-size: 14px; color: var(--color-text-primary); }

.s-key {
  font-size: 15px; font-weight: 600;
  color: var(--color-primary);
  letter-spacing: 2px;
  background: var(--color-bg);
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  user-select: all;
}

.mono { font-family: 'Ubuntu Mono', monospace; }
</style>