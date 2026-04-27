<template>
  <ActionShell
    :visible="visible"
    :title="config.title"
    :width="config.width || 720"
    :height="config.height"
    :canceled-on-touch-outside="!config.keep"
    :module="module"
    :extend="extend"
    :api-url="apiUrl"
    @close="handleCancel"
    @toast="$emit('toast', $event)"
    @reset="$emit('reset', $event)"
  >
    <a-space direction="vertical" fill size="medium">
      <ActionMessage v-if="config.msg" :message="config.msg" />

      <ActionMedia
        :image-url="config.imageUrl"
        :image-height="config.imageHeight || 200"
      />

      <a-input-search
        v-if="config.searchable"
        v-model="searchKeyword"
        placeholder="搜索选项..."
        allow-clear
        @input="handleSearch"
      />

      <a-row v-if="isMultiSelect" :gutter="8">
        <a-col :span="8">
          <a-button long :disabled="selectedOptions.length === menuOptions.length" @click="selectAll">
            全选
          </a-button>
        </a-col>
        <a-col :span="8">
          <a-button long :disabled="selectedOptions.length === 0" @click="clearAll">
            全清
          </a-button>
        </a-col>
        <a-col :span="8">
          <a-button long :disabled="menuOptions.length === 0" @click="invertSelection">
            反选
          </a-button>
        </a-col>
      </a-row>

      <a-list class="menu-options-list" bordered :max-height="400">
        <a-list-item
          v-for="(option, index) in menuOptions"
          :key="option.value || index"
          class="menu-option-item"
          :class="{ 'is-disabled': option.disabled }"
          @click="handleOptionClick(option, index)"
        >
          <a-list-item-meta :title="option.name" :description="option.description">
            <template v-if="option.icon" #avatar>
              <a-avatar :size="36">
                <img v-if="option.icon.startsWith('http')" :src="option.icon" alt="" />
                <span v-else-if="option.icon.includes('<svg')" v-html="option.icon"></span>
                <span v-else-if="option.icon.startsWith('&#')" v-html="option.icon"></span>
                <span v-else-if="isEmoji(option.icon)">{{ option.icon }}</span>
                <span v-else :class="option.icon"></span>
              </a-avatar>
            </template>
          </a-list-item-meta>

          <template #actions>
            <a-checkbox
              v-if="isMultiSelect"
              :model-value="isSelected(option)"
              :disabled="option.disabled"
              @click.stop="handleOptionClick(option, index)"
            />
            <a-radio
              v-else
              :model-value="isSelected(option)"
              :disabled="option.disabled"
              @click.stop="handleOptionClick(option, index)"
            />
          </template>
        </a-list-item>
      </a-list>

      <a-card v-if="isMultiSelect && selectedOptions.length > 0" size="small" title="已选择项目">
        <a-space wrap>
          <a-tag
            v-for="option in selectedOptions"
            :key="option.value"
            color="arcoblue"
            closable
            @close="removeSelection(option)"
          >
            {{ option.name }}
          </a-tag>
        </a-space>
      </a-card>

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
        :disabled="!isValid"
        ok-text="确定"
        cancel-text="取消"
        @ok="handleSubmit"
        @cancel="handleCancel"
      />
    </template>
  </ActionShell>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import ActionShell from './shared/ActionShell.vue'
import ActionMessage from './shared/ActionMessage.vue'
import ActionMedia from './shared/ActionMedia.vue'
import ActionTimeout from './shared/ActionTimeout.vue'
import ActionFooter from './shared/ActionFooter.vue'
import { 
  ButtonType, 
  parseSelectData,
  normalizeButtonType 
} from './types.js'
import { executeAction } from '@/api/modules/module.js'
import { showToast } from '@/stores/toast.js'
import { useRouter } from 'vue-router'
import { getActionTimeout } from '@/api/config'

export default {
  name: 'MenuAction',
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
    const selectedOptions = ref([])
    const searchKeyword = ref('')
    const timeLeft = ref(0)
    const timer = ref(null)

    // 计算属性
    const isMultiSelect = computed(() => {
      // select 类型为多选，menu 类型为单选
      return props.config.type === 'select' || props.config.type === 'multiSelect'
    })

    const menuOptions = computed(() => {
      let options = []
      
      // 优先使用option字段（符合文档规范）
      if (props.config.option) {
        options = Array.isArray(props.config.option) ? props.config.option : [props.config.option]
        // 处理字符串格式：'菜单3$menu3'
        options = options.map(item => {
          if (typeof item === 'string') {
            const [name, action] = item.split('$')
            return { name: name || item, action: action || item, value: action || item }
          }
          return { 
            name: item.name || item.title || item.label,
            action: item.action || item.value,
            value: item.action || item.value,
            description: item.description
          }
        })
      } else if (props.config.selectData) {
        // 兼容旧的selectData格式
        options = parseSelectData(props.config.selectData)
      }
      
      // 搜索过滤
      if (searchKeyword.value) {
        const keyword = searchKeyword.value.toLowerCase()
        options = options.filter(option => 
          option.name.toLowerCase().includes(keyword) ||
          (option.description && option.description.toLowerCase().includes(keyword))
        )
      }
      
      return options
    })

    const showOkButton = computed(() => {
      const button = normalizeButtonType(props.config.button)
      const needOkButton = button === ButtonType.OK_CANCEL || button === ButtonType.OK_ONLY
      
      // 单选且自动提交时不显示确定按钮
      if (!isMultiSelect.value && props.config.autoSubmit) {
        return false
      }
      
      return needOkButton
    })

    const showCancelButton = computed(() => {
      const button = normalizeButtonType(props.config.button)
      return button === ButtonType.OK_CANCEL || button === ButtonType.CANCEL_ONLY
    })

    const isValid = computed(() => {
      if (isMultiSelect.value) {
        return selectedOptions.value.length > 0
      } else {
        return selectedOptions.value.length === 1
      }
    })

    // 方法
    const isSelected = (option) => {
      return selectedOptions.value.some(selected => selected.value === option.value)
    }

    const handleOptionClick = (option, index) => {
      if (option.disabled) return

      if (isMultiSelect.value) {
        // 多选模式
        if (isSelected(option)) {
          removeSelection(option)
        } else {
          selectedOptions.value.push(option)
        }
      } else {
        // 单选模式
        selectedOptions.value = [option]
        
        // 自动提交
        if (props.config.autoSubmit) {
          handleSubmit()
        }
      }
    }

    const removeSelection = (option) => {
      const index = selectedOptions.value.findIndex(selected => selected.value === option.value)
      if (index > -1) {
        selectedOptions.value.splice(index, 1)
      }
    }

    const selectAll = () => {
      selectedOptions.value = [...menuOptions.value]
    }

    const clearAll = () => {
      selectedOptions.value = []
    }

    const invertSelection = () => {
      const currentSelected = new Set(selectedOptions.value.map(option => option.value))
      selectedOptions.value = menuOptions.value.filter(option => !currentSelected.has(option.value))
    }

    const handleSearch = () => {
      // 搜索逻辑在计算属性中处理
    }

    // 复选框点击处理
    const handleCheckboxClick = (option, index, event) => {
      event.stopPropagation()
      if (option.disabled) return
      
      if (isSelected(option)) {
        removeSelection(option)
      } else {
        selectedOptions.value.push(option)
      }
    }

    // 单选框点击处理
    const handleRadioClick = (option, index, event) => {
      event.stopPropagation()
      if (option.disabled) return
      
      selectedOptions.value = [option]
      
      // 自动提交
      if (props.config.autoSubmit) {
        handleSubmit()
      }
    }

    // 检测是否为emoji图标
    const isEmoji = (str) => {
      const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u
      return emojiRegex.test(str)
    }

    // T4接口调用方法
    const callT4Action = async (action, value) => {
      if (!props.module && !props.apiUrl) {
        console.warn('未提供module或apiUrl，无法调用T4接口')
        return null
      }

      const actionData = {
        action,
        value: value
      }

      // 添加扩展参数
      if (props.extend && props.extend.ext) {
        actionData.extend = props.extend.ext
      }

      // 添加API URL
      if (props.apiUrl) {
        actionData.apiUrl = props.apiUrl
      }

      console.log('MenuAction调用T4接口:', {
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

    const handleSubmit = async () => {
      if (!isValid.value) return

      const result = {}
      let value = ''
      
      if (isMultiSelect.value) {
        result.selectedValues = selectedOptions.value.map(option => option.value)
        result.selectedOptions = selectedOptions.value
        
        // 多选模式下，生成包含所有选项状态的JSON列表
        const allOptionsWithStatus = menuOptions.value.map(option => ({
          name: option.name,
          action: option.value,
          selected: selectedOptions.value.some(selected => selected.value === option.value)
        }))
        
        // 将JSON列表转换为字符串传递给T4接口
        value = JSON.stringify(allOptionsWithStatus)
        console.log('多选菜单T4接口数据格式:', allOptionsWithStatus)
      } else {
        const selected = selectedOptions.value[0]
        result.selectedValue = selected.value
        value = selected.value
        result.selectedOption = selected
      }

      // 调用T4接口
      if (props.config.actionId) {
        try {
          console.log('菜单选择T4接口调用:', props.config.actionId, value)
          const response = await callT4Action(props.config.actionId, value)
          
          // 检查响应是否为普通文本
          if (typeof response === 'string') {
            showToast(response, 'success')
            emit('close')
            return
          }
          
          // 处理JSON格式的专项动作响应
          if (response && response.action) {
            const actionData = response.action
            const toastData = response.toast
            
            if (toastData) {
              showToast(toastData, 'success')
            }
            
            switch (actionData.actionId) {
              case '__keep__':
                if (actionData.msg) {
                  // 更新消息内容
                  console.log('保持弹窗打开，更新消息:', actionData.msg)
                }
                if (actionData.reset) {
                  // 重置选择
                  selectedOptions.value = []
                  searchKeyword.value = ''
                }
                // 不关闭弹窗
                return
                
              case '__close__':
                if (actionData.msg) {
                  showToast(actionData.msg, 'info')
                }
                emit('close')
                return
                
              case '__detail__':
                // 详情页跳转
                console.log('详情页跳转:', actionData)
                await handleDetailAction(actionData)
                emit('close')
                return
                
              case '__copy__':
                // 复制到剪贴板
                await handleCopyAction(actionData, toastData)
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
          console.error('菜单选择T4接口调用失败:', error)
          showToast('操作失败，请重试', 'error')
          return
        }
      }

      emit('submit', result)
    }

    // 处理详情页跳转动作
    const handleDetailAction = async (actionData) => {
      try {
        console.log('执行详情页跳转:', actionData)
        
        if (actionData.url) {
          // 如果有URL，直接跳转
          await router.push(actionData.url)
        } else if (actionData.route) {
          // 如果有路由信息，使用路由跳转
          await router.push(actionData.route)
        } else {
          console.warn('详情页跳转缺少URL或路由信息')
          showToast('跳转失败：缺少目标地址', 'error')
        }
        
      } catch (error) {
        console.error('详情页跳转失败:', error)
        showToast('跳转失败', 'error')
      }
    }

    // 处理复制动作
    const handleCopyAction = async (actionData, toastData) => {
      try {
        const copyContent = actionData.content || actionData.text || actionData.value || ''
        
        if (!copyContent) {
          console.warn('复制内容为空')
          showToast('复制失败：内容为空', 'error')
          return
        }
        
        await navigator.clipboard.writeText(copyContent)
        console.log('复制成功:', copyContent)
        
        const message = actionData.msg || toastData?.msg || '复制成功'
        showToast(message, 'success')
        
      } catch (error) {
        console.error('复制失败:', error)
        showToast('复制失败', 'error')
      }
    }

    // 处理源内搜索动作
    const handleSelfSearchAction = async (actionData) => {
      try {
        console.log('执行源内搜索:', actionData)
        
        // 构建搜索参数
        const searchParams = {
          keyword: actionData.keyword || actionData.query || '',
          siteKey: actionData.skey || actionData.siteKey || '',
          ...actionData.params
        }
        
        // 如果指定了站点，先切换站点
        if (searchParams.siteKey) {
          // 触发站点切换事件
          window.dispatchEvent(new CustomEvent('switchSite', {
            detail: { siteKey: searchParams.siteKey }
          }))
        }
        
        // 触发搜索事件
        emit('special-action', {
          type: 'self-search',
          data: searchParams
        })
        
        showToast('开始搜索...', 'info')
        
      } catch (error) {
        console.error('源内搜索失败:', error)
        showToast('搜索失败', 'error')
      }
    }

    // 处理刷新列表动作
    const handleRefreshListAction = async (actionData) => {
      try {
        console.log('执行刷新列表:', actionData)
        
        const currentRoute = router.currentRoute.value
        const routeName = currentRoute.name
        
        switch (routeName) {
          case 'Video':
            window.dispatchEvent(new CustomEvent('refreshVideoList', {
              detail: actionData
            }))
            showToast('视频列表已刷新', 'success')
            break
            
          case 'Live':
            window.dispatchEvent(new CustomEvent('refreshLiveList', {
              detail: actionData
            }))
            showToast('直播列表已刷新', 'success')
            break
            
          default:
            showToast('列表已刷新', 'success')
            break
        }
        
      } catch (error) {
        console.error('刷新列表失败:', error)
        showToast('刷新列表失败', 'error')
      }
    }

    // 处理KTV播放动作
    const handleKtvPlayerAction = async (actionData) => {
      try {
        console.log('执行KTV播放:', actionData)
        
        const playUrl = actionData.url || actionData.playUrl || ''
        const title = actionData.title || actionData.name || 'KTV播放'
        
        if (!playUrl) {
          console.warn('KTV播放缺少播放地址')
          showToast('播放失败：缺少播放地址', 'error')
          return
        }
        
        // 构建KTV播放器路由参数
        const routeParams = {
          name: 'KtvPlayer',
          query: {
            url: playUrl,
            title: title,
            ...actionData.params
          }
        }
        
        // 如果没有KTV播放器路由，使用通用视频播放器
        try {
          await router.push(routeParams)
        } catch (routeError) {
          console.log('KTV播放器路由不存在，使用通用播放器')
          await router.push({
            name: 'VideoPlayer',
            query: {
              url: playUrl,
              title: title,
              type: 'ktv',
              ...actionData.params
            }
          })
        }
        
        showToast('正在打开KTV播放器...', 'info')
        
      } catch (error) {
        console.error('KTV播放失败:', error)
        showToast('播放失败', 'error')
      }
    }

    const handleCancel = () => {
      emit('cancel')
      emit('close')
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

    // 监听配置变化
    watch(() => props.config, (newConfig) => {
      selectedOptions.value = []
      searchKeyword.value = ''
      
      // 设置默认选中项
      if (newConfig.defaultValue) {
        const options = parseSelectData(newConfig.selectData || '')
        const defaultValues = Array.isArray(newConfig.defaultValue) 
          ? newConfig.defaultValue 
          : [newConfig.defaultValue]
        
        selectedOptions.value = options.filter(option => 
          defaultValues.includes(option.value)
        )
      }
      
      if (newConfig.timeout) {
        startTimeout()
      } else {
        stopTimeout()
      }
    }, { immediate: true })

    // 监听显示状态
    watch(() => props.visible, (visible) => {
      if (visible) {
        startTimeout()
      } else {
        stopTimeout()
      }
    })

    onMounted(() => {
      // 初始化默认选中项
      if (props.config.defaultValue) {
        const options = parseSelectData(props.config.selectData || '')
        const defaultValues = Array.isArray(props.config.defaultValue) 
          ? props.config.defaultValue 
          : [props.config.defaultValue]
        
        selectedOptions.value = options.filter(option => 
          defaultValues.includes(option.value)
        )
      }
    })

    onUnmounted(() => {
      stopTimeout()
    })

    return {
      selectedOptions,
      searchKeyword,
      timeLeft,
      isMultiSelect,
      menuOptions,
      showOkButton,
      showCancelButton,
      isValid,
      isSelected,
      isEmoji,
      handleOptionClick,
      handleCheckboxClick,
      handleRadioClick,
      removeSelection,
      selectAll,
      clearAll,
      invertSelection,
      handleSearch,
      handleSubmit,
      handleCancel
    }
  }
}
</script>

<style scoped>
.menu-options-list :deep(.arco-list-content) {
  overflow-y: auto;
}

.menu-option-item {
  cursor: pointer;
}

.menu-option-item.is-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.menu-option-item :deep(.arco-list-item-action) {
  margin-left: 12px;
}
</style>