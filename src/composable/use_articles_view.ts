import { useArticles } from "./use_articles";
import * as apiv1 from "@/api/v1";
import { type Resp } from "@/api/response";

import { ref, watch, computed } from "vue";

export interface ArticleView extends apiv1.Article {
  $state: {
    checked: boolean,
    loadings: {
      delete: boolean,
      updates: {
        status: boolean,
        title: boolean,
        description: boolean,
        customID: boolean,
        category: boolean,
        coverImage: boolean,
        tags: boolean,
        enableComment: boolean,
        restore: boolean,
      },
    }
  }
}

const defaultState: ArticleView["$state"] = {
  checked: false,
  loadings: {
    delete: false,
    updates: {
      status: false,
      title: false,
      description: false,
      customID: false,
      category: false,
      coverImage: false,
      tags: false,
      enableComment: false,
      restore: false,
    },
  },
}

export type ArticleViewsFn<T> = (query:apiv1.ArticleGeneralQuery) => Resp<T>
export type ArticleViewsAdapter<T> = (data: T) => apiv1.Article[]

function useViewerBase<T>(fn: ArticleViewsFn<T>, adapter: ArticleViewsAdapter<T>){
  const expr = ref<string | undefined>(undefined)
  const orderBy = ref<apiv1.ArticleOrderBy | undefined>("createdAt:desc")
  const articles = ref<ArticleView[]>([])
  const isCheckAll = computed(() => {
    return articles.value.every(v => v.$state.checked)
  })

  const ar = useArticles((limit, page) => {
    return fn({ page, limit, expr: expr.value, orderBy: orderBy.value })
  }, adapter);

  watch(() => ar.articles.value, (newData) => {
    articles.value = newData.map(v => ({ 
      ...v, 
      $state: JSON.parse(JSON.stringify(defaultState)) 
    }))
  }, { immediate: true, deep: true })

  const setExpr = (newExpr: string | undefined) => {
    expr.value = newExpr
    ar.fetch()
  }

  const setOrderBy = (newOrderBy: apiv1.ArticleOrderBy | undefined) => {
    orderBy.value = newOrderBy
    ar.fetch()
  }

  const setCheck = (id: string, checked: boolean) => {
    const article = getArticle(id)
    if (article) {
      article.$state.checked = checked
    }
  }

  const setCheckAll = (checked: boolean) => {
    articles.value.forEach(v => {
      v.$state.checked = checked
    })
  }

  const getArticle = (id: string) => {
    return articles.value.find(v => v.id === id)
  }

  const getChecked = () => {
    return articles.value.filter(v => v.$state.checked)
  }

  const deleteArticle = async (ids: string[], hard: boolean = false) => {
    if (ids.length === 0) {
      return
    }

    const mark = (val: boolean) => {
      ids.forEach(id => {
        const article = getArticle(id)
        if (article) {
          console.log(article, val)
          article.$state.loadings.delete = val
        }
      })
    }

    mark(true)
    const resp = await ar.delete(ids, hard)
      .finally(() => mark(false))

    return resp
  }

  const update = async (id: string, options: apiv1.EditableArticle) => {
    const article = getArticle(id)
    if (!article) {
      return
    }

    const mark = (val: boolean) => {
      for (const key in options) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      article.$state.loadings.updates[key] = val
    }
    }

    mark(true)
    
    const resp = await ar.update(id, options).finally(() => {
      mark(false)
    })
    return resp
  }


  return {
    ...ar,
    articles,
    isCheckAll,
    orderBy,
    expr,
    update,
    getChecked,
    getArticle,
    delete: deleteArticle,
    setExpr,
    setOrderBy,
    setCheck,
    setCheckAll,
  }
}

export function useArticlesViewer() {
  const base = useViewerBase(apiv1.getArticles, v => v || [])
  return {
    ...base,
    delete: (id: string) => base.delete([id], false),
    deleteChecked: () => base.delete(base.getChecked().map(v => v.id), false),
  }
}

export function useTrashBinViewer() {
  const base = useViewerBase(apiv1.getDeletedArticles, v => v || [])

  const restore = async (ids: string[]) => {
    const mark = (val: boolean) => {
      ids.forEach(id => {
        const article = base.getArticle(id)
        if (article) {
          article.$state.loadings.updates.restore = val
        }
      })
    }

    mark(true)
    const resp = await apiv1.restoreArticle(ids)
      .then(() => base.fetch())
      .finally(() => mark(false))
    return resp
  }

  return {
    ...base,
    update: null,
    delete: (id: string) => base.delete([id], true),
    deleteChecked: () => base.delete(base.getChecked().map(v => v.id), true),
    restore: (id: string) => restore([id])  ,
    restoreChecked: () => restore(base.getChecked().map(v => v.id)),
  }
}
