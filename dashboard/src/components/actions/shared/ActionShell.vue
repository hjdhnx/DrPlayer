<template>
  <a-modal
    :visible="visible"
    :title="title"
    :width="width"
    :modal-class="customClass"
    :mask-closable="canceledOnTouchOutside"
    :esc-to-close="escapeToClose"
    :hide-cancel="true"
    :footer="$slots.footer ? undefined : false"
    unmount-on-close
    @cancel="emit('close')"
  >
    <template v-if="$slots.header" #title>
      <slot name="header" />
    </template>

    <slot />

    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </a-modal>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '' },
  width: { type: [Number, String], default: 420 },
  height: { type: [Number, String], default: 'auto' },
  bottom: { type: Number, default: 0 },
  canceledOnTouchOutside: { type: Boolean, default: true },
  showClose: { type: Boolean, default: true },
  escapeToClose: { type: Boolean, default: true },
  resizable: { type: Boolean, default: false },
  customClass: { type: String, default: '' },
  module: { type: String, default: '' },
  extend: { type: [Object, String], default: () => ({}) },
  apiUrl: { type: String, default: '' }
})

const emit = defineEmits(['close', 'toast', 'reset'])
</script>
