<script setup lang="ts">
import { NButton } from 'naive-ui';
import { Clear } from '@icon-park/vue-next';
</script>

<template>
  <NButton strong secondary circle class="action" title="清除缓存">
    <Clear/>
  </NButton>
</template>