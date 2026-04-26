<template>
  <div class="live-container">
    <!-- 简化的标题显示 -->
    <div class="simple-header">
      <span class="navigation-title">直播</span>
      <div class="header-actions">
        <a-button 
          type="text" 
          @click="refreshData"
          :loading="loading"
          size="small"
        >
          <template #icon>
            <icon-refresh />
          </template>
          刷新
        </a-button>
        <a-input-search
          v-model="searchKeyword"
          placeholder="搜索频道..."
          style="width: 200px"
          size="small"
          @search="handleSearch"
          @clear="handleSearchClear"
          allow-clear
        />
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="live-content">
      <!-- 加载状态 -->
      <div v-if="loading && !liveData" class="loading-container">
        <a-spin :size="32" tip="正在加载直播数据..." />
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-container">
        <a-result
          status="error"
          :title="error"
          sub-title="请检查网络连接或直播配置"
        >
          <template #extra>
            <a-button type="primary" @click="refreshData">
              重新加载
            </a-button>
            <a-button @click="goToSettings">
              检查设置
            </a-button>
          </template>
        </a-result>
      </div>

      <!-- 无配置状态 -->
      <div v-else-if="!hasLiveConfig" class="no-config-container">
        <a-result
          status="info"
          title="未配置直播源"
          sub-title="请先在设置页面配置直播地址"
        >
          <template #extra>
            <a-button type="primary" @click="goToSettings">
              前往设置
            </a-button>
          </template>
        </a-result>
      </div>

      <!-- 直播内容 -->
      <div v-else-if="liveData" class="live-main">
        <!-- 左侧分组列表 -->
        <div class="groups-panel">
          <div class="panel-header">
            <h3>分组列表</h3>
            <span class="group-count">{{ filteredGroups.length }}个分组</span>
          </div>
          <div class="groups-list">
            <div
              v-for="group in filteredGroups"
              :key="group.name"
              class="group-item"
              :class="{ active: selectedGroup === group.name }"
              @click="selectGroup(group.name)"
            >
              <div class="group-info">
                <span class="group-name">{{ group.name }}</span>
                <span class="channel-count">{{ group.channels.length }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 中间频道列表 -->
        <div class="channels-panel">
          <div class="panel-header">
            <h3>频道列表</h3>
            <span class="channel-count">{{ currentChannels.length }}个频道</span>
          </div>
          <div class="channels-list">
            <div
              v-for="channel in currentChannels"
              :key="channel.name"
              class="channel-item"
              :class="{ active: selectedChannel?.name === channel.name }"
              @click="selectChannel(channel)"
            >
              <div class="channel-logo">
                <img 
                  v-if="channel.logo" 
                  :src="channel.logo" 
                  :alt="channel.name"
                  @error="handleImageError"
                />
                <icon-live-broadcast v-else class="default-logo" />
              </div>
              <div class="channel-info">
                <div class="channel-name">{{ channel.name }}</div>
                <div class="channel-group">{{ channel.group }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧播放器预览区域 -->
        <div class="player-panel">
          <div class="panel-header">
            <h3>播放预览</h3>
            <div class="player-controls" v-if="selectedChannel">
              <a-button 
                type="text" 
                size="small"
                @click="copyChannelUrl"
              >
                <template #icon>
                  <icon-copy />
                </template>
                复制链接
              </a-button>
              <a-button 
                type="text" 
                size="small"
                @click="openInNewWindow"
              >
                <template #icon>
                  <icon-launch />
                </template>
                新窗口播放
              </a-button>
            </div>
          </div>
          
          <div class="player-content">
            <div v-if="!selectedChannel" class="no-selection">
              <icon-play-circle class="no-selection-icon" />
              <p>请选择一个频道开始播放</p>
            </div>
            
            <div v-else class="player-wrapper">
              <!-- 播放器控制区域 -->
              <div class="player-controls-area">
                <!-- 播放器头部组件（不包含代理功能） -->
                <PlayerHeader
                  :episode-name="selectedChannel.name"
                  :is-live-mode="true"
                  :show-debug-button="true"
                  :qualities="routeQualities"
                  :current-quality="currentQualityName"
                  @quality-change="handleQualityChange"
                  @toggle-debug="handleToggleDebug"
                  @close="handleClosePlayer"
                />
                
                <!-- 独立的直播代理选择器 -->
                <div class="live-proxy-control">
                  <LiveProxySelector
                    ref="liveProxySelector"
                    @change="handleLiveProxyChange"
                  />
                </div>
              </div>
              
              <!-- 默认播放器 -->
              <div class="video-container">
                <video
                  ref="videoPlayer"
                  :src="getVideoUrl()"
                  controls
                  preload="metadata"
                  @error="handleVideoError"
                  @loadstart="handleVideoLoadStart"
                  @loadeddata="handleVideoLoaded"
                >
                  您的浏览器不支持视频播放
                </video>
                
                <!-- 播放状态覆盖层 -->
                <div v-if="videoLoading" class="video-loading">
                  <a-spin :size="32" tip="正在加载视频..." />
                </div>
                
                <div v-if="videoError" class="video-error">
                  <icon-exclamation-circle class="error-icon" />
                  <p>视频加载失败</p>
                  <p class="error-detail">{{ videoError }}</p>
                  <a-button @click="retryVideo">重试</a-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 调试信息弹窗组件 -->
    <DebugInfoDialog
      :visible="debugMode"
      :video-url="getCurrentChannelUrl()"
      :headers="{}"
      :player-type="'default'"
      :detected-format="'m3u8'"
      :proxy-url="liveProxyEnabled && liveProxyUrl ? getProxyChannelUrl() : ''"
      @close="handleToggleDebug"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'
import mpegts from 'mpegts.js'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { 
  IconRefresh, 
  IconLiveBroadcast, 
  IconPlayCircle,
  IconCopy,
  IconLaunch,
  IconExclamationCircle
} from '@arco-design/web-vue/es/icon'
import liveService from '@/api/services/live.js'
import PlayerHeader from '@/components/players/PlayerHeader.vue'
import DebugInfoDialog from '@/components/players/DebugInfoDialog.vue'
import LiveProxySelector from '@/components/players/LiveProxySelector.vue'
import { processVideoUrl, buildProxyPlayUrl } from '@/utils/proxyPlayer'

const router = useRouter()

// 响应式数据
let mpegtsPlayer = null
const loading = ref(false)
const error = ref('')
const liveData = ref(null)
const hasLiveConfig = ref(true)
const searchKeyword = ref('')
const selectedGroup = ref('')
const selectedChannel = ref(null)
const currentRouteId = ref(1) // 当前选中的线路ID
const videoLoading = ref(false)
const videoError = ref('')
const videoPlayer = ref(null)

// PlayerHeader相关状态
const debugMode = ref(false)

// 直播界面独立的代理状态
const liveProxyEnabled = ref(false)
const liveProxyUrl = ref('')
const liveProxySelector = ref(null)

// 计算属性
const filteredGroups = computed(() => {
  if (!liveData.value) return []
  
  let groups = liveData.value.groups
  
  // 如果有搜索关键词，过滤分组
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    groups = groups.filter(group => 
      group.name.toLowerCase().includes(keyword) ||
      group.channels.some(channel => 
        channel.name.toLowerCase().includes(keyword)
      )
    )
  }
  
  return groups
})

const currentChannels = computed(() => {
  if (!liveData.value || !selectedGroup.value) return []
  
  const group = filteredGroups.value.find(g => g.name === selectedGroup.value)
  if (!group) return []
  
  let channels = group.channels
  
  // 如果有搜索关键词，过滤频道
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    channels = channels.filter(channel => 
      channel.name.toLowerCase().includes(keyword)
    )
  }
  
  return channels
})

// 将线路转换为画质选择格式
const routeQualities = computed(() => {
  if (!selectedChannel.value || !selectedChannel.value.routes) return []
  
  return selectedChannel.value.routes.map(route => ({
    name: route.name,
    id: route.id,
    url: route.url
  }))
})

// 当前画质名称
const currentQualityName = computed(() => {
  if (!selectedChannel.value || !selectedChannel.value.routes) return '默认'
  
  const currentRoute = selectedChannel.value.routes.find(route => route.id === currentRouteId.value)
  return currentRoute ? currentRoute.name : '默认'
})

// 方法
const loadLiveData = async (forceRefresh = false) => {
  loading.value = true
  error.value = ''
  
  try {
    // 检查是否有直播配置
    const config = await liveService.getLiveConfig()
    if (!config) {
      hasLiveConfig.value = false
      return
    }
    
    hasLiveConfig.value = true
    
    // 获取直播数据
    const data = await liveService.getLiveData(forceRefresh)
    liveData.value = data
    
    // 自动选择第一个分组
    if (data.groups.length > 0 && !selectedGroup.value) {
      selectedGroup.value = data.groups[0].name
    }
    
    console.log('直播数据加载成功:', data)
  } catch (err) {
    console.error('加载直播数据失败:', err)
    error.value = err.message || '加载直播数据失败'
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  loadLiveData(true)
}

const selectGroup = (groupName) => {
  selectedGroup.value = groupName
  selectedChannel.value = null // 清除选中的频道
}

const selectChannel = (channel) => {
  selectedChannel.value = channel
  videoError.value = ''
  // 使用nextTick确保DOM更新后再设置线路ID
  nextTick(() => {
    if (channel && channel.routes && channel.routes.length > 0) {
      // 智能选择线路ID：使用第一个线路的实际ID
      currentRouteId.value = Number(channel.routes[0].id)
    } else {
      currentRouteId.value = 1
    }
    // 重置视频播放器
    if (videoPlayer.value) {
      const newSrc = getVideoUrl()
      console.log('=== selectChannel 设置视频源 ===')
      console.log('设置前 videoPlayer.src:', videoPlayer.value.src)
      console.log('新的 src:', newSrc)
      videoPlayer.value.src = newSrc
      console.log('设置后 videoPlayer.src:', videoPlayer.value.src)
      videoPlayer.value.load()
    }
    setupMpegtsPlayer()
  })
}

// 获取当前频道的播放URL
function setupMpegtsPlayer() {
  // 销毁旧播放器
  if (mpegtsPlayer) {
    mpegtsPlayer.destroy()
    mpegtsPlayer = null
  }
  
  // 使用getVideoUrl函数获取正确的URL
  const url = getVideoUrl()
  console.log('=== setupMpegtsPlayer ===')
  console.log('mpegts播放器使用的URL:', url)
  console.log('当前videoPlayer.src:', videoPlayer.value?.src)
  
  if (!url || !videoPlayer.value) return
  
  // 判断是否为 mpegts 流（简单判断 .ts 或 mpegts 协议）
  if (url.endsWith('.ts') || url.includes('mpegts') || url.includes('udpxy') || 
      url.includes('/udp/') || url.includes('rtp://') || url.includes('udp://')) {
    if (mpegts.isSupported()) {
      mpegtsPlayer = mpegts.createPlayer({
        type: 'mpegts',
        url
      })
      mpegtsPlayer.attachMediaElement(videoPlayer.value)
      mpegtsPlayer.load()
      mpegtsPlayer.play()
    }
  }
}

onUnmounted(() => {
  if (mpegtsPlayer) {
    mpegtsPlayer.destroy()
    mpegtsPlayer = null
  }
})
const getCurrentChannelUrl = () => {
  if (!selectedChannel.value) return ''
  
  if (selectedChannel.value.routes && selectedChannel.value.routes.length > 0) {
    const currentRoute = selectedChannel.value.routes.find(route => route.id === currentRouteId.value)
    return currentRoute ? currentRoute.url : selectedChannel.value.routes[0].url
  }
  
  return selectedChannel.value.url || ''
}

// 获取代理后的频道URL
const getProxyChannelUrl = () => {
  const originalUrl = getCurrentChannelUrl()
  if (!originalUrl) return ''
  
  // 如果启用了直播代理且有代理URL，使用直播独立代理URL构建代理地址
  if (liveProxyEnabled.value && liveProxyUrl.value) {
    console.log('🔄 [直播代理] 构建代理URL:', {
      originalUrl: originalUrl,
      proxyAddress: liveProxyUrl.value,
      enabled: liveProxyEnabled.value
    })
    return buildProxyPlayUrl(originalUrl, liveProxyUrl.value, {})
  }
  
  // 否则返回原始URL
  return originalUrl
}

// 获取视频URL（根据直播代理设置）
const getVideoUrl = () => {
  const originalUrl = getCurrentChannelUrl()
  const proxyUrl = getProxyChannelUrl()
  const finalUrl = liveProxyEnabled.value ? proxyUrl : originalUrl
  
  console.log('=== getVideoUrl 调试信息 ===')
  console.log('直播代理状态:', liveProxyEnabled.value)
  console.log('直播代理URL:', liveProxyUrl.value)
  console.log('原始URL:', originalUrl)
  console.log('代理URL:', proxyUrl)
  console.log('最终URL:', finalUrl)
  console.log('========================')
  
  return finalUrl
}

// 切换线路
const switchRoute = (event) => {
  const routeId = Number(event.target ? event.target.value : event)
  if (!selectedChannel.value || !selectedChannel.value.routes) return
  const route = selectedChannel.value.routes.find(r => r.id === routeId)
  if (route) {
    currentRouteId.value = routeId
    videoError.value = ''
    nextTick(() => {
      if (videoPlayer.value) {
      const newSrc = getVideoUrl()
      console.log('=== switchRoute 设置视频源 ===')
      console.log('设置前 videoPlayer.src:', videoPlayer.value.src)
      console.log('新的 src:', newSrc)
      videoPlayer.value.src = newSrc
      console.log('设置后 videoPlayer.src:', videoPlayer.value.src)
      videoPlayer.value.load()
    }
    setupMpegtsPlayer()
    })
    Message.success(`已切换到${route.name}`)
  }
}

const handleSearch = (value) => {
  searchKeyword.value = value
  // 如果搜索后当前分组不在过滤结果中，选择第一个可用分组
  if (filteredGroups.value.length > 0 && 
      !filteredGroups.value.find(g => g.name === selectedGroup.value)) {
    selectedGroup.value = filteredGroups.value[0].name
  }
}

const handleSearchClear = () => {
  searchKeyword.value = ''
}

const goToSettings = () => {
  router.push('/settings')
}

const copyChannelUrl = async () => {
  if (!selectedChannel.value) return
  
  try {
    await navigator.clipboard.writeText(selectedChannel.value.url)
    Message.success('频道链接已复制到剪贴板')
  } catch (err) {
    console.error('复制失败:', err)
    Message.error('复制失败')
  }
}

const openInNewWindow = () => {
  if (!selectedChannel.value) return
  
  window.open(selectedChannel.value.url, '_blank')
}

const handleImageError = (event) => {
  // 图片加载失败时隐藏图片
  event.target.style.display = 'none'
}

const handleVideoError = (event) => {
  console.error('视频播放错误:', event)
  videoError.value = '无法播放此频道，可能是网络问题或频道源不可用'
  videoLoading.value = false
}

const handleVideoLoadStart = () => {
  videoLoading.value = true
  videoError.value = ''
}

const handleVideoLoaded = () => {
  videoLoading.value = false
}

const retryVideo = () => {
  if (videoPlayer.value) {
    videoError.value = ''
    videoPlayer.value.load()
    setupMpegtsPlayer()
  }
}

// PlayerHeader事件处理方法
const handleQualityChange = (qualityName) => {
  // 根据画质名称找到对应的线路
  if (!selectedChannel.value || !selectedChannel.value.routes) return
  
  const route = selectedChannel.value.routes.find(r => r.name === qualityName)
  if (route) {
    switchRoute(route.id)
  }
}

// 处理直播代理变更（独立于全局代理设置）
const handleLiveProxyChange = (proxyData) => {
  console.log('=== 直播代理播放地址变更 ===')
  console.log('代理数据:', proxyData)
  console.log('变更前状态:', { enabled: liveProxyEnabled.value, url: liveProxyUrl.value })
  
  // 更新直播代理状态
  liveProxyEnabled.value = proxyData.enabled
  liveProxyUrl.value = proxyData.url
  
  console.log('变更后状态:', { enabled: liveProxyEnabled.value, url: liveProxyUrl.value })
  
  // 如果当前有选中的频道，重新加载视频以应用代理设置
  if (selectedChannel.value) {
    // 销毁当前播放器
    if (mpegtsPlayer) {
      mpegtsPlayer.destroy()
      mpegtsPlayer = null
    }
    
    // 重新设置视频源
    if (videoPlayer.value) {
      videoError.value = ''
      videoLoading.value = true
      
      // 使用getVideoUrl函数获取正确的URL
      const newUrl = getVideoUrl()
      console.log('直播代理变更后重新设置视频源:', newUrl)
      videoPlayer.value.src = newUrl
      videoPlayer.value.load()
      
      // 重新设置mpegts播放器
      nextTick(() => {
        setupMpegtsPlayer()
      })
    }
  }
  
  Message.success(`直播代理播放: ${proxyData.enabled ? '已启用' : '已关闭'}`)
}

const handleToggleDebug = () => {
  debugMode.value = !debugMode.value
  console.log('调试模式:', debugMode.value ? '开启' : '关闭')
  
  if (debugMode.value) {
    console.log('=== 调试信息详情 ===')
    
    // 检查localStorage内容
    const LIVE_PROXY_STORAGE_KEY = 'live-proxy-selection'
    const savedSelection = localStorage.getItem(LIVE_PROXY_STORAGE_KEY)
    console.log('localStorage中的直播代理选择:', savedSelection)
    
    console.log('直播代理启用状态:', liveProxyEnabled.value)
    console.log('直播代理URL:', liveProxyUrl.value)
    console.log('原始频道URL:', getCurrentChannelUrl())
    console.log('代理后URL:', getProxyChannelUrl())
    console.log('传递给DebugInfoDialog的proxy-url:', liveProxyEnabled.value && liveProxyUrl.value ? getProxyChannelUrl() : '')
    
    // 检查LiveProxySelector组件状态
    if (liveProxySelector.value) {
      console.log('LiveProxySelector组件状态:')
      console.log('- getCurrentSelection():', liveProxySelector.value.getCurrentSelection?.())
      console.log('- isEnabled():', liveProxySelector.value.isEnabled?.())
      console.log('- getProxyUrl():', liveProxySelector.value.getProxyUrl?.())
    }
    
    console.log('==================')
  }
  // Message.info(`调试模式${debugMode.value ? '已开启' : '已关闭'}`)
}



const handleClosePlayer = () => {
  selectedChannel.value = null
  currentRouteId.value = 1
  videoError.value = ''
  if (mpegtsPlayer) {
    mpegtsPlayer.destroy()
    mpegtsPlayer = null
  }
}

// 监听选中频道变化
watch(selectedChannel, (newChannel) => {
  if (newChannel) {
    console.log('选中频道:', newChannel.name, newChannel.url)
  }
})

// 测试方法：直接加载本地M3U文件
const testLocalM3U = async () => {
      try {
        const response = await fetch('/json/tv.m3u')
        const content = await response.text()
        
        // 动态导入live.js并创建实例
        const { default: LiveService } = await import('@/api/services/live.js')
        const liveService = new LiveService()
        
        // 解析M3U内容
        const parsedData = liveService.parseM3U(content, {})
        
        // 设置数据
        liveData.value = parsedData
        
        // 自动选择第一个分组
        if (parsedData.groups && parsedData.groups.length > 0) {
          selectedGroup.value = parsedData.groups[0].name
        }
      } catch (error) {
        console.error('加载本地M3U文件失败:', error)
      }
    }

// 组件挂载时加载数据
// 初始化直播代理状态
const initLiveProxyState = () => {
  try {
    const LIVE_PROXY_STORAGE_KEY = 'live-proxy-selection'  // 修复：使用与LiveProxySelector组件一致的键名
    const savedSelection = localStorage.getItem(LIVE_PROXY_STORAGE_KEY)
    
    console.log('从localStorage读取的直播代理选择:', savedSelection)
    
    if (savedSelection && savedSelection !== 'null' && savedSelection !== 'disabled') {
      liveProxyEnabled.value = true
      liveProxyUrl.value = savedSelection
      console.log('初始化直播代理状态:', { enabled: true, url: savedSelection })
    } else {
      liveProxyEnabled.value = false
      liveProxyUrl.value = ''
      console.log('初始化直播代理状态:', { enabled: false, url: '', reason: savedSelection || 'null/disabled' })
    }
  } catch (error) {
    console.error('初始化直播代理状态失败:', error)
    liveProxyEnabled.value = false
    liveProxyUrl.value = ''
  }
}

onMounted(async () => {
  // 初始化直播代理状态
  initLiveProxyState()
  
  try {
    await loadLiveData()
  } catch (error) {
    console.error('加载直播数据失败:', error)
    // 如果加载失败，尝试测试本地M3U
    testLocalM3U()
  }
})
</script>

<style scoped>
.live-container {
  width: 100%;
  max-width: var(--dp-page-max-width);
  height: 100%;
  min-height: 0;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: transparent;
}

.simple-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  width: 100%;
  padding: 18px 22px;
  margin-bottom: 16px;
  background: var(--dp-bg-surface);
  border: 1px solid var(--dp-border-subtle);
  border-radius: var(--dp-radius-xl);
  box-shadow: var(--dp-shadow-sm);
  box-sizing: border-box;
}

.navigation-title {
  font-size: 24px;
  line-height: 1.25;
  font-weight: 800;
  color: var(--dp-text-primary);
  white-space: nowrap;
}

.header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.live-content {
  flex: 1;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}

.loading-container,
.error-container,
.no-config-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.live-main {
  height: 100%;
  display: grid;
  grid-template-columns: minmax(220px, 260px) minmax(260px, 320px) minmax(0, 1fr);
  gap: 16px;
}

.groups-panel,
.channels-panel,
.player-panel {
  background: var(--dp-bg-surface);
  border-radius: var(--dp-radius-xl);
  border: 1px solid var(--dp-border-subtle);
  box-shadow: var(--dp-shadow-sm);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.groups-panel,
.channels-panel {
  width: auto;
}

.player-panel {
  min-width: 0;
}

.panel-header {
  min-height: 54px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--dp-border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--dp-bg-surface-muted);
}

.panel-header h3 {
  margin: 0;
  font-size: 15px;
  line-height: 1.3;
  font-weight: 800;
  color: var(--dp-text-primary);
}

.group-count,
.channel-count {
  font-size: 12px;
  color: var(--dp-text-tertiary);
}

.player-controls {
  display: flex;
  gap: 8px;
}

.groups-list,
.channels-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 10px;
}

.group-item,
.channel-item {
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
  margin-bottom: 6px;
  border: 1px solid transparent;
}

.group-item:hover,
.channel-item:hover {
  background: var(--dp-bg-hover);
}

.group-item.active,
.channel-item.active {
  background: color-mix(in srgb, var(--dp-primary-readable) 12%, var(--dp-bg-surface));
  border-color: color-mix(in srgb, var(--dp-primary-readable) 28%, var(--dp-border-subtle));
  color: var(--dp-primary-readable);
}

.group-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.group-name {
  font-size: 14px;
  font-weight: 500;
}

.channel-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.channel-logo {
  flex: 0 0 58px;
  height: 44px;
  min-width: 58px;
  border-radius: 10px;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.channel-logo::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.channel-logo img {
  width: 80%;
  height: 80%;
  object-fit: contain;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.default-logo {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.9);
  position: relative;
  z-index: 1;
}

.channel-info {
  flex: 1;
  min-width: 0;
}

.channel-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--dp-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.channel-group {
  font-size: 12px;
  color: var(--dp-text-tertiary);
  margin-top: 3px;
}

.player-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.no-selection {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-3);
}

.no-selection-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.player-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}



.video-container {
  flex: 1;
  position: relative;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-container video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.video-loading,
.video-error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  color: white;
}

.error-icon {
  font-size: 48px;
  color: var(--color-danger-6);
  margin-bottom: 16px;
}

.error-detail {
  font-size: 12px;
  color: var(--color-text-3);
  margin-top: 8px;
  text-align: center;
}

/* 滚动条样式 */
.groups-list::-webkit-scrollbar,
.channels-list::-webkit-scrollbar {
  width: 6px;
}

.groups-list::-webkit-scrollbar-track,
.channels-list::-webkit-scrollbar-track {
  background: var(--color-fill-2);
  border-radius: 3px;
}

.groups-list::-webkit-scrollbar-thumb,
.channels-list::-webkit-scrollbar-thumb {
  background: var(--color-fill-4);
  border-radius: 3px;
}

.groups-list::-webkit-scrollbar-thumb:hover,
.channels-list::-webkit-scrollbar-thumb:hover {
  background: var(--color-fill-6);
}

@media (max-width: 1280px) {
  .live-main {
    grid-template-columns: minmax(190px, 220px) minmax(230px, 280px) minmax(0, 1fr);
    gap: 12px;
  }

  .panel-header {
    padding: 12px 14px;
  }

  .group-item,
  .channel-item {
    padding: 10px;
  }
}

@media (max-width: 768px) {
  .live-container {
    background: var(--dp-bg-app);
  }

  .simple-header {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding: 10px 0 12px;
    margin-bottom: 0;
    background: transparent;
    border: none;
    border-radius: 0;
    box-shadow: none;
  }

  .navigation-title {
    display: none;
  }

  .header-actions {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 8px;
  }

  .header-actions :deep(.arco-input-wrapper) {
    width: 100% !important;
    height: 40px;
    border-radius: 999px;
    background: var(--dp-bg-surface);
    border-color: var(--dp-border-subtle);
  }

  .live-content {
    min-height: 0;
    padding: 0;
    overflow: hidden;
  }

  .live-main {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: minmax(210px, 32vh) auto minmax(0, 1fr);
    gap: 10px;
    height: 100%;
  }

  .player-panel {
    grid-row: 1;
    min-width: 0;
    border-radius: 18px;
    background: #000;
    border: none;
    box-shadow: var(--dp-shadow-sm);
  }

  .player-panel .panel-header {
    min-height: 42px;
    padding: 8px 10px;
    background: rgba(0, 0, 0, 0.72);
    border-bottom-color: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .player-panel .panel-header h3 {
    color: #fff;
  }

  .player-controls {
    gap: 4px;
  }

  .player-controls :deep(.arco-btn) {
    color: rgba(255, 255, 255, 0.88);
    padding: 0 6px;
    font-size: 12px;
  }

  .player-content,
  .player-wrapper,
  .video-container {
    min-height: 0;
  }

  .player-controls-area {
    background: var(--dp-bg-surface);
  }

  .groups-panel {
    grid-row: 2;
    width: 100%;
    min-width: 0;
    height: auto;
    border: none;
    border-radius: 0;
    background: transparent;
  }

  .groups-panel .panel-header {
    display: none;
  }

  .groups-list {
    display: flex;
    gap: 8px;
    padding: 0 0 2px;
    overflow-x: auto;
    overflow-y: hidden;
  }

  .group-item {
    flex: 0 0 auto;
    min-width: 82px;
    margin: 0;
    padding: 9px 12px;
    border-radius: 999px;
    background: var(--dp-bg-surface);
    border: 1px solid var(--dp-border-subtle);
    box-shadow: var(--dp-shadow-sm);
  }

  .group-info {
    gap: 8px;
  }

  .group-name {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
  }

  .group-item.active {
    background: var(--dp-bg-hover);
    color: var(--color-primary-6);
    border-color: var(--color-primary-3);
  }

  .channels-panel {
    grid-row: 3;
    width: 100%;
    min-width: 0;
    border-radius: 18px;
    background: var(--dp-bg-surface);
    border-color: var(--dp-border-subtle);
  }

  .channels-panel .panel-header {
    padding: 12px;
    background: var(--dp-bg-surface);
  }

  .channels-list {
    padding: 8px;
  }

  .channel-item {
    margin-bottom: 8px;
    padding: 10px;
    border-radius: 14px;
    background: var(--dp-bg-surface-muted);
  }

  .channel-logo {
    width: 48px;
    min-width: 48px;
    flex: 0 0 48px;
    height: 42px;
  }

  .channel-info {
    width: auto;
    min-width: 0;
    flex: 1;
  }

  .channel-name {
    font-size: 14px;
  }
}
</style>
