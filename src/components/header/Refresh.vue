<script setup lang="ts">
import { usePanelStore } from '@/stores/panel';
import { Refresh } from '@icon-park/vue-next';
import { NButton } from 'naive-ui';
import { nextTick, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter()
const canRefresh = ref(false)
const panelStore = usePanelStore()
const refreshFunc = ref<() => void>()
const title = ref<null | string>(null)

function checkCanRefresh() {
  canRefresh.value = false
  title.value = null

  nextTick(() => {
    let activeComponent = panelStore.activeComponent

    if (!activeComponent) {
      return
    }

    if (!activeComponent.onRefresh) {
      return
    }

    if (typeof activeComponent.refreshTitle == "string") {
      title.value = activeComponent.refreshTitle
    }

    refreshFunc.value = activeComponent.onRefresh
    canRefresh.value = true
  })
}

function refresh() {
  if (!refreshFunc.value) {
    return
  }

  refreshFunc.value()
}

router.afterEach(() => {
  checkCanRefresh()
})

function globalRefresh() {
  router.go(0)
}

onMounted(() => {
  checkCanRefresh()
})

</script>

<template>
  <NButton strong secondary circle class="action" :title="title || '刷新'" @click.middle="globalRefresh" @click="refresh">
    <Refresh />
  </NButton>
</template>

<style scoped>
.action:focus {
  transform: rotateZ(360deg);
  transition: 800ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>