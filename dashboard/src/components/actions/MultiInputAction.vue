<template>
  <ActionShell
    :visible="visible"
    :title="config.title"
    :width="config.width || 600"
    :height="config.height"
    :canceled-on-touch-outside="!config.keep"
    :module="module"
    :extend="extend"
    :api-url="apiUrl"
    @close="handleCancel"
    @toast="(message, type) => emit('toast', message, type)"
    @reset="() => emit('reset')"
  >
    <a-space direction="vertical" fill size="medium" class="multi-input-action">
      <ActionMessage v-if="config.msg" :message="currentMessage" />

      <ActionMedia
        :image-url="config.imageUrl"
        :image-height="config.imageHeight || 200"
      />

      <a-form layout="vertical" class="multi-input-form">
        <a-space direction="vertical" fill size="small">
          <a-card
            v-for="(input, index) in inputItems"
            :key="input.id || index"
            size="small"
            :bordered="true"
            class="multi-input-card"
          >
            <a-form-item
              :label="input.name || undefined"
              :required="!!input.required"
              :validate-status="inputErrors[index] ? 'error' : undefined"
              :feedback="!!inputErrors[index]"
              :help="inputErrors[index] || undefined"
            >
              <template v-if="input.help" #extra>
                <a-button size="mini" type="text" @click="showHelpPopup(input.help)">
                  查看帮助
                </a-button>
              </template>

              <a-space direction="vertical" fill size="small">
                <a-space
                  v-if="input.selectData && hasNonSpecialOptions(input.selectData) && !input.multiSelect"
                  wrap
                  size="mini"
                >
                  <a-tag
                    v-for="option in getNonSpecialOptions(input.selectData)"
                    :key="option.value"
                    color="arcoblue"
                    checkable
                    :checked="isOptionSelected(index, option)"
                    @click="selectQuickOption(index, option)"
                  >
                    {{ option.name }}
                  </a-tag>
                </a-space>

                <a-date-picker
                  v-if="(!input.multiLine || input.multiLine <= 1) && !input.onlyQuickSelect && input.selectData === '[calendar]' && input.inputType === 0"
                  v-model="inputValues[index]"
                  :placeholder="input.tip || input.name"
                  format="YYYY-MM-DD"
                  style="width: 100%;"
                  @change="handleDateChange(index, $event)"
                />

                <div
                  v-else-if="(!input.multiLine || input.multiLine <= 1) && !input.onlyQuickSelect"
                  class="multi-input-inline-row"
                >
                  <a-input
                    v-model="inputValues[index]"
                    :type="getInputType(input)"
                    :placeholder="input.tip || input.name"
                    :readonly="input.inputType === 0"
                    :status="inputErrors[index] ? 'error' : undefined"
                    allow-clear
                    @input="value => handleInputChange(index, value)"
                    @blur="validateInput(index)"
                  />
                  <a-button
                    v-if="getSpecialInputType(input)"
                    class="multi-input-inline-action"
                    @click="handleSpecialInput(index, getSpecialInputType(input))"
                  >
                    {{ getSpecialInputTitle(getSpecialInputType(input)) }}
                  </a-button>
                  <a-button
                    v-else-if="input.inputType === 0 && input.selectData"
                    class="multi-input-inline-action"
                    @click="openSelectOptions(index)"
                  >
                    选项
                  </a-button>
                  <a-button class="multi-input-inline-action" v-else @click="openTextEditor(index)">
                    大文本
                  </a-button>
                </div>

                <template v-else-if="!input.onlyQuickSelect">
                  <a-textarea
                    v-model="inputValues[index]"
                    :placeholder="input.tip || input.name"
                    :auto-size="{ minRows: Math.min(input.multiLine || 3, 4), maxRows: 8 }"
                    :readonly="input.inputType === 0"
                    :status="inputErrors[index] ? 'error' : undefined"
                    allow-clear
                    @input="value => handleInputChange(index, value)"
                    @blur="validateInput(index)"
                  />
                  <a-space>
                    <a-button
                      v-if="getSpecialInputType(input)"
                      size="small"
                      @click="handleSpecialInput(index, getSpecialInputType(input))"
                    >
                      {{ getSpecialInputTitle(getSpecialInputType(input)) }}
                    </a-button>
                    <a-button v-else size="small" @click="openTextEditor(index)">
                      打开大文本编辑器
                    </a-button>
                  </a-space>
                </template>

                <a-typography-text
                  v-if="inputValues[index] && inputValues[index].length > 0"
                  type="secondary"
                  class="multi-input-count"
                >
                  {{ inputValues[index].length }} 字符
                </a-typography-text>
              </a-space>
            </a-form-item>

            <template v-if="isEnhanced && inputItems.length > 1" #extra>
              <a-button status="danger" size="mini" type="text" @click="removeInputItem(index)">
                删除
              </a-button>
            </template>
          </a-card>
        </a-space>
      </a-form>

      <a-card v-if="isEnhanced && (config.allowAdd || config.allowBatch)" size="small" :bordered="true">
        <a-space wrap>
          <a-button v-if="config.allowAdd" @click="addInputItem">
            添加项目
          </a-button>
          <template v-if="config.allowBatch">
            <a-button @click="clearAll">清空全部</a-button>
            <a-button @click="fillExample">填充示例</a-button>
          </template>
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
    :width="800"
    @close="closeTextEditor"
  >
    <a-textarea
      ref="textEditorRef"
      v-model="editorText"
      placeholder="请输入文本内容..."
      :auto-size="{ minRows: 12, maxRows: 18 }"
      allow-clear
    />

    <template #footer>
      <ActionFooter
        ok-text="确定"
        cancel-text="取消"
        @ok="saveEditorText"
        @cancel="closeTextEditor"
      />
    </template>
  </ActionShell>

  <ActionShell
    :visible="showDatePicker"
    title="选择日期"
    :width="400"
    @close="handleDateCancel"
  >
    <a-date-picker
      v-model="selectedDate"
      style="width: 100%;"
      placeholder="请选择日期"
      format="YYYY-MM-DD"
      @change="handleDateConfirm"
    />

    <template #footer>
      <ActionFooter
        :show-ok="false"
        cancel-text="取消"
        @cancel="handleDateCancel"
      />
    </template>
  </ActionShell>

  <ActionShell
    :visible="showHelpDialog"
    title="帮助信息"
    :width="500"
    @close="closeHelpDialog"
  >
    <a-typography-paragraph class="help-content">
      <span v-html="helpContent"></span>
    </a-typography-paragraph>

    <template #footer>
      <ActionFooter
        :show-cancel="false"
        ok-text="确定"
        @ok="closeHelpDialog"
      />
    </template>
  </ActionShell>

  <ActionShell
    :visible="showSelectOptions"
    :title="isMultiSelectMode ? '请选择字母' : '请选择'"
    :width="isMultiSelectMode ? (currentSelectColumn * 160 + 200) : 400"
    @close="showSelectOptions = false"
  >
    <a-space v-if="!isMultiSelectMode" direction="vertical" fill>
      <a-radio-group
        v-model="selectedRadioValue"
        direction="vertical"
        @change="handleRadioChange"
      >
        <a-radio
          v-for="option in currentSelectOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.name }}
        </a-radio>
      </a-radio-group>
    </a-space>

    <a-space v-else direction="vertical" fill size="medium">
      <a-checkbox-group v-model="selectedCheckboxValues" class="checkbox-grid">
        <a-checkbox
          v-for="option in currentSelectOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.name }}
        </a-checkbox>
      </a-checkbox-group>
      <a-space wrap>
        <a-button size="small" @click="selectAll">全选</a-button>
        <a-button size="small" @click="clearSelection">全清</a-button>
        <a-button size="small" @click="invertSelection">反选</a-button>
      </a-space>
    </a-space>

    <template #footer>
      <ActionFooter
        ok-text="确认"
        cancel-text="取消"
        @ok="isMultiSelectMode ? confirmMultiSelection() : confirmRadioSelection()"
        @cancel="showSelectOptions = false"
      />
    </template>
  </ActionShell>
</template>

<script>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
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

export default {
  name: 'MultiInputAction',
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
    const router = useRouter()
    const inputValues = ref([])
    const inputErrors = ref([])
    const inputItems = ref([])
    const timeLeft = ref(0)
    const timer = ref(null)
    const currentMessage = ref(props.config.msg || '')

    const textEditorRef = ref(null)
    const showTextEditor = ref(false)
    const editorText = ref('')
    const currentEditIndex = ref(-1)

    const showDatePicker = ref(false)
    const currentDateIndex = ref(-1)
    const selectedDate = ref('')

    const showSelectOptions = ref(false)
    const currentSelectIndex = ref(-1)
    const currentSelectOptions = ref([])
    const selectedRadioValue = ref('')

    const selectedCheckboxValues = ref([])
    const isMultiSelectMode = ref(false)
    const currentSelectColumn = ref(4)

    const showHelpDialog = ref(false)
    const helpContent = ref('')

    const isEnhanced = computed(() => {
      return props.config.type === 'multiInputEnhanced'
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

    const isValid = computed(() => {
      if (inputErrors.value.some(error => error)) return false

      for (let i = 0; i < inputItems.value.length; i++) {
        const item = inputItems.value[i]
        const value = inputValues.value[i]

        if (item.required && (!value || !String(value).trim())) {
          return false
        }
      }

      return true
    })

    const initializeInputs = () => {
      const inputs = props.config.input || []
      inputItems.value = Array.isArray(inputs) ? inputs : [inputs]
      inputValues.value = inputItems.value.map(item => item.value || '')
      inputErrors.value = inputItems.value.map(() => '')
    }

    const getInputType = (input) => {
      const { inputType = 0 } = input
      const typeMap = {
        0: 'text',
        1: 'password',
        2: 'number',
        3: 'email',
        4: 'url'
      }
      return typeMap[inputType] || 'text'
    }

    const validateInput = (index) => {
      const item = inputItems.value[index]
      const value = inputValues.value[index]
      const stringValue = value == null ? '' : String(value)

      inputErrors.value[index] = ''

      if (item.required && !stringValue.trim()) {
        inputErrors.value[index] = `${item.name || '此字段'}为必填项`
        return false
      }

      if (item.validation && stringValue) {
        try {
          const regex = new RegExp(item.validation)
          if (!regex.test(stringValue)) {
            inputErrors.value[index] = `${item.name || '输入'}格式不正确`
            return false
          }
        } catch (err) {
          console.warn('验证正则表达式错误:', err)
        }
      }

      const inputType = getInputType(item)
      if (inputType === 'email' && stringValue) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(stringValue)) {
          inputErrors.value[index] = '请输入有效的邮箱地址'
          return false
        }
      }

      if (inputType === 'url' && stringValue) {
        try {
          new URL(stringValue)
        } catch {
          inputErrors.value[index] = '请输入有效的URL地址'
          return false
        }
      }

      return true
    }

    const debouncedValidate = debounce((index) => {
      validateInput(index)
    }, 300)

    const callT4Action = async (actionId, inputData) => {
      if (!props.module && !props.apiUrl) {
        console.warn('未提供module或apiUrl，无法调用T4接口')
        return null
      }
      try {
        const actionData = {
          action: actionId,
          value: JSON.stringify(inputData)
        }
        if (props.extend && props.extend.ext) {
          actionData.extend = props.extend.ext
        }

        if (props.apiUrl) {
          actionData.apiUrl = props.apiUrl
        }
        console.log('InputAction调用T4接口:', {
          module: props.module,
          actionData,
          apiUrl: props.apiUrl
        })

        const response = await executeAction(props.module, actionData)
        return response
      } catch (error) {
        console.error('T4接口调用失败:', error)
        throw error
      }
    }

    const handleDetailAction = async (actionData) => {
      try {
        const { skey, ids } = actionData

        if (!skey || !ids) {
          showToast('详情页跳转参数不完整', 'error')
          return
        }

        const site = siteService.getSiteByKey(skey)
        if (!site) {
          showToast(`未找到站源: ${skey}`, 'error')
          return
        }

        router.push({
          name: 'VideoDetail',
          params: { id: ids },
          query: {
            tempSiteName: site.name,
            tempSiteApi: site.api,
            tempSiteKey: site.key,
            tempSiteExt: site.ext,
            fromSpecialAction: 'true',
            actionType: '__detail__',
            sourcePic: ''
          }
        })

        showToast(`正在加载 ${site.name} 的详情...`, 'info')
      } catch (error) {
        console.error('详情页跳转失败:', error)
        showToast('详情页跳转失败', 'error')
      }
    }

    const handleCopyAction = async (actionData, toastData) => {
      try {
        const { content } = actionData

        if (!content) {
          showToast('没有可复制的内容', 'error')
          return
        }

        await navigator.clipboard.writeText(content)
        if (!toastData) {
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

        const searchParams = {
          name: name || '搜索',
          tid: tid || '',
          flag: flag || '',
          folder: folder || ''
        }

        if (skey) {
          const site = siteService.getSiteByKey(skey)
          if (site) {
            siteService.setCurrentSite(skey)
            showToast(`已切换到 ${site.name}`, 'info')
          }
        }

        console.log('执行源内搜索:', searchParams)
        showToast('正在执行源内搜索...', 'info')

        emit('special-action', '__self_search__', {
          tid: searchParams.tid,
          name: searchParams.name,
          type_id: searchParams.tid,
          type_name: searchParams.name,
          actionData: searchParams
        })
      } catch (error) {
        console.error('源内搜索失败:', error)
        showToast('源内搜索失败', 'error')
      }
    }

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

    const handleKtvPlayerAction = async (actionData) => {
      try {
        console.log('执行KTV播放:', actionData)
        showToast('正在启动KTV播放...', 'info')
      } catch (error) {
        console.error('KTV播放失败:', error)
        showToast('KTV播放失败', 'error')
      }
    }

    const handleInputChange = (index, eventOrValue) => {
      const value = typeof eventOrValue === 'string' || typeof eventOrValue === 'number'
        ? eventOrValue
        : eventOrValue?.target?.value || ''
      inputValues.value[index] = value
      debouncedValidate(index)
    }

    const handleDateChange = (index, value) => {
      inputValues.value[index] = value
      validateInput(index)
    }

    const handleSubmit = async () => {
      let allValid = true
      for (let i = 0; i < inputItems.value.length; i++) {
        if (!validateInput(i)) {
          allValid = false
        }
      }

      if (!allValid) return

      const result = {}

      inputItems.value.forEach((item, index) => {
        const key = item.id || item.name || `input_${index}`
        result[key] = inputValues.value[index]
      })

      if (props.config.actionId) {
        try {
          console.log('多输入框T4接口调用:', props.config.actionId, result)
          const response = await callT4Action(props.config.actionId, result)

          if (typeof response === 'string') {
            showToast(response, 'success')
            emit('close')
            return
          }

          if (response && response.action) {
            const actionData = response.action
            const toastData = response.toast

            if (toastData) {
              showToast(toastData, 'success')
            }

            switch (actionData.actionId) {
              case '__keep__':
                if (actionData.msg) {
                  currentMessage.value = actionData.msg
                }
                if (actionData.reset) {
                  inputValues.value = inputValues.value.map(() => '')
                  inputErrors.value = inputErrors.value.map(() => '')
                  emit('reset')
                }
                return

              case '__detail__':
                await handleDetailAction(actionData)
                emit('close')
                return

              case '__copy__':
                await handleCopyAction(actionData, toastData)
                emit('close')
                return

              case '__self_search__':
                await handleSelfSearchAction(actionData)
                emit('close')
                return

              case '__refresh_list__':
                await handleRefreshListAction(actionData)
                emit('close')
                return

              case '__ktvplayer__':
                await handleKtvPlayerAction(actionData)
                emit('close')
                return

              default:
                if (actionData.type) {
                  console.log('检测到普通动作，触发新的ActionRenderer:', actionData)
                  emit('action', actionData)
                  return
                } else {
                  console.warn('未知的专项动作:', actionData.actionId)
                }
                break
            }
          }
        } catch (error) {
          console.error('多输入框T4接口调用失败:', error)
          showToast('操作失败，请重试', 'error')
          return
        }
      }

      emit('submit', result)
    }

    const handleCancel = () => {
      emit('cancel')
      emit('close')
    }

    const handleReset = () => {
      inputValues.value = inputValues.value.map(() => '')
      inputErrors.value = inputErrors.value.map(() => '')
      emit('reset')
    }

    const openTextEditor = (index) => {
      currentEditIndex.value = index
      editorText.value = inputValues.value[index] || ''
      showTextEditor.value = true
      nextTick(() => {
        if (textEditorRef.value) {
          textEditorRef.value.focus()
        }
      })
    }

    const closeTextEditor = () => {
      showTextEditor.value = false
      currentEditIndex.value = -1
    }

    const saveEditorText = () => {
      if (currentEditIndex.value >= 0) {
        inputValues.value[currentEditIndex.value] = editorText.value
        handleInputChange(currentEditIndex.value, editorText.value)
      }
      showTextEditor.value = false
      currentEditIndex.value = -1
    }

    const getSelectOptions = (selectData) => {
      return parseSelectData(selectData)
    }

    const getSpecialInputType = (input) => {
      if (!input.selectData) return null

      const options = parseSelectData(input.selectData)
      for (const option of options) {
        if (option.value && option.value.startsWith('[') && option.value.endsWith(']')) {
          const type = option.value.slice(1, -1).toLowerCase()
          if (['calendar', 'file', 'folder', 'image'].includes(type)) {
            return type
          }
        }
      }
      return null
    }

    const getSpecialInputTitle = (type) => {
      const titles = {
        calendar: '选择日期',
        file: '选择文件',
        folder: '选择文件夹',
        image: '选择图片'
      }
      return titles[type] || '特殊输入'
    }

    const handleSpecialInput = (index, type) => {
      switch (type) {
        case 'calendar':
          handleDateSelect(index)
          break
        case 'file':
          handleFileSelect(index)
          break
        case 'folder':
          handleFolderSelect(index)
          break
        case 'image':
          handleImageSelect(index)
          break
        default:
          console.warn('未知的特殊输入类型:', type)
      }
    }

    const openSelectOptions = (index) => {
      const input = inputItems.value[index]
      if (input.selectData) {
        currentSelectIndex.value = index
        currentSelectOptions.value = parseSelectData(input.selectData)
        isMultiSelectMode.value = input.multiSelect === true
        currentSelectColumn.value = input.selectColumn || 4

        if (isMultiSelectMode.value) {
          const currentValue = inputValues.value[index] || ''
          selectedCheckboxValues.value = currentValue ? currentValue.split(',').map(v => v.trim()).filter(v => v) : []
        } else {
          selectedRadioValue.value = inputValues.value[index] || ''
        }

        showSelectOptions.value = true
      }
    }

    const selectOption = (option) => {
      if (currentSelectIndex.value >= 0) {
        inputValues.value[currentSelectIndex.value] = option.value
        validateInput(currentSelectIndex.value)
      }
      showSelectOptions.value = false
      currentSelectIndex.value = -1
      currentSelectOptions.value = []
    }

    const handleRadioChange = (value) => {
      if (currentSelectIndex.value >= 0) {
        inputValues.value[currentSelectIndex.value] = value
        validateInput(currentSelectIndex.value)
      }
    }

    const confirmRadioSelection = () => {
      showSelectOptions.value = false
      currentSelectIndex.value = -1
      currentSelectOptions.value = []
      selectedRadioValue.value = ''
    }

    const selectAll = () => {
      selectedCheckboxValues.value = currentSelectOptions.value.map(option => option.value)
    }

    const clearSelection = () => {
      selectedCheckboxValues.value = []
    }

    const invertSelection = () => {
      const allValues = currentSelectOptions.value.map(option => option.value)
      selectedCheckboxValues.value = allValues.filter(value => !selectedCheckboxValues.value.includes(value))
    }

    const confirmMultiSelection = () => {
      if (currentSelectIndex.value >= 0) {
        if (isMultiSelectMode.value) {
          inputValues.value[currentSelectIndex.value] = selectedCheckboxValues.value.join(',')
        } else {
          inputValues.value[currentSelectIndex.value] = selectedCheckboxValues.value[0] || ''
        }
        validateInput(currentSelectIndex.value)
      }
      showSelectOptions.value = false
      currentSelectIndex.value = -1
      currentSelectOptions.value = []
      selectedCheckboxValues.value = []
      isMultiSelectMode.value = false
    }

    const isSpecialSelector = (value) => {
      return value && value.startsWith('[') && value.endsWith(']')
    }

    const getOptionDisplayName = (option) => {
      if (isSpecialSelector(option.value)) {
        const selectorType = option.value.slice(1, -1).toLowerCase()
        const displayNames = {
          calendar: '选择日期',
          file: '选择文件',
          folder: '选择文件夹',
          image: '选择图片'
        }
        return displayNames[selectorType] || option.name
      }
      return option.name
    }

    const hasNonSpecialOptions = (selectData) => {
      const options = getSelectOptions(selectData)
      return options.some(option => !isSpecialSelector(option.value))
    }

    const getNonSpecialOptions = (selectData) => {
      const options = getSelectOptions(selectData)
      return options.filter(option => !isSpecialSelector(option.value))
    }

    const selectQuickOption = (index, option) => {
      if (option.value.startsWith('[') && option.value.endsWith(']')) {
        const selectorType = option.value.slice(1, -1).toLowerCase()

        switch (selectorType) {
          case 'calendar':
            handleDateSelect(index)
            break
          case 'file':
            handleFileSelect(index)
            break
          case 'folder':
            handleFolderSelect(index)
            break
          case 'image':
            handleImageSelect(index)
            break
          default:
            inputValues.value[index] = option.value
            break
        }
      } else {
        inputValues.value[index] = option.value
      }
      validateInput(index)
    }

    const isOptionSelected = (index, option) => {
      return inputValues.value[index] === option.value
    }

    const handleDateSelect = (index) => {
      currentDateIndex.value = index
      selectedDate.value = inputValues.value[index] || ''
      showDatePicker.value = true
    }

    const handleDateConfirm = (dateString) => {
      if (dateString && currentDateIndex.value >= 0) {
        inputValues.value[currentDateIndex.value] = dateString
        validateInput(currentDateIndex.value)
      }
      showDatePicker.value = false
      currentDateIndex.value = -1
    }

    const handleDateCancel = () => {
      showDatePicker.value = false
      currentDateIndex.value = -1
    }

    const showHelpPopup = (content) => {
      helpContent.value = content
      showHelpDialog.value = true
    }

    const closeHelpDialog = () => {
      showHelpDialog.value = false
      helpContent.value = ''
    }

    const handleFileSelect = (index) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.style.position = 'absolute'
      input.style.left = '-9999px'
      document.body.appendChild(input)

      input.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          inputValues.value[index] = e.target.files[0].name
          validateInput(index)
        }
        document.body.removeChild(input)
      })

      input.click()
    }

    const handleFolderSelect = (index) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.webkitdirectory = true
      input.multiple = true
      input.style.position = 'absolute'
      input.style.left = '-9999px'
      input.style.opacity = '0'
      document.body.appendChild(input)

      input.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          const firstFile = e.target.files[0]
          const relativePath = firstFile.webkitRelativePath

          if (relativePath) {
            inputValues.value[index] = relativePath.split('/')[0]
          } else {
            const fileName = firstFile.name
            inputValues.value[index] = fileName.substring(0, fileName.lastIndexOf('.')) || fileName
          }

          validateInput(index)
        }
        document.body.removeChild(input)
      })

      input.addEventListener('cancel', () => {
        document.body.removeChild(input)
      })

      input.click()
    }

    const handleImageSelect = (index) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.style.position = 'absolute'
      input.style.left = '-9999px'
      document.body.appendChild(input)

      input.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0]
          const reader = new FileReader()
          reader.onload = (event) => {
            inputValues.value[index] = event.target.result
            validateInput(index)
          }
          reader.readAsDataURL(file)
        }
        document.body.removeChild(input)
      })

      input.click()
    }

    const addInputItem = () => {
      const newItem = {
        id: `dynamic_${Date.now()}`,
        name: `输入项 ${inputItems.value.length + 1}`,
        tip: '请输入内容',
        required: false
      }

      inputItems.value.push(newItem)
      inputValues.value.push('')
      inputErrors.value.push('')
    }

    const removeInputItem = (index) => {
      if (inputItems.value.length <= 1) return

      inputItems.value.splice(index, 1)
      inputValues.value.splice(index, 1)
      inputErrors.value.splice(index, 1)
    }

    const clearAll = () => {
      inputValues.value = inputValues.value.map(() => '')
      inputErrors.value = inputErrors.value.map(() => '')
    }

    const fillExample = () => {
      inputItems.value.forEach((item, index) => {
        if (item.example) {
          inputValues.value[index] = item.example
        } else {
          inputValues.value[index] = `示例${index + 1}`
        }
      })

      inputItems.value.forEach((_, index) => {
        validateInput(index)
      })
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
      initializeInputs()
      currentMessage.value = newConfig.msg || ''

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
      }
    })

    onMounted(() => {
      initializeInputs()
    })

    onUnmounted(() => {
      stopTimeout()
    })

    return {
      inputValues,
      inputErrors,
      inputItems,
      timeLeft,
      currentMessage,
      isEnhanced,
      showOkButton,
      showCancelButton,
      showResetButton,
      isValid,
      getInputType,
      validateInput,
      handleInputChange,
      handleDateChange,
      handleSubmit,
      handleCancel,
      handleReset,
      selectQuickOption,
      handleDateSelect,
      handleFileSelect,
      handleFolderSelect,
      handleImageSelect,
      addInputItem,
      removeInputItem,
      clearAll,
      fillExample,
      parseSelectData,
      getSelectOptions,
      isSpecialSelector,
      getOptionDisplayName,
      getSpecialInputType,
      getSpecialInputTitle,
      handleSpecialInput,
      hasNonSpecialOptions,
      getNonSpecialOptions,
      showTextEditor,
      textEditorRef,
      editorText,
      openTextEditor,
      closeTextEditor,
      saveEditorText,
      showDatePicker,
      selectedDate,
      handleDateConfirm,
      handleDateCancel,
      showSelectOptions,
      currentSelectOptions,
      selectedRadioValue,
      openSelectOptions,
      selectOption,
      handleRadioChange,
      confirmRadioSelection,
      isOptionSelected,
      selectedCheckboxValues,
      isMultiSelectMode,
      currentSelectColumn,
      selectAll,
      clearSelection,
      invertSelection,
      confirmMultiSelection,
      showHelpDialog,
      helpContent,
      showHelpPopup,
      closeHelpDialog
    }
  }
}
</script>

<style scoped>
.multi-input-action,
.multi-input-form {
  width: 100%;
}

.multi-input-form {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 4px;
}

.multi-input-card :deep(.arco-card-body) {
  padding-bottom: 4px;
}

.multi-input-count {
  align-self: flex-end;
  font-size: 12px;
}

.multi-input-inline-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  margin-top: 4px;
}

.multi-input-inline-row :deep(.arco-input-wrapper) {
  flex: 1;
  min-width: 0;
}

.multi-input-inline-action {
  flex-shrink: 0;
}

.help-content {
  margin-bottom: 0;
  line-height: 1.6;
}

.checkbox-grid :deep(.arco-checkbox) {
  margin: 4px 16px 4px 0;
}

@media (max-width: 768px) {
  .multi-input-form {
    max-height: 68vh;
  }
}
</style>
