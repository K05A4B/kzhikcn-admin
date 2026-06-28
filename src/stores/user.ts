import { defineStore } from 'pinia';
import { computed, onMounted } from 'vue';
import { apiv1 } from "@/api";
import { useFetch, prefixErrorMessage } from '@/composable/use_fetch';

export const useUserStore = defineStore('user', () => {
  const { data, error, loading, fetch } = useFetch(() => apiv1.getUserInfo(), {
    errorMessageFormat: prefixErrorMessage("获取用户信息失败"),
  })

  const userInfo = computed(() => data.value || null)
  
  onMounted(() => fetch())

  return {
    userInfo,
    error,
    loading,
    fetch,
  }
})

