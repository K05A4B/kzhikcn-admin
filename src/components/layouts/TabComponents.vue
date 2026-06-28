<script setup lang="ts">
import { NTabs, NTab, NButton, NDropdown, NIcon, NSpace } from 'naive-ui';
import { DownSquare } from "@icon-park/vue-next";
import { useTabStore } from "@/stores/tab";
import { storeToRefs } from "pinia";
import { useRouter } from 'vue-router';

const dropdownOptions = [
  { label: "关闭全部", key: "closeAll" }
]

const tabStore = useTabStore()
const tabRef = storeToRefs(tabStore)

const tabs = tabRef.tabs
const activeTab = tabRef.active

const onDropdownSelect = (ev: string) => {
  switch (ev) {
    case "closeAll":
      tabStore.closeAll()
      break
  }

}

const onUpdate = (val: string) => {
  tabStore.openTab(val)
}

const router = useRouter()

function getTabIcon(path: string) {
  let route = router.getRoutes().find(v => router.resolve(path).matched.some(m => m.path === v.path))
  if (route == undefined) {
    return undefined
  }

  return route.meta.tabIcon
}
</script>

<template>
  <div id="tabs">
    <NTabs @close="tabStore.closeTab" @update:value="onUpdate" v-bind:value="activeTab" type="card" closable>
      <NTab class="tab" v-for="tab in tabs" :key="tab.key" :name="tab.key" :closable="tab.closable ?? true">
        <NSpace :size="[4,4]" align="center" justify="center" style="padding: 1px;">
          <NIcon v-if="getTabIcon(tab.key) != undefined" style="transform: translateY(1px);">
            <component :is="getTabIcon(tab.key)" />
          </NIcon>
          <span>{{ tab.label }}</span>
        </NSpace>
      </NTab>

      <template #suffix>
        <NDropdown trigger="click" size="medium" :options="dropdownOptions" @select="onDropdownSelect">
          <NButton strong secondary circle>
            <DownSquare />
          </NButton>
        </NDropdown>
      </template>
    </NTabs>
  </div>
</template>

<style>
#tabs {
  position: sticky;
  top: 0;
  z-index: 80;
  background-color: var(--color-tabs-bg);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 4px;
  padding-bottom: 0;
  transition: background var(--transition-normal);
}

#tabs .n-tabs-tab {
  padding: 4px 10px;
  border-radius: 8px !important;
  margin: 0;
  transition: all var(--transition-fast);
}

#tabs .n-tabs-pad {
  border-bottom: none !important;
}

#tabs .n-tabs-tab--active {
  border: 1px solid var(--theme-color) !important;
}

[is-loading=true] .content-scroll .n-scrollbar-content {
  height: 95%;
}
</style>