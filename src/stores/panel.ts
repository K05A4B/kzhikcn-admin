import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface PanelConfig {
  baseURL: string;
}

export const usePanelStore = defineStore('panel',  () => {
  const themeMode = ref<'light' | 'dark'>('light')
  const isDefaultExpandAll = ref(true)
  const viewLoading = ref(false)

  const setThemeMode = (mode: 'light' | 'dark') => {
    themeMode.value = mode
  }

  return {
    themeMode,
    isDefaultExpandAll,
    viewLoading,
    setThemeMode,
  }
}, {
  persist: true,
})