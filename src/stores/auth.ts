import { defineStore } from "pinia"
import { ref, computed } from "vue"
import * as apiv1 from "@/api/v1"
import { useMessage } from "@/composable/use_naiveui_discrete_api"

export const useAuthStore = defineStore('authStore',  () => {
  const token = ref<string|null>(null)
  const isAuthorized = computed(() => token.value !== null)

  const setToken = (jwtToken: string) => {
    useMessage().success("登录成功")
    token.value = jwtToken
  }

  const removeToken = () => {
    token.value = null
  }

  // 请求logout接口并清除token
  const revokeToken = () => {
    apiv1.logout()
      .then(() => { removeToken() })
  }

  return {
    token,
    isAuthorized,
    setToken,
    removeToken,
    revokeToken,
  }
}, {
  persist: true,
})