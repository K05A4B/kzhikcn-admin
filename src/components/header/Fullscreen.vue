<script setup lang="ts">
import { FullScreen, OffScreen } from "@icon-park/vue-next"
import { ref } from "vue"
import { NButton } from "naive-ui"

const isFullscreen = ref(document.fullscreenElement != null)

const fullscreen = () => {
  let app = document.getElementById("app")
  if (app == null) {
    return
  }

  if (document.fullscreenElement == null) {
    app.requestFullscreen()
    isFullscreen.value = true
    return
  }

  isFullscreen.value = false
  document.exitFullscreen()
}
</script>

<template>
  <NButton strong secondary circle class="action" title="全屏/退出全屏" @click="fullscreen">
    <component :is="isFullscreen?OffScreen:FullScreen"/>
  </NButton>
</template>