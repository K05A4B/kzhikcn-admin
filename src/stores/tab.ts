import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

export type CloseCallback = (close: () => void) => void

export interface OpenTabOptions {
  position?: number | 'currentNext' | 'currentPrev'
  closable?: boolean
  label?: string
}

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
  const openTab = (key: string, options?: OpenTabOptions) => {
    const routers = router.getRoutes()
    if (!tabs.value.find((tab) => tab.key === key)) {
      const nextRoute = routers.find(v =>
        router.resolve(key).matched.some(m => m.path === v.path)
      );

      if (nextRoute == undefined || nextRoute.meta.title == undefined) {
        console.error("cannot change tab cause undefined route");
        return
      }

      console.log(options?.label)
      const tabOption: TabOption = {
        key: key,
        label: options?.label || nextRoute.meta.title as string,
        closable: options?.closable || true,
      }

      const position = options?.position

      if (position === undefined) {
        tabs.value.push(tabOption);
      }

      if (typeof position === 'number') {
        tabs.value.splice(position, 0, tabOption);
      }

      if (typeof position === 'string') {
        const currIndex = tabs.value.findIndex((tab) => tab.key === active.value);
        if (position === 'currentNext') {
          tabs.value.splice(currIndex + 1, 0, tabOption);
        }

        if (position === 'currentPrev') {
          tabs.value.splice(currIndex, 0, tabOption);
        }
      }
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
