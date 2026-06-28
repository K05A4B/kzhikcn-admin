import { defineStore } from "pinia"
import { ref, watch, onMounted } from "vue"
import { getCategories, type Category } from "@/api/v1"
import { useFetch, usePagination } from "@/composable"

export const useCategoriesStore = defineStore("categories", () => {
  const categories = ref<Category[]>([])
  const pagination = usePagination(50)
  const expr = ref<string|undefined>(undefined)
  
  const { response, data, fetch: fetchData, loading } = useFetch(() => getCategories({
    page: pagination.page.value,
    limit: pagination.pageSize.value,
    expr: expr.value
  }))

  const push = (item: Category) => {
    if (categories.value.find(v => v.id === item.id)) {
      return
    }
    
    categories.value.push(item)
  }

  const setExpr = (v: string|undefined) => {
    pagination.setPage(1)
    expr.value = v
    fetchData()
  }

  watch(response, v => {
    const d = v?.data || []

    d.forEach(push)

    pagination.setTotal((response.value?.meta.total as number) || 0)

  })

  pagination.onNotify(() => {
    fetchData()
  })

  const loadMore = () => {
    if (pagination.hasNextPage()) {
      pagination.nextPage()
    }
  }

  const reset = () => {
    categories.value = []
    pagination.reset()
    setExpr(undefined)
  }

  onMounted(() => {
    fetchData()
  })

  return { 
    ...pagination,
    categories,
    response,
    data,
    expr,
    loading,
    reset,
    fetch: fetchData,
    push,
    setExpr,
    loadMore,
  }
})