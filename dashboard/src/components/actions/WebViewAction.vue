<template>
  <ActionShell
    :visible="visible"
    :title="config.title"
    :width="config.width || '90%'"
    :height="config.height || 'auto'"
    :canceled-on-touch-outside="!config.keep"
    :module="module"
    :extend="extend"
    :api-url="apiUrl"
    @close="handleClose"
    @toast="(message, type) => emit('toast', message, type)"
    @reset="() => emit('reset')"
  >
    <a-space class="webview-action" direction="vertical" fill size="small">
      <a-space v-if="showToolbar" class="webview-toolbar" fill wrap>
        <a-button-group>
          <a-button :disabled="!canGoBack" @click="goBack">后退</a-button>
          <a-button :disabled="!canGoForward" @click="goForward">前进</a-button>
          <a-button @click="reload">刷新</a-button>
        </a-button-group>

        <a-input-search
          v-if="config.showAddressBar"
          v-model="currentUrl"
          class="webview-address"
          placeholder="请输入网址..."
          search-button
          button-text="访问"
          @search="navigate"
          @press-enter="navigate"
        />

        <a-space wrap>
          <a-button v-if="config.allowFullscreen" @click="toggleFullscreen">
            {{ isFullscreen ? '退出全屏' : '全屏' }}
          </a-button>
          <a-button v-if="config.allowDevTools" @click="toggleDevTools">
            开发者工具
          </a-button>
        </a-space>
      </a-space>

      <a-progress
        v-if="isLoading"
        :percent="loadingProgress / 100"
        :show-text="false"
        size="small"
      />

      <div class="webview-container" :class="{ fullscreen: isFullscreen }">
        <a-spin
          v-if="isLoading && loadingProgress < 100"
          class="webview-loading"
          tip="正在加载网页..."
        />

        <a-result v-if="hasError" status="error" title="页面加载失败" class="webview-error">
          <template #subtitle>{{ errorMessage }}</template>
          <template #extra>
            <a-button type="primary" @click="reload">重新加载</a-button>
          </template>
        </a-result>

        <iframe
          v-show="!hasError"
          ref="webviewFrame"
          :src="iframeSrc"
          class="webview-frame"
          :sandbox="sandboxAttributes"
          @load="onFrameLoad"
          @error="onFrameError"
        ></iframe>
      </div>

      <a-card v-if="config.showStatus" size="small" :bordered="true">
        <a-space fill class="webview-status" wrap>
          <a-typography-text type="secondary" class="webview-status-url">
            {{ displayUrl }}
          </a-typography-text>
          <a-typography-text v-if="config.timeout && timeLeft > 0" type="warning">
            {{ timeLeft }}秒后自动关闭
          </a-typography-text>
        </a-space>
      </a-card>
    </a-space>

    <template #footer>
      <ActionFooter
        :show-ok="showOkButton"
        :show-cancel="true"
        :ok-text="config.okText || '确定'"
        :cancel-text="config.closeText || '关闭'"
        @ok="handleOk"
        @cancel="handleClose"
      />
    </template>
  </ActionShell>
</template>

<script>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import ActionShell from './shared/ActionShell.vue'
import ActionFooter from './shared/ActionFooter.vue'
import { ButtonType, normalizeButtonType } from './types.js'

export default {
  name: 'WebViewAction',
  components: {
    ActionShell,
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
    const webviewFrame = ref(null)
    const currentUrl = ref('')
    const isLoading = ref(true)
    const loadingProgress = ref(0)
    const hasError = ref(false)
    const errorMessage = ref('')
    const canGoBack = ref(false)
    const canGoForward = ref(false)
    const isFullscreen = ref(false)
    const timeLeft = ref(0)
    const timer = ref(null)
    const progressTimer = ref(null)

    const showToolbar = computed(() => props.config.showToolbar !== false)

    const iframeSrc = computed(() => currentUrl.value || props.config.url || 'about:blank')

    const displayUrl = computed(() => {
      const url = currentUrl.value || props.config.url || ''
      return url.length > 80 ? `${url.substring(0, 77)}...` : url
    })

    const sandboxAttributes = computed(() => {
      const { sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups' } = props.config
      return sandbox
    })

    const showOkButton = computed(() => {
      const button = normalizeButtonType(props.config.button)
      return button === ButtonType.OK_CANCEL || button === ButtonType.OK_ONLY
    })

    const showCancelButton = computed(() => {
      const button = normalizeButtonType(props.config.button)
      return button === ButtonType.OK_CANCEL || button === ButtonType.CANCEL_ONLY
    })

    const navigate = () => {
      if (!currentUrl.value) return

      isLoading.value = true
      hasError.value = false
      loadingProgress.value = 0
      startLoadingProgress()
    }

    const goBack = () => {
      try {
        if (webviewFrame.value && webviewFrame.value.contentWindow) {
          webviewFrame.value.contentWindow.history.back()
        }
      } catch (err) {
        console.warn('无法执行后退操作:', err)
      }
    }

    const goForward = () => {
      try {
        if (webviewFrame.value && webviewFrame.value.contentWindow) {
          webviewFrame.value.contentWindow.history.forward()
        }
      } catch (err) {
        console.warn('无法执行前进操作:', err)
      }
    }

    const reload = () => {
      isLoading.value = true
      hasError.value = false
      loadingProgress.value = 0

      if (webviewFrame.value) {
        webviewFrame.value.src = webviewFrame.value.src
      }

      startLoadingProgress()
    }

    const toggleFullscreen = () => {
      isFullscreen.value = !isFullscreen.value
    }

    const toggleDevTools = () => {
      console.log('开发者工具功能需要在 Electron 环境中实现')
    }

    const onFrameLoad = () => {
      isLoading.value = false
      hasError.value = false
      loadingProgress.value = 100
      stopLoadingProgress()
      updateNavigationState()

      try {
        if (webviewFrame.value && webviewFrame.value.contentWindow) {
          currentUrl.value = webviewFrame.value.contentWindow.location.href
        }
      } catch (err) {
        console.warn('无法获取iframe URL:', err)
      }
    }

    const onFrameError = (error) => {
      isLoading.value = false
      hasError.value = true
      errorMessage.value = error.message || '页面加载失败'
      stopLoadingProgress()
    }

    const updateNavigationState = () => {
      try {
        if (webviewFrame.value && webviewFrame.value.contentWindow) {
          const history = webviewFrame.value.contentWindow.history
          canGoBack.value = history.length > 1
          canGoForward.value = false
        }
      } catch (err) {
        canGoBack.value = false
        canGoForward.value = false
      }
    }

    const startLoadingProgress = () => {
      stopLoadingProgress()
      loadingProgress.value = 0
      progressTimer.value = setInterval(() => {
        if (loadingProgress.value < 90) {
          loadingProgress.value += Math.random() * 10
        }
      }, 200)
    }

    const stopLoadingProgress = () => {
      if (progressTimer.value) {
        clearInterval(progressTimer.value)
        progressTimer.value = null
      }

      setTimeout(() => {
        loadingProgress.value = 100
      }, 100)
    }

    const handleOk = () => {
      const result = {
        url: currentUrl.value,
        action: 'ok'
      }

      try {
        if (webviewFrame.value && webviewFrame.value.contentWindow) {
          result.title = webviewFrame.value.contentWindow.document.title
        }
      } catch (err) {
        // 跨域页面不能读取标题。
      }

      emit('submit', result)
    }

    const handleCancel = () => {
      emit('cancel')
      emit('close')
    }

    const handleClose = () => {
      emit('close')
    }

    const startTimeout = () => {
      stopTimeout()
      if (!props.config.timeout || props.config.timeout <= 0) return

      timeLeft.value = props.config.timeout
      timer.value = setInterval(() => {
        timeLeft.value--
        if (timeLeft.value <= 0) {
          clearInterval(timer.value)
          handleCancel()
        }
      }, 1000)
    }

    const stopTimeout = () => {
      if (timer.value) {
        clearInterval(timer.value)
        timer.value = null
      }
      timeLeft.value = 0
    }

    watch(() => props.config, (newConfig) => {
      currentUrl.value = newConfig.url || ''
      isLoading.value = true
      hasError.value = false
      loadingProgress.value = 0

      if (newConfig.url) {
        nextTick(() => {
          startLoadingProgress()
        })
      }

      if (newConfig.timeout) {
        startTimeout()
      } else {
        stopTimeout()
      }
    }, { immediate: true })

    watch(() => props.visible, (visible) => {
      if (visible) {
        startTimeout()
      } else {
        stopTimeout()
        stopLoadingProgress()
      }
    })

    onMounted(() => {
      currentUrl.value = props.config.url || ''

      if (props.visible && props.config.timeout) {
        startTimeout()
      }
    })

    onUnmounted(() => {
      stopTimeout()
      stopLoadingProgress()
    })

    return {
      webviewFrame,
      currentUrl,
      isLoading,
      loadingProgress,
      hasError,
      errorMessage,
      canGoBack,
      canGoForward,
      isFullscreen,
      timeLeft,
      showToolbar,
      iframeSrc,
      displayUrl,
      sandboxAttributes,
      showOkButton,
      showCancelButton,
      navigate,
      goBack,
      goForward,
      reload,
      toggleFullscreen,
      toggleDevTools,
      onFrameLoad,
      onFrameError,
      handleOk,
      handleCancel,
      handleClose
    }
  }
}
</script>

<style scoped>
.webview-action {
  width: 100%;
}

.webview-toolbar {
  align-items: center;
}

.webview-address {
  flex: 1;
  min-width: 240px;
}

.webview-container {
  position: relative;
  height: min(62vh, 620px);
  min-height: 400px;
  overflow: hidden;
  background: var(--action-webview-page-bg);
  border: 1px solid var(--color-border-2);
  border-radius: 8px;
}

.webview-container.fullscreen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  height: 100vh;
  border: 0;
  border-radius: 0;
}

.webview-frame {
  width: 100%;
  height: 100%;
  border: 0;
  background: var(--action-webview-page-bg);
}

.webview-loading,
.webview-error {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-2);
}

.webview-error {
  flex-direction: column;
}

.webview-status {
  justify-content: space-between;
}

.webview-status-url {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .webview-container {
    height: 68vh;
    min-height: 360px;
  }
}
</style>
