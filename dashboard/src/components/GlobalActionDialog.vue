<template>
  <a-modal 
    :visible="visible"
    title="全局动作"
    :width="800"
    :footer="false"
    @cancel="handleCancel"
    class="global-action-dialog"
  >
    <div class="global-action-content">
      <!-- 搜索和筛选区域 -->
      <div class="search-section">
        <div class="search-filters">
          <a-input-search
            v-model="searchKeyword"
            placeholder="搜索动作或站源..."
            allow-clear
            class="action-search"
          />
          <a-select
            v-model="selectedSiteKey"
            placeholder="选择站源"
            allow-clear
            class="site-filter"
          >
            <a-option value="">全部站源</a-option>
            <a-option 
              v-for="site in sitesWithActions" 
              :key="site.key" 
              :value="site.key"
            >
              {{ site.name }} ({{ getSiteActionCount(site.key) }})
            </a-option>
          </a-select>
        </div>
      </div>

      <!-- 动作列表 -->
      <div class="action-list-container">
        <div v-if="filteredActions.length === 0" class="empty-state">
          <div class="empty-icon">
            <icon-thunderbolt />
          </div>
          <div class="empty-text">
            {{ getEmptyStateText() }}
          </div>
          <div class="empty-hint">
            {{ getEmptyStateHint() }}
          </div>
        </div>

        <div v-else class="action-list">
          <div 
            v-for="action in filteredActions" 
            :key="`${action.siteKey}-${action.name}`"
            class="action-item"
            @click="handleActionClick(action)"
          >
            <div class="action-main">
              <div class="action-name">
                <icon-thunderbolt class="action-icon" />
                {{ action.name }}
              </div>
              <div class="action-source">
                <icon-desktop class="source-icon" />
                {{ action.siteName }}
              </div>
            </div>
            <div class="action-arrow">
              <icon-right />
            </div>
          </div>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="action-stats">
        <div class="stats-item">
          <span class="stats-label">总动作数：</span>
          <span class="stats-value">{{ allActions.length }}</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">站源数：</span>
          <span class="stats-value">{{ sitesWithActions.length }}</span>
        </div>
        <div v-if="selectedSiteKey" class="stats-item">
          <span class="stats-label">当前站源：</span>
          <span class="stats-value">{{ getSelectedSiteName() }}</span>
        </div>
        <div v-if="searchKeyword || selectedSiteKey" class="stats-item">
          <span class="stats-label">筛选结果：</span>
          <span class="stats-value">{{ filteredActions.length }}</span>
        </div>
      </div>
    </div>

    <!-- ActionRenderer组件 -->
    <ActionRenderer
      v-if="showActionRenderer"
      ref="actionRendererRef"
      :action-data="currentActionData"
      :module="currentActionData?.siteKey"
      :extend="currentActionData?.siteExt"
      :api-url="currentActionData?.siteApi"
      :visible="showActionRenderer"
      @close="handleActionRendererClose"
      @action="handleActionRendererAction"
      @success="handleActionRendererSuccess"
      @error="handleActionRendererError"
      @special-action="handleSpecialAction"
    />
  </a-modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import ActionRenderer from '@/components/actions/ActionRenderer.vue'
import { callActionEndpoint } from '@/components/actions/utils/actionTransport.js'
import {
  createMessageAction,
  normalizeActionConfig
} from '@/components/actions/utils/actionConfig.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  sites: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:visible', 'action-executed', 'special-action'])

const searchKeyword = ref('')
const selectedSiteKey = ref('')

// ActionRenderer 相关状态
const showActionRenderer = ref(false)
const currentActionData = ref(null)
const actionRendererRef = ref(null)

// 计算所有可用的动作
const allActions = computed(() => {
  const actions = []
  
  props.sites.forEach(site => {
    if (site.more && site.more.actions && Array.isArray(site.more.actions)) {
      site.more.actions.forEach(action => {
        actions.push({
          ...action,
          siteKey: site.key,
          siteName: site.name,
          siteApi: site.api,
          siteExt: site.ext
        })
      })
    }
  })
  
  return actions
})

// 计算有动作的站源数量
const sitesWithActions = computed(() => {
  return props.sites.filter(site => 
    site.more && 
    site.more.actions && 
    Array.isArray(site.more.actions) && 
    site.more.actions.length > 0
  )
})

// 过滤后的动作列表
const filteredActions = computed(() => {
  let actions = allActions.value
  
  // 按站源筛选
  if (selectedSiteKey.value) {
    actions = actions.filter(action => action.siteKey === selectedSiteKey.value)
  }
  
  // 按关键词搜索
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase().trim()
    actions = actions.filter(action => 
      action.name.toLowerCase().includes(keyword) ||
      action.siteName.toLowerCase().includes(keyword)
    )
  }
  
  return actions
})

// 获取指定站源的动作数量
const getSiteActionCount = (siteKey) => {
  return allActions.value.filter(action => action.siteKey === siteKey).length
}

// 获取选中站源的名称
const getSelectedSiteName = () => {
  if (!selectedSiteKey.value) return ''
  const site = sitesWithActions.value.find(site => site.key === selectedSiteKey.value)
  return site ? site.name : ''
}

// 获取空状态文本
const getEmptyStateText = () => {
  if (allActions.value.length === 0) {
    return '暂无可用的全局动作'
  }
  
  if (selectedSiteKey.value && searchKeyword.value.trim()) {
    return '在当前站源中未找到匹配的动作'
  }
  
  if (selectedSiteKey.value) {
    return '当前站源暂无可用动作'
  }
  
  if (searchKeyword.value.trim()) {
    return '未找到匹配的动作'
  }
  
  return '暂无可用的全局动作'
}

// 获取空状态提示
const getEmptyStateHint = () => {
  if (allActions.value.length === 0) {
    return '请确保站源配置中包含动作信息'
  }
  
  if (selectedSiteKey.value && searchKeyword.value.trim()) {
    return '请尝试其他关键词或切换站源'
  }
  
  if (selectedSiteKey.value) {
    return '请选择其他站源或清除筛选条件'
  }
  
  if (searchKeyword.value.trim()) {
    return '请尝试其他关键词或清除搜索条件'
  }
  
  return '请确保站源配置中包含动作信息'
}

const parseActionString = (value) => {
  try {
    return JSON.parse(value)
  } catch (error) {
    return JSON.parse(value.replace(/'/g, '"'))
  }
}

const extractActionFromResult = (result, action) => {
  if (typeof result === 'string') {
    try {
      const parsedResult = parseActionString(result)
      return parsedResult.action || parsedResult
    } catch (error) {
      return createMessageAction({
        title: action.name || '动作结果',
        msg: result,
        actionIdPrefix: 'global_msgbox'
      })
    }
  }

  if (result && typeof result === 'object') {
    return result.action || result
  }

  throw new Error('T4接口返回了无效的数据格式')
}

// T4接口调用方法
const callT4Action = async (action, siteKey, apiUrl, extend) => {
  const result = await callActionEndpoint({
    module: siteKey,
    apiUrl,
    extend,
    action
  })

  if (!result) {
    throw new Error('T4接口调用失败或返回空结果')
  }

  return result
}

// 处理动作点击
const handleActionClick = async (action) => {
  try {
    console.log('执行全局动作:', action)
    
    // 添加安全检查，防止null引用错误
    if (!action || typeof action !== 'object') {
      throw new Error('无效的动作对象')
    }
    
    // 解析动作配置
    let actionConfig
    if (typeof action.action === 'string') {
      try {
        actionConfig = parseActionString(action.action)
      } catch (parseError) {
        try {
          const t4Result = await callT4Action(action.action, action.siteKey, action.siteApi, action.siteExt)
          actionConfig = extractActionFromResult(t4Result, action)
        } catch (t4Error) {
          console.error('T4接口调用失败:', t4Error)
          actionConfig = createMessageAction({
            title: '动作执行失败',
            msg: `调用T4接口失败: ${t4Error.message}`,
            actionIdPrefix: 'global_error'
          })
        }
      }
    } else if (typeof action.action === 'object' && action.action !== null) {
      actionConfig = action.action
    } else {
      throw new Error('无效的动作配置')
    }

    actionConfig = normalizeActionConfig(actionConfig, {
      ensureActionId: true,
      actionIdPrefix: 'global'
    })

    // 添加站源信息到配置中
    actionConfig.siteKey = action.siteKey
    actionConfig.siteName = action.siteName
    actionConfig.siteApi = action.siteApi
    actionConfig.siteExt = action.siteExt

    console.log('<actionConfig>:', actionConfig)

    // 使用 ActionRenderer 组件显示动作交互界面
    currentActionData.value = actionConfig
    showActionRenderer.value = true

  } catch (error) {
    console.error('执行全局动作失败:', error)
    
    // 发送动作执行失败事件
    emit('action-executed', {
      action,
      error: error.message,
      success: false
    })

    Message.error(`动作 "${action.name}" 执行失败: ${error.message}`)
  }
}

// 处理取消
const handleCancel = () => {
  emit('update:visible', false)
  searchKeyword.value = ''
  selectedSiteKey.value = ''
}

// ActionRenderer 事件处理函数
const handleActionRendererClose = () => {
  showActionRenderer.value = false
  currentActionData.value = null
}

const handleActionRendererAction = async (actionId, value) => {
  console.log('ActionRenderer 动作执行:', { actionId, value })
  // 这里可以添加自定义的动作处理逻辑
  return { success: true, message: '动作执行成功' }
}

const handleActionRendererSuccess = (value) => {
  console.log('ActionRenderer 执行成功:', value)
  
  // 发送动作执行完成事件
  emit('action-executed', {
    action: currentActionData.value,
    result: value,
    success: true
  })

  Message.success(`动作执行成功`)
  
  // 关闭 ActionRenderer
  handleActionRendererClose()
  
  // 关闭全局动作弹窗
  handleCancel()
}

const handleActionRendererError = (error) => {
  console.error('ActionRenderer 执行失败:', error)
  
  // 发送动作执行失败事件
  emit('action-executed', {
    action: currentActionData.value,
    error: error.message || error,
    success: false
  })

  if (error.type !== 'cancel') {
    Message.error(`动作执行失败: ${error.message || error}`)
  }
  
  // 关闭 ActionRenderer
  handleActionRendererClose()
}

const handleSpecialAction = (actionType, actionData) => {
  console.log('ActionRenderer special-action:', { actionType, actionData })
  
  // 发送特殊动作事件给父组件处理
  emit('special-action', actionType, actionData)
  
  // 关闭 ActionRenderer
  handleActionRendererClose()
}

// 监听弹窗显示状态，重置搜索和筛选
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    searchKeyword.value = ''
    selectedSiteKey.value = ''
  }
})
</script>

<style scoped>
.global-action-dialog :deep(.arco-modal-header) {
  border-bottom: 1px solid var(--color-border-2);
  padding: 16px 24px;
}

.global-action-dialog :deep(.arco-modal-body) {
  padding: 0;
  max-height: 70vh;
  overflow: hidden;
}

.global-action-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 搜索和筛选区域 */
.search-section {
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--color-border-2);
  background: var(--color-bg-1);
}

.search-filters {
  display: flex;
  gap: 12px;
  align-items: center;
}

.action-search {
  flex: 2;
  min-width: 60%;
}

.site-filter {
  flex: 1;
  min-width: 100px;
  max-width: 120px;
}

/* 动作列表容器 */
.action-list-container {
  flex: 1;
  overflow-y: auto;
  min-height: 300px;
  max-height: 400px;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  color: var(--color-text-4);
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-2);
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 14px;
  color: var(--color-text-3);
}

/* 动作列表 */
.action-list {
  padding: 8px 0;
}

.action-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid var(--color-border-1);
}

.action-item:hover {
  background: var(--color-bg-2);
}

.action-item:last-child {
  border-bottom: none;
}

.action-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
}

.action-name {
  display: flex;
  align-items: center;
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text-1);
  flex: 1;
  min-width: 0;
}

.action-icon {
  margin-right: 8px;
  color: var(--color-primary-6);
  font-size: 16px;
  flex-shrink: 0;
}

.action-source {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: var(--color-text-3);
  margin-left: 16px;
  flex-shrink: 0;
}

.source-icon {
  margin-right: 4px;
  font-size: 14px;
}

.action-arrow {
  margin-left: 16px;
  color: var(--color-text-4);
  font-size: 14px;
  flex-shrink: 0;
}

/* 统计信息 */
.action-stats {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 16px 24px;
  background: var(--color-bg-2);
  border-top: 1px solid var(--color-border-2);
}

.stats-item {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.stats-label {
  color: var(--color-text-3);
  margin-right: 4px;
}

.stats-value {
  color: var(--color-text-1);
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .global-action-dialog :deep(.arco-modal) {
    width: calc(100vw - 24px) !important;
    margin: 12px auto;
  }

  .global-action-dialog :deep(.arco-modal-body) {
    max-height: calc(100vh - 148px);
    overflow: hidden;
  }

  .search-section {
    padding: 14px;
  }

  .search-filters {
    flex-direction: column;
    gap: 10px;
  }

  .action-search,
  .site-filter {
    min-width: 0;
    max-width: none;
    width: 100%;
  }

  .action-list-container {
    min-height: 220px;
    max-height: calc(100vh - 320px);
  }

  .action-item {
    padding: 12px 14px;
  }

  .action-main {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .action-name {
    width: 100%;
    line-height: 1.35;
    word-break: break-word;
  }

  .action-source {
    margin-left: 0;
    max-width: 100%;
    color: var(--dp-text-secondary);
    word-break: break-word;
  }

  .action-arrow {
    display: none;
  }

  .action-stats {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    padding: 12px 14px;
  }
}

/* 暗色主题适配 */
@media (prefers-color-scheme: dark) {
  .search-section {
    background: var(--color-bg-3);
  }
  
  .action-item:hover {
    background: var(--color-bg-3);
  }
  
  .action-stats {
    background: var(--color-bg-3);
  }
}
</style>