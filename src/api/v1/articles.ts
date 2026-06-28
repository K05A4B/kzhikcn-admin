import { type Tag } from './tags'
import { httpClient } from '../interceptors'
import { type Category } from './categories'
import { type Resp } from '../response'

export type ArticleStatus = 'published' | 'draft' | 'hidden'
export type ArticleOrderBy = 'publishedAt' | 'createdAt' | 'updatedAt' | 'likes' | 'views' | 'publishedAt:desc' | 'createdAt:desc' | 'updatedAt:desc' | 'likes:desc' | 'views:desc'

export interface EditableArticle {
  title?: string,
  description?: string,
  coverImage?: string,
  enableComment?: boolean,
  tags?: string[],
  customID?: string,
  status?: ArticleStatus,
  category?: string,
}

export type CreateArticleBody = EditableArticle & Required<Pick<EditableArticle, 'title'>>

export interface Article {
  id: string
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  customID: string
  title: string
  views: number
  likes: number
  categoryID: number | null
  category: Category
  tags: Tag[]
  status: ArticleStatus
  description: string
  coverImage: string
  enableComment: boolean
}

export interface ArticleGeneralQuery {
  page?: number
  limit?: number
  orderBy?: ArticleOrderBy
  expr?: string
}


export function getArticle(articleID: string): Resp<Article> {
  return httpClient.get(`/v1/articles/${articleID}`)
}

export function getArticles(query?: ArticleGeneralQuery): Resp<Article[]> {
  return httpClient.get("/v1/articles", { params: query })
}

export function getDeletedArticles(query?: ArticleGeneralQuery): Resp<Article[]> {
  return httpClient.get("/v1/articles/trash-bin", { params: query })
}

export function createArticle(article: CreateArticleBody): Resp<Article> {
  return httpClient.post("/v1/articles", article)
}

export function updateArticle(articleID: string, article: EditableArticle): Resp<Article> {
  return httpClient.patch(`/v1/articles/${articleID}`, article)
}

export function deleteArticles(ids: string[], hardDelete: boolean = false): Resp<void> {
  return httpClient.delete("/v1/articles/batch-delete", { 
    data: { ids, hardDelete }
  })
}

export function restoreArticle(ids: string[]): Resp<void> {
  return httpClient.post(`/v1/articles/trash-bin/restore`, { ids })
}

// ── 文章内容 ──
export function getArticleRawContent(articleID: string): Resp<string> {
  return httpClient.get(`/v1/articles/${articleID}/raw-content`, {
    headers: { Accept: 'application/json' },
  })
}

export function updateArticleRawContent(articleID: string, content: string): Resp<void> {
  return httpClient.put(`/v1/articles/${articleID}/raw-content`, content, {
    headers: { 'Content-Type': 'text/plain' },
  })
}

export function getArticleRenderedContent(articleID: string): Resp<string> {
  return httpClient.get(`/v1/articles/${articleID}/content`, {
    headers: { Accept: 'application/json' },
  })
}

// ── 文章资源 ──
export function listArticleAssets(articleID: string): Resp<string[]> {
  return httpClient.get(`/v1/articles/${articleID}/assets`)
}

export function uploadArticleAsset(articleID: string, file: File): Resp<string> {
  const formData = new FormData()
  formData.append('file', file)
  return httpClient.post(`/v1/articles/${articleID}/assets`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function deleteArticleAsset(articleID: string, assetID: string): Resp<void> {
  return httpClient.delete(`/v1/articles/${articleID}/assets/${assetID}`)
}