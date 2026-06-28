<script setup lang="ts">
import HeaderComponent from '@/components/header/HeaderComponent.vue';
import SidebarComponent from '@/components/layouts/SidebarComponent.vue';
import TabComponents from '@/components/layouts/TabComponents.vue';
import LoadingComponent from '@/components/layouts/LoadingComponent.vue';
import { useUserStore } from '@/stores/user';
import { NLayoutContent, NLayoutHeader, NLayout, NScrollbar, NBackTop } from 'naive-ui';
import { usePanelStore } from '@/stores/panel';
import { useRoute } from 'vue-router';

const userStore = useUserStore()
const panelStore = usePanelStore()
const route = useRoute()

</script>

<template>
  <div class="main-layout">
    <NLayoutHeader>
      <HeaderComponent :user-info="userStore.userInfo" />
    </NLayoutHeader>
    <NLayout has-sider class="content-layout">
      <SidebarComponent />

      <NLayoutContent embedded id="view">
        <NScrollbar>
          <TabComponents />
          <LoadingComponent v-if="panelStore.viewLoading" />
          <div v-else class="page-content">
            <Transition name="page" mode="out-in">
              <slot :key="route.path" />
            </Transition>
          </div>

          <NBackTop :right="24" :bottom="120" />

        </NScrollbar>
      </NLayoutContent>
    </NLayout>
  </div>
</template>

<style scoped>
.main-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.content-layout {
  height: 100%;
}

.page-content {
  padding: var(--content-padding);
  min-height: 200px;
}
</style>