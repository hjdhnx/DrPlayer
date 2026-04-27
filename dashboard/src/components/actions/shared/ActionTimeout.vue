<template>
  <a-space v-if="timeLeft > 0" direction="vertical" fill size="mini">
    <a-typography-text type="secondary">{{ timeLeft }} 秒后自动关闭</a-typography-text>
    <a-progress :percent="percent" :show-text="false" size="small" />
  </a-space>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  timeLeft: { type: Number, default: 0 },
  total: { type: Number, default: 0 }
})

const percent = computed(() => {
  const total = Number(props.total) || Number(props.timeLeft) || 1
  return Math.max(0, Math.min(1, props.timeLeft / total))
})
</script>
