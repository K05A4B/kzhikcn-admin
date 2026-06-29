<script lang="ts" setup>
import Fullscreen from "./Fullscreen.vue";
import HeaderAvatar from "./HeaderAvatar.vue";
import SwitchThemes from "./SwitchThemes.vue";

import type { PropType } from "vue"
import type { UserInfo } from "@/api/v1"
import { useAuthStore } from "@/stores/auth.ts";

const props = defineProps({
  userInfo: {
    type: Object as PropType<UserInfo | null>,
  }
})

const authStore = useAuthStore()

const defaultUserInfo: UserInfo = {
  avatar: "",
  email: "",
  enableMFA: false,
  id: -1,
  username: "登录失败",
}



</script>

<template>
  <header>
    <div class="header-wrapper">
      <div class="title-wrapper">
        <h1 class="title">管理面板</h1>
      </div>
      <div class="actions-wrapper">
        <SwitchThemes />
        <Fullscreen />
        <HeaderAvatar @logout="authStore.revokeToken" size="medium" :info="props.userInfo || defaultUserInfo" />
      </div>
    </div>
  </header>
</template>

<style scoped>
header {
  height: var(--header-height);
  background: var(--color-header-bg);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  padding: 0 var(--spacing-5);
  transition: background var(--transition-normal), border-color var(--transition-normal);
}

.header-wrapper {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title-wrapper {
  display: inline-block;
}

.title {
  margin: 0;
  padding: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--theme-color);
  letter-spacing: -0.01em;
}

.actions-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-2);
}

.actions-wrapper>* {
  font-size: 20px;
  cursor: pointer;
}
</style>