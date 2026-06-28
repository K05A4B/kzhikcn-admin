<script setup lang="ts">
import { DeleteFive } from '@icon-park/vue-next';
import { NButton, NFlex, NButtonGroup, NCheckbox, NSelect, NInput, NInputGroup, NPopconfirm } from 'naive-ui';
import * as apiv1 from '@/api/v1'
import { ref } from 'vue'

defineProps({
  checkedAll: {
    type: Boolean,
    required: true
  },
  orderBy: {
    type: String,
    default: "publishedAt:desc",
  },
})

const expression = ref<string|undefined>(undefined)

const emit = defineEmits<{
  (e: 'checkAll', checked: boolean): void
  (e: 'deleteChecked',): void
  (e: 'updateOrderBy', orderBy: apiv1.ArticleOrderBy): void
  (e: 'updateExpression', filter: string|undefined): void
}>()

const orderBySelectOptions = [
  { label: '创建时间', value: 'createdAt' },
  { label: '更新时间', value: 'updatedAt' },
  { label: '发布时间', value: 'publishedAt' },
  { label: '点赞数', value: 'likes' },
  { label: '浏览量', value: 'views' },

  { label: '创建时间（降序）', value: 'createdAt:desc' },
  { label: '更新时间（降序）', value: 'updatedAt:desc' },
  { label: '发布时间（降序）', value: 'publishedAt:desc' },
  { label: '点赞数（降序）', value: 'likes:desc' },
  { label: '浏览量（降序）', value: 'views:desc' },
]

const onKeyup = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    emit('updateExpression', expression.value)
  }
}
</script>

<template>
  <NFlex align="center" :wrap="false">
    <NCheckbox :checked="checkedAll" @change="checked => emit('checkAll', checked)" />

    <NButtonGroup size="small">
      <slot name="buttons"/>
      <NPopconfirm animated positive-text="确认" @positive-click="emit('deleteChecked')"
        negative-text="取消">
        <template #trigger>
          <NButton title="删除选中文章" secondary size="small" align="center" type="error">
            <DeleteFive />
          </NButton>
        </template>

        <span>你确定要删除选中文章吗？</span>
      </NPopconfirm>
    </NButtonGroup>

    <NSelect :options="orderBySelectOptions" :value="orderBy" @change="orderBy => emit('updateOrderBy', orderBy)" default-value="createdAt:desc" size="small" style="max-width: 160px;"></NSelect>
    <NInputGroup>
      <NInput @keyup="onKeyup" style="width: 100%;" clearable size="small" v-model:value="expression" placeholder="过滤器"></NInput>
      <NButton type="primary" size="small" secondary @click="emit('updateExpression', expression)">应用</NButton>
    </NInputGroup>
  </NFlex>
</template>
