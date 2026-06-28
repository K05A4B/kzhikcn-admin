<script setup lang="ts">
import { NForm, NFormItem, NInput, NDynamicTags, NGrid, NFormItemGi, NSwitch, NButton } from 'naive-ui';
import CategorySelect from './CategorySelect.vue';
import ArticleStatusSelect from './ArticleStatusSelect.vue';
import { ref } from 'vue';
import { apiv1 } from '@/api';
import { useTemplateRef } from 'vue';

const formRef = useTemplateRef("formRef")

const form = ref({
  title: '',
  description: '',
  customID: '',
  category: undefined as apiv1.Category | undefined,
  status: 'draft',
  enableComments: true,
  tags: [],
})

const rule = {
  title: [
    { required: true, message: '请输入文章标题' }
  ],
}

const emit = defineEmits(['submit'])

const onSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate()
  emit('submit', form.value)
}
</script>

<template>
  <NForm :model="form" :rules="rule" ref="formRef">
    <NFormItem label="文章标题" path="title">
      <NInput v-model:value="form.title" placeholder="请输入文章标题" />
    </NFormItem>
    
    <NFormItem label="描述" path="description">
      <NInput type="textarea" v-model:value="form.description" placeholder="请输入文章描述" />
    </NFormItem>

    <NFormItem label="自定义ID" path="customID">
      <NInput v-model:value="form.customID" placeholder="请输入自定义ID" />
    </NFormItem>

    <NGrid cols="4" x-gap="16px">
      <NFormItemGi span="2" label="分类" path="category">
        <CategorySelect :category="form.category" @update:category="c => form.category = c" />
      </NFormItemGi>

      <NFormItemGi span="1" label="状态" path="status">
        <ArticleStatusSelect v-model:value="form.status" default-value="draft" />
      </NFormItemGi>

      <NFormItemGi span="1" label="启用评论" path="enableComments">
        <NSwitch v-model:value="form.enableComments" />
      </NFormItemGi>
    </NGrid>

    <NFormItem label="标签" path="tags">
      <NDynamicTags v-model:value="form.tags" />
    </NFormItem>

    <NButton type="primary" @click="onSubmit">创建</NButton>
  </NForm>
</template>
