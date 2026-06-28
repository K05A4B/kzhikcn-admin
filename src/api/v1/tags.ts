import { httpClient } from '@/api/interceptors'
import type { Resp } from '../response'

export interface Tag {
  id: number
  tagName: string
}

export interface TagGeneralQuery {
  page?: number
  limit?: number
  expr?: string
}

export function getTags(query?: TagGeneralQuery): Resp<Tag[]> {
  return httpClient.get('/v1/tags', { params: query })
}

export interface EditableTag {
  tagName?: string
}

export function updateTag(tagId: string, tag: EditableTag): Resp<void> {
  return httpClient.patch(`/v1/tags/${tagId}`, tag)
}

export function deleteTags(ids: number[]): Resp<void> {
  return httpClient.delete('/v1/tags/batch-delete', { data: { ids } })
}