<script setup lang="ts">
import { NAvatar } from "naive-ui";
import { type PropType } from "vue"

const props = defineProps({
  info: {
    type: Object as PropType<{
      username: string,
      avatar: string,
    }|undefined>,
    default: () => ({})
  },
  size: {
    type: String as PropType<number | "small" | "medium" | "large">,
    default: () => "medium"
  }
})

</script>

<template>
  <NAvatar :src="props.info.avatar" :size="props.size" round color="var(--color-primary)" class="profile-avatar">
    <span v-if="!props.info.avatar">
      {{ props.info.username.charAt(0).toUpperCase() }}
    </span>
  </NAvatar>
</template>