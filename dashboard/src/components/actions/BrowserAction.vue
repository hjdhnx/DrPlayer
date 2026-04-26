<template>
  <ActionDialog
    :visible="visible"
    :title="dialogTitle"
    :width="dialogWidth"
    :height="dialogHeight"
    :canceled-on-touch-outside="!config.keep"
    :show-close="true"
    :resizable="true"
    :custom-class="dialogClass"
    :module="module"
    :extend="extend"
    :api-url="apiUrl"
    @close="handleClose"
    @toast="(message, type) => emit('toast', message, type)"
    @reset="() => emit('reset')"
  >
    <div class="browser-action">
      <div class="browser-toolbar">
        <div class="browser-address" :title="currentUrl || '未提供网址'">
          <span class="browser-address-dot"></span>
          <span class="browser-address-text">{{ currentUrl || '未提供网址' }}</span>
        </div>
        <div class="browser-toolbar-actions">
          <button class="browser-tool-btn" type="button" @click="toggleOrientation">
            {{ orientationLabel }}
          </button>
          <button class="browser-tool-btn" type="button" :disabled="!currentUrl" @click="reload">
            刷新
          </button>
          <button class="browser-tool-btn" type="button" :disabled="!currentUrl" @click="openExternal">
            外部打开
          </button>
        </div>
      </div>

      <div v-if="currentUrl" class="browser-frame-hint">
        如果页面空白或提示拒绝连接，说明目标站点禁止 iframe 内嵌，请使用“外部打开”。
      </div>

      <div class="browser-frame-wrap">
        <div v-if="!currentUrl" class="browser-empty">
          <div class="browser-empty-title">没有可打开的网址</div>
          <div class="browser-empty-desc">browser action 需要提供 url 字段。</div>
        </div>

        <div v-else-if="hasError" class="browser-empty browser-frame-blocked">
          <div class="browser-empty-title">该网站禁止内嵌打开</div>
          <div class="browser-empty-desc">
            目标站点可能设置了 X-Frame-Options 或 CSP frame-ancestors，浏览器会拒绝在 iframe 中显示。请使用“外部打开”继续访问。
          </div>
          <div class="browser-empty-actions">
            <button class="browser-retry-btn" type="button" @click="reload">重新加载</button>
            <button class="browser-retry-btn browser-primary-btn" type="button" @click="openExternal">外部打开</button>
          </div>
        </div>

        <div v-else-if="isLoading" class="browser-loading">
          <div class="browser-spinner"></div>
          <div>正在加载网页...</div>
        </div>

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
    </div>
  </ActionDialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import ActionDialog from './ActionDialog.vue'

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
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border-radius: 14px;
  background: var(--dp-bg-surface, #fff);
  border: 1px solid var(--dp-border-subtle, rgba(0, 0, 0, 0.08));
}

.browser-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--dp-bg-surface-muted, rgba(0, 0, 0, 0.03));
  border-bottom: 1px solid var(--dp-border-subtle, rgba(0, 0, 0, 0.08));
  flex-shrink: 0;
}

.browser-address {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: var(--dp-bg-surface, #fff);
  border: 1px solid var(--dp-border-subtle, rgba(0, 0, 0, 0.08));
  color: var(--dp-text-secondary, #4e5969);
  font-size: 13px;
}

.browser-address-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #00b42a;
  flex-shrink: 0;
}

.browser-address-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.browser-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.browser-tool-btn,
.browser-retry-btn {
  height: 32px;
  padding: 0 12px;
  border: 1px solid color-mix(in srgb, var(--dp-primary-readable, #165dff) 18%, var(--dp-border-subtle, #d9d9d9));
  border-radius: 999px;
  background: color-mix(in srgb, var(--dp-primary-readable, #165dff) 7%, var(--dp-bg-surface, #fff));
  color: var(--dp-primary-readable, #165dff);
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}

.browser-tool-btn:hover:not(:disabled),
.browser-retry-btn:hover {
  background: var(--dp-primary-readable, #165dff);
  border-color: var(--dp-primary-readable, #165dff);
  color: #fff;
}

.browser-tool-btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.browser-frame-hint {
  padding: 7px 12px;
  border-bottom: 1px solid var(--dp-border-subtle, rgba(0, 0, 0, 0.08));
  background: color-mix(in srgb, #ff7d00 10%, var(--dp-bg-surface, #fff));
  color: #ad4e00;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.5;
  flex-shrink: 0;
}

.browser-frame-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
  background: #fff;
  overflow: hidden;
}

.browser-frame {
  width: 100%;
  height: 100%;
  border: 0;
  background: #fff;
}

.browser-loading,
.browser-empty {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  text-align: center;
  color: var(--dp-text-secondary, #4e5969);
  background: var(--dp-bg-surface, #fff);
}

.browser-empty-title {
  color: var(--dp-text-primary, #1d2129);
  font-size: 16px;
  font-weight: 900;
}

.browser-empty-desc {
  max-width: 420px;
  font-size: 13px;
  line-height: 1.6;
}

.browser-empty-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.browser-primary-btn {
  background: var(--dp-primary-readable, #165dff);
  border-color: var(--dp-primary-readable, #165dff);
  color: #fff;
}

.browser-frame-blocked .browser-address-dot {
  background: #f53f3f;
}

.browser-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(22, 93, 255, 0.16);
  border-top-color: var(--dp-primary-readable, #165dff);
  border-radius: 50%;
  animation: browser-spin 0.8s linear infinite;
}

:global(.browser-action-dialog .action-dialog-content) {
  padding: 12px;
  min-height: 0;
}

:global(.browser-action-dialog .action-dialog-header) {
  padding: 16px 56px 10px 16px;
}

:global(.browser-action-dialog .action-dialog-title) {
  text-align: left;
  font-size: 16px;
  font-weight: 900;
}

@media (min-width: 769px) {
  :global(.browser-action-dialog) {
    min-width: min(560px, 90vw);
    min-height: min(420px, calc(100vh - 2rem));
  }

  :global(.browser-action-portrait) {
    width: min(430px, 90vw) !important;
    min-width: min(360px, 90vw) !important;
    max-width: min(430px, 90vw) !important;
  }

  :global(.browser-action-landscape) {
    width: min(980px, 96vw) !important;
    max-width: min(980px, 96vw) !important;
  }
}

@media (max-width: 768px) {
  :global(.browser-action-dialog) {
    width: 96vw !important;
    max-width: 96vw !important;
  }

  :global(.browser-action-landscape) {
    height: 88vh !important;
    max-height: 88vh !important;
  }

  :global(.browser-action-portrait) {
    height: min(88vh, 760px) !important;
    max-height: 88vh !important;
  }

  :global(.browser-action-dialog .action-dialog-content) {
    padding: 8px;
  }

  :global(.browser-action-dialog .action-dialog-header) {
    padding: 14px 48px 8px 14px;
  }

  .browser-toolbar {
    align-items: stretch;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
  }

  .browser-toolbar-actions {
    justify-content: flex-end;
  }
}

@keyframes browser-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
