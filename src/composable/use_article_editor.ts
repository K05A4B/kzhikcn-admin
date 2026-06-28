import { ref, computed } from 'vue'
import { apiv1 } from '@/api'
import type { Article, EditableArticle } from '@/api/v1'
import { useFetch } from '@/composable/use_fetch'
import { useMessage } from '@/composable/use_naiveui_discrete_api'

export function useArticleEditor(articleId: string) {
  const message = useMessage()
  const article = ref<Article | null>(null)
  const title = ref('')
  const content = ref('')
  const isDirty = ref(false)
  const initialContent = ref('')
  const saving = ref(false)

  // ── 加载文章元数据 ──
  const {
    loading: loadingMeta,
    fetch: doLoadMeta,
    response: metaResp,
  } = useFetch(() => apiv1.getArticle(articleId), { showError: false })

  // ── 加载正文 ──
  const {
    loading: loadingContent,
    fetch: doLoadContent,
    response: contentResp,
    error: contentError,
  } = useFetch(() => apiv1.getArticleRawContent(articleId), { showError: false })

  async function load() {
    await doLoadMeta()
    const a = metaResp.value?.data
    if (a) {
      article.value = a
      title.value = a.title
    }

    await doLoadContent()
    const raw = contentResp.value?.data
    if (raw !== undefined && raw !== null) {
      content.value = String(raw)
      initialContent.value = String(raw)
    }
  }

  // ── 保存 ──
  async function save(status?: 'draft' | 'published') {
    saving.value = true
    try {
      const meta: EditableArticle = { title: title.value }
      if (article.value) {
        meta.description = article.value.description || undefined
        meta.customID = article.value.customID || undefined
        meta.category = article.value.category?.categoryName || undefined
        meta.enableComment = article.value.enableComment
        meta.tags = article.value.tags?.map(t => t.tagName) || undefined
      }
      if (status) meta.status = status

      const { fetch: doSaveMeta } = useFetch(() => apiv1.updateArticle(articleId, meta))
      await doSaveMeta()

      if (content.value !== initialContent.value) {
        const { fetch: doSaveContent } = useFetch(
          () => apiv1.updateArticleRawContent(articleId, content.value),
        )
        await doSaveContent()
      }

      message.success('已保存')
      isDirty.value = false
      initialContent.value = content.value
    } finally {
      saving.value = false
    }
  }

  function markDirty() {
    isDirty.value = true
  }

  const loading = computed(() => loadingMeta.value || loadingContent.value)

  return {
    article, title, content, isDirty,
    loading, saving,
    loadError: contentError,
    load, save, markDirty,
  }
}
