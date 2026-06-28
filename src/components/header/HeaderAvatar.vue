<script setup lang="ts">
import { NDropdown, NIcon, NSkeleton } from "naive-ui";
import UserAvatar from "../common/UserAvatar.vue";
import { h, type Component, type PropType } from "vue"
import { Logout, User } from "@icon-park/vue-next";
import { useRouter } from "vue-router";

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

const emit = defineEmits(["logout"])

function renderIcon(icon: Component) {
  return () => {
    return h(NIcon, null, {
      default: () => h(icon)
    })
  }
}

const options = [
  {
    label: '资料管理',
    key: 'profile',
    icon: renderIcon(User)
  },
  {
    label: "注销",
    key: "logout",
    icon: renderIcon(Logout)
  }
]

const router = useRouter()

const onSelect = (key: string | number) => {
  switch (key) {
    case "profile":
      router.push("/settings/profile")
      break

    case "logout":
      emit("logout")
      break
  }
}

</script>

<template>
  <NSkeleton v-if="props.info == null" round height="100%" />
  <NDropdown v-if="props.info != null" :show-arrow="true" @select="onSelect" :options="options">
    <UserAvatar :info="props.info" :size="props.size" />
  </NDropdown>
</template>