import { httpClient } from '@/api/interceptors'
import type { Resp } from '../response'
import type { Article, ArticleGeneralQuery } from '@/api/v1/articles'

export interface Category {
  id: number
  categoryName: string
  description: string
}

export interface CategoryGeneralQuery {
  page?: number
  limit?: number
  expr?: string
}

export function getCategories(query?: CategoryGeneralQuery): Resp<Category[]> {
  return httpClient.get('/v1/categories', { params: query })
}

export interface CategoryWithArticles extends Category {
  articles: Article[]
}

export function getCategoryArticles(category: string, query?: ArticleGeneralQuery): Resp<CategoryWithArticles> {
  return httpClient.get(`/v1/categories/${category}/articles`, { params: query })
}

export interface EditableCategory {
  categoryName?: string
  description?: string
}

export function createCategory(data: { categoryName: string; description?: string }): Resp<Category> {
  return httpClient.post('/v1/categories', data)
}

export function updateCategory(categoryId: string, data: EditableCategory): Resp<void> {
  return httpClient.patch(`/v1/categories/${categoryId}`, data)
}

export function deleteCategories(ids: number[]): Resp<void> {
  return httpClient.delete('/v1/categories/batch-delete', { data: { ids } })
}