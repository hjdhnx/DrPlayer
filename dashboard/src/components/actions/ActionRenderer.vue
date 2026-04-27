<template>
  <div class="action-renderer">
    <!-- 动态渲染Action组件 -->
    <component
      v-if="parsedConfig"
      :is="currentComponent"
      :config="parsedConfig"
      :visible="isVisible"
      :module="module"
      :extend="extend"
      :api-url="apiUrl"
      @submit="handleSubmit"
      @cancel="handleCancel"
      @close="handleClose"
      @action="handleAction"
      @toast="handleToast"
      @reset="handleReset"
      @special-action="handleSpecialActionFromChild"
    />

    <!-- 错误提示 -->
    <ActionShell
      v-if="error"
      :visible="!!error"
      title="错误"
      width="400"
      @close="clearError"
    >
      <a-alert type="error" show-icon>
        <template #title>{{ error.type || 'Action 解析失败' }}</template>
        {{ error.message }}
      </a-alert>
      <a-card v-if="error.details" size="small" class="action-error-details">
        <pre>{{ JSON.stringify(error.details, null, 2) }}</pre>
      </a-card>
      <template #footer>
        <ActionFooter :show-cancel="false" ok-text="确定" @ok="clearError" />
      </template>
    </ActionShell>

    <!-- 加载状态 -->
    <ActionShell
      v-if="isLoading"
      :visible="isLoading"
      title="处理中"
      width="300"
      :show-close="false"
    >
      <a-spin tip="正在处理，请稍候..." class="action-loading" />
    </ActionShell>

  </div>
</template>

<script>
import { ref, computed, watch, defineAsyncComponent } from 'vue'
import ActionShell from './shared/ActionShell.vue'
import ActionFooter from './shared/ActionFooter.vue'
import { ActionType } from './types.js'
import {
  isSpecialActionConfig,
  normalizeActionConfig,
  validateActionConfig
} from './utils/actionConfig.js'
import { callActionEndpoint } from './utils/actionTransport.js'
import { handleActionResponse } from './utils/actionResponse.js'
import { useActionSpecialActions } from './composables/useActionSpecialActions.js'
import { showToast } from '@/stores/toast.js'

const InputAction = defineAsyncComponent(() => import('./InputAction.vue'))
const MultiInputAction = defineAsyncComponent(() => import('./MultiInputAction.vue'))
const MenuAction = defineAsyncComponent(() => import('./MenuAction.vue'))
const MsgBoxAction = defineAsyncComponent(() => import('./MsgBoxAction.vue'))
const WebViewAction = defineAsyncComponent(() => import('./WebViewAction.vue'))
const BrowserAction = defineAsyncComponent(() => import('./BrowserAction.vue'))
const HelpAction = defineAsyncComponent(() => import('./HelpAction.vue'))

export default {
  name: 'ActionRenderer',
  components: {
    ActionShell,
    ActionFooter,
    InputAction,
    MultiInputAction,
    MenuAction,
    MsgBoxAction,
    WebViewAction,
    BrowserAction,
    HelpAction
  },
  props: {
    actionData: {
      type: [String, Object],
      default: null
    },
    visible: {
      type: Boolean,
      default: true
    },
    autoShow: {
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
  emits: ['action', 'close', 'error', 'success', 'special-action'],
  setup(props, { emit }) {
    const parsedConfig = ref(null)
    const error = ref(null)
    const isLoading = ref(false)
    const isVisible = ref(props.visible)

    const componentMap = {
      [ActionType.INPUT]: 'InputAction',
      [ActionType.EDIT]: 'InputAction',
      [ActionType.MULTI_INPUT]: 'MultiInputAction',
      [ActionType.MULTI_INPUT_X]: 'MultiInputAction',
      [ActionType.MENU]: 'MenuAction',
      [ActionType.SELECT]: 'MenuAction',
      [ActionType.MSGBOX]: 'MsgBoxAction',
      [ActionType.WEBVIEW]: 'WebViewAction',
      [ActionType.BROWSER]: 'BrowserAction',
      [ActionType.HELP]: 'HelpAction'
    }

    const currentComponent = computed(() => {
      if (!parsedConfig.value) {
        return null
      }
      return componentMap[parsedConfig.value.type] || null
    })

    const handleToast = (message, type = 'success') => {
      showToast(message, type)
    }

    const handleClose = () => {
      isVisible.value = false
      parsedConfig.value = null
      emit('close')
    }

    const { handleSpecialAction } = useActionSpecialActions({
      emit,
      close: handleClose,
      toast: handleToast
    })

    const handleKeepAction = async (actionData) => {
      await handleSpecialAction(actionData)
      if (actionData?.reset) {
        parsedConfig.value = null
      }
    }

    const parseConfig = async (data) => {
      try {
        if (!data) {
          parsedConfig.value = null
          return
        }

        const config = normalizeActionConfig(data, {
          ensureActionId: true,
          actionIdPrefix: 'renderer'
        })
        validateActionConfig(config)

        if (isSpecialActionConfig(config)) {
          await handleSpecialAction(config)
          return
        }

        parsedConfig.value = config
        error.value = null

        if (props.autoShow) {
          isVisible.value = true
        }
      } catch (err) {
        console.error('解析Action配置失败:', err)
        error.value = err
        parsedConfig.value = null
        emit('error', err)
      }
    }

    const handleResponse = async (result, submittedValue) => {
      await handleActionResponse(result, {
        onToast: handleToast,
        onNextAction: parseConfig,
        onSpecialAction: handleSpecialAction,
        onKeep: handleKeepAction,
        onSuccess: () => emit('success', submittedValue),
        onClose: handleClose,
        onError: (err) => {
          error.value = err
          emit('error', err)
        }
      })
    }

    const handleSubmit = async (value) => {
      if (!parsedConfig.value) return

      try {
        isLoading.value = true

        if (!props.module && !props.apiUrl) {
          emit('action', parsedConfig.value.actionId, value)
          emit('success', value)
          handleClose()
          return
        }

        const result = await callActionEndpoint({
          module: props.module,
          apiUrl: props.apiUrl,
          extend: props.extend,
          action: parsedConfig.value.actionId,
          value
        })

        await handleResponse(result, value)
      } catch (err) {
        console.error('执行Action失败:', err)
        error.value = err
        emit('error', err)
        showToast(err.message || '操作失败', 'error')
      } finally {
        isLoading.value = false
      }
    }

    const handleCancel = () => {
      handleClose()
    }

    const handleAction = async (action, value) => {
      if (action && typeof action === 'object') {
        isVisible.value = false
        await new Promise(resolve => setTimeout(resolve, 100))
        await parseConfig(action)
        return
      }

      await handleSubmit({ action, value })
    }

    const clearError = () => {
      error.value = null
    }

    const handleSpecialActionFromChild = (actionType, actionData) => {
      emit('special-action', actionType, actionData)
      handleClose()
    }

    watch(() => props.actionData, async (newData) => {
      await parseConfig(newData)
    }, { immediate: true })

    watch(() => props.visible, (newVal) => {
      isVisible.value = newVal
    })

    const show = async (actionData) => {
      if (actionData) {
        await parseConfig(actionData)
      }
      isVisible.value = true
    }

    const hide = () => {
      isVisible.value = false
    }

    const executeParentAction = async (actionId, value) => {
      try {
        isLoading.value = true
        emit('action', actionId, value)
      } catch (err) {
        error.value = err
        emit('error', err)
        throw err
      } finally {
        isLoading.value = false
      }
    }

    const handleReset = () => {}

    return {
      parsedConfig,
      currentComponent,
      error,
      isLoading,
      isVisible,
      handleSubmit,
      handleCancel,
      handleClose,
      handleAction,
      handleToast,
      handleReset,
      handleSpecialActionFromChild,
      clearError,
      show,
      hide,
      executeParentAction,
      executeAction: executeParentAction
    }
  }
}
</script>

<style scoped>
.action-renderer {
  position: relative;
}

.action-error-details {
  margin-top: 12px;
}

.action-error-details pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
}

.action-loading {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}
</style>