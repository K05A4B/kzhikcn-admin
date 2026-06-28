<script setup lang="ts">
import { darkTheme, dateZhCN, lightTheme, NConfigProvider, zhCN } from 'naive-ui';
import themesOverrides from "@/assets/theme-overrides.json"
import { computed, watch } from 'vue';
import { usePanelStore } from '@/stores/panel'
import MainLayout from '@/layout/MainLayout.vue'
import LoginLayout from '@/layout/LoginLayout.vue'
import { useAuthStore } from './stores/auth';

const panelStore = usePanelStore()
const authStore = useAuthStore()

const Layout = computed(() => {
  if (!authStore.isAuthorized) {
    return LoginLayout
  }

  return MainLayout
})

// 同步 themeMode 到 <html> 上，用于全局 CSS 变量切换
watch(() => panelStore.themeMode, (mode) => {
  document.documentElement.setAttribute('data-theme', mode)
}, { immediate: true })

</script>

<template>
  <NConfigProvider :locale="zhCN" :date-locale="dateZhCN" :data-theme="panelStore.themeMode" :theme="panelStore.themeMode == 'dark' ? darkTheme : lightTheme"
    :theme-overrides="themesOverrides">

    <RouterView v-slot="{ Component }">
      <Layout>
        <component :is="Component"/>
      </Layout>
    </RouterView>
  </NConfigProvider>
</template>