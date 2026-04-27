<template>
  <div class="action-footer">
    <a-space wrap>
      <a-button v-if="showCancel" @click="emit('cancel')">
        {{ cancelText }}
      </a-button>
      <a-button v-if="showReset" @click="emit('reset')">
        {{ resetText }}
      </a-button>
      <a-button v-if="showOk" type="primary" :disabled="disabled" @click="emit('ok')">
        {{ okText }}
      </a-button>
    </a-space>
  </div>
</template>

<script setup>
defineProps({
  showOk: { type: Boolean, default: true },
  showCancel: { type: Boolean, default: true },
  showReset: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  okText: { type: String, default: '确定' },
  cancelText: { type: String, default: '取消' },
  resetText: { type: String, default: '重置' }
})

const emit = defineEmits(['ok', 'cancel', 'reset'])
</script>

<style scoped>
.action-footer {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}
</style>
