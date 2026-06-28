<script setup lang="ts">
import { NButton, NResult, NSpace } from 'naive-ui';
import { useRouter } from 'vue-router';

const router = useRouter()
</script>

<template>
  <NResult status="404" title="404 NOT FOUND" size="large" description="您访问的页面不存在">
    <NSpace justify="center">
      <NButton @click="router.back" type="primary" size="large">返回</NButton>
      <NButton @click="router.push('/')" size="large">仪表盘</NButton>
    </NSpace>
  </NResult>
</template>