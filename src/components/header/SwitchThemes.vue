<script setup lang="ts">
import { NButton } from 'naive-ui';
import { IntermediateMode, DarkMode, Light, Palace } from "@icon-park/vue-next";
import { usePanelStore } from '@/stores/panel';
const panelStore = usePanelStore()

function switchTheme() {
  let theme = panelStore.themeMode
  if (theme == "dark") {
    panelStore.setThemeMode("light")
  } else {
    panelStore.setThemeMode("dark")
  }
}

</script>

<template>
  <NButton strong secondary circle class="action" title="浅色/深色模式" @click="switchTheme">
    <component :is="panelStore.themeMode == 'dark' ? IntermediateMode : DarkMode" />
  </NButton>
</template>