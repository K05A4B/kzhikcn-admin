import { ref, watch } from 'vue'
import { type Article, type EditableArticle } from '@/api/v1/articles'
import { type Resp } from "@/api/response"
import { useFetch } from "@/composable/use_fetch"
import * as apiv1 from "@/api/v1"
import { onMounted } from "vue"
import { type CreateArticleBody } from "@/api/v1/articles"
import { usePagination } from './use_pagination'

type FetchArticlesFn<T> = ((pageSize: number, page: number) => Resp<T>)
type AdapterFn<T> = ((data: T) => Article[])

export function useArticles<T>(fetchArticles: FetchArticlesFn<T>, adapter: AdapterFn<T>) {
  const articles = ref<Article[]>([])
  const pagination = usePagination(20)
  const { response, data, loading, error, fetch: fetch } = useFetch(() => {
    return fetchArticles(pagination.pageSize.value, pagination.page.value)
  })

  // 监听数据变化并更新 articles
  watch(() => data.value, (newData) => {
    if (newData) {
      articles.value = adapter(newData)
    }
  }, { immediate: true })

  const fetchData = async () => {
    try {
      await fetch()
      pagination.setTotal((response.value?.meta.total as number) || 0)
    } catch (err) {
      console.error('获取文章列表失败:', err)
    }
  }

  pagination.onNotify(() => fetchData())

  const create = async (article: CreateArticleBody) => {
    try {
      const { fetch: createFetch, data: createdData } = useFetch(() => apiv1.createArticle(article))
      await createFetch()
      // 创建成功后刷新文章列表
      await fetchData()
      return createdData.value
    } catch (err) {
      console.error('创建文章失败:', err)
      throw err
    }
  }

  const deleteArticle = async (ids: string[], hardDelete: boolean = false) => {
    try {
      const { fetch: deleteFetch } = useFetch(() => apiv1.deleteArticles(ids, hardDelete))
      await deleteFetch()
      // 删除成功后刷新文章列表
      await fetchData()
    } catch (err) {
      console.error('删除文章失败:', err)
      throw err
    }
  }

  // 更新文章
  const update = async (id: string, article: EditableArticle) => {
    try {
      const { fetch: updateFetch, data: updatedData } = useFetch(() => apiv1.updateArticle(id, article))
      await updateFetch()
      
      if (!updatedData.value) {
        return
      }

      const idx = articles.value.findIndex(v => v.id === id)
      if (idx >= 0) {
        articles.value[idx] = updatedData.value
        return
      }

      // 如果当前列表中没有该文章，则重新获取列表
      await fetchData()
    } catch (err) {
      console.error('更新文章失败:', err)
      throw err
    }
  }

  onMounted(() => {
    fetchData()
  })

  return {
    articles,
    loading,
    error,
    fetch: fetchData,
    delete: deleteArticle,
    update,
    create,
    ...pagination,
  }
}