import type { Article } from '@/api/v1'

/**
 * 每篇文章卡片在列表中的 UI 状态
 */
export interface ArticleCardState {
  checked: boolean
  loadings: {
    delete: boolean
    updates: {
      status: boolean
      title: boolean
      description: boolean
      customID: boolean
      category: boolean
      coverImage: boolean
      tags: boolean
      enableComment: boolean
      restore: boolean
    }
  }
}

/** Article + 卡片 UI 状态 */
export interface ArticleView extends Article {
  $state: ArticleCardState
}

const defaultCardState: ArticleCardState = {
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

/** 深拷贝默认状态（避免引用共享） */
function freshState(): ArticleCardState {
  return JSON.parse(JSON.stringify(defaultCardState))
}

/** 将 Article 包装为 ArticleView */
export function toArticleView(article: Article): ArticleView {
  return { ...article, $state: freshState() }
}

/** 批量包装 */
export function toArticleViews(articles: Article[]): ArticleView[] {
  return articles.map(toArticleView)
}