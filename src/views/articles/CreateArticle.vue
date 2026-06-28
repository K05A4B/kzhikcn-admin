<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { apiv1 } from '@/api'
import { useFetch } from '@/composable'
import { useMessage } from '@/composable/use_naiveui_discrete_api'
import CategorySelect from '@/components/articles/CategorySelect.vue'
import ArticleStatusSelect from '@/components/articles/ArticleStatusSelect.vue'
import {
  NCard, NButton, NInput, NForm, NFormItem, NFormItemGi,
  NGrid, NSwitch, NDynamicTags, NSpin, NResult, NSpace, NDivider
} from 'naive-ui'
import { ArrowLeft, Edit, UnorderedList } from '@icon-park/vue-next'

const router = useRouter()
const message = useMessage()

type Step = 'form' | 'success'
const step = ref<Step>('form')
const createdId = ref('')

const form = ref({
  title: '',
  description: '',
  customID: '',
  category: undefined as apiv1.Category | undefined,
  status: 'draft' as string,
  enableComments: true,
  tags: [] as string[],
})

const { loading: creating, fetch: doCreate } = useFetch(
  () => apiv1.createArticle({
    title: form.value.title,
    description: form.value.description || undefined,
    customID: form.value.customID || undefined,
    category: form.value.category?.categoryName,
    status: form.value.status as any,
    enableComment: form.value.enableComments,
    tags: form.value.tags.length > 0 ? form.value.tags : undefined,
  }),
)

async function handleSubmit() {
  if (!form.value.title.trim()) {
    message.warning('请输入文章标题')
    return
  }

  const { fetch: create, response: resp } = useFetch(
    () => apiv1.createArticle({
      title: form.value.title,
      description: form.value.description || undefined,
      customID: form.value.customID || undefined,
      category: form.value.category?.categoryName,
      status: form.value.status as any,
      enableComment: form.value.enableComments,
      tags: form.value.tags.length > 0 ? form.value.tags : undefined,
    }),
  )
  await create()
  const data = resp.value?.data
  if (data) {
    createdId.value = data.id
    step.value = 'success'
    message.success('文章已创建')
  }
}

function goEdit() {
  router.push(`/article-editor/${createdId.value}`)
}

function goList() {
  router.push('/content/articles')
}

function goBack() {
  if (step.value === 'success') {
    step.value = 'form'
  } else {
    router.back()
  }
}

</script>

<template>
  <div class="create-page">
    <!-- 工具栏 -->
    <header class="create-toolbar">
      <NButton text @click="goBack">
        <template #icon><ArrowLeft /></template>
        返回
      </NButton>
      <div class="toolbar-title">新建文章</div>
      <div />
    </header>

    <!-- 创建表单 -->
    <div v-if="step === 'form'" class="create-body">
      <NCard :bordered="true" class="form-card">
        <NForm label-placement="top">
          <NFormItem label="文章标题">
            <NInput v-model:value="form.title" placeholder="请输入文章标题" size="large" />
          </NFormItem>

          <NFormItem label="描述">
            <NInput v-model:value="form.description" type="textarea" :rows="3" placeholder="文章描述（可选）" />
          </NFormItem>

          <NFormItem label="自定义 ID">
            <NInput v-model:value="form.customID" placeholder="自动生成（可选）" />
          </NFormItem>

          <NDivider />

          <NGrid cols="2" :x-gap="16">
            <NFormItemGi label="分类">
              <CategorySelect
                :category="form.category ?? { id: 0, categoryName: '', description: '' }"
                @update:category="c => form.category = c"
              />
            </NFormItemGi>

            <NFormItemGi label="状态">
              <ArticleStatusSelect
                @update="s => form.status = s"
              />
            </NFormItemGi>
          </NGrid>

          <NFormItem label="标签">
            <NDynamicTags v-model:value="form.tags" />
          </NFormItem>

          <NFormItem label="启用评论">
            <NSwitch v-model:value="form.enableComments" />
          </NFormItem>
        </NForm>

        <NDivider />

        <div class="form-actions">
          <NButton @click="router.back()">取消</NButton>
          <NButton type="primary" :loading="creating" @click="handleSubmit">创建文章</NButton>
        </div>
      </NCard>
    </div>

    <!-- 创建成功 -->
    <div v-else class="create-body">
      <NCard :bordered="true" class="success-card">
        <NResult
          status="success"
          title="文章已创建"
          :description="`「${form.title}」已保存为草稿`"
        >
          <template #footer>
            <NSpace justify="center" :size="16">
              <NButton type="primary" @click="goEdit">
                <template #icon><Edit /></template>
                现在编辑
              </NButton>
              <NButton secondary @click="goList">
                <template #icon><UnorderedList /></template>
                返回列表
              </NButton>
            </NSpace>
          </template>
        </NResult>
      </NCard>
    </div>
  </div>
</template>

<style scoped>
.create-page {
  max-width: 680px;
  margin: 0 auto;
}

.create-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-6);
}

.toolbar-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}

.create-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.form-card {
  overflow: hidden;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.success-card {
  overflow: hidden;
}
</style>
