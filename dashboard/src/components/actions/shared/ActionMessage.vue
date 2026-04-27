<template>
  <a-alert v-if="message || html" :type="alertType" show-icon>
    <template #title>
      <span v-if="html" v-html="html"></span>
      <span v-else>{{ message }}</span>
    </template>
  </a-alert>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  message: { type: String, default: '' },
  html: { type: String, default: '' },
  type: { type: String, default: 'info' }
})

const alertType = computed(() => {
  if (props.type === 'error') return 'error'
  if (props.type === 'success') return 'success'
  if (props.type === 'warning') return 'warning'
  return 'info'
})
</script>
