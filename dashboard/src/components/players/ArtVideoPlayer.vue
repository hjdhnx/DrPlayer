<template>
  <a-card v-if="visible && (videoUrl || needsParsing)" class="video-player-section">
    <PlayerHeader
      :episode-name="episodeName"
      :player-type="playerType"
      :episodes="episodes"
      :auto-next-enabled="autoNextEnabled"
      :loop-enabled="loopEnabled"
      :countdown-enabled="countdownEnabled"
      :skip-enabled="skipEnabled"
      :show-debug-button="showDebugButton"
      :qualities="convertQualitiesToHeaderFormat"
      :current-quality="getCurrentQualityLabel"
      :show-parser-selector="needsParsing"
      :needs-parsing="needsParsing"
      :parse-data="parseData"
      @toggle-auto-next="toggleAutoNext"
      @toggle-loop="toggleLoop"
      @toggle-countdown="toggleCountdown"
      @player-change="handlePlayerTypeChange"
      @open-skip-settings="openSkipSettingsDialog"
      @toggle-debug="toggleDebugDialog"
      @proxy-change="handleProxyChange"
      @quality-change="handleHeaderQualityChange"
      @parser-change="handleParserChange"
      @close="closePlayer"
    />
    <div class="art-player-wrapper" v-show="props.visible">

    <div ref="artPlayerContainer" class="art-player-container">
      <!-- ArtPlayer 将在这里初始化 -->
    </div>

    <!-- 自动下一集倒计时弹窗 -->
    <div v-if="showAutoNextDialog" class="auto-next-dialog">
      <div class="auto-next-content">
        <div class="auto-next-title">
          <span>即将播放下一集</span>
        </div>
        <div class="auto-next-episode" v-if="getNextEpisode()">
          {{ getNextEpisode().name }}
        </div>
        <div class="auto-next-countdown">
          {{ autoNextCountdown }} 秒后自动播放
        </div>
        <div class="auto-next-buttons">
          <button @click="playNextEpisode" class="btn-play-now">立即播放</button>
          <button @click="cancelAutoNext" class="btn-cancel">取消</button>
        </div>
      </div>
    </div>



    <!-- 片头片尾设置弹窗 -->
    <SkipSettingsDialog
      :visible="showSkipSettingsDialog"
      :skip-intro-enabled="skipIntroEnabled"
      :skip-outro-enabled="skipOutroEnabled"
      :skip-intro-seconds="skipIntroSeconds"
      :skip-outro-seconds="skipOutroSeconds"
      @close="closeSkipSettingsDialog"
      @save="saveSkipSettings"
    />

    <!-- 调试信息弹窗组件 -->
    <DebugInfoDialog
      :visible="showDebugDialog"
      :video-url="currentPlayingUrl || videoUrl"
      :headers="headers"
      :player-type="'artplayer'"
      :detected-format="detectedFormat"
      :proxy-url="proxyVideoUrl"
      @close="closeDebugDialog"
    />
  </div>
  </a-card>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick, computed, markRaw, toRaw } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconClose } from '@arco-design/web-vue/es/icon'
import Artplayer from 'artplayer'
import Hls from 'hls.js'
import artplayerPluginDanmuku from 'artplayer-plugin-danmuku'
import { MediaPlayerManager, detectVideoFormat, createCustomPlayer, destroyCustomPlayer } from '@/utils/MediaPlayerManager'

// 配置自定义倍速选项
Artplayer.PLAYBACK_RATE = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5]
import PlayerHeader from './PlayerHeader.vue'
import SkipSettingsDialog from './SkipSettingsDialog.vue'
import DebugInfoDialog from './DebugInfoDialog.vue'
import { useSkipSettings } from '@/composables/useSkipSettings'
import { applyCSPBypass, setVideoReferrerPolicy, REFERRER_POLICIES, getCSPConfig } from '@/utils/csp'
import { processVideoUrl, isProxyPlayEnabled } from '@/utils/proxyPlayer'

// Props - 已添加 HLS 支持、动态高度自适应和自动下一集功能
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  videoUrl: {
    type: String,
    default: ''
  },
  episodeName: {
    type: String,
    default: '未知选集'
  },
  poster: {
    type: String,
    default: ''
  },
  playerType: {
    type: String,
    default: 'artplayer'
  },
  // 自动下一集功能相关 props
  episodes: {
    type: Array,
    default: () => []
  },
  currentEpisodeIndex: {
    type: Number,
    default: 0
  },
  autoNext: {
    type: Boolean,
    default: true
  },
  // 自定义请求头，用于HLS播放
  headers: {
    type: Object,
    default: () => ({})
  },
  // 弹幕链接，用于弹幕功能
  danmakuUrl: {
    type: String,
    default: ''
  },
  // 画质相关属性
  qualities: {
    type: Array,
    default: () => []
  },
  hasMultipleQualities: {
    type: Boolean,
    default: false
  },
  initialQuality: {
    type: String,
    default: '默认'
  },
  // 解析相关属性
  needsParsing: {
    type: Boolean,
    default: false
  },
  parseData: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits(['close', 'error', 'player-change', 'next-episode', 'episode-selected', 'quality-change', 'parser-change'])

// 响应式数据
const artPlayerContainer = ref(null)
const artPlayerInstance = ref(null)
const mediaPlayerManager = ref(null) // 媒体播放器管理器
const retryCount = ref(0) // 重连次数计数器
const maxRetries = ref(3) // 最大重连次数
const isRetrying = ref(false) // 是否正在重连
const dynamicHeight = ref(450) // 动态计算的高度

// 自动下一集功能相关数据
// 初始化互斥逻辑：自动连播和循环播放不能同时开启
const savedLoopEnabled = JSON.parse(localStorage.getItem('loopEnabled') || 'false')
const savedAutoNextEnabled = JSON.parse(localStorage.getItem('autoNextEnabled') || 'true')

// 确保互斥：如果循环播放开启，则关闭自动连播
const autoNextEnabled = ref(savedLoopEnabled ? false : savedAutoNextEnabled)
const loopEnabled = ref(savedLoopEnabled)
const autoNextCountdown = ref(0) // 自动下一集倒计时
const autoNextTimer = ref(null) // 自动下一集定时器
const showAutoNextDialog = ref(false) // 显示自动下一集对话框
const countdownEnabled = ref(false) // 倒计时开关，默认关闭

// 防抖标志，防止重复触发
const isProcessingAutoNext = ref(false) // 防止自动下一集重复触发
const isProcessingLoop = ref(false) // 防止循环播放重复触发

// 调试相关
const showDebugDialog = ref(false)
const detectedFormat = ref('')

// 画质相关
const currentQuality = ref('默认')
const availableQualities = ref([])
const currentPlayingUrl = ref('')

// 代理设置变化追踪器 - 用于强制 proxyVideoUrl 计算属性重新计算
const proxySettingsVersion = ref(0)

// 弹幕相关状态
const danmakuEnabled = ref(JSON.parse(localStorage.getItem('danmakuEnabled') || 'true'))
const danmakuData = ref([])
const danmakuLoading = ref(false)
const currentDanmakuUrl = ref('') // 当前弹幕iframe的URL


// 计算属性：是否显示调试按钮
const showDebugButton = computed(() => {
  return !!props.videoUrl
})

// 计算属性：代理后的视频链接
const proxyVideoUrl = computed(() => {
  // 依赖 proxySettingsVersion 以响应代理设置变化
  proxySettingsVersion.value

  // 使用当前实际播放的URL，如果没有则使用props.videoUrl
  const actualUrl = currentPlayingUrl.value || props.videoUrl
  if (!actualUrl) return ''

  const headers = props.headers || {}
  return processVideoUrl(actualUrl, headers)
})

// 计算属性：获取当前画质的标签
const getCurrentQualityLabel = computed(() => {
  if (!currentQuality.value || availableQualities.value.length === 0) {
    return '默认'
  }

  // 按照T4格式处理：使用name字段
  const currentQualityData = availableQualities.value.find(q => q.name === currentQuality.value)
  return currentQualityData?.name || currentQuality.value || '默认'
})

// 计算属性：转换画质数据格式以适配PlayerHeader组件
const convertQualitiesToHeaderFormat = computed(() => {
  return availableQualities.value.map(q => ({
    name: q.name || '未知',
    value: q.name,
    url: q.url
  }))
})

// 选集弹窗相关数据已移除，现在使用ArtPlayer的layer功能

// 使用片头片尾设置组合式函数
const {
  showSkipSettingsDialog,
  skipIntroEnabled,
  skipOutroEnabled,
  skipIntroSeconds,
  skipOutroSeconds,
  skipEnabled,
  initSkipSettings,
  resetSkipState,
  applySkipSettings,
  applyIntroSkipImmediate,
  handleTimeUpdate,
  closeSkipSettingsDialog,
  saveSkipSettings: saveSkipSettingsComposable,
  onUserSeekStart,
  onUserSeekEnd,
  onFullscreenChangeStart,
  onFullscreenChangeEnd
} = useSkipSettings({
  onSkipToNext: () => {
    if (autoNextEnabled.value && hasNextEpisode()) {
      playNextEpisode()
    }
  },
  getCurrentTime: () => artPlayerInstance.value?.video?.currentTime || 0,
  setCurrentTime: (time) => {
    if (artPlayerInstance.value?.video) {
      artPlayerInstance.value.video.currentTime = time
    }
  },
  getDuration: () => artPlayerInstance.value?.video?.duration || 0
})

// 链接类型判断函数
const isDirectVideoLink = (url) => {
  if (!url) return false

  // 视频文件扩展名
  const videoExtensions = [
    '.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.flv', '.mkv',
    '.m4v', '.3gp', '.ts', '.m3u8', '.mpd'
  ]

  // 检查URL是否包含视频扩展名
  const hasVideoExtension = videoExtensions.some(ext =>
    url.toLowerCase().includes(ext)
  )

  // 检查是否是流媒体格式
  const isStreamingFormat = url.toLowerCase().includes('m3u8') ||
                           url.toLowerCase().includes('mpd') ||
                           url.toLowerCase().includes('rtmp') ||
                           url.toLowerCase().includes('rtsp')

  // 如果有视频扩展名或是流媒体格式，认为是直链
  if (hasVideoExtension || isStreamingFormat) {
    return true
  }

  // 检查是否看起来像网页链接（但排除已经确认为视频的情况）
  const looksLikeWebpage = url.includes('://') &&
                          (url.includes('.html') ||
                           url.includes('.php') ||
                           url.includes('.asp') ||
                           url.includes('.jsp') ||
                           url.match(/\/[^.?#]*$/) // 没有扩展名且没有查询参数的路径
                          ) &&
                          !hasVideoExtension &&
                          !isStreamingFormat

  // 如果看起来像网页，认为不是直链
  if (looksLikeWebpage) {
    return false
  }

  // 默认尝试作为直链处理
  return true
}

// 弹幕相关工具函数
const parseDanmakuUrl = (videoUrl) => {
  if (!videoUrl) return null

  // 尝试从视频URL推断弹幕URL
  // 这里可以根据不同的视频源网站实现不同的弹幕URL解析逻辑

  // 示例：如果是bilibili链接
  if (videoUrl.includes('bilibili.com')) {
    // 从bilibili视频URL提取弹幕
    const bvMatch = videoUrl.match(/BV[a-zA-Z0-9]+/)
    if (bvMatch) {
      return `https://api.bilibili.com/x/v1/dm/list.so?oid=${bvMatch[0]}`
    }
  }

  // 示例：如果是其他支持弹幕的网站
  // 可以在这里添加更多的解析逻辑

  // 默认返回null，表示无法解析弹幕URL
  return null
}

const loadDanmakuData = async (videoUrl) => {
  if (!danmakuEnabled.value) {
    return []
  }

  danmakuLoading.value = true

  try {
    // 优先使用 T4 解析返回的弹幕链接
    let danmakuUrl = props.danmakuUrl
    
    // 如果没有 T4 弹幕链接，尝试从视频URL解析
    if (!danmakuUrl) {
      danmakuUrl = parseDanmakuUrl(videoUrl)
    }
    
    if (!danmakuUrl) {
      console.log('无法解析弹幕URL，使用默认弹幕数据')
      return getDefaultDanmakuData()
    }

    console.log('弹幕链接:', danmakuUrl)

    // 处理不同协议的弹幕链接
    if (danmakuUrl.startsWith('http://') || danmakuUrl.startsWith('https://')) {
      // HTTP协议：直接请求弹幕数据
      console.log('处理HTTP协议弹幕链接:', danmakuUrl)
      const response = await fetch(danmakuUrl)
      const data = await response.json()
      return parseDanmakuData(data)
    } else if (danmakuUrl.startsWith('web://')) {
      // WEB协议：创建自定义HTML层显示iframe
      console.log('处理WEB协议弹幕链接:', danmakuUrl)
      const iframeUrl = danmakuUrl.replace('web://', '')
      await createDanmakuIframeLayer(iframeUrl)
      // WEB协议不返回弹幕数据，而是通过iframe显示
      return []
    } else {
      console.log('未知弹幕协议，使用默认弹幕数据')
      return getDefaultDanmakuData()
    }
  } catch (error) {
    console.error('加载弹幕数据失败:', error)
    return getDefaultDanmakuData()
  } finally {
    danmakuLoading.value = false
  }
}

const getDefaultDanmakuData = () => {
  return [
    {
      text: '欢迎使用弹幕功能！',
      time: 10,
      color: '#ffffff',
      type: 'right'
    },
    {
      text: '这是一条测试弹幕',
      time: 30,
      color: '#00ff00',
      type: 'right'
    },
    {
      text: '弹幕功能已启用',
      time: 60,
      color: '#ff6b6b',
      type: 'top'
    }
  ]
}

// 解析弹幕数据 - 将HTTP协议返回的数据转换为ArtPlayer弹幕格式
const parseDanmakuData = (data) => {
  try {
    // 处理不同格式的弹幕数据
    if (Array.isArray(data)) {
      // 如果已经是数组格式，直接处理
      return data.map(item => ({
        text: item.text || item.content || '',
        time: parseFloat(item.time || item.timestamp || 0),
        color: item.color || '#ffffff',
        type: item.type || 'right'
      })).filter(item => item.text.trim().length > 0)
    } else if (data.data && Array.isArray(data.data)) {
      // 如果数据在data字段中
      return data.data.map(item => ({
        text: item.text || item.content || '',
        time: parseFloat(item.time || item.timestamp || 0),
        color: item.color || '#ffffff',
        type: item.type || 'right'
      })).filter(item => item.text.trim().length > 0)
    } else {
      console.warn('未知的弹幕数据格式:', data)
      return getDefaultDanmakuData()
    }
  } catch (error) {
    console.error('解析弹幕数据失败:', error)
    return getDefaultDanmakuData()
  }
}

const buildDanmakuIframeHtml = (iframeUrl)=>{
  return `
        <div class="danmaku-iframe-container" style="
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 10;
        ">
          <iframe
            src="${iframeUrl}"
            style="
              width: 100%;
              height: 100%;
              border: none;
              background: transparent;
              pointer-events: auto;
            "
            frameborder="0"
            allowtransparency="true"
          ></iframe>
        </div>
      `
}

// 创建弹幕iframe层 - 处理web://协议的弹幕链接
const createDanmakuIframeLayer = async (iframeUrl) => {
  try {
    if (!artPlayerInstance.value) {
      console.warn('ArtPlayer实例不存在，无法创建弹幕iframe层')
      return
    }

    console.log('创建弹幕iframe层:', iframeUrl)

    // 存储当前弹幕URL
    currentDanmakuUrl.value = iframeUrl

    // 移除已存在的弹幕iframe层
    removeDanmakuIframeLayer()

    // 更新iframe层内容
    artPlayerInstance.value.layers.update({
      name: 'danmaku-iframe',
      html: buildDanmakuIframeHtml(currentDanmakuUrl.value),
      style: {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        display: danmakuEnabled.value ? 'block' : 'none',
        zIndex: '10'
      }
    })

    console.log('弹幕iframe层创建成功')
  } catch (error) {
    console.error('创建弹幕iframe层失败:', error)
  }
}

// 移除弹幕iframe层（完全清空内容）
const removeDanmakuIframeLayer = () => {
  try {
    if (artPlayerInstance.value && artPlayerInstance.value.layers) {
      artPlayerInstance.value.layers.update({
        name: 'danmaku-iframe',
        html: '',
        style: {
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          display: 'none',
          zIndex: '10'
        }
      })
    }
  } catch (error) {
    console.error('移除弹幕iframe层失败:', error)
  }
}

// 隐藏弹幕iframe层（保留内容，只隐藏显示）
const hideDanmakuIframeLayer = () => {
  try {
    if (artPlayerInstance.value && artPlayerInstance.value.layers) {
      const currentLayer = artPlayerInstance.value.layers['danmaku-iframe']
      if (currentLayer) {
        artPlayerInstance.value.layers.update({
          name: 'danmaku-iframe',
          html: '',
          style: {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: '10',
            display: 'none'
          }
        })
        console.log('隐藏弹幕iframe层成功')
      }
    }
  } catch (error) {
    console.error('隐藏弹幕iframe层失败:', error)
  }
}

// 显示弹幕iframe层
const showDanmakuIframeLayer = () => {
  try {
    if (artPlayerInstance.value && artPlayerInstance.value.layers && currentDanmakuUrl.value) {
      artPlayerInstance.value.layers.update({
        name: 'danmaku-iframe',
        html: buildDanmakuIframeHtml(currentDanmakuUrl.value),
        style: {
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          display: 'block',
          zIndex: '10'
        }
      })
      console.log('显示弹幕iframe层成功:', currentDanmakuUrl.value)
    }
  } catch (error) {
    console.error('显示弹幕iframe层失败:', error)
  }
}

// 处理弹幕URL - 根据协议类型选择处理方式
const handleDanmakuUrl = async () => {
  try {
    if (!props.danmakuUrl || !props.danmakuUrl.trim()) {
      console.log('没有弹幕URL，使用默认弹幕数据')
      return
    }

    const danmakuUrl = props.danmakuUrl.trim()
    console.log('处理弹幕URL:', danmakuUrl)

    if (danmakuUrl.startsWith('web://')) {
      // 处理web://协议 - 创建iframe层
      const iframeUrl = danmakuUrl.substring(6) // 移除 'web://' 前缀
      console.log('检测到web://协议，创建iframe层:', iframeUrl)
      await createDanmakuIframeLayer(iframeUrl)
    } else if (danmakuUrl.startsWith('http://') || danmakuUrl.startsWith('https://')) {
      // 处理HTTP协议 - 加载弹幕数据
      console.log('检测到HTTP协议，加载弹幕数据:', danmakuUrl)
      danmakuLoading.value = true
      
      try {
        const response = await fetch(danmakuUrl)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        const parsedData = parseDanmakuData(data)
        
        // 更新弹幕数据
        danmakuData.value = parsedData
        console.log('弹幕数据加载成功，条数:', parsedData.length)
        
        // 如果弹幕插件已初始化，更新弹幕数据
        if (artPlayerInstance.value && artPlayerInstance.value.plugins && artPlayerInstance.value.plugins.artplayerPluginDanmuku) {
          artPlayerInstance.value.plugins.artplayerPluginDanmuku.config({
            danmuku: parsedData
          })
          console.log('弹幕插件数据已更新')
        }
      } catch (error) {
        console.error('加载弹幕数据失败:', error)
        // 使用默认弹幕数据
        danmakuData.value = getDefaultDanmakuData()
      } finally {
        danmakuLoading.value = false
      }
    } else {
      console.warn('不支持的弹幕URL协议:', danmakuUrl)
    }
  } catch (error) {
    console.error('处理弹幕URL失败:', error)
  }
}

// 初始化 ArtPlayer
const initArtPlayer = async (url) => {
  if (!artPlayerContainer.value || !url) return

  console.log('初始化 ArtPlayer:', url)

  // 应用CSP绕过策略
  try {
    const appliedPolicy = applyCSPBypass(url)
    console.log(`已为ArtPlayer应用CSP策略: ${appliedPolicy}`)
  } catch (error) {
    console.warn('应用CSP策略失败:', error)
  }

  // 重置重连状态
  resetRetryState()

  // 重置片头片尾状态
  resetSkipState()

  // 重置防抖标志
  resetDebounceFlags()

  // 等待 DOM 更新后计算动态高度
  await nextTick()
  dynamicHeight.value = calculateDynamicHeight()

  // 应用动态高度到容器
  artPlayerContainer.value.style.height = `${dynamicHeight.value}px`

  // 首先判断链接类型
  if (!isDirectVideoLink(url)) {
    console.log('检测到网页链接，在新窗口打开:', url)
    Message.info('检测到网页链接，正在新窗口打开...')
    window.open(url, '_blank')
    emit('close') // 关闭播放器
    return
  }

  // 初始化或清理媒体播放器管理器
  if (!mediaPlayerManager.value) {
    mediaPlayerManager.value = new MediaPlayerManager()
  } else {
    mediaPlayerManager.value.destroy()
  }

  // 如果播放器实例已存在，使用 switchUrl 方法切换视频源
  if (artPlayerInstance.value) {
    // 准备自定义请求头
    const cspConfig = getCSPConfig()
    const headers = {
      ...(props.headers || {}),
      ...(cspConfig.autoBypass ? {} : {})
    }

    // 处理代理播放地址
    const finalUrl = processVideoUrl(url, headers)
    if (finalUrl !== url) {
      console.log('🔄 [代理播放] switchUrl使用代理地址')
    }

    console.log('使用 switchUrl 方法切换视频源:', finalUrl)

    try {
      // 使用 switchUrl 方法切换视频源，这样可以保持全屏状态和其他用户设置
      await artPlayerInstance.value.switchUrl(finalUrl)
      console.log('视频源切换成功')

      // 重置片头片尾跳过状态
      resetSkipState()

      // 重新应用片头片尾设置
      applySkipSettings()

      return // 切换成功，直接返回
    } catch (error) {
      console.error('switchUrl 切换失败，回退到销毁重建方式:', error)
      // 如果 switchUrl 失败，回退到原来的销毁重建方式

      // 清理媒体播放器管理器
      if (mediaPlayerManager.value) {
        mediaPlayerManager.value.destroy()
      }

      artPlayerInstance.value.destroy()
      artPlayerInstance.value = null
    }
  }

  try {
    // 准备自定义请求头
    const cspConfig = getCSPConfig()
    const headers = {
      ...(props.headers || {}),
      ...(cspConfig.autoBypass ? {} : {})
    }

    // 处理代理播放地址
    const finalUrl = processVideoUrl(url, headers)
    if (finalUrl !== url) {
      console.log('🔄 [代理播放] 使用代理地址播放视频')
    }

    // 检测视频格式
    const videoFormat = detectVideoFormat(finalUrl)
    detectedFormat.value = videoFormat
    console.log('检测到视频格式:', videoFormat)

    // 加载弹幕数据
    danmakuData.value = await loadDanmakuData(finalUrl)

    // 创建 ArtPlayer 实例
    const art = new Artplayer({
      container: artPlayerContainer.value,
      url: finalUrl,
      poster: props.poster,
      volume: 0.7,
      isLive: false,
      muted: false,
      autoplay: true,
      pip: true,
      autoSize: false,
      autoMini: true,
      width: '100%',
      height: dynamicHeight.value,
      screenshot: true,
      setting: true,
      loop: false,
      flip: true,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      subtitleOffset: true,
      miniProgressBar: true,
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: true,
      airplay: true,
      theme: '#23ade5',
      lang: 'zh-cn',
      whitelist: ['*'],
      // 自定义视频类型处理
      type: videoFormat === 'hls' ? 'm3u8' : videoFormat === 'flv' ? 'flv' : videoFormat === 'dash' ? 'mpd' : '',
      // 自定义加载器 - 直接使用createCustomPlayer
      customType: videoFormat !== 'native' ? {
        [videoFormat === 'hls' ? 'm3u8' : videoFormat === 'flv' ? 'flv' : videoFormat === 'dash' ? 'mpd' : videoFormat]: function (video, url, art) {
          // 直接使用createCustomPlayer函数
          const cspConfig = getCSPConfig()
          const headers = {
            ...(props.headers || {}),
            ...(cspConfig.autoBypass ? {} : {})
          }

          // 根据格式创建对应的播放器
          let player = null
          switch (videoFormat) {
            case 'hls':
              player = createCustomPlayer.hls(video, url, headers)
              break
            case 'flv':
              player = createCustomPlayer.flv(video, url, headers)
              break
            case 'dash':
              player = createCustomPlayer.dash(video, url, headers)
              break
          }

          // 将播放器实例保存到art实例中，方便后续管理
          if (player) {
            art.customPlayer = player
            art.customPlayerFormat = videoFormat
          }

          console.log(`${videoFormat.toUpperCase()} 播放器加载成功`)
        }
      } : {},
      // 自定义控制栏
      controls: [
        {
          position: 'right',
          html: hasNextEpisode() ? '<span class="player-control-label" data-mobile="下">下一集</span>' : '',
          tooltip: hasNextEpisode() ? '播放下一集' : '',
          style: hasNextEpisode() ? {} : { display: 'none' },
          click: function () {
            playNextEpisode()
          },
        },
        {
          position: 'right',
          html: availableQualities.value.length > 1 ? `<span class="player-control-label" data-mobile="质">画质: ${getCurrentQualityLabel.value}</span>` : '',
          style: availableQualities.value.length > 1 ? {} : { display: 'none' },
          click: function () {
            toggleQualityLayer()
          },
        },
        {
          position: 'right',
          html: props.episodes.length > 1 ? '<span class="player-control-label" data-mobile="集">选集</span>' : '',
          tooltip: props.episodes.length > 1 ? '选择集数' : '',
          style: props.episodes.length > 1 ? {} : { display: 'none' },
          click: function () {
            toggleEpisodeLayer()
          },
        },
        {
          position: 'right',
          html: '<span class="player-control-label" data-mobile="关">关闭</span>',
          tooltip: '关闭播放器',
          click: function () {
            closePlayer()
          },
        },
      ],
      // 质量选择器（如果支持）
      quality: [],
      // 字幕配置
      subtitle: {
        url: '',
        type: 'srt',
        encoding: 'utf-8',
        escape: true,
      },
      // 右键菜单
      contextmenu: [
        {
          html: '自定义菜单',
          click: function () {
            console.log('点击了自定义菜单')
          },
        },
      ],
      // 图层配置
      layers: [
        {
          name: 'episodeLayer',
          html: '',
          style: {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'none',
            zIndex: '100',
            padding: '0',
            boxSizing: 'border-box',
            overflow: 'hidden'
          },
          click: function(event) {
            // 点击背景关闭layer
            if (event.target.classList.contains('episode-layer-background')) {
              hideEpisodeLayer()
            }
          }
        },
        {
          name: 'qualityLayer',
          html: '',
          style: {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'none',
            zIndex: '100',
            padding: '0',
            boxSizing: 'border-box',
            overflow: 'hidden'
          },
          click: function(event) {
            // 点击背景关闭layer
            if (event.target.classList.contains('quality-layer-background')) {
              hideQualityLayer()
            }
          }
        },
        {
          name: 'danmaku-iframe',
          html: '',
          style: {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            display: 'none',
            zIndex: '10'
          }
        }
      ],
      // 插件配置
      plugins: [
        artplayerPluginDanmuku({
          // 使用函数返回以支持后续异步替换
          danmuku: () => danmakuData.value,
          speed: 5,
          opacity: 1,
          fontSize: 25,
          antiOverlap: true,
          synchronousPlayback: false,
          filter: (danmu) => (danmu?.text || '').trim().length > 0 && (danmu?.text || '').length <= 80,
          visible: danmakuEnabled.value,
        })
      ]
    })

    // 事件监听
    art.on('ready', () => {
      console.log('ArtPlayer 准备就绪')
      // 应用片头片尾设置
      applySkipSettings()
      // 处理弹幕URL
      handleDanmakuUrl()
    })

    art.on('video:loadstart', () => {
      // 重置片头片尾跳过状态
      resetSkipState()
    })

    art.on('video:canplay', () => {
      // 视频可以播放时，重置重连计数器
      resetRetryState()
      // 应用片头片尾设置
      applySkipSettings()
    })

    art.on('video:timeupdate', () => {
      handleTimeUpdate()
    })

    // 监听用户拖动进度条事件
    art.on('video:seeking', () => {
      onUserSeekStart()
    })

    art.on('video:seeked', () => {
      onUserSeekEnd()
    })

    art.on('video:playing', () => {
      // 视频开始播放时，重置重连计数器
      resetRetryState()

      // 重置防抖标志，确保新的播放周期可以正常处理自动下一集和循环播放
      resetDebounceFlags()

      // 立即尝试片头跳过（针对视频刚开始播放的情况）
      const immediateSkipped = applyIntroSkipImmediate()

      // 如果立即跳过未执行，则使用常规跳过逻辑
      if (!immediateSkipped) {
        applySkipSettings()

        // 为了确保片头跳过生效，再次检查（短延迟）
        setTimeout(() => {
          applySkipSettings()
        }, 50) // 减少延迟到50ms
      }
    })

    // 监听全屏状态变化
    art.on('fullscreen', (isFullscreen) => {
      // 标记全屏状态开始变化
      onFullscreenChangeStart()

      // 500ms后标记全屏状态变化结束
      setTimeout(() => {
        onFullscreenChangeEnd()
      }, 500)
    })

    art.on('video:error', (err) => {
      console.error('ArtPlayer 播放错误:', err)

      // 如果播放失败，再次检查是否为网页链接
      if (!isDirectVideoLink(url)) {
        console.log('播放失败，检测到可能是网页链接，在新窗口打开:', url)
        Message.info('视频播放失败，检测到网页链接，正在新窗口打开...')
        window.open(url, '_blank')
        emit('close') // 关闭播放器
        return
      }

      // 处理重连逻辑
      handleRetry(url)
    })

    art.on('video:ended', () => {
      try {
        console.log('视频播放结束')

        // 防抖检查：如果正在处理自动下一集或循环播放，则忽略
        if (isProcessingAutoNext.value || isProcessingLoop.value) {
          console.log('正在处理中，忽略重复的视频结束事件')
          return
        }

        // 优先处理循环播放
        if (loopEnabled.value) {
          console.log('循环播放：重新播放当前选集')
          isProcessingLoop.value = true // 设置防抖标志

          // 重新执行当前选集的播放逻辑
          setTimeout(() => {
            try {
              // 触发重新选择当前选集，这会重新获取播放链接
              emit('episode-selected', props.currentEpisodeIndex)
            } catch (error) {
              console.error('循环播放触发选集事件失败:', error)
              Message.error('循环播放失败，请重试')
              isProcessingLoop.value = false // 出错时重置标志
            }
          }, 1000)
          return
        }

        // 视频结束时启动自动下一集
        if (autoNextEnabled.value && hasNextEpisode()) {
          isProcessingAutoNext.value = true // 设置防抖标志
          startAutoNextCountdown()
        } else if (!hasNextEpisode()) {
          Message.info('全部播放完毕')
        }
      } catch (error) {
        console.error('视频结束事件处理失败:', error)
        Message.error('视频结束处理失败')
        // 出错时重置防抖标志
        isProcessingAutoNext.value = false
        isProcessingLoop.value = false
      }
    })

    // 监听弹幕插件的显示/隐藏事件，实现与 danmakuEnabled 的双向同步
    art.on('artplayerPluginDanmuku:hide', () => {
      console.log('弹幕已隐藏，更新 danmakuEnabled 状态')
      danmakuEnabled.value = false
      // 持久化到 localStorage
      localStorage.setItem('danmakuEnabled', 'false')
    })

    art.on('artplayerPluginDanmuku:show', () => {
      console.log('弹幕已显示，更新 danmakuEnabled 状态')
      danmakuEnabled.value = true
      // 持久化到 localStorage
      localStorage.setItem('danmakuEnabled', 'true')
    })

    art.on('destroy', () => {
      console.log('ArtPlayer 已销毁')
      // 清理自动下一集相关资源
      cancelAutoNext()
    })

    // 避免 Vue 代理导致只读属性访问报错
    artPlayerInstance.value = markRaw(art)

  } catch (error) {
    console.error('创建 ArtPlayer 实例失败:', error)
    Message.error('播放器初始化失败')
    emit('error', '播放器初始化失败')
  }
}

// 初始化画质数据
const initQualityData = () => {
  if (props.qualities && props.qualities.length > 0) {
    availableQualities.value = [...props.qualities]
    currentQuality.value = props.initialQuality || props.qualities[0]?.name || '默认'

    // 设置当前播放URL
    const currentQualityData = availableQualities.value.find(q => q.name === currentQuality.value)
    currentPlayingUrl.value = currentQualityData?.url || props.videoUrl
  } else {
    availableQualities.value = []
    currentQuality.value = '默认'
    currentPlayingUrl.value = props.videoUrl
  }

  console.log('画质数据初始化完成:', {
    available: availableQualities.value,
    current: currentQuality.value,
    currentPlayingUrl: currentPlayingUrl.value
  })
}

// 更新控制栏中的画质文本
const updateQualityControlText = () => {
  if (!artPlayerInstance.value) return

  try {
    // 通过DOM直接更新
    const container = artPlayerInstance.value.template.$container
    if (container) {
      // 查找控制栏中的画质按钮
      const controlsRight = container.querySelector('.art-controls-right')
      if (controlsRight) {
        const buttons = controlsRight.querySelectorAll('.art-control')
        // 遍历所有按钮，找到包含"画质"文本的按钮
        for (let i = 0; i < buttons.length; i++) {
          const button = buttons[i]
          if (button.innerHTML.includes('画质')) {
            const newText = `<span class="player-control-label" data-mobile="质">画质: ${getCurrentQualityLabel.value}</span>`
            button.innerHTML = newText
            console.log('更新控制栏画质文本:', newText)
            return
          }
        }
      }
    }
  } catch (error) {
    console.error('更新控制栏画质文本失败:', error)
  }
}

// 处理画质切换
const handleQualityChange = (qualityName) => {
  const quality = availableQualities.value.find(q => q.name === qualityName)
  if (!quality) {
    console.warn('未找到指定画质:', qualityName)
    return
  }

  console.log('切换画质:', qualityName, quality)

  // 保存当前播放状态
  let currentTime = 0
  let isPaused = true

  if (artPlayerInstance.value) {
    currentTime = artPlayerInstance.value.currentTime || 0
    isPaused = artPlayerInstance.value.paused
  }

  // 更新当前画质和播放URL
  currentQuality.value = qualityName
  currentPlayingUrl.value = quality.url

  // 更新控制栏中的画质文本
  updateQualityControlText()

  // 触发画质切换事件，让父组件更新videoUrl
  // 父组件更新videoUrl后会触发watch监听器重新初始化播放器
  emit('quality-change', quality)
}



// 处理来自PlayerHeader的画质切换事件
const handleHeaderQualityChange = (qualityName) => {
  // 根据name找到对应的画质
  const quality = availableQualities.value.find(q => q.name === qualityName)

  if (quality) {
    handleQualityChange(quality.name)
  }
}

// 切换视频源（用于画质切换）
const switchVideoSource = (newUrl) => {
  if (!artPlayerInstance.value || !newUrl) return

  console.log('切换视频源:', newUrl)

  // 保存当前播放状态
  const currentTime = artPlayerInstance.value.currentTime || 0
  const isPaused = artPlayerInstance.value.paused

  // 切换URL
  artPlayerInstance.value.switchUrl(newUrl)

  // 恢复播放位置和状态
  setTimeout(() => {
    if (artPlayerInstance.value) {
      artPlayerInstance.value.currentTime = currentTime
      if (!isPaused) {
        artPlayerInstance.value.play()
      }
    }
  }, 100)
}

// 关闭播放器
const closePlayer = () => {
  console.log('关闭 ArtPlayer 播放器')

  // 重置重连状态
  resetRetryState()

  // 清理播放器实例
  if (artPlayerInstance.value) {
    // 清理 HLS 实例
    if (artPlayerInstance.value.hls) {
      artPlayerInstance.value.hls.destroy()
      artPlayerInstance.value.hls = null
    }

    artPlayerInstance.value.destroy()
    artPlayerInstance.value = null
  }

  emit('close')
}



// 处理播放器类型变更
const handlePlayerTypeChange = (newType) => {
  emit('player-change', newType)
}

// 处理解析器变更
const handleParserChange = (parser) => {
  emit('parser-change', parser)
}

// 处理代理播放地址变更
const handleProxyChange = (proxyUrl) => {
  console.log('代理播放地址变更:', proxyUrl)

  try {
    // 获取当前的addressSettings
    const savedAddresses = JSON.parse(localStorage.getItem('addressSettings') || '{}')

    if (proxyUrl === 'disabled') {
      // 关闭代理播放，但保留设置界面中配置的代理地址
      savedAddresses.proxyPlayEnabled = false
      // 注意：不清除 proxyPlay 地址，保留用户在设置界面的配置
    } else {
      // 启用代理播放并设置地址
      savedAddresses.proxyPlayEnabled = true
      savedAddresses.proxyPlay = proxyUrl
    }

    // 保存到localStorage
    localStorage.setItem('addressSettings', JSON.stringify(savedAddresses))

    // 触发自定义事件，通知其他组件设置已变化
    window.dispatchEvent(new CustomEvent('addressSettingsChanged'))

    // 重新加载视频以应用新的代理设置
    if (props.videoUrl) {
      nextTick(() => {
        initArtPlayer(props.videoUrl)
      })
    }
  } catch (error) {
    console.error('保存代理播放设置失败:', error)
  }
}

// 打开片头片尾设置弹窗
const openSkipSettingsDialog = () => {
  showSkipSettingsDialog.value = true
}

// 保存片头片尾设置
const saveSkipSettings = (settings) => {
  saveSkipSettingsComposable(settings)
  Message.success('片头片尾设置已保存')
  closeSkipSettingsDialog()
}

// 处理重连逻辑
const handleRetry = (originalUrl) => {
  if (isRetrying.value) {
    return // 如果正在重连，避免重复触发
  }

  if (retryCount.value < maxRetries.value) {
    isRetrying.value = true
    retryCount.value++

    console.log(`ArtPlayer 播放失败，正在进行第 ${retryCount.value} 次重连...`)
    Message.warning(`播放失败，正在进行第 ${retryCount.value} 次重连...`)

    // 延迟重连，避免频繁重试
    setTimeout(() => {
      if (artPlayerInstance.value) {
        try {
          // 重连时也要使用代理处理后的URL，确保代理设置生效
          const headers = props.headers || {}
          const processedUrl = processVideoUrl(originalUrl, headers)

          console.log('重连使用URL:', processedUrl)
          if (processedUrl !== originalUrl) {
            console.log('🔄 [代理播放] 重连时使用代理地址')
          }

          // 重新加载视频
          artPlayerInstance.value.switchUrl(processedUrl)
          isRetrying.value = false
        } catch (error) {
          console.error('重连时出错:', error)
          isRetrying.value = false
          handleRetry(originalUrl) // 递归重试
        }
      }
    }, 2000 * retryCount.value) // 递增延迟：2秒、4秒、6秒
  } else {
    // 超过最大重连次数
    console.error('ArtPlayer 重连次数已达上限，停止重连')
    Message.error(`视频播放失败，已重试 ${maxRetries.value} 次，请检查视频链接或网络连接`)
    emit('error', '视频播放失败，重连次数已达上限')

    // 重置重连计数器
    retryCount.value = 0
    isRetrying.value = false
  }
}

// 重置重连状态
const resetRetryState = () => {
  retryCount.value = 0
  isRetrying.value = false
}

// 计算动态高度
const calculateDynamicHeight = () => {
  if (!artPlayerContainer.value) return 450

  const containerWidth = artPlayerContainer.value.offsetWidth
  if (containerWidth === 0) return 450

  // 按照 16:9 的比例计算高度
  const aspectRatio = 16 / 9
  let calculatedHeight = containerWidth / aspectRatio

  // 设置最小和最大高度限制
  const minHeight = 300
  const maxHeight = Math.min(window.innerHeight * 0.7, 600)

  calculatedHeight = Math.max(minHeight, Math.min(calculatedHeight, maxHeight))

  console.log(`容器宽度: ${containerWidth}px, 计算高度: ${calculatedHeight}px`)
  return Math.round(calculatedHeight)
}

// 防抖标志重置函数
const resetDebounceFlags = () => {
  isProcessingAutoNext.value = false
  isProcessingLoop.value = false
}

// 自动下一集功能相关函数

// 检查是否有下一集
const hasNextEpisode = () => {
  return props.episodes.length > 0 && props.currentEpisodeIndex < props.episodes.length - 1
}

// 获取下一集信息
const getNextEpisode = () => {
  if (!hasNextEpisode()) return null
  return props.episodes[props.currentEpisodeIndex + 1]
}

// 开始自动下一集倒计时
const startAutoNextCountdown = () => {
  if (!autoNextEnabled.value || !hasNextEpisode()) return

  console.log('开始自动下一集')

  // 如果开启了倒计时，显示倒计时弹窗
  if (countdownEnabled.value) {
    autoNextCountdown.value = 10 // 10秒倒计时
    showAutoNextDialog.value = true

    autoNextTimer.value = setInterval(() => {
      autoNextCountdown.value--

      if (autoNextCountdown.value <= 0) {
        clearInterval(autoNextTimer.value)
        autoNextTimer.value = null
        showAutoNextDialog.value = false
        playNextEpisode()
      }
    }, 1000)
  } else {
    // 直接播放下一集，不显示倒计时
    playNextEpisode()
  }
}

// 取消自动下一集
const cancelAutoNext = () => {
  if (autoNextTimer.value) {
    clearInterval(autoNextTimer.value)
    autoNextTimer.value = null
  }
  autoNextCountdown.value = 0
  showAutoNextDialog.value = false

  // 重置防抖标志
  resetDebounceFlags()

  console.log('用户取消自动下一集')
}

// 立即播放下一集
const playNextEpisode = () => {
  if (!hasNextEpisode()) {
    Message.info('已经是最后一集了')
    resetDebounceFlags() // 重置防抖标志
    return
  }

  const nextEpisode = getNextEpisode()

  // 清理倒计时
  cancelAutoNext()

  // 重置防抖标志
  resetDebounceFlags()

  // 通知父组件切换到下一集
  emit('next-episode', props.currentEpisodeIndex + 1)

  // 移除重复的播放提示，由父组件VideoDetail统一处理
  // Message.success(`开始播放: ${nextEpisode.name}`)
}

// 切换自动下一集开关
const toggleAutoNext = () => {
  autoNextEnabled.value = !autoNextEnabled.value
  // 保存自动连播状态到本地存储
  localStorage.setItem('autoNextEnabled', JSON.stringify(autoNextEnabled.value))

  // 如果开启自动连播，则关闭循环播放
  if (autoNextEnabled.value) {
    loopEnabled.value = false
    localStorage.setItem('loopEnabled', 'false')
  }

  if (!autoNextEnabled.value) {
    cancelAutoNext()
  }
}

// 切换循环播放开关
const toggleLoop = () => {
  loopEnabled.value = !loopEnabled.value

  // 保存到本地存储
  localStorage.setItem('loopEnabled', JSON.stringify(loopEnabled.value))

  // 如果开启循环播放，则关闭自动连播
  if (loopEnabled.value) {
    autoNextEnabled.value = false
    localStorage.setItem('autoNextEnabled', 'false')
    cancelAutoNext()
  }

  console.log('循环播放开关:', loopEnabled.value ? '开启' : '关闭')
}

// 切换倒计时开关
const toggleCountdown = () => {
  countdownEnabled.value = !countdownEnabled.value
  console.log('倒计时开关:', countdownEnabled.value ? '开启' : '关闭')

  if (!countdownEnabled.value) {
    cancelAutoNext()
  }
}

// 调试弹窗控制方法
const toggleDebugDialog = () => {
  showDebugDialog.value = !showDebugDialog.value
}

const closeDebugDialog = () => {
  showDebugDialog.value = false
}

// 滚动到当前选集位置
const scrollToCurrentEpisode = async () => {
  // 等待DOM更新
  await nextTick()

  if (!episodeListRef.value || props.currentEpisodeIndex < 0) {
    return
  }

  // 查找当前选集按钮
  const currentButton = episodeListRef.value.querySelector('.episode-item.current')
  if (!currentButton) {
    return
  }

  const container = episodeListRef.value
  const containerHeight = container.clientHeight
  const containerScrollHeight = container.scrollHeight
  const buttonTop = currentButton.offsetTop
  const buttonHeight = currentButton.offsetHeight

  // 计算滚动位置，让当前选集出现在容器的中间偏上位置（约30%处）
  const targetPosition = buttonTop + (buttonHeight / 2) - (containerHeight * 0.3)

  // 确保滚动位置在有效范围内
  const maxScrollTop = containerScrollHeight - containerHeight
  const targetScrollTop = Math.max(0, Math.min(targetPosition, maxScrollTop))

  // 只有当需要滚动的距离超过一定阈值时才执行滚动
  const currentScrollTop = container.scrollTop
  const scrollDistance = Math.abs(targetScrollTop - currentScrollTop)

  if (scrollDistance > 50) { // 滚动距离超过50px才执行
    container.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    })
    console.log(`自动滚动到当前选集: 第${props.currentEpisodeIndex + 1}集，滚动距离: ${scrollDistance}px`)
  } else {
    console.log(`当前选集已在可视区域中心，无需滚动: 第${props.currentEpisodeIndex + 1}集`)
  }
}

// 创建选集layer的HTML内容
const createEpisodeLayerHTML = () => {
  if (!props.episodes || props.episodes.length === 0) {
    return '<div class="episode-layer-background"></div>'
  }

  const currentIdx = props.currentEpisodeIndex
  const episodeItems = props.episodes.map((episode, index) => {
    const isCurrentEpisode = index === currentIdx
    return `
      <button
        class="episode-layer-item ${isCurrentEpisode ? 'current' : ''}"
        data-episode-index="${index}"
      >
        ${episode.name || `第${index + 1}集`}
      </button>
    `
  }).join('')

  return `
    <div class="episode-layer-background">
      <div class="episode-layer-content">
        <div class="episode-layer-header">
          <h3>选集 <span class="episode-layer-count">${props.episodes.length}集</span></h3>
          <button class="episode-layer-close">×</button>
        </div>
        <div class="episode-layer-list">
          ${episodeItems}
        </div>
      </div>
    </div>
  `
}

// 显示选集layer
const showEpisodeLayer = () => {
  if (!artPlayerInstance.value) return

  try {
    // 更新layer内容和样式
    artPlayerInstance.value.layers.update({
      name: 'episodeLayer',
      html: createEpisodeLayerHTML(),
      style: {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        zIndex: '100',
        padding: '0',
        boxSizing: 'border-box',
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center'
      }
    })

    // 添加事件监听器并滚动到当前选集
    nextTick(() => {
      const episodeLayer = artPlayerInstance.value.layers.episodeLayer
      if (episodeLayer) {
        episodeLayer.addEventListener('click', handleEpisodeLayerClick)
        const currentItem = episodeLayer.querySelector('.episode-layer-item.current')
        if (currentItem) {
          const list = episodeLayer.querySelector('.episode-layer-list')
          if (list) {
            const listRect = list.getBoundingClientRect()
            const itemRect = currentItem.getBoundingClientRect()
            const offset = itemRect.top - listRect.top + list.scrollTop - listRect.height * 0.3
            if (offset > listRect.height) {
              list.scrollTo({ top: offset, behavior: 'smooth' })
            }
          }
        }
      }
    })

    console.log('显示选集layer')
  } catch (error) {
    console.error('显示选集layer失败:', error)
  }
}

// 处理选集layer的点击事件
const handleEpisodeLayerClick = (event) => {
  const target = event.target.closest('.episode-layer-item')
  const closeBtn = event.target.closest('.episode-layer-close')
  const background = event.target.closest('.episode-layer-background')

  if (closeBtn || (background && event.target === background)) {
    // 点击关闭按钮或背景，隐藏layer
    hideEpisodeLayer()
  } else if (target) {
    // 点击选集项
    const episodeIndex = parseInt(target.dataset.episodeIndex)
    if (!isNaN(episodeIndex)) {
      selectEpisodeFromLayer(episodeIndex)
      hideEpisodeLayer()
    }
  }
}

// 隐藏选集layer
const hideEpisodeLayer = () => {
  if (!artPlayerInstance.value) return

  try {
    // 移除事件监听器
    const episodeLayer = artPlayerInstance.value.layers.episodeLayer
    if (episodeLayer) {
      episodeLayer.removeEventListener('click', handleEpisodeLayerClick)
    }

    // 隐藏layer
    artPlayerInstance.value.layers.update({
      name: 'episodeLayer',
      html: '',
      style: {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'none',
        zIndex: '100',
        padding: '0',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }
    })
    console.log('隐藏选集layer')
  } catch (error) {
    console.error('隐藏选集layer失败:', error)
  }
}

// 切换选集layer显示状态
const toggleEpisodeLayer = () => {
  if (!artPlayerInstance.value) return

  try {
    const episodeLayer = artPlayerInstance.value.layers.episodeLayer
    if (episodeLayer && episodeLayer.style.display !== 'none') {
      hideEpisodeLayer()
    } else {
      showEpisodeLayer()
    }
  } catch (error) {
    console.error('切换选集layer失败:', error)
    // 如果出错，尝试直接显示
    showEpisodeLayer()
  }
}

// 从layer中选择剧集
const selectEpisodeFromLayer = (episodeIndex) => {
  console.log('从layer选择剧集:', episodeIndex)

  // 发送选集事件给父组件
  const episode = props.episodes[episodeIndex]
  if (episode) {
    emit('episode-selected', episode)
  }
}

// 创建画质选择layer的HTML
const createQualityLayerHTML = () => {
  const qualityItems = availableQualities.value.map((quality, index) => {
    const isActive = quality.name === currentQuality.value
    return `
      <div class="quality-layer-item ${isActive ? 'active' : ''}" data-quality-index="${index}">
        <span class="quality-name">${quality.name || '未知'}</span>
        ${isActive ? '<span class="quality-current">当前</span>' : ''}
      </div>
    `
  }).join('')

  return `
    <div class="quality-layer-background">
      <div class="quality-layer-content">
        <div class="quality-layer-header">
          <h3>选择画质</h3>
          <button class="quality-layer-close">×</button>
        </div>
        <div class="quality-layer-list">
          ${qualityItems}
        </div>
      </div>
    </div>
  `
}

// 显示画质选择layer
const showQualityLayer = () => {
  if (!artPlayerInstance.value) return

  try {
    // 更新layer内容和样式
    artPlayerInstance.value.layers.update({
      name: 'qualityLayer',
      html: createQualityLayerHTML(),
      style: {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        zIndex: '100',
        padding: '0',
        boxSizing: 'border-box',
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center'
      }
    })

    // 添加事件监听器
    nextTick(() => {
      const qualityLayer = artPlayerInstance.value.layers.qualityLayer
      if (qualityLayer) {
        // 使用事件委托处理点击事件
        qualityLayer.addEventListener('click', handleQualityLayerClick)
      }
    })

    console.log('显示画质选择layer')
  } catch (error) {
    console.error('显示画质选择layer失败:', error)
  }
}

// 处理画质layer的点击事件
const handleQualityLayerClick = (event) => {
  const target = event.target.closest('.quality-layer-item')
  const closeBtn = event.target.closest('.quality-layer-close')
  const background = event.target.closest('.quality-layer-background')

  if (closeBtn || (background && event.target === background)) {
    // 点击关闭按钮或背景，隐藏layer
    hideQualityLayer()
  } else if (target) {
    // 点击画质项
    const qualityIndex = parseInt(target.dataset.qualityIndex)
    if (!isNaN(qualityIndex)) {
      selectQualityFromLayer(qualityIndex)
      hideQualityLayer()
    }
  }
}

// 隐藏画质选择layer
const hideQualityLayer = () => {
  if (!artPlayerInstance.value) return

  try {
    // 移除事件监听器
    const qualityLayer = artPlayerInstance.value.layers.qualityLayer
    if (qualityLayer) {
      qualityLayer.removeEventListener('click', handleQualityLayerClick)
    }

    // 隐藏layer
    artPlayerInstance.value.layers.update({
      name: 'qualityLayer',
      html: '',
      style: {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'none',
        zIndex: '100',
        padding: '0',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }
    })
    console.log('隐藏画质选择layer')
  } catch (error) {
    console.error('隐藏画质选择layer失败:', error)
  }
}

// 切换画质layer显示状态
const toggleQualityLayer = () => {
  if (!artPlayerInstance.value) return

  try {
    const qualityLayer = artPlayerInstance.value.layers.qualityLayer
    if (qualityLayer && qualityLayer.style.display !== 'none') {
      hideQualityLayer()
    } else {
      showQualityLayer()
    }
  } catch (error) {
    console.error('切换画质layer失败:', error)
    // 如果出错，尝试直接显示
    showQualityLayer()
  }
}

// 从layer中选择画质
const selectQualityFromLayer = (qualityIndex) => {
  console.log('从layer选择画质:', qualityIndex)

  const quality = availableQualities.value[qualityIndex]
  if (quality) {
    handleQualityChange(quality.name)
  }
}

// 原有的选集弹窗函数已移除，现在使用ArtPlayer的layer功能

// 监听视频URL变化
watch(() => props.videoUrl, async (newUrl) => {
  if (newUrl && props.visible) {
    resetRetryState() // 重置重连状态
    resetSkipState() // 重置片头片尾跳过状态
    await nextTick()
    await initArtPlayer(newUrl)
  }
}, { immediate: true })

// 监听显示状态变化
watch(() => props.visible, async (newVisible) => {
  if (newVisible && props.videoUrl) {
    await nextTick()
    await initArtPlayer(props.videoUrl)
  } else if (!newVisible) {
    // 隐藏时清理资源
    if (mediaPlayerManager.value) {
      mediaPlayerManager.value.destroy()
    }
    if (artPlayerInstance.value) {
      artPlayerInstance.value.destroy()
      artPlayerInstance.value = null
    }
  }
})

// 监听画质数据变化
watch(() => props.qualities, () => {
  initQualityData()
}, { immediate: true, deep: true })

// 监听初始画质变化
watch(() => props.initialQuality, (newQuality) => {
  if (newQuality && newQuality !== currentQuality.value) {
    currentQuality.value = newQuality
  }
})

// 监听弹幕开关状态变化，同步到弹幕插件
watch(danmakuEnabled, (newEnabled) => {
  console.log('danmakuEnabled 状态变化:', newEnabled)

  // 如果 ArtPlayer 实例存在且弹幕插件已加载
  if (artPlayerInstance.value && artPlayerInstance.value.plugins && artPlayerInstance.value.plugins.artplayerPluginDanmuku) {
    const danmakuPlugin = artPlayerInstance.value.plugins.artplayerPluginDanmuku

    try {
      if (newEnabled) {
        // 显示弹幕
        if (typeof danmakuPlugin.show === 'function') {
          danmakuPlugin.show()
          console.log('通过插件方法显示弹幕')
        }
      } else {
        // 隐藏弹幕
        if (typeof danmakuPlugin.hide === 'function') {
          danmakuPlugin.hide()
          console.log('通过插件方法隐藏弹幕')
        }
      }
    } catch (error) {
      console.error('控制弹幕显示/隐藏失败:', error)
    }
  }

  // 控制iframe弹幕层的显示/隐藏
  if (newEnabled) {
    console.log('showDanmakuIframeLayer');
    showDanmakuIframeLayer()
  } else {
    console.log('hideDanmakuIframeLayer');
    hideDanmakuIframeLayer()
  }

  // 持久化到 localStorage
  localStorage.setItem('danmakuEnabled', newEnabled.toString())
})

// 监听弹幕URL变化，重新处理弹幕
watch(() => props.danmakuUrl, async (newDanmakuUrl) => {
  console.log('danmakuUrl 变化:', newDanmakuUrl)
  
  if (artPlayerInstance.value) {
    // 移除之前的iframe层
    removeDanmakuIframeLayer()
    
    // 处理新的弹幕URL
    await handleDanmakuUrl()
  }
})

// 窗口大小变化处理
const handleResize = () => {
  if (artPlayerContainer.value && artPlayerInstance.value) {
    const newHeight = calculateDynamicHeight()
    if (newHeight !== dynamicHeight.value) {
      dynamicHeight.value = newHeight
      artPlayerContainer.value.style.height = `${newHeight}px`
      // 通知 ArtPlayer 更新尺寸
      artPlayerInstance.value.resize()
    }
  }
}

// 处理代理设置变化
const handleAddressSettingsChange = () => {
  console.log('检测到代理设置变化，重新初始化播放器')

  // 更新代理设置版本号，强制 proxyVideoUrl 计算属性重新计算
  proxySettingsVersion.value++

  if (props.videoUrl && props.visible) {
    nextTick(() => {
      initArtPlayer(props.videoUrl)
    })
  }
}

// 组件挂载时的初始化
onMounted(() => {
  console.log('ArtVideoPlayer 组件已挂载 - 动态高度版本')
  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize)
  // 添加代理设置变化监听
  window.addEventListener('addressSettingsChanged', handleAddressSettingsChange)
  // 初始化片头片尾设置
  initSkipSettings()
  // 初始化画质数据
  initQualityData()
})

// 组件卸载时清理资源
onUnmounted(() => {
  console.log('ArtVideoPlayer 组件即将卸载')

  // 移除窗口大小变化监听器
  window.removeEventListener('resize', handleResize)
  // 移除代理设置变化监听器
  window.removeEventListener('addressSettingsChanged', handleAddressSettingsChange)

  // 清理自动下一集相关资源
  cancelAutoNext()

  // 清理媒体播放器管理器
  if (mediaPlayerManager.value) {
    mediaPlayerManager.value.destroy()
  }

  // 销毁播放器实例
  if (artPlayerInstance.value) {
    // 清理弹幕iframe层
    removeDanmakuIframeLayer()
    
    // 清理自定义播放器
    if (artPlayerInstance.value.customPlayer && artPlayerInstance.value.customPlayerFormat) {
      const format = artPlayerInstance.value.customPlayerFormat
      if (destroyCustomPlayer[format]) {
        destroyCustomPlayer[format](artPlayerInstance.value.customPlayer)
      }
    }

    // 销毁播放器实例
    artPlayerInstance.value.destroy()
    artPlayerInstance.value = null
  }
})
</script>

<style scoped>
/* ArtPlayer 播放器样式 */
.video-player-section {
  margin-bottom: 20px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  /* background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); */
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.player-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.player-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.art-player-container {
  position: relative;
  width: 100%;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.art-player {
  width: 100%;
  background: #000;
  /* 高度由 JavaScript 动态设置 */
}

/* 响应式设计 */
@media (max-width: 768px) {
  .player-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .player-header h3 {
    font-size: 14px;
  }

  .art-player {
    /* 移动端高度也由 JavaScript 动态设置 */
  }
}

/* ArtPlayer 主题定制 */
:deep(.art-video-player) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.art-bottom) {
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
}

:deep(.art-control) {
  color: #fff;
}

:deep(.art-control:hover) {
  color: #23ade5;
}

:deep(.player-control-label) {
  display: inline-flex;
  align-items: center;
  max-width: 96px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  :deep(.art-bottom) {
    padding: 0 4px;
  }

  :deep(.art-controls),
  :deep(.art-controls-left),
  :deep(.art-controls-right) {
    min-width: 0;
  }

  :deep(.art-controls-right) {
    flex: 0 1 auto;
    overflow: hidden;
  }

  :deep(.art-controls-right .art-control) {
    flex: 0 0 34px;
    width: 34px;
    min-width: 34px;
    padding: 0 4px;
    font-size: 12px;
  }

  :deep(.art-controls-right .art-control .player-control-label) {
    width: 22px;
    justify-content: center;
    font-size: 0;
  }

  :deep(.art-controls-right .art-control .player-control-label::before) {
    content: attr(data-mobile);
    font-size: 12px;
    font-weight: 600;
  }
}

/* ArtPlayer selector 弹层位置调整 */
:deep(.art-selector) {
  bottom: 45px !important; /* 向上调整弹层位置，避免被遮挡 */
  margin-bottom: 5px !important;
}

:deep(.art-control-selector .art-selector) {
  bottom: 45px !important;
  margin-bottom: 5px !important;
}

/* ArtPlayer selector 选项样式 */
:deep(.art-selector .art-selector-item) {
  color: #fff !important;
  background: rgba(0, 0, 0, 0.8) !important;
}

:deep(.art-selector .art-selector-item:hover) {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #fff !important;
}

:deep(.art-selector .art-selector-item.art-current) {
  color: #23ade5 !important;
  background: rgba(35, 173, 229, 0.1) !important;
}

:deep(.art-selector .art-selector-item.art-current:hover) {
  color: #23ade5 !important;
  background: rgba(35, 173, 229, 0.2) !important;
}

/* 紧凑按钮组样式 */
.compact-button-group {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.compact-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  height: 28px;
  background: #ffffff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  box-sizing: border-box;
}

.compact-btn:hover {
  background: #f5f5f5;
  border-color: #40a9ff;
  color: #40a9ff;
}

.compact-btn.active {
  background: #1890ff;
  border-color: #1890ff;
  color: white;
}

.compact-btn.active:hover {
  background: #40a9ff;
  border-color: #40a9ff;
}

.compact-btn .btn-icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.compact-btn .btn-text {
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
}

/* 选择框按钮特殊样式 */
.compact-btn.selector-btn {
  padding: 4px 6px;
  position: relative;
}

.compact-btn.selector-btn .compact-select {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  font-size: 11px;
  min-width: 60px;
  height: 20px;
}

:deep(.compact-btn.selector-btn .compact-select .arco-select-view-single) {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
  height: 20px !important;
  min-height: 20px !important;
}

:deep(.compact-btn.selector-btn .compact-select .arco-select-view-value) {
  color: inherit !important;
  font-weight: 500;
  font-size: 11px;
  line-height: 20px;
  padding: 0 !important;
}

:deep(.compact-btn.selector-btn .compact-select .arco-select-view-suffix) {
  color: inherit !important;
  font-size: 10px;
}

/* 关闭按钮特殊样式 */
.compact-btn.close-btn {
  background: #fff2f0;
  border-color: #ffccc7;
  color: #ff4d4f;
}

.compact-btn.close-btn:hover {
  background: #ff4d4f;
  border-color: #ff4d4f;
  color: white;
}

 /* 自动下一集倒计时弹窗样式 */
 .auto-next-dialog {
   position: absolute;
   top: 50%;
   left: 50%;
   transform: translate(-50%, -50%);
   background: rgba(0, 0, 0, 0.9);
   color: white;
   padding: 20px;
   border-radius: 8px;
   text-align: center;
   z-index: 1000;
   min-width: 280px;
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
 }

.auto-next-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.auto-next-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.auto-next-episode {
  font-size: 14px;
  color: #23ade5;
  font-weight: 500;
}

.auto-next-countdown {
  font-size: 18px;
  font-weight: bold;
  color: #ff6b6b;
}

.auto-next-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 8px;
}

.btn-play-now,
.btn-cancel {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-play-now {
  background: #23ade5;
  color: white;
}

.btn-play-now:hover {
  background: #1890d5;
}

.btn-cancel {
  background: #666;
  color: white;
}

.btn-cancel:hover {
  background: #555;
}

/* 原有的选集弹窗样式已移除，现在使用ArtPlayer的layer功能 */

/* 选集Layer样式 */
:deep(.art-layer[data-name="episodeLayer"]) {
  display: flex !important;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.85) !important;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

:deep(.episode-layer-background) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}

:deep(.episode-layer-content) {
  background: rgba(20, 20, 20, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
  max-width: 800px;
  max-height: 70vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  animation: episodeLayerIn 0.25s ease-out;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

@keyframes episodeLayerIn {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:deep(.episode-layer-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

:deep(.episode-layer-header h3) {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
}

:deep(.episode-layer-count) {
  font-size: 12px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.45);
  margin-left: 6px;
}

:deep(.episode-layer-close) {
  background: rgba(255, 255, 255, 0.08);
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.7);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  font-weight: 300;
  line-height: 1;
}

:deep(.episode-layer-close:hover) {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

:deep(.episode-layer-list) {
  padding: 10px 12px 14px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-content: flex-start;
}

:deep(.episode-layer-list::-webkit-scrollbar) {
  width: 4px;
}

:deep(.episode-layer-list::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(.episode-layer-list::-webkit-scrollbar-thumb) {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
}

:deep(.episode-layer-item) {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.15s ease;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  font-weight: 500;
  padding: 6px 12px;
  white-space: nowrap;
  line-height: 1.4;
  font-family: inherit;
}

:deep(.episode-layer-item:hover) {
  border-color: rgba(64, 150, 255, 0.5);
  background: rgba(64, 150, 255, 0.12);
  color: #ffffff;
}

:deep(.episode-layer-item.current) {
  border-color: rgba(64, 150, 255, 0.7);
  background: rgba(64, 150, 255, 0.25);
  color: #ffffff;
  font-weight: 600;
}

/* 移动端适配 */
@media (max-width: 768px) {
  :deep(.episode-layer-background) {
    padding: 0;
    align-items: flex-end;
  }

  :deep(.episode-layer-content) {
    max-width: 100%;
    max-height: 70vh;
    border-radius: 14px 14px 0 0;
    animation: episodeLayerSlideUp 0.25s ease-out;
  }

  @keyframes episodeLayerSlideUp {
    from {
      opacity: 0;
      transform: translateY(100%);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  :deep(.episode-layer-header) {
    flex-shrink: 0;
    padding: 12px 14px;
  }

  :deep(.episode-layer-list) {
    padding: 8px 10px 14px;
    gap: 6px;
    -webkit-overflow-scrolling: touch;
  }

  :deep(.episode-layer-item) {
    font-size: 13px;
    padding: 8px 14px;
    border-radius: 8px;
  }
}

@media (max-width: 480px) {
  :deep(.episode-layer-item) {
    padding: 7px 12px;
    font-size: 12px;
  }
}

/* 画质选择layer样式 */
:deep(.quality-layer-background) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
}

:deep(.quality-layer-content) {
  background: rgba(20, 20, 20, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow:
    0 32px 64px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  max-width: 400px;
  max-height: 60vh;
  width: 95%;
  overflow: hidden;
  animation: qualityLayerShow 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

@keyframes qualityLayerShow {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(-40px);
    filter: blur(4px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
    filter: blur(0);
  }
}

:deep(.quality-layer-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
}

:deep(.quality-layer-header h3) {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.02em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

:deep(.quality-layer-close) {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 18px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 300;
}

:deep(.quality-layer-close:hover) {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  transform: scale(1.05);
}

:deep(.quality-layer-close:active) {
  transform: scale(0.95);
}

:deep(.quality-layer-list) {
  padding: 16px 20px 20px;
  max-height: 45vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 自定义滚动条 */
:deep(.quality-layer-list::-webkit-scrollbar) {
  width: 6px;
}

:deep(.quality-layer-list::-webkit-scrollbar-track) {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

:deep(.quality-layer-list::-webkit-scrollbar-thumb) {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  transition: background 0.3s ease;
}

:deep(.quality-layer-list::-webkit-scrollbar-thumb:hover) {
  background: rgba(255, 255, 255, 0.3);
}

:deep(.quality-layer-item) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
  min-height: 48px;
  position: relative;
  overflow: hidden;
}

:deep(.quality-layer-item::before) {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

:deep(.quality-layer-item:hover) {
  border-color: rgba(64, 150, 255, 0.4);
  background: rgba(64, 150, 255, 0.08);
  transform: translateY(-2px) scale(1.02);
  box-shadow:
    0 8px 32px rgba(64, 150, 255, 0.15),
    0 0 0 1px rgba(64, 150, 255, 0.2);
}

:deep(.quality-layer-item:hover::before) {
  opacity: 1;
}

:deep(.quality-layer-item.active) {
  border-color: rgba(64, 150, 255, 0.6);
  background: linear-gradient(135deg, rgba(64, 150, 255, 0.2) 0%, rgba(100, 180, 255, 0.15) 100%);
  color: #ffffff;
  box-shadow:
    0 8px 32px rgba(64, 150, 255, 0.25),
    0 0 0 1px rgba(64, 150, 255, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transform: scale(1.02);
}

:deep(.quality-layer-item.active::before) {
  opacity: 1;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%);
}

:deep(.quality-layer-item.active:hover) {
  background: linear-gradient(135deg, rgba(64, 150, 255, 0.25) 0%, rgba(100, 180, 255, 0.2) 100%);
  transform: translateY(-2px) scale(1.04);
  box-shadow:
    0 12px 40px rgba(64, 150, 255, 0.3),
    0 0 0 1px rgba(64, 150, 255, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

:deep(.quality-name) {
  font-size: 16px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.3;
  letter-spacing: -0.01em;
}

:deep(.quality-layer-item.active .quality-name) {
  color: #ffffff;
  font-weight: 600;
}

:deep(.quality-current) {
  font-size: 12px;
  font-weight: 600;
  color: rgba(64, 150, 255, 0.9);
  background: rgba(64, 150, 255, 0.15);
  border: 1px solid rgba(64, 150, 255, 0.3);
  border-radius: 12px;
  padding: 2px 8px;
  line-height: 1.2;
}

/* 响应式设计 */
@media (max-width: 768px) {
  :deep(.quality-layer-content) {
    max-width: 320px;
    max-height: 75vh;
  }

  :deep(.quality-layer-header) {
    padding: 14px 16px 10px;
  }

  :deep(.quality-layer-header h3) {
    font-size: 18px;
  }

  :deep(.quality-layer-list) {
    max-height: 55vh;
    padding: 12px 16px 16px;
  }
}


</style>