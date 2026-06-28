import { ref, watch } from 'vue'

type NotifyFn = (pageSize: number, page: number, total: number) => void

export function usePagination(initPageSize: number) {
  const page = ref(1)
  const pageSize = ref(initPageSize)
  const total = ref(0)

  const notifyFuncs: NotifyFn[] = []

  const notify = () => {
    notifyFuncs.forEach(fn => fn(pageSize.value, page.value, total.value))
  }

  const onNotify = (fn: NotifyFn) => {
    notifyFuncs.push(fn)
  }
  // 监听分页参数变化并获取数据
  watch([page, pageSize], () => {
    notify()
  })

  const setTotal = (newTotal: number) => {
    total.value = newTotal
  }

  // 切换到指定页
  const setPage = (newPage: number) => {
    page.value = newPage
  }

  // 切换每页显示数量
  const setPageSize = (size: number) => {
    pageSize.value = size
    page.value = 1
  }

  // 下一页
  const nextPage = () => {
    if (hasNextPage()) {
      page.value++
    }
  }

  // 上一页
  const prevPage = () => {
    if (hasPrevPage()) {
      page.value--
    }
  }

  // 是否有下一页
  const hasNextPage = () => {
    return page.value * pageSize.value < total.value
  }

  // 是否有上一页
  const hasPrevPage = () => {
    return page.value > 1
  }

  const reset = () => {
    page.value = 1
    pageSize.value = initPageSize
    total.value = 0
  }

  return {
    page,
    pageSize,
    total,
    reset,
    setPage,
    setPageSize,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
    setTotal,
    onNotify,
  }
}