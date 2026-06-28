<script setup lang="ts">
import { ref, h, computed, watch, type Component } from "vue";
import { useRoute, useRouter, type RouteRecordRaw } from "vue-router";
import { usePanelStore } from "@/stores/panel";
import { storeToRefs } from "pinia";
import { type MenuOption, NMenu, NLayoutSider, NIcon, NScrollbar } from "naive-ui";
import { useTabStore } from "@/stores/tab";

const panelStoreRef = storeToRefs(usePanelStore())
const route = useRoute();
const router = useRouter()
const isDefaultExpandAll = panelStoreRef.isDefaultExpandAll
const activeKey = ref(route.path);

// 监听路由变化，自动更新选中状态
watch(() => route.path, (newPath) => activeKey.value = newPath, { immediate: true })

const routeToMenu = (routes: readonly RouteRecordRaw[]): MenuOption[] => {
  return routes
    .filter(route => route.meta != undefined && !route.meta?.hidden)
    .map(route => ({
      label: route.meta?.title as string,
      key: route.path,
      icon: route.meta?.icon ? renderIcon(route.meta.icon) : undefined,
      children: route.children ? routeToMenu(route.children) : undefined,
    }));
};

const menuOptions = computed(() => routeToMenu(router.options.routes));


// 处理菜单点击
function handleMenuSelect(key: string) {
  useTabStore().openTab(key)
}

// 渲染菜单图标
function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) });
}

</script>

<template>
  <div class="sidebar-wrapper">
    <NLayoutSider
      collapse-mode="width"
      :collapsed-width="64"
      :width="220"
      show-trigger="arrow-circle"
      bordered
    >

      <NScrollbar style="max-height: 100%;">
        <NMenu 
          :default-expand-all="isDefaultExpandAll" 
          :collapsed-icon-size="24"
          :options="menuOptions" 
          position="absolute"
          v-model:value="activeKey" 
          @update:value="handleMenuSelect"
        />
      </NScrollbar>
    </NLayoutSider>
  </div>
</template>

<style scoped>
.n-layout-sider {
  transition: 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
  height: 100%;
}

.sidebar-footer {
  border-top: 1px solid #f1f1f1;
  padding: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-sider {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
}

.sidebar-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
}

:deep(.n-menu-item-content) {
  padding-left: 18px !important;
}
</style>