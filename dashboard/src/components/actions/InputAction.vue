<template>
  <ActionShell
    :visible="visible"
    :title="config.title"
    :width="config.width || 420"
    :height="config.height"
    :canceled-on-touch-outside="!config.keep"
    :module="module"
    :extend="extend"
    :api-url="apiUrl"
    @close="handleCancel"
    @toast="(message, type) => emit('toast', message, type)"
    @reset="() => emit('reset')"
  >
    <a-space direction="vertical" fill size="medium">
      <ActionMessage v-if="config.msg" :message="currentMessage" />

      <ActionMedia
        :image-url="config.imageUrl"
        :image-height="config.imageHeight || 200"
        :image-click-coord="config.imageClickCoord"
        :qrcode="config.qrcode"
        :qrcode-size="config.qrcodeSize"
        @image-click="handleImageClick"
      />

      <a-typography-paragraph v-if="config.qrcode" class="input-qrcode-text">
        {{ config.qrcode }}
      </a-typography-paragraph>

      <a-form v-if="!config.qrcode" layout="vertical" class="input-action-form">
        <a-form-item
          :label="config.tip || undefined"
          :help="!errorMessage ? config.help : undefined"
          :validate-status="errorMessage ? 'error' : undefined"
          :feedback="!!errorMessage"
        >
          <template #extra>
            <a-space v-if="errorMessage || inputValue.length > 0" fill class="input-extra">
              <a-typography-text v-if="errorMessage" type="danger">
                {{ errorMessage }}
              </a-typography-text>
              <a-typography-text v-if="inputValue.length > 0" type="secondary">
                {{ inputValue.length }} 字符
              </a-typography-text>
            </a-space>
          </template>

          <div class="input-field-stack">
            <div v-if="quickSelectOptions.length > 0" class="quick-select-options">
              <a-tag
                v-for="option in quickSelectOptions"
                :key="option.value"
                color="arcoblue"
                checkable
                :checked="isQuickOptionSelected(option)"
                @click="selectQuickOption(option)"
              >
                {{ option.name }}
              </a-tag>
            </div>

            <a-input
              v-if="!isMultiLine"
              ref="inputRef"
              v-model="inputValue"
              class="input-with-editor"
              :type="inputType"
              :placeholder="config.tip || '请输入内容...'"
              :status="hasError ? 'error' : undefined"
              allow-clear
              @keyup.enter="handleSubmit"
              @input="handleInput"
            >
              <template #suffix>
                <a-button
                  type="text"
                  size="mini"
                  class="input-editor-icon-button"
                  title="打开大文本编辑器"
                  @click.stop="openTextEditor"
                >
                  <template #icon>
                    <IconEdit />
                  </template>
                </a-button>
              </template>
            </a-input>

            <template v-else>
              <a-textarea
                ref="inputRef"
                v-model="inputValue"
                :placeholder="config.tip || '请输入内容...'"
                :auto-size="{ minRows: Number(config.multiLine) || 4, maxRows: 10 }"
                :status="hasError ? 'error' : undefined"
                allow-clear
                @input="handleInput"
              />

              <a-button size="small" class="text-editor-button" @click="openTextEditor">
                打开大文本编辑器
              </a-button>
            </template>
          </div>
        </a-form-item>
      </a-form>

      <a-alert v-if="imageCoords" type="success" show-icon>
        点击坐标：{{ imageCoords.x }}, {{ imageCoords.y }}
      </a-alert>

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
        :show-reset="showResetButton"
        :disabled="!isValid"
        ok-text="确定"
        cancel-text="取消"
        reset-text="重置"
        @ok="handleSubmit"
        @cancel="handleCancel"
        @reset="handleReset"
      />
    </template>
  </ActionShell>

  <ActionShell
    :visible="showTextEditor"
    title="大文本编辑器"
    :width="720"
    custom-class="action-text-editor-modal"
    @close="closeTextEditor"
  >
    <a-textarea
      ref="textEditorRef"
      v-model="editorText"
      class="action-text-editor-textarea"
      placeholder="请输入文本内容..."
      :auto-size="{ minRows: 9, maxRows: 13 }"
    />

    <template #footer>
      <ActionFooter
        ok-text="确定"
        cancel-text="取消"
        :show-reset="false"
        @ok="saveEditorText"
        @cancel="closeTextEditor"
      />
    </template>
  </ActionShell>
</template>

<script>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { IconEdit } from '@arco-design/web-vue/es/icon'
import ActionShell from './shared/ActionShell.vue'
import ActionMessage from './shared/ActionMessage.vue'
import ActionMedia from './shared/ActionMedia.vue'
import ActionTimeout from './shared/ActionTimeout.vue'
import ActionFooter from './shared/ActionFooter.vue'
import { 
  ButtonType,
  parseSelectData,
  debounce,
  normalizeButtonType
} from './types.js'
import { executeAction } from '@/api/modules/module.js'
import { showToast } from '@/stores/toast.js'
import siteService from '@/api/services/site'
import { useRouter } from 'vue-router'
import { getActionTimeout } from '@/api/config'

export default {
  name: 'InputAction',
  components: {
    ActionShell,
    ActionMessage,
    ActionMedia,
    ActionTimeout,
    ActionFooter,
    IconEdit
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
    // T4接口调用相关属性
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
    const router = useRouter()
    const inputRef = ref(null)
    const textEditorRef = ref(null)
    const inputValue = ref('')
    const errorMessage = ref('')
    const imageCoords = ref(null)
    const timeLeft = ref(0)
    const timer = ref(null)
    const showTextEditor = ref(false)
    const editorText = ref('')
    const currentMessage = ref(props.config.msg || '')

    // 计算属性
    const isMultiLine = computed(() => {
      return props.config.type === 'edit' || props.config.multiLine > 1
    })

    const inputType = computed(() => {
      const { inputType = 0 } = props.config
      const typeMap = {
        0: 'text',
        1: 'password',
        2: 'number',
        3: 'email',
        4: 'url'
      }
      return typeMap[inputType] || 'text'
    })

    const quickSelectOptions = computed(() => {
      return parseSelectData(props.config.selectData || '')
    })

    const showOkButton = computed(() => {
      const button = normalizeButtonType(props.config.button)
      return button === ButtonType.OK_CANCEL || button === ButtonType.OK_ONLY || button === ButtonType.CUSTOM
    })

    const showCancelButton = computed(() => {
      const button = normalizeButtonType(props.config.button)
      return button === ButtonType.OK_CANCEL || button === ButtonType.CANCEL_ONLY || button === ButtonType.CUSTOM
    })

    const showResetButton = computed(() => {
      const button = normalizeButtonType(props.config.button)
      return button === ButtonType.CUSTOM
    })

    const hasError = computed(() => {
      return !!errorMessage.value
    })

    const isValid = computed(() => {
      if (hasError.value) return false
      if (props.config.required && !inputValue.value.trim()) return false
      return true
    })

    // 验证输入
    const validateInput = debounce((value) => {
      errorMessage.value = ''

      // 必填验证
      if (props.config.required && !value.trim()) {
        errorMessage.value = '此字段为必填项'
        return false
      }

      // 自定义验证
      if (props.config.validation) {
        try {
          const regex = new RegExp(props.config.validation)
          if (!regex.test(value)) {
            errorMessage.value = '输入格式不正确'
            return false
          }
        } catch (err) {
          console.warn('验证正则表达式错误:', err)
        }
      }

      // 类型验证
      if (inputType.value === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          errorMessage.value = '请输入有效的邮箱地址'
          return false
        }
      }

      if (inputType.value === 'url' && value) {
        try {
          new URL(value)
        } catch {
          errorMessage.value = '请输入有效的URL地址'
          return false
        }
      }

      return true
    }, 300)

    // 事件处理
    const handleInput = (eventOrValue) => {
      const value = typeof eventOrValue === 'string' ? eventOrValue : eventOrValue?.target?.value || ''
      inputValue.value = value
      validateInput(value)
    }

    const handleSubmit = async () => {
      if (!isValid.value) return

      const result = {}
      
      // 图片点击坐标
      if (props.config.imageClickCoord && imageCoords.value) {
        result.imageCoords = imageCoords.value
      }
      
      // 输入值
      const value = inputValue.value
      result[props.config.id || 'value'] = value

      // 调用T4接口
      if (props.config.actionId) {
        try {
          console.log('111:',props.config.actionId)
          const response = await callT4Action(props.config.actionId, value)
          
          console.log('222:',typeof response)
          
          // 检查响应是否为普通文本
          if (typeof response === 'string') {
            // 普通文本响应，使用全局Toast显示消息
            showToast(response, 'success')
            // 立即关闭弹窗，Toast独立显示
            emit('close')
            return
          }
          
          // 处理JSON格式的专项动作响应
          if (response && response.action) {
            const actionData = response.action
            const toastData = response.toast
            
            // 显示toast消息
            if (toastData) {
              showToast(toastData, 'success')
            }
            
            // 处理不同的专项动作
            switch (actionData.actionId) {
              case '__keep__':
                // 保持弹窗打开状态
                if (actionData.msg) {
                  // 更新弹窗内的消息文本
                  currentMessage.value = actionData.msg
                }
                if (actionData.reset) {
                  // 清除输入框内容
                  inputValue.value = ''
                  errorMessage.value = ''
                  emit('reset')
                }
                return // 不关闭弹窗
                
              case '__detail__':
                // 详情页跳转
                console.log('详情页跳转:', actionData)
                await handleDetailAction(actionData)
                emit('close')
                return
                
              case '__copy__':
                // 复制到剪贴板
                await handleCopyAction(actionData,toastData)
                emit('close')
                return
                
              case '__self_search__':
                // 源内搜索
                await handleSelfSearchAction(actionData)
                emit('close')
                return
                
              case '__refresh_list__':
                // 刷新列表
                await handleRefreshListAction(actionData)
                emit('close')
                return
                
              case '__ktvplayer__':
                // KTV播放
                await handleKtvPlayerAction(actionData)
                emit('close')
                return
                
              default:
                // 检查是否为普通动作（包含type字段）
                if (actionData.type) {
                  console.log('检测到普通动作，触发新的ActionRenderer:', actionData)
                  // 通过action事件将新的动作数据传递给ActionRenderer
                  emit('action', actionData)
                  // 不要立即关闭弹窗，让ActionRenderer处理新动作配置
                  return
                } else {
                  console.warn('未知的专项动作:', actionData.actionId)
                }
                break
            }
          }
          
          
        } catch (error) {
          console.error('确认按钮T4接口调用失败:', error)
          showToast('操作失败，请重试', 'error')
          return // 不关闭弹窗
        }
      }

      emit('submit', result)
    }

    // 专项动作处理函数
    const handleDetailAction = async (actionData) => {
      try {
        const { skey, ids } = actionData
        
        if (!skey || !ids) {
          showToast('详情页跳转参数不完整', 'error')
          return
        }
        
        // 根据skey获取对应的站源信息
        const site = siteService.getSiteByKey(skey)
        if (!site) {
          showToast(`未找到站源: ${skey}`, 'error')
          return
        }
        
        console.log('跳转到详情页:', {
          skey,
          ids,
          site: site.name
        })

        console.log('site:',site)
        
        // 跳转到详情页，传递站源信息
        router.push({
          name: 'VideoDetail',
          params: { id: ids },
          query: {
            // 传递站源信息，不影响全局状态
            tempSiteName: site.name,
            tempSiteApi: site.api,
            tempSiteKey: site.key,
            tempSiteExt: site.ext,
            // 标识从专项动作进入
            fromSpecialAction: 'true',
            actionType: '__detail__',
            // 添加来源图片信息，用于详情页图片备用（专项动作通常没有图片）
            sourcePic: ''
          }
        })
        
        showToast(`正在加载 ${site.name} 的详情...`, 'info')
        
      } catch (error) {
        console.error('详情页跳转失败:', error)
        showToast('详情页跳转失败', 'error')
      }
    }
    
    const handleCopyAction = async (actionData,toastData) => {
      try {
        const { content } = actionData
        
        if (!content) {
          showToast('没有可复制的内容', 'error')
          return
        }
        
        await navigator.clipboard.writeText(content)
        if(!toastData){
        showToast('已复制到剪切板', 'success')
        }
        
      } catch (error) {
        console.error('复制失败:', error)
        showToast('复制失败', 'error')
      }
    }
    
    const handleSelfSearchAction = async (actionData) => {
      try {
        const { skey, name, tid, flag, folder } = actionData
        
        // 构造搜索参数
        const searchParams = {
          name: name || '搜索',
          tid: tid || '',
          flag: flag || '',
          folder: folder || ''
        }
        
        // 如果指定了目标源，切换到该源
        if (skey) {
          const site = siteService.getSiteByKey(skey)
          if (site) {
            siteService.setCurrentSite(skey)
            showToast(`已切换到 ${site.name}`, 'info')
          }
        }
        
        // 跳转到搜索页面或触发搜索
        console.log('执行源内搜索:', searchParams)
        showToast('正在执行源内搜索...', 'info')
        
        // 触发special-action事件，传递给父组件处理
        console.log('📝 [InputAction DEBUG] 即将触发 special-action 事件');
        console.log('📝 [InputAction DEBUG] 事件参数:', {
          actionType: '__self_search__',
          eventData: {
            tid: searchParams.tid,
            name: searchParams.name,
            type_id: searchParams.tid,
            type_name: searchParams.name,
            actionData: searchParams
          }
        });
        
        emit('special-action', '__self_search__', {
          tid: searchParams.tid,
          name: searchParams.name,
          type_id: searchParams.tid,
          type_name: searchParams.name,
          actionData: searchParams
        })
        
        console.log('📝 [InputAction DEBUG] special-action 事件已触发');
        
      } catch (error) {
        console.error('源内搜索失败:', error)
        showToast('源内搜索失败', 'error')
      }
    }
    
    const handleRefreshListAction = async (actionData) => {
      try {
        console.log('执行刷新列表:', actionData)
        
        // 获取当前路由信息
        const currentRoute = router.currentRoute.value
        const routeName = currentRoute.name
        
        // 根据不同页面类型执行相应的刷新操作
        switch (routeName) {
          case 'Video':
            // 视频列表页面刷新
            window.dispatchEvent(new CustomEvent('refreshVideoList', {
              detail: { ...actionData, type: 'video' }
            }))
            break
            
          case 'Live':
            // 直播列表页面刷新
            window.dispatchEvent(new CustomEvent('refreshLiveList', {
              detail: { ...actionData, type: 'live' }
            }))
            break
            
          case 'Collection':
            // 收藏列表页面刷新
            window.dispatchEvent(new CustomEvent('refreshCollectionList', {
              detail: { ...actionData, type: 'collection' }
            }))
            break
            
          case 'History':
            // 历史记录页面刷新
            window.dispatchEvent(new CustomEvent('refreshHistoryList', {
              detail: { ...actionData, type: 'history' }
            }))
            break
            
          case 'BookGallery':
            // 书籍列表页面刷新
            window.dispatchEvent(new CustomEvent('refreshBookList', {
              detail: { ...actionData, type: 'book' }
            }))
            break
            
          default:
            // 通用刷新事件
            window.dispatchEvent(new CustomEvent('refreshList', {
              detail: { ...actionData, routeName }
            }))
            break
        }
        
        // 如果指定了特定的刷新类型，也发送对应事件
        if (actionData.type) {
          window.dispatchEvent(new CustomEvent(`refresh${actionData.type}List`, {
            detail: actionData
          }))
        }
        
        showToast('列表刷新中...', 'info')
        
        // 延迟显示刷新完成提示
        setTimeout(() => {
          showToast('列表已刷新', 'success')
        }, 500)
        
      } catch (error) {
        console.error('刷新列表失败:', error)
        showToast('刷新列表失败', 'error')
      }
    }
    
    const handleKtvPlayerAction = async (actionData) => {
      try {
        const { name, id, url, type = 'ktv' } = actionData
        
        if (!name || !id) {
          showToast('KTV播放参数不完整', 'error')
          return
        }
        
        console.log('启动KTV播放:', {
          name,
          id,
          url,
          type
        })
        
        // 构建播放参数
        const playParams = {
          title: name,
          videoId: id,
          playUrl: url || id, // 如果没有url则使用id作为播放地址
          playType: type,
          isKtv: true,
          // KTV特有参数
          showLyrics: true,
          enableKaraokeMode: true,
          fromAction: '__ktvplayer__'
        }
        
        // 检查是否有专门的KTV播放页面
        try {
          // 尝试跳转到KTV播放页面
          router.push({
            name: 'KtvPlayer',
            params: { id: id },
            query: {
              title: name,
              url: url || id,
              type: type,
              mode: 'ktv'
            }
          })
          
          showToast(`正在启动KTV播放: ${name}`, 'success')
          
        } catch (routeError) {
          // 如果没有专门的KTV页面，尝试使用通用播放器
          console.log('KTV专用页面不存在，使用通用播放器')
          
          // 发送KTV播放事件给播放器组件
          window.dispatchEvent(new CustomEvent('startKtvPlay', {
            detail: playParams
          }))
          
          // 或者跳转到通用播放页面并标记为KTV模式
          router.push({
            name: 'VideoPlayer',
            params: { id: id },
            query: {
              title: name,
              url: url || id,
              type: type,
              ktvMode: 'true',
              showLyrics: 'true',
              fromAction: '__ktvplayer__'
            }
          })
          
          showToast(`正在播放: ${name}`, 'success')
        }
        
      } catch (error) {
        console.error('KTV播放失败:', error)
        showToast('KTV播放失败', 'error')
      }
    }

    const handleCancel = async () => {
      // 检查是否有自定义取消行为
      if (props.config.cancelAction && props.config.cancelValue !== undefined) {
        try {
          await callT4Action(props.config.cancelAction, props.config.cancelValue)
        } catch (error) {
          console.error('取消按钮T4接口调用失败:', error)
          // 即使接口调用失败，也继续执行默认的取消行为
        }
      }
      
      emit('cancel')
      emit('close')
    }

    const handleReset = () => {
      inputValue.value = ''
      errorMessage.value = ''
      if (inputRef.value) {
        inputRef.value.focus()
      }
    }

    // 大文本编辑器方法
    const openTextEditor = () => {
      editorText.value = inputValue.value
      showTextEditor.value = true
      nextTick(() => {
        if (textEditorRef.value) {
          textEditorRef.value.focus()
        }
      })
    }

    const closeTextEditor = () => {
      showTextEditor.value = false
    }

    const saveEditorText = () => {
      inputValue.value = editorText.value
      showTextEditor.value = false
      handleInput({ target: { value: editorText.value } })
    }

    const handleImageClick = (coords) => {
      if (!props.config.imageClickCoord || !coords) return

      imageCoords.value = { x: coords.x, y: coords.y }
      const newCoordsText = `${coords.x},${coords.y}`

      if (inputValue.value.trim()) {
        inputValue.value = `${inputValue.value}-${newCoordsText}`
      } else {
        inputValue.value = newCoordsText
      }

      validateInput(inputValue.value)
    }

    const isQuickOptionSelected = (option) => {
      return String(inputValue.value) === String(option.value)
    }

    const selectQuickOption = (option) => {
      inputValue.value = option.value
      validateInput(option.value)

      // 如果只允许快速选择，直接提交
      if (props.config.onlyQuickSelect) {
        nextTick(() => {
          handleSubmit()
        })
      }
    }

    const onImageLoad = () => {
      console.log('图片加载成功')
    }

    const onImageError = () => {
      console.error('图片加载失败')
    }

    const onQrcodeError = () => {
      console.error('二维码生成失败')
    }

    // 超时处理
    const startTimeout = () => {
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

    // T4接口调用方法
    const callT4Action = async (action, value) => {
      if (!props.module && !props.apiUrl) {
        console.warn('未提供module或apiUrl，无法调用T4接口')
        return null
      }

      // 构造正确的T4接口格式
      // ac=list&action=[actionId]&value={"[id]":[value]}
      const valueObject = {}
      const actionId = props.config.id || 'value'
      valueObject[actionId] = value

      const actionData = {
        action,
        value: JSON.stringify(valueObject)
      }

      // 添加扩展参数
      if (props.extend && props.extend.ext) {
        actionData.extend = props.extend.ext
      }

      // 添加API URL
      if (props.apiUrl) {
        actionData.apiUrl = props.apiUrl
      }

      console.log('InputAction调用T4接口:', {
        module: props.module,
        actionData,
        apiUrl: props.apiUrl
      })

      let result = null
      if (props.module) {
        console.log('调用模块:', props.module)
        result = await executeAction(props.module, actionData)
      } else if (props.apiUrl) {
        // 直接调用API
        console.log('直接调用API:', props.apiUrl)
        const axios = (await import('axios')).default
        const response = await axios.post(props.apiUrl, actionData, {
          timeout: getActionTimeout(),
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json;charset=UTF-8',
          }
        })
        result = response.data
      }

      console.log('T4接口返回结果:', result)
      return result
    }

    // 监听配置变化
    watch(() => props.config, (newConfig) => {
      inputValue.value = newConfig.value || ''
      errorMessage.value = ''
      imageCoords.value = null
      
      if (newConfig.timeout) {
        startTimeout()
      } else {
        stopTimeout()
      }
    }, { immediate: true })

    // 监听显示状态
    watch(() => props.visible, (visible) => {
      if (visible) {
        nextTick(() => {
          if (inputRef.value) {
            inputRef.value.focus()
          }
        })
        startTimeout()
      } else {
        stopTimeout()
      }
    })

    onMounted(() => {
      if (props.visible && inputRef.value) {
        inputRef.value.focus()
      }
    })

    onUnmounted(() => {
      stopTimeout()
    })

    return {
      inputRef,
      inputValue,
      errorMessage,
      imageCoords,
      timeLeft,
      currentMessage,
      isMultiLine,
      inputType,
      quickSelectOptions,
      showOkButton,
      showCancelButton,
      showResetButton,
      hasError,
      isValid,
      handleInput,
      handleSubmit,
      handleCancel,
      handleReset,
      handleImageClick,
      selectQuickOption,
      isQuickOptionSelected,
      // 大文本编辑器相关
      textEditorRef,
      showTextEditor,
      editorText,
      openTextEditor,
      closeTextEditor,
      saveEditorText
    }
  }
}
</script>

<style scoped>
.input-action-form {
  width: 100%;
}

.input-field-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.quick-select-options {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
}

.input-with-editor {
  width: 100%;
}

.input-editor-icon-button {
  color: var(--color-text-2);
}

.input-editor-icon-button:hover {
  color: rgb(var(--primary-6));
  background: var(--color-fill-2);
}

.action-text-editor-textarea {
  width: 100%;
}

.action-text-editor-textarea :deep(textarea) {
  line-height: 1.55;
}

.input-extra {
  justify-content: space-between;
}

.text-editor-button {
  margin-top: 8px;
}

.input-qrcode-text {
  margin-bottom: 0;
  word-break: break-all;
  white-space: pre-wrap;
}
</style>