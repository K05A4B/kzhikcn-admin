import type { HttpResponse } from "@/api"
import type { Resp } from "@/api/response"
import { useMessage } from "@/composable/use_naiveui_discrete_api"
import axios, { AxiosError } from "axios"
import { ref, computed, type Ref } from "vue"

export function prefixErrorMessage(prefix: string): (err: string) => string {
  return (err: string) => `${prefix}: ${err}`
}

export interface FetchOptions {
  showError?: boolean,
  errorMessageFormat?: (err: string) => string,
}

const defaultOptions: FetchOptions = {
  showError: true,
  errorMessageFormat: (err: string) => err,
}

export interface ApiError {
  message: string;
  code: number;
  axios?: AxiosError;
  rawError?: unknown;
}

function newApiError(message: string, code: number, rawError?: unknown, axios?: AxiosError): ApiError {
  return {
    message,
    code,
    axios,
    rawError,
  }
}

export function useAction(fn: () => Resp<unknown>, options: FetchOptions = defaultOptions) {
  options = { ...defaultOptions, ...options }

  const response = ref<HttpResponse<unknown>>()
  const error = ref<ApiError | null>()
  const loading = ref<boolean>(false)

  const handleError = (err: unknown): ApiError | null => {
    if (!axios.isAxiosError(err)) {
      console.error(err)
      return newApiError("接口请求失败，请查看控制台错误信息", 0, err)
    }

    const axiosErr = err as AxiosError
    if (!axiosErr.response) {
      return newApiError(axiosErr.message, 0, err, axiosErr)
    }

    const resp = axiosErr.response
    if (resp.headers["content-type"] !== "application/json") {
      if (resp.status === 404) {
        return newApiError("请检查API接口配置是否正确", resp.status, err, axiosErr)
      }

      return newApiError(axiosErr.message, resp.status, err, axiosErr)
    }

    const data = resp.data as HttpResponse<unknown>
    return newApiError(data.message, data.code, err, axiosErr)
  }

  const fetch = async () => {
    loading.value = true
    error.value = null
    try {
      const result = await fn()
      response.value = result.data
      return result.data
    } catch (err) {
      const pErr = handleError(err)

      if (options.showError && pErr) {
        useMessage().error(pErr.message)
      }

      error.value = pErr

      throw pErr
    } finally {
      loading.value = false
    }
  }

  return {
    response,
    error,
    loading,
    fetch,
  }
}

export function useFetch<T>(fn: () => Resp<T>, options: FetchOptions = defaultOptions) {
  const { response, error, loading, fetch } = useAction(fn, options)
  const data = computed<T|undefined>(() => response.value?.data as T)
  return {
    response: response as Ref<HttpResponse<T>>,
    data,
    error,
    loading,
    fetch: fetch as () => Promise<HttpResponse<T>>,
  }
}