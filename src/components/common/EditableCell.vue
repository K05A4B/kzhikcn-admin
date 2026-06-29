<script setup lang="ts">
import { ref, useAttrs, useTemplateRef, nextTick } from "vue"
import { NInput, NEllipsis, NSpin, NFlex } from "naive-ui"

const props = defineProps({
  value: {
    type: String,
    required: true
  },
  emptyText: {
    type: String,
    default: "无内容..."
  },
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const attr = useAttrs()
const inputRef = useTemplateRef("inputRef")

const emit = defineEmits<{
  (e: "update", value: string): void
}>()

const isEdit = ref(false)
const value = ref(props.value)

const onCellClick = () => {
  if (props.disabled || props.loading) {
    return
  }
  value.value = props.value
  isEdit.value = true
  nextTick(() => {
    inputRef.value?.focus()
  })
}

const onBlur = () => {
  isEdit.value = false
  emit("update", value.value)
}
</script>

<template>
  <div class="cell" @click="onCellClick">
    <NInput v-if="isEdit" ref="inputRef" v-bind="attr" @blur="onBlur" v-model:value="value" />
    <NFlex v-else>
      <NSpin :show="loading" :size="16" >
        <NEllipsis style="width: 100%;">
          {{ props.value || emptyText }}
        </NEllipsis>
      </NSpin>
    </NFlex>
  </div>
</template>