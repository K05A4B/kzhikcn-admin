import { defineStore } from "pinia"
import { ref, computed, watch } from "vue"
import * as apiv1 from "@/api/v1"
import { useMessage } from "@/composable/use_naiveui_discrete_api"
import { debounce } from "@/utils"

export const useAuthStore = defineStore('authStore',  () => {
  const token = ref<string|null>(null)
  const baseUrl = ref<string|null>(null)
  const baseUrlConnected = ref<boolean>(false)

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

  const testConnection = () => {
    if (!baseUrl.value) {
      useMessage().error("请先配置API接口地址")
      baseUrlConnected.value = false
      return
    }

    apiv1.ping()
      .then(() => {
        useMessage().success("API接口状态正常")
        baseUrlConnected.value = true
      })
      .catch(() => {
        useMessage().error("API接口状态异常，检查配置是否正确")
        baseUrlConnected.value = false
      })
  }

  watch(baseUrl, debounce((newVal) => {
    if (!newVal) {
      return
    }
    
    testConnection()
  }, 500))

  return {
    token,
    isAuthorized,
    baseUrl,
    baseUrlConnected, 
    setToken,
    removeToken,
    revokeToken,
    testConnection,
  }
}, {
  persist: true,
})