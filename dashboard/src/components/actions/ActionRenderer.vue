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
    <ActionDialog
      v-if="error"
      :visible="!!error"
      title="错误"
      width="400"
      @close="clearError"
    >
      <div class="action-error">
        <p><strong>{{ error.type }}</strong></p>
        <p>{{ error.message }}</p>
        <pre v-if="error.details">{{ JSON.stringify(error.details, null, 2) }}</pre>
      </div>
      <template #footer>
        <button class="action-button action-button-primary" @click="clearError">
          确定
        </button>
      </template>
    </ActionDialog>

    <!-- 加载状态 -->
    <ActionDialog
      v-if="isLoading"
      :visible="isLoading"
      title="处理中"
      width="300"
      :show-close="false"
    >
      <div class="action-loading">
        正在处理，请稍候...
      </div>
    </ActionDialog>

  </div>
</template>

<script>
import { ref, computed, watch, defineAsyncComponent } from 'vue'
import ActionDialog from './ActionDialog.vue'
import { 
  parseActionConfig, 
  validateActionConfig, 
  ActionType, 
  ActionErrorType,
  createActionError,
  isSpecialAction
} from './types.js'
import { executeAction } from '@/api/modules/module.js'
import { showToast } from '@/stores/toast.js'

// 懒加载Action组件
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
    ActionDialog,
    InputAction,
    MultiInputAction,
    MenuAction,
    MsgBoxAction,
    WebViewAction,
    BrowserAction,
    HelpAction
  },
  props: {
    // Action数据，可以是JSON字符串或对象
    actionData: {
      type: [String, Object],
      default: null
    },
    // 是否显示
    visible: {
      type: Boolean,
      default: true
    },
    // 自动显示，当actionData变化时自动显示
    autoShow: {
      type: Boolean,
      default: true
    },
    // 模块名称，用于T4接口调用
    module: {
      type: String,
      default: ''
    },
    // 扩展参数，用于T4接口调用
    extend: {
      type: [Object, String],
      default: () => ({})
    },
    // API URL，用于直接调用站点API
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

    // 组件映射
    const componentMap = {
      [ActionType.INPUT]: 'InputAction',
      [ActionType.EDIT]: 'InputAction', // edit类型使用InputAction，通过multiLine区分
      [ActionType.MULTI_INPUT]: 'MultiInputAction',
      [ActionType.MULTI_INPUT_X]: 'MultiInputAction',
      [ActionType.MENU]: 'MenuAction', // 单选菜单
      [ActionType.SELECT]: 'MenuAction', // 多选菜单，使用MenuAction组件
      [ActionType.MSGBOX]: 'MsgBoxAction',
      [ActionType.WEBVIEW]: 'WebViewAction',
      [ActionType.BROWSER]: 'BrowserAction',
      [ActionType.HELP]: 'HelpAction'
    }

    // 当前组件
    const currentComponent = computed(() => {
      if (!parsedConfig.value) {
        console.log('ActionRenderer currentComponent: parsedConfig.value 为空')
        return null
      }
      const component = componentMap[parsedConfig.value.type] || null
      console.log('ActionRenderer currentComponent:', {
        type: parsedConfig.value.type,
        component: component,
        parsedConfig: parsedConfig.value
      })
      return component
    })

    // 解析Action配置
    const parseConfig = async (data) => {
      try {
        console.log('ActionRenderer parseConfig 开始解析:', data)
        if (!data) {
          parsedConfig.value = null
          return
        }

        const config = parseActionConfig(data)
        console.log('ActionRenderer parseConfig 解析后的配置:', config)
        validateActionConfig(config)
        
        // 检查是否为特殊动作，如果是则立即执行
        if (isSpecialAction(config)) {
          console.log('检测到特殊动作，立即执行:', config)
          await handleSpecialAction(config)
          return // 特殊动作执行完毕后直接返回，不需要显示UI
        }
        
        parsedConfig.value = config
        error.value = null
        console.log('ActionRenderer parseConfig 设置 parsedConfig.value:', parsedConfig.value)

        if (props.autoShow) {
          isVisible.value = true
          console.log('ActionRenderer parseConfig 设置 isVisible.value = true, autoShow:', props.autoShow)
        } else {
          console.log('ActionRenderer parseConfig autoShow 为 false，不自动显示')
        }
      } catch (err) {
        console.error('解析Action配置失败:', err)
        error.value = err
        parsedConfig.value = null
      }
    }



    // 处理专项动作（动态动作）
    const handleSpecialAction = async (actionData) => {
      const { actionId } = actionData

      switch (actionId) {
        case '__self_search__':
          // 源内搜索 - 处理T4返回的数据格式
          console.log('🚀 [ActionRenderer DEBUG] 处理__self_search__专项动作');
          console.log('🚀 [ActionRenderer DEBUG] actionData:', JSON.stringify(actionData, null, 2));
          
          // 验证必要的参数
          if (!actionData.tid) {
            console.error('🚀 [ActionRenderer ERROR] 源内搜索参数不完整：缺少tid');
            showToast('源内搜索参数不完整：缺少tid', 'error')
            handleClose()
            break
          }
          
          // 构造特殊分类数据
          const specialCategory = {
            tid: actionData.tid,
            type_id: actionData.tid,
            name: actionData.name,
            type_name: actionData.name || `搜索: ${actionData.tid}`,
            isSpecialCategory: true,
            actionData: actionData
          }
          
          console.log('🚀 [ActionRenderer DEBUG] 构造的 specialCategory:', JSON.stringify(specialCategory, null, 2));
          console.log('🚀 [ActionRenderer DEBUG] 即将触发 special-action 事件');
          
          showToast(actionData.msg || '执行源内搜索', 'info')
          emit('special-action', '__self_search__', specialCategory)
          
          console.log('🚀 [ActionRenderer DEBUG] special-action 事件已触发，关闭组件');
          handleClose()
          break

        case '__detail__':
          // 详情页跳转
          showToast('跳转到详情页', 'info')
          emit('special-action', 'detail', actionData)
          handleClose()
          break

        case '__ktvplayer__':
          // KTV播放
          showToast('启动KTV播放', 'info')
          emit('special-action', 'ktv-player', actionData)
          handleClose()
          break

        case '__refresh_list__':
          // 刷新列表
          showToast('刷新列表', 'info')
          emit('special-action', 'refresh-list', actionData)
          handleClose()
          break

        case '__copy__':
          // 复制到剪贴板
          if (actionData.content) {
            try {
              await navigator.clipboard.writeText(actionData.content)
              showToast('已复制到剪切板', 'success')
            } catch (err) {
              showToast('复制失败', 'error')
            }
          }
          handleClose()
          break

        case '__keep__':
          // 保持窗口
          if (actionData.msg) {
            showToast(actionData.msg, 'info')
          }
          if (actionData.reset) {
            // 重置窗口内容
            parsedConfig.value = null
          }
          // 不关闭窗口
          break

        default:
          showToast(`未知的专项动作: ${actionId}`, 'warning')
          handleClose()
          break
      }
    }

    // 处理提交
    const handleSubmit = async (value) => {
      if (!parsedConfig.value) return

      try {
        isLoading.value = true
        
        // 准备action数据
        const actionData = {
          action: parsedConfig.value.actionId,
          value: typeof value === 'object' ? JSON.stringify(value) : value
        }

        // 添加扩展参数
        if (props.extend) {
          actionData.extend = props.extend
        }

        // 添加API URL
        if (props.apiUrl) {
          actionData.apiUrl = props.apiUrl
        }

        // 调用T4接口
        console.log('ActionRenderer准备调用T4接口:', {
          module: props.module,
          actionData,
          apiUrl: props.apiUrl
        })
        
        let result = null
        if (props.module) {
          result = await executeAction(props.module, actionData)
          console.log('T4接口返回结果:', result)
        } else {
          // 如果没有module，触发action事件让父组件处理
          result = await emit('action', parsedConfig.value.actionId, value)
          console.log('父组件处理结果:', result)
        }
        
        // 处理返回结果
        if (result) {
          // 如果返回的是字符串，尝试解析为JSON
          if (typeof result === 'string') {
            try {
              const parsedResult = JSON.parse(result)
              result = parsedResult
            } catch (e) {
              // 如果不是JSON，作为toast消息显示
              showToast(result, 'success')
              emit('success', value)
              handleClose()
              return
            }
          }

          // 处理对象结果
          if (typeof result === 'object') {
            console.log('处理API返回的对象结果:', result)
            
            // 检查错误
            if (result.error) {
              throw createActionError(
                ActionErrorType.NETWORK_ERROR,
                result.error
              )
            }

            // 显示toast消息
            if (result.toast) {
              showToast(result.toast, 'success')
            }

            // 处理消息字段（兼容不同的消息字段名）
            if (result.message || result.msg) {
              showToast(result.message || result.msg, 'success')
            }

            // 处理新的action（动态action）
            if (result.action) {
              console.log('检测到动态action，重新解析:', result.action)
              await parseConfig(result.action)
              return
            }

            // 处理专项动作
            if (result.actionId) {
              console.log('检测到专项动作:', result.actionId)
              await handleSpecialAction(result)
              return
            }

            // 处理状态码
            if (result.code !== undefined) {
              if (result.code === 0 || result.code === 200) {
                // 成功状态
                if (result.data) {
                  // 如果有data字段，递归处理data内容
                  if (typeof result.data === 'object') {
                    // 递归处理data对象
                    const dataResult = { ...result.data }
                    if (dataResult.action || dataResult.actionId) {
                      console.log('在data字段中检测到action:', dataResult)
                      if (dataResult.action) {
                        await parseConfig(dataResult.action)
                        return
                      }
                      if (dataResult.actionId) {
                        await handleSpecialAction(dataResult)
                        return
                      }
                    }
                  }
                }
                showToast(result.message || result.msg || '操作成功', 'success')
              } else {
                // 错误状态
                throw createActionError(
                  ActionErrorType.NETWORK_ERROR,
                  result.message || result.msg || `操作失败，错误码: ${result.code}`
                )
              }
            }
          }
        }

        // 默认成功处理
        emit('success', value)
        handleClose()
      } catch (err) {
        console.error('执行Action失败:', err)
        error.value = err
        showToast(err.message || '操作失败', 'error')
      } finally {
        isLoading.value = false
      }
    }

    // 处理取消
    const handleCancel = () => {
      handleClose()
    }

    // 处理关闭
    const handleClose = () => {
      isVisible.value = false
      parsedConfig.value = null
      emit('close')
    }

    // 处理动作
    const handleAction = async (action, value) => {
      // 如果action是一个对象（新的动作配置），则重新解析
      if (typeof action === 'object' && action.type) {
        console.log('ActionRenderer接收到新的动作配置:', action)
        // 先隐藏当前弹窗
        isVisible.value = false
        // 等待一个短暂的时间让当前弹窗完全关闭
        await new Promise(resolve => setTimeout(resolve, 100))
        // 然后解析新的配置
        await parseConfig(action)
        return
      }
      
      // 否则按原来的逻辑处理
      await handleSubmit({ action, value })
    }

    // 清除错误
    const clearError = () => {
      error.value = null
    }

    // 处理子组件的special-action事件
    const handleSpecialActionFromChild = (actionType, actionData) => {
      console.log('🔗 [ActionRenderer DEBUG] 接收到子组件的 special-action 事件');
      console.log('🔗 [ActionRenderer DEBUG] actionType:', actionType);
      console.log('🔗 [ActionRenderer DEBUG] actionData:', JSON.stringify(actionData, null, 2));
      
      // 将事件向上传递给父组件
      console.log('🔗 [ActionRenderer DEBUG] 向父组件传递 special-action 事件');
      emit('special-action', actionType, actionData);
      
      // 关闭当前组件
      handleClose();
    }



    // 监听actionData变化
    watch(() => props.actionData, async (newData) => {
      await parseConfig(newData)
    }, { immediate: true })

    // 监听visible变化
    watch(() => props.visible, (newVal) => {
      isVisible.value = newVal
    })

    // 公开方法
    const show = async (actionData) => {
      if (actionData) {
        await parseConfig(actionData)
      }
      isVisible.value = true
    }

    const hide = () => {
      isVisible.value = false
    }

    const executeAction = async (actionId, value) => {
      try {
        isLoading.value = true
        const result = await emit('action', actionId, value)
        return result
      } catch (err) {
        error.value = err
        throw err
      } finally {
        isLoading.value = false
      }
    }

    // 处理Toast消息
    const handleToast = (message, type = 'success') => {
      showToast(message, type)
    }

    // 处理重置事件
    const handleReset = () => {
      // 可以在这里添加额外的重置逻辑
      console.log('InputAction触发重置事件')
    }

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
      executeAction
    }
  }
}
</script>

<style scoped>
.action-renderer {
  position: relative;
}

/* 错误样式 */
.action-error {
  color: #f5222d;
}

.action-error pre {
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 4px;
  padding: 8px;
  margin-top: 8px;
  font-size: 12px;
  overflow-x: auto;
}

/* 加载样式 */
.action-loading {
  text-align: center;
  padding: 20px;
  color: #8c8c8c;
}
</style>