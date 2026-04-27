<template>
  <div class="live-proxy-selector">
    <svg class="selector-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M2 17l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <a-select
      :model-value="currentSelection"
      @change="handleSelectionChange"
      class="proxy-select"
      size="small"
      placeholder="选择代理播放地址"
    >
      <a-option value="disabled" title="关闭代理播放功能">代理 · 关闭</a-option>
      <a-option 
        v-for="option in proxyOptions" 
        :key="option.value" 
        :value="option.value"
        :title="`${option.label}\n完整链接: ${option.url || option.value}`"
      >
        代理 · {{ option.label }}
      </a-option>
    </a-select>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// Props
const props = defineProps({
  // 可以传入初始值，但组件会使用自己的存储
  initialValue: {
    type: String,
    default: 'disabled'
  }
})

// Emits
const emit = defineEmits(['change'])

// 响应式数据
const currentSelection = ref('disabled')
const proxyOptions = ref([])

// 存储键名 - 直播界面专用
const LIVE_PROXY_STORAGE_KEY = 'live-proxy-selection'
const GLOBAL_PROXY_HISTORY_KEY = 'address-history-proxy-play'

// 获取代理配置名称
const getProxyName = (url) => {
  if (!url) return '未知'
  const hashIndex = url.indexOf('#')
  if (hashIndex !== -1 && hashIndex < url.length - 1) {
    return url.substring(hashIndex + 1)
  }
  return '默认代理'
}

// 加载全局代理播放地址历史记录作为选项
const loadProxyOptions = () => {
  try {
    // 从全局历史记录中加载选项
    const addressHistory = JSON.parse(localStorage.getItem(GLOBAL_PROXY_HISTORY_KEY) || '[]')
    
    // 清空选项
    proxyOptions.value = []
    
    // 添加历史记录到选项中
    addressHistory.forEach(item => {
      const url = item.url || item.value || ''
      if (!url) return
      
      const proxyName = getProxyName(url)
      proxyOptions.value.push({
        value: url,
        label: proxyName,
        url: url
      })
    })
    
    console.log('直播代理选项加载完成:', proxyOptions.value.length, '个选项')
  } catch (error) {
    console.error('加载直播代理选项失败:', error)
  }
}

// 加载直播界面的独立选择状态
const loadLiveProxySelection = () => {
  try {
    const savedSelection = localStorage.getItem(LIVE_PROXY_STORAGE_KEY)
    if (savedSelection && savedSelection !== 'null') {
      currentSelection.value = savedSelection
    } else {
      currentSelection.value = 'disabled'
    }
    
    console.log('直播代理选择状态加载:', currentSelection.value)
  } catch (error) {
    console.error('加载直播代理选择状态失败:', error)
    currentSelection.value = 'disabled'
  }
}

// 保存直播界面的独立选择状态
const saveLiveProxySelection = (value) => {
  try {
    localStorage.setItem(LIVE_PROXY_STORAGE_KEY, value)
    console.log('直播代理选择状态已保存:', value)
  } catch (error) {
    console.error('保存直播代理选择状态失败:', error)
  }
}

// 处理选择变更
const handleSelectionChange = (value) => {
  currentSelection.value = value
  
  // 保存到独立存储
  saveLiveProxySelection(value)
  
  // 发送事件给父组件
  emit('change', {
    value: value,
    enabled: value !== 'disabled',
    url: value === 'disabled' ? '' : value
  })
  
  console.log('直播代理选择已变更:', {
    value: value,
    enabled: value !== 'disabled'
  })
}

// 监听全局代理历史变化，更新选项
const handleGlobalProxyHistoryChange = (event) => {
  if (event.key === GLOBAL_PROXY_HISTORY_KEY) {
    loadProxyOptions()
  }
}

// 监听自定义事件（用于同一页面内的历史变化）
const handleAddressHistoryChanged = () => {
  loadProxyOptions()
}

// 组件挂载时初始化
onMounted(() => {
  loadProxyOptions()
  loadLiveProxySelection()
  
  // 监听localStorage变化
  window.addEventListener('storage', handleGlobalProxyHistoryChange)
  
  // 监听自定义事件
  window.addEventListener('addressHistoryChanged', handleAddressHistoryChanged)
})

// 组件卸载时清理监听器
onUnmounted(() => {
  window.removeEventListener('storage', handleGlobalProxyHistoryChange)
  window.removeEventListener('addressHistoryChanged', handleAddressHistoryChanged)
})

// 暴露方法给父组件
defineExpose({
  getCurrentSelection: () => currentSelection.value,
  isEnabled: () => currentSelection.value !== 'disabled',
  getProxyUrl: () => currentSelection.value === 'disabled' ? '' : currentSelection.value,
  refreshOptions: loadProxyOptions
})
</script>

<style scoped>
.live-proxy-selector {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-width: 0;
  min-height: 32px;
  padding: 4px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
  background: transparent;
  border: none;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-2);
  position: relative;
}

.live-proxy-selector:hover {
  background: var(--color-fill-2);
  color: var(--color-text-1);
}

.selector-icon {
  width: 14px;
  height: 14px;
  flex: 0 0 auto;
}

.proxy-select {
  width: 142px;
  min-width: 142px;
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
}

.proxy-select :deep(.arco-select-view) {
  height: 32px;
  border: none !important;
  background: transparent !important;
  padding: 0 8px 0 0;
  font-size: 12px;
  font-weight: 500;
  border-radius: 8px;
}

.proxy-select :deep(.arco-select-view-suffix) {
  color: currentColor;
}

.proxy-select :deep(.arco-select-view-value) {
  color: currentColor;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .live-proxy-selector {
    flex: 0 0 auto;
    width: auto;
    min-height: 32px;
    padding: 4px;
    border-radius: 10px;
  }

  .proxy-select {
    width: 142px;
    min-width: 142px;
  }
}

</style>