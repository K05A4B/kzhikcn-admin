import axios from "axios";
import { type HttpResponse } from "./response";
import { useAuthStore } from "@/stores/auth";

export const httpClient = axios.create({
});

httpClient.interceptors.request.use(
  
  (config) => {
    const authStore = useAuthStore();

    if (!authStore.baseUrl) {
      return config;
    }

    config.baseURL = authStore.baseUrl;
    if (authStore.isAuthorized)  {
      config.headers["Authorization"] = `Bearer ${authStore.token}`
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

httpClient.interceptors.response.use(
  response => response,
  error => {
    const authStore = useAuthStore();

    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const response = error.response;
    if (!response) {
      return Promise.reject(error);
    }

    const data = response.data as HttpResponse<unknown>

    // 处理未授权错误，一般这个错误码指的就是登录过期了
    if (data.errorCode == "system.unauthorized") {
      authStore.removeToken()
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);