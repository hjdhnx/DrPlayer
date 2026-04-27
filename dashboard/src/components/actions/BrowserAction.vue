<template>
  <ActionShell
    :visible="visible"
    :title="dialogTitle"
    :width="dialogWidth"
    :height="dialogHeight"
    :canceled-on-touch-outside="!config.keep"
    :show-close="true"
    :custom-class="dialogClass"
    :module="module"
    :extend="extend"
    :api-url="apiUrl"
    @close="handleClose"
    @toast="(message, type) => emit('toast', message, type)"
    @reset="() => emit('reset')"
  >
    <a-space class="browser-action" direction="vertical" fill size="small">
      <a-space class="browser-toolbar" fill wrap>
        <a-input
          :model-value="currentUrl || '未提供网址'"
          readonly
          class="browser-address"
        />
        <a-space wrap>
          <a-button @click="toggleOrientation">{{ orientationLabel }}</a-button>
          <a-button :disabled="!currentUrl" @click="reload">刷新</a-button>
          <a-button type="primary" :disabled="!currentUrl" @click="openExternal">外部打开</a-button>
        </a-space>
      </a-space>

      <a-alert v-if="currentUrl" type="warning" show-icon>
        如果页面空白或提示拒绝连接，说明目标站点禁止 iframe 内嵌，请使用“外部打开”。
      </a-alert>

      <div class="browser-frame-wrap">
        <a-empty v-if="!currentUrl" description="browser action 需要提供 url 字段。" />

        <a-result v-else-if="hasError" status="warning" title="该网站禁止内嵌打开">
          <template #subtitle>
            目标站点可能设置了 X-Frame-Options 或 CSP frame-ancestors，浏览器会拒绝在 iframe 中显示。
          </template>
          <template #extra>
            <a-space>
              <a-button @click="reload">重新加载</a-button>
              <a-button type="primary" @click="openExternal">外部打开</a-button>
            </a-space>
          </template>
        </a-result>

        <a-spin v-else-if="isLoading" tip="正在加载网页..." class="browser-loading" />

        <iframe
          v-if="currentUrl"
          v-show="!hasError"
          ref="browserFrame"
          :key="frameKey"
          :src="currentUrl"
          class="browser-frame"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
          referrerpolicy="no-referrer-when-downgrade"
          @load="handleFrameLoad"
          @error="handleFrameError"
        ></iframe>
      </div>
    </a-space>
  </ActionShell>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import ActionShell from './shared/ActionShell.vue'

const props = defineProps({
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
})

const emit = defineEmits(['submit', 'cancel', 'close', 'action', 'toast', 'reset', 'special-action'])

const browserFrame = ref(null)
const frameKey = ref(0)
const isLoading = ref(false)
const hasError = ref(false)
const orientation = ref('landscape')

const dialogTitle = computed(() => props.config.title || '浏览器')
const currentUrl = computed(() => typeof props.config.url === 'string' ? props.config.url.trim() : '')
const dialogClass = computed(() => `browser-action-dialog browser-action-${orientation.value}`)
const orientationLabel = computed(() => orientation.value === 'landscape' ? '竖屏' : '横屏')
const dialogWidth = computed(() => {
  if (orientation.value === 'portrait') {
    return props.config.portraitWidth || 430
  }
  return props.config.width || 980
})
const dialogHeight = computed(() => {
  if (orientation.value === 'portrait') {
    return props.config.portraitHeight || 760
  }
  return props.config.height || 680
})

const resetFrameState = () => {
  hasError.value = false
  isLoading.value = Boolean(currentUrl.value)
}

watch(
  () => props.config,
  (config) => {
    orientation.value = config?.orientation === 'portrait' ? 'portrait' : 'landscape'
  },
  { immediate: true }
)

const reload = () => {
  if (!currentUrl.value) return
  resetFrameState()
  frameKey.value += 1
}

const openExternal = () => {
  if (!currentUrl.value) return
  window.open(currentUrl.value, '_blank', 'noopener,noreferrer')
}

const toggleOrientation = () => {
  orientation.value = orientation.value === 'landscape' ? 'portrait' : 'landscape'
}

const handleFrameLoad = () => {
  isLoading.value = false
  hasError.value = false
}

const handleFrameError = () => {
  isLoading.value = false
  hasError.value = true
}

const handleClose = () => {
  emit('close')
}

watch(
  () => [props.visible, currentUrl.value],
  ([visible]) => {
    if (visible) {
      resetFrameState()
      frameKey.value += 1
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.browser-action {
  width: 100%;
}

.browser-toolbar {
  align-items: center;
}

.browser-address {
  flex: 1;
  min-width: 220px;
}

.browser-frame-wrap {
  position: relative;
  height: min(62vh, 640px);
  min-height: 420px;
  overflow: hidden;
  background: var(--action-webview-page-bg);
  border: 1px solid var(--color-border-2);
  border-radius: 8px;
}

.browser-frame {
  width: 100%;
  height: 100%;
  border: 0;
  background: var(--action-webview-page-bg);
}

.browser-loading,
.browser-frame-wrap :deep(.arco-empty),
.browser-frame-wrap :deep(.arco-result) {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.browser-frame-wrap :deep(.arco-result) {
  flex-direction: column;
  background: var(--color-bg-2);
}

@media (max-width: 768px) {
  .browser-frame-wrap {
    height: 68vh;
    min-height: 360px;
  }
}
</style>
