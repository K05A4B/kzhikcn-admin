import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

export type CloseCallback = (close: () => void) => void

export const useTabStore = defineStore("globalTabs", () => {
  interface TabOption {
    key: string
    label: string
    closable?: boolean
  }

  const defaultTabs = [{
    label: "主页",
    key: "/dashboard",
    closable: false,
  }]

  const route = useRoute()
  const router = useRouter()

  const closeInterceptors = new Map<string, CloseCallback>()
  const active = ref<string>("")
  const tabs = ref<TabOption[]>([...defaultTabs])

  const closeTab = (key: string) => {
    const close = () => {
      const index = tabs.value.findIndex((tab) => tab.key === key);
      if (index <= -1) {
        return
      }

      tabs.value.splice(index, 1);
      if (active.value === key) {
        const newActiveTab = tabs.value[index - 1] || tabs.value[0];
        if (newActiveTab) {
          active.value = newActiveTab.key
        }
      }
    }

    const interceptor = closeInterceptors.get(key)

    if (interceptor == null) {
      close()
      return
    }

    interceptor(close)
  };

  // 切换 Tab
  const openTab = (key: string) => {
    const routers = router.getRoutes()
    if (!tabs.value.find((tab) => tab.key === key)) {
      const nextRoute = routers.find(v => 
        router.resolve(key).matched.some(m => m.path === v.path)
      );

      if (nextRoute == undefined || nextRoute.meta.title == undefined) {
        console.error("cannot change tab cause undefined route");
        return
      }

      const option: TabOption = {
        key: key,
        label: nextRoute.meta.title as string,
      }

      tabs.value.push(option);
    }

    active.value = key
  };

  const closeAll = () => {
    tabs.value = [...defaultTabs]
    openTab(tabs.value[0]!.key)
  }

  const defineCloseInterceptor = (fn: CloseCallback) => {
    closeInterceptors.set(route.path, fn)
  }

  const disposeCloseInterceptor = () => {
    closeInterceptors.delete(route.path)
  }

  watch(() => active.value, (newActive) => router.push(newActive), { immediate: true })
  watch(() => route.path, (newPath) => openTab(newPath), { immediate: true })

  return { active, tabs, closeTab, closeAll, openTab, defineCloseInterceptor, disposeCloseInterceptor }
}, { persist: true })
