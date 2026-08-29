import { defineStore } from 'pinia'
import { ref, watch, readonly } from 'vue'
import { debounce } from "@/utils"
import { useMessage } from "@/composable/use_naiveui_discrete_api"
import * as apiv1 from "@/api/v1"

export interface PanelConfig {
  baseURL: string;
}

export const usePanelStore = defineStore('panel', () => {
  const themeMode = ref<'light' | 'dark'>('light')
  const isDefaultExpandAll = ref(true)
  const viewLoading = ref(false)

  const baseUrl = ref<string | null>(null)
  const baseUrlConnected = ref<boolean>(false)
  const pingResult = ref<apiv1.PingResponse | null>(null)
  const latency = ref<number | null>(null)

  const setThemeMode = (mode: 'light' | 'dark') => {
    themeMode.value = mode
  }

  const ping = () => {
    const startTime = Date.now()

    return new Promise((resolve, reject) => {
      apiv1.ping()
      .then(result => {
        latency.value = Date.now() - startTime
        pingResult.value = result.data.data
        baseUrlConnected.value = true
        resolve(result)
      })
      .catch((err) => {
        baseUrlConnected.value = false
        reject(err)
      })
    })
  }

  const testConnection = () => {
    if (!baseUrl.value) {
      useMessage().error("请先配置API接口地址")
      baseUrlConnected.value = false
      return
    }

    ping().then(() => {
      useMessage().success("API接口状态正常")
    })
    .catch(() => {
      useMessage().error("API接口状态异常，检查配置是否正确")
    })
  }

  watch(baseUrl, debounce((newVal) => {
    if (!newVal) {
      return
    }

    testConnection()
  }, 500))

  // 健康检查
  setInterval(() => {
    ping().catch(err => {
      console.error("API接口状态异常: ", err)
      useMessage().error("API接口状态异常，请查看控制台日志")
    })
  }, 5000)

  return {
    baseUrl,
    baseUrlConnected: readonly(baseUrlConnected),
    themeMode,
    isDefaultExpandAll,
    viewLoading,
    pingResult: readonly(pingResult),
    latency: readonly(latency),
    setThemeMode,
    testConnection,
  }
}, {
  persist: true,
})