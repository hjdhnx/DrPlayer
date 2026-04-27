<template>
  <a-space v-if="imageUrl || qrcode" direction="vertical" fill align="center" size="medium">
    <a-image
      v-if="imageUrl"
      :src="imageUrl"
      :height="imageHeight || undefined"
      fit="contain"
      show-loader
      @click="handleImageClick"
    />

    <a-card v-if="qrcode" :bordered="true" class="action-qrcode-card">
      <a-image :src="qrcodeUrl" :preview="false" fit="contain" />
    </a-card>
  </a-space>
</template>

<script setup>
import { computed } from 'vue'
import { generateQRCodeUrl } from '../types.js'

const props = defineProps({
  imageUrl: { type: String, default: '' },
  imageHeight: { type: [Number, String], default: '' },
  imageClickCoord: { type: Boolean, default: false },
  qrcode: { type: String, default: '' },
  qrcodeSize: { type: String, default: '200x200' }
})

const emit = defineEmits(['image-click'])
const qrcodeUrl = computed(() => props.qrcode ? generateQRCodeUrl(props.qrcode, props.qrcodeSize) : '')

const handleImageClick = (event) => {
  if (!props.imageClickCoord) {
    emit('image-click', event)
    return
  }

  const target = event?.target?.closest?.('.arco-image') || event?.currentTarget
  const rect = target?.getBoundingClientRect?.()
  if (!rect) {
    emit('image-click', event)
    return
  }

  emit('image-click', {
    x: Math.round(event.clientX - rect.left),
    y: Math.round(event.clientY - rect.top),
    width: Math.round(rect.width),
    height: Math.round(rect.height)
  })
}
</script>

<style scoped>
.action-qrcode-card {
  background: var(--action-qr-bg);
}
</style>
