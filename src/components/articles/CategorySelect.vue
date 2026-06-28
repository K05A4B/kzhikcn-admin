<script setup lang="ts">
import { NSelect } from 'naive-ui';
import { useCategoriesStore } from '@/stores/categories';
import { computed, type PropType, onMounted, useAttrs } from 'vue';
import { type Category } from '@/api/v1/categories';

const props = defineProps({
  category: {
    type: Object as PropType<Category>,
    default: () => ({
      id: 0,
      categoryName: '',
      description: '',
    }),
  }
})

const emit = defineEmits<{
  (e: 'update:category', category: Category): void
}>()

const attrs = useAttrs()
const categoriesStore = useCategoriesStore()

const options = computed(() => categoriesStore.categories.map((category) => ({
  label: category.categoryName,
  value: category.id,
})) || [])

function onScroll(ev: Event) {
  const currentTarget = ev.currentTarget as HTMLElement
  const offset = currentTarget.scrollTop + currentTarget.offsetHeight
  const threshold = currentTarget.scrollHeight - 10
  if (offset >= threshold) {
    categoriesStore.loadMore()
  }
}

onMounted(() => {
  if (props.category.id != 0) {
    categoriesStore.push(props.category)
  }
})
</script>

<template>
  <NSelect 
    v-bind="attrs"
    filterable
    :options="options"
    :loading="categoriesStore.loading"
    :value="category.id != 0 ? category.id : null"
    :reset-menu-on-options-change="false"
    placeholder="未选择分类"
    @update:value="val => emit('update:category', categoriesStore.categories.find((category) => category.id == val) || props.category)"
    @scroll="onScroll"
  />
</template> 