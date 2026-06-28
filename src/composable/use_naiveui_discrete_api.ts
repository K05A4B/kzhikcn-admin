import { createDiscreteApi, type ConfigProviderProps } from "naive-ui";
import { computed } from "vue";
import themeOverrides from "@/assets/theme-overrides.json";

let discreteApi: ReturnType<typeof createDiscreteApi>;

export const useDiscreteApi = () => {
  if (!discreteApi) {
    discreteApi = createDiscreteApi(["message", "notification", "dialog", "loadingBar", "modal"], {
      configProviderProps: computed<ConfigProviderProps>(() => ({
        // theme: usePanelStore().themeMode == 'dark' ? darkTheme : lightTheme,
        themeOverrides: themeOverrides
      }))
    })
  }
  return discreteApi
}

export const useMessage = () => {
  return useDiscreteApi().message
}

export const useNotification = () => {
  return useDiscreteApi().notification
}

export const useDialog = () => {
  return useDiscreteApi().dialog
}

export const useLoadingBar = () => {
  return useDiscreteApi().loadingBar
}
