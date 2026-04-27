<template>
  <ActionShell
    :visible="visible"
    :title="config.title"
    :width="config.width || 480"
    :height="config.height"
    :canceled-on-touch-outside="!config.keep"
    :module="module"
    :extend="extend"
    :api-url="apiUrl"
    @close="handleClose"
    @toast="(message, type) => emit('toast', message, type)"
    @reset="() => emit('reset')"
  >
    <a-space class="msgbox-action" direction="vertical" fill size="medium">
      <a-result v-if="showIcon" :status="resultStatus" :title="resultTitle" />

      <ActionMessage
        v-if="config.msg || config.htmlMsg"
        :html="formatMessage(config.htmlMsg || config.msg)"
        :type="messageType"
      />

      <ActionMessage
        v-if="config.detail"
        :html="formatMessage(config.detail)"
        type="info"
      />

      <ActionMedia
        :image-url="config.imageUrl"
        :image-height="config.imageHeight || 200"
        :qrcode="config.qrcode"
        :qrcode-size="config.qrcodeSize"
      />

      <a-card v-if="config.showProgress" size="small" title="进度">
        <a-progress :percent="progressPercent / 100" :show-text="false" />
        <a-typography-text type="secondary">{{ progressText }}</a-typography-text>
      </a-card>

      <a-list v-if="config.list?.length" size="small" bordered>
        <template #header>详细信息</template>
        <a-list-item v-for="(item, index) in config.list" :key="index">
          {{ item }}
        </a-list-item>
      </a-list>

      <ActionTimeout
        v-if="config.timeout"
        :time-left="timeLeft"
        :total="Number(config.timeout) || 0"
      />
    </a-space>

    <template #footer>
      <ActionFooter
        :show-ok="showOkButton"
        :show-cancel="showCancelButton"
        :ok-text="config.okText || '确定'"
        :cancel-text="config.cancelText || '取消'"
        @ok="handleOk"
        @cancel="handleCancel"
      />
    </template>
  </ActionShell>
</template>

<script>
import { computed, ref, watch, onUnmounted } from 'vue'
import { ButtonType, normalizeButtonType } from './types.js'
import ActionShell from './shared/ActionShell.vue'
import ActionMessage from './shared/ActionMessage.vue'
import ActionMedia from './shared/ActionMedia.vue'
import ActionTimeout from './shared/ActionTimeout.vue'
import ActionFooter from './shared/ActionFooter.vue'

export default {
  name: 'MsgBoxAction',
  components: {
    ActionShell,
    ActionMessage,
    ActionMedia,
    ActionTimeout,
    ActionFooter
  },
  props: {
    config: {
      type: Object,
      required: true
    },
    visible: {
      type: Boolean,
      default: true
    },
    module: {
      type: String,
      default: ''
    },
    extend: {
      type: [Object, String],
      default: () => ({})
    },
    apiUrl: {
      type: String,
      default: ''
    }
  },
  emits: ['submit', 'cancel', 'close', 'action', 'toast', 'reset', 'special-action'],
  setup(props, { emit }) {
    const timeLeft = ref(0)
    const progressPercent = ref(0)
    let timeoutTimer = null
    let progressTimer = null

    const showIcon = computed(() => props.config.icon !== false && props.config.type !== 'plain')

    const iconType = computed(() => {
      const validTypes = ['info', 'success', 'warning', 'error', 'question']
      return validTypes.includes(props.config.type) ? props.config.type : 'info'
    })

    const resultStatus = computed(() => {
      if (iconType.value === 'question') return 'info'
      return iconType.value
    })

    const resultTitle = computed(() => props.config.title || '')

    const messageType = computed(() => iconType.value === 'question' ? 'info' : iconType.value)

    const showOkButton = computed(() => {
      const button = normalizeButtonType(props.config.button)
      return button === ButtonType.OK_CANCEL || button === ButtonType.OK_ONLY || button === ButtonType.CUSTOM
    })

    const showCancelButton = computed(() => {
      const button = normalizeButtonType(props.config.button)
      return button === ButtonType.OK_CANCEL || button === ButtonType.CANCEL_ONLY || button === ButtonType.CUSTOM
    })

    const progressText = computed(() => {
      if (props.config.progressText) {
        return props.config.progressText.replace('{percent}', Math.round(progressPercent.value))
      }
      return `${Math.round(progressPercent.value)}%`
    })

    const formatMessage = (message) => {
      if (!message) return ''
      if (/<[^>]+>/.test(message)) return message
      return message
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
    }

    const stopTimeout = () => {
      if (timeoutTimer) {
        clearInterval(timeoutTimer)
        timeoutTimer = null
      }
      timeLeft.value = 0
    }

    const startTimeout = () => {
      stopTimeout()
      const timeout = Number(props.config.timeout) || 0
      if (timeout <= 0) return

      timeLeft.value = timeout
      timeoutTimer = setInterval(() => {
        timeLeft.value -= 1
        if (timeLeft.value <= 0) {
          stopTimeout()
          handleCancel()
        }
      }, 1000)
    }

    const stopProgress = () => {
      if (progressTimer) {
        clearInterval(progressTimer)
        progressTimer = null
      }
      progressPercent.value = 0
    }

    const startProgress = () => {
      stopProgress()
      if (!props.config.showProgress) return

      const duration = props.config.progressDuration || 5000
      const interval = 50
      const step = (100 / duration) * interval

      progressTimer = setInterval(() => {
        progressPercent.value = Math.min(100, progressPercent.value + step)
        if (progressPercent.value >= 100) {
          clearInterval(progressTimer)
          progressTimer = null
          if (props.config.onProgressComplete) {
            handleOk()
          }
        }
      }, interval)
    }

    const resetTimers = () => {
      if (props.visible) {
        startTimeout()
        startProgress()
      } else {
        stopTimeout()
        stopProgress()
      }
    }

    const handleOk = () => {
      emit('submit', { action: 'ok' })
    }

    const handleCancel = () => {
      emit('cancel')
      emit('close')
    }

    const handleClose = () => {
      emit('close')
    }

    watch(() => props.config, resetTimers, { immediate: true })
    watch(() => props.visible, resetTimers)

    onUnmounted(() => {
      stopTimeout()
      stopProgress()
    })

    return {
      timeLeft,
      progressPercent,
      resultStatus,
      resultTitle,
      messageType,
      showOkButton,
      showCancelButton,
      progressText,
      formatMessage,
      handleOk,
      handleCancel,
      handleClose
    }
  }
}
</script>

<style scoped>
.msgbox-action {
  width: 100%;
}
</style>
