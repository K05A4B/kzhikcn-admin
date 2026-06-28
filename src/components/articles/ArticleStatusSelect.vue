<script setup lang="ts">
import { NSelect, NIcon, type SelectOption } from 'naive-ui';
import { h, type VNodeChild, type VNode } from 'vue'
import { Editor, Eyes, PreviewCloseOne } from "@icon-park/vue-next"

const options = [
  { label: "草稿", value: "draft" },
  { label: "已发布", value: "published" },
  { label: "隐藏", value: "hidden" },
]

const renderOption = (option: SelectOption): VNodeChild =>  {
  let icon: VNode;
  switch (option.value) {
    case "draft":
      icon = h(PreviewCloseOne)
      break
    case "published":
      icon = h(Eyes)
      break
    case "hidden":
      icon = h(Editor)
      break
  }

  return [
    h(
      NIcon,
      {
        style: {
          verticalAlign: '-0.15em',
          marginRight: '4px'
        }
      },
      {
        default: () => icon
      }
    ),
    option.label as string
  ]
}

const emit = defineEmits<{
  (e: "update", status: string): void,
}>()
</script>

<template>
  <NSelect 
    @change="status => emit('update', status)" 
    :options="options"
    :render-label="renderOption"
  />
</template>