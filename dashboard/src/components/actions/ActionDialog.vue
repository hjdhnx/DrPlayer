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
    @before-open="emit('open')"
    @open="emit('opened')"
    @before-close="emit('closed')"
    @cancel="handleClose"
  >
    <template v-if="$slots.header" #title>
      <slot name="header" />
    </template>

    <div class="action-dialog-content" :style="contentStyle">
      <slot />
    </div>

    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </a-modal>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'ActionDialog',
  props: {
    visible: { type: Boolean, default: false },
    title: { type: String, default: '' },
    width: { type: [Number, String], default: 400 },
    height: { type: [Number, String], default: 'auto' },
    bottom: { type: Number, default: 0 },
    canceledOnTouchOutside: { type: Boolean, default: true },
    dimAmount: { type: Number, default: 0.45 },
    showClose: { type: Boolean, default: true },
    escapeToClose: { type: Boolean, default: true },
    resizable: { type: Boolean, default: false },
    customClass: { type: String, default: '' },
    module: { type: String, default: '' },
    extend: { type: [Object, String], default: () => ({}) },
    apiUrl: { type: String, default: '' }
  },
  emits: ['update:visible', 'close', 'open', 'opened', 'closed', 'toast', 'reset'],
  setup(props, { emit }) {
    const contentStyle = computed(() => {
      if (!props.height || props.height === 'auto') return {}
      const height = typeof props.height === 'number' ? `${props.height}px` : props.height
      return {
        maxHeight: `calc(${height} - 120px)`,
        overflowY: 'auto'
      }
    })

    const handleClose = () => {
      emit('close')
      emit('update:visible', false)
    }

    return {
      emit,
      contentStyle,
      handleClose
    }
  }
}
</script>

<style scoped>
.action-dialog-content {
  min-height: 0;
}
</style>
