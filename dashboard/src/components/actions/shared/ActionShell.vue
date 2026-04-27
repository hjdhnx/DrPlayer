<template>
  <a-modal
    :visible="visible"
    :title="title"
    :width="width"
    :modal-class="['action-shell-modal', customClass].filter(Boolean).join(' ')"
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

<style>
.action-shell-modal .arco-modal-header {
  padding: 14px 18px 10px;
  border-bottom: 1px solid var(--color-border-2);
}

.action-shell-modal .arco-modal-title {
  font-size: 16px;
  font-weight: 600;
}

.action-shell-modal .arco-modal-body {
  padding: 14px 18px;
}

.action-shell-modal .arco-modal-footer {
  padding: 10px 18px 14px;
  border-top: 1px solid var(--color-border-2);
}

.action-shell-modal .arco-form-item {
  margin-bottom: 10px;
}

.action-shell-modal .arco-form-item:last-child {
  margin-bottom: 0;
}

.action-shell-modal .arco-form-item-label-col {
  margin-bottom: 4px;
}

.action-shell-modal .arco-card-size-small .arco-card-body {
  padding: 10px 12px;
}

@media (max-width: 768px) {
  .action-shell-modal {
    width: calc(100vw - 24px) !important;
    max-width: calc(100vw - 24px);
  }

  .action-shell-modal .arco-modal-header {
    padding: 12px 14px 8px;
  }

  .action-shell-modal .arco-modal-body {
    padding: 12px 14px;
  }

  .action-shell-modal .arco-modal-footer {
    padding: 8px 14px 12px;
  }
}
</style>
