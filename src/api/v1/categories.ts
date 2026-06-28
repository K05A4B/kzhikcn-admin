import { httpClient } from '@/api/interceptors'
import type { Resp } from '../response'

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