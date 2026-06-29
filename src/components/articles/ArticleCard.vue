<script setup lang="ts">
import { NCard, NCheckbox, NEllipsis, NFlex, NTabs, NSwitch, NTabPane, NButtonGroup, NTable, NTag, NButton, NPopconfirm, NDynamicTags, NDivider } from 'naive-ui';
import EditableCell from '@/components/common/EditableCell.vue';
import { Like, Eyes, MemoryCardOne, DeleteFive } from "@icon-park/vue-next"
import { type ArticleView } from '@/composable/use_article_card_state'
import CategorySelect from '@/components/articles/CategorySelect.vue'
import { watch, type PropType, ref, computed } from 'vue'
import * as apiv1 from '@/api/v1'
import ArticleStatusSelect from './ArticleStatusSelect.vue';

type ShowElements = ("checkbox"|"actionButtons")[];

const props = defineProps({
  info: {
    type: Object as PropType<ArticleView>,
    required: true,
  },
  show: {
    type: Array as PropType<ShowElements>,
    default: () => ["checkbox", "actionButtons"],
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const activeTab = ref("description")
const emit = defineEmits<{
  (e: "check", id: string, checked: boolean): void,
  (e: "delete", id: string): void,
  (e: "update", id: string, options: apiv1.EditableArticle): void,
}>()

const tags = ref<string[]>([])
const disabled = computed(() => props.disabled)

const state = computed(() => {
  return props.info.$state
})

const loadings = computed(() => {
  return props.info.$state.loadings
})

watch(() => props.info.tags || [], value => {
  let result: string[] = []

  value.forEach(t => {
    result.push(t.tagName)
  })

  tags.value = result
}, { immediate: true })


const update = (options: apiv1.EditableArticle) => {
  return emit('update', props.info.id, options)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

</script>

<template>
  <NCard embedded>
    <template #header>
      <NFlex :wrap="false" align="center">
        <NCheckbox v-if="show.includes('checkbox')" :checked="state.checked" @change="checked => emit('check', info.id, checked)" />
        <NEllipsis style="width: 100%;">
          <EditableCell 
            :disabled="disabled || loadings.updates.title" 
            :loading="loadings.updates.title" 
            :value="info.title"
            @update="title => update({ title })"
          />
        </NEllipsis>
      </NFlex>

    </template>

    <NTabs animated v-model:value="activeTab">
      <NTabPane name="description" tab="描述">
        <EditableCell 
          :disabled="disabled || loadings.updates.description"
          type="textarea"
          :value="info.description"
          @update="description => update({ description })"
          :loading="loadings.updates.description"
        />
      </NTabPane>

      <NTabPane name="tags" tab="标签">
        <NDynamicTags loading :disabled="disabled" v-model:value="tags" />
      </NTabPane>

      <NTabPane name="more" tab="更多">
        <NTable size="small">
          <tr>
            <th>文章ID</th>
            <td>{{ info.id }}</td>
          </tr>
          <tr>
            <th>创建时间</th>
            <td>{{ formatDate(info.createdAt) }}</td>
          </tr>
          <tr>
            <th>更新时间</th>
            <td>{{ formatDate(info.updatedAt) }}</td>
          </tr>
          <tr>
            <th>发布时间</th>
            <td>{{ info.publishedAt ? formatDate(info.publishedAt) : "未发布" }}</td>
          </tr>
        </NTable>

        <NDivider size="small" title-placement="left">可编辑信息</NDivider>

        <NTable size="small">
          <tr>
            <th>自定义ID</th>
            <td>
              <EditableCell 
                size="small"
                :disabled="disabled || loadings.updates.customID" 
                :loading="loadings.updates.customID"
                :value="info.customID" 
                @update="customID => update({ customID })" 
              />
            </td>
          </tr>
          <tr>
            <th>分类</th>
            <td>
              <CategorySelect 
                size="small" 
                :loading="loadings.updates.category"
                :category="info.category"
                @update:category="category => update({ category: category.categoryName })"
                :disabled="disabled || loadings.updates.category"
              />
            </td>
          </tr>
          <tr>
            <th>文章封面</th>
            <td>
              <EditableCell 
                size="small"
                :disabled="disabled || loadings.updates.coverImage" 
                :loading="loadings.updates.coverImage"
                :value="info.coverImage" 
                empty-text="未设置"
                @update="coverImage => update({ coverImage })" 
              />
            </td>
          </tr>

          <tr>
            <th>启用评论</th>
            <td>
              <NSwitch 
                :disabled="disabled || loadings.updates.enableComment"
                :loading="loadings.updates.enableComment" 
                :value="info.enableComment"
                @update-value="enableComment => update({ enableComment })"
              />
            </td>
          </tr>
        </NTable>
        <NButton style="margin-top: 8px;" type="primary" secondary block size="small">打开文章资源管理器</NButton>
      </NTabPane>
    </NTabs>

    <template #footer>
      <NFlex justify="space-between">
        <NFlex size="small" :wrap="false" align="center">
          <NTag size="small" type="primary" title="点赞量">
            <Like /> {{ props.info.likes }}
          </NTag>

          <NTag size="small" type="primary" title="浏览量">
            <Eyes /> {{ props.info.views }}
          </NTag>

          <ArticleStatusSelect
            :loading="loadings.updates.status"
            size="small"
            style="min-width: 110px;"
            :disabled="disabled || loadings.updates.status"
            :value="info.status"
            @update="status => update({ status })"
          />

        </NFlex>

        <NFlex gap="4">
          <NButtonGroup>
            <NButton :loading="loadings.updates.tags" :disabled="disabled || loadings.updates.tags" size="small"
              type="primary" title="更新标签" tertiary v-if="activeTab === 'tags'"
              @click="update({ tags })">
              <MemoryCardOne />
            </NButton>
          </NButtonGroup>

          <NButtonGroup v-if="show.includes('actionButtons')">
            <slot name="action-buttons" />

            <NPopconfirm animated positive-text="确认" @positive-click="emit('delete', info.id)"
              negative-text="取消">
              <template #trigger>
                <NButton title="删除文章" :loading="loadings.delete" :disabled="loadings.delete" secondary size="small" align="center"
                  type="error">
                  <DeleteFive />
                </NButton>
              </template>

              <span>你确定要删除这篇文章吗？</span>
            </NPopconfirm>
          </NButtonGroup>
        </NFlex>
      </NFlex>
    </template>
  </NCard>
</template>