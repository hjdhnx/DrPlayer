<template>
  <div class="video-test-container">
    <!-- 固定头部区域 -->
    <div class="test-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <icon-play-arrow class="title-icon" />
            视频播放器测试
          </h1>
          <p class="page-subtitle">测试各种视频播放器的格式支持和功能</p>
        </div>
        <div class="nav-button-group">
          <div class="nav-button-grid">
            <a-button type="primary" status="success" @click="goToActionTest" class="nav-grid-button">
              <icon-arrow-left />
              <span>Action测试</span>
            </a-button>
            <a-button type="primary" status="normal" @click="goToCSPTest" class="nav-grid-button">
              <icon-safe />
              <span>CSP测试</span>
            </a-button>
            <a-button type="primary" status="warning" @click="goToDebugTest" class="nav-grid-button">
              <icon-bug />
              <span>综合测试</span>
            </a-button>
            <!-- 预留位置，可以添加更多测试工具 -->
            <div class="nav-grid-placeholder">
              <span class="placeholder-text">更多工具</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 可滚动内容区域 -->
    <div class="test-content">
      <div class="test-section">
        <h2>测试URL</h2>
        <a-input 
          v-model="testUrl" 
          placeholder="输入视频URL进行测试"
          style="margin-bottom: 16px;"
        />
        <div class="test-buttons">
          <a-button @click="testUrl = mp4TestUrl" type="outline">
            使用MP4测试链接
          </a-button>
          <a-button @click="testUrl = m3u8TestUrl" type="outline">
            使用M3U8测试链接
          </a-button>
          <a-button @click="testUrl = yourMp4Url" type="outline">
            使用你的MP4链接
          </a-button>
        </div>
      </div>

      <div class="test-section">
        <h2>URL分析结果</h2>
        <div class="analysis-result">
          <p><strong>URL:</strong> {{ testUrl || '未输入URL' }}</p>
          <p><strong>是否为直链:</strong> {{ isDirectLink ? '是' : '否' }}</p>
          <p><strong>检测到的格式:</strong> {{ detectedFormat }}</p>
          <p><strong>URL分析详情:</strong></p>
          <ul v-if="testUrl">
            <li>包含视频扩展名: {{ urlAnalysis.hasVideoExtension ? '是' : '否' }}</li>
            <li>是流媒体格式: {{ urlAnalysis.isStreamingFormat ? '是' : '否' }}</li>
            <li>看起来像网页: {{ urlAnalysis.looksLikeWebpage ? '是' : '否' }}</li>
            <li>包含查询参数: {{ urlAnalysis.hasQueryParams ? '是' : '否' }}</li>
            <li>包含锚点: {{ urlAnalysis.hasFragment ? '是' : '否' }}</li>
          </ul>
          <p><strong>浏览器支持情况:</strong></p>
          <ul>
            <li>MP4: {{ browserSupport.mp4 ? '支持' : '不支持' }}</li>
            <li>WebM: {{ browserSupport.webm ? '支持' : '不支持' }}</li>
            <li>OGG: {{ browserSupport.ogg ? '支持' : '不支持' }}</li>
            <li>HLS: {{ browserSupport.hls ? '支持' : '不支持' }}</li>
          </ul>
        </div>
      </div>

      <div class="test-section">
        <h2>播放器测试</h2>
        <div class="player-buttons">
          <a-button @click="testWithDefaultPlayer" type="primary" :disabled="!testUrl">
            默认播放器测试
          </a-button>
          <a-button @click="testWithArtPlayer" type="primary" :disabled="!testUrl">
            ArtPlayer测试
          </a-button>
          <a-button @click="testWithNativeVideo" type="primary" :disabled="!testUrl">
            原生Video测试
          </a-button>
        </div>
      </div>

      <!-- 原生Video测试 -->
      <div v-if="showNativeVideo" class="test-section">
        <div class="native-video-header">
          <h2>原生Video标签测试</h2>
          <div class="native-video-controls">
            <a-button @click="closeNativeVideo" type="outline">关闭</a-button>
          </div>
        </div>
        <div class="native-video-container">
          <video 
            ref="nativeVideo"
            controls 
            autoplay 
            class="native-video-player"
            @error="handleNativeVideoError"
            @loadstart="handleNativeVideoLoadStart"
            @loadedmetadata="handleNativeVideoLoadedMetadata"
            @canplay="handleNativeVideoCanPlay"
          >
            您的浏览器不支持视频播放
          </video>
        </div>
        <div class="native-video-logs">
          <h3>播放日志:</h3>
          <div v-for="(log, index) in nativeVideoLogs" :key="index" class="log-item">
            {{ log }}
          </div>
        </div>
      </div>

      <!-- 错误信息显示 -->
      <div v-if="errorMessage" class="test-section error-section">
        <h2>错误信息:</h2>
        <pre>{{ errorMessage }}</pre>
      </div>

      <!-- 播放器区域 -->
      <div v-if="showDefaultPlayer || showArtPlayer" class="test-section player-section">
        <h2>视频播放器</h2>
        
        <!-- 默认播放器 -->
        <VideoPlayer
          v-if="showDefaultPlayer"
          :visible="showDefaultPlayer"
          :video-url="testUrl"
          :episode-name="'测试视频'"
          :episodes="[]"
          :player-type="'default'"
          @close="showDefaultPlayer = false"
          @error="handlePlayerError"
          @player-change="handlePlayerTypeChange"
        />

        <!-- ArtPlayer -->
        <ArtVideoPlayer
          v-if="showArtPlayer"
          :visible="showArtPlayer"
          :video-url="testUrl"
          :episode-name="'测试视频'"
          :episodes="[]"
          :player-type="'artplayer'"
          @close="showArtPlayer = false"
          @error="handlePlayerError"
          @player-change="handlePlayerTypeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { IconPlayArrow, IconArrowLeft, IconSafe, IconBug } from '@arco-design/web-vue/es/icon'
import VideoPlayer from '@/components/players/VideoPlayer.vue'
import ArtVideoPlayer from '@/components/players/ArtVideoPlayer.vue'

const router = useRouter()

// 测试URL
const testUrl = ref('')
const mp4TestUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
const m3u8TestUrl = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
const yourMp4Url = 'http://qcapp.xingya.com.cn/h265/wz_mp40917zhuixu03.mp4?sign=36297d1b23191454fe6d6204fa2d07a5&t=68dd7037'

// 播放器显示状态
const showDefaultPlayer = ref(false)
const showArtPlayer = ref(false)
const showNativeVideo = ref(false)

// 错误信息
const errorMessage = ref('')

// 原生视频相关
const nativeVideo = ref(null)
const nativeVideoLogs = ref([])

// 浏览器支持检测
const browserSupport = computed(() => {
  const video = document.createElement('video')
  return {
    mp4: video.canPlayType('video/mp4') !== '',
    webm: video.canPlayType('video/webm') !== '',
    ogg: video.canPlayType('video/ogg') !== '',
    hls: video.canPlayType('application/vnd.apple.mpegurl') !== '' || window.Hls?.isSupported()
  }
})

// URL分析 - 使用与播放器相同的逻辑
const isDirectLink = computed(() => {
  if (!testUrl.value) return false
  
  const url = testUrl.value
  
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
})

const urlAnalysis = computed(() => {
  if (!testUrl.value) return {}
  
  const url = testUrl.value
  
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
  
  return {
    hasVideoExtension,
    isStreamingFormat,
    looksLikeWebpage,
    hasQueryParams: url.includes('?'),
    hasFragment: url.includes('#')
  }
})

const detectedFormat = computed(() => {
  if (!testUrl.value) return '未知'
  
  const url = testUrl.value.toLowerCase()
  if (url.includes('.mp4')) return 'MP4'
  if (url.includes('.m3u8')) return 'HLS (M3U8)'
  if (url.includes('.webm')) return 'WebM'
  if (url.includes('.ogg')) return 'OGG'
  if (url.includes('.avi')) return 'AVI'
  if (url.includes('.mov')) return 'MOV'
  if (url.includes('.wmv')) return 'WMV'
  if (url.includes('.flv')) return 'FLV'
  if (url.includes('.mkv')) return 'MKV'
  if (url.includes('.mpd')) return 'DASH (MPD)'
  
  return '未知格式'
})

// 播放器测试方法
const testWithDefaultPlayer = () => {
  if (showDefaultPlayer.value) {
    // 如果默认播放器已经显示，则关闭它
    showDefaultPlayer.value = false
    Message.info('关闭默认播放器测试')
    return
  }
  
  errorMessage.value = ''
  showArtPlayer.value = false
  showNativeVideo.value = false
  showDefaultPlayer.value = true
  Message.info('启动默认播放器测试')
}

const testWithArtPlayer = () => {
  if (showArtPlayer.value) {
    // 如果ArtPlayer已经显示，则关闭它
    showArtPlayer.value = false
    Message.info('关闭ArtPlayer测试')
    return
  }
  
  errorMessage.value = ''
  showDefaultPlayer.value = false
  showNativeVideo.value = false
  showArtPlayer.value = true
  Message.info('启动ArtPlayer测试')
}

const testWithNativeVideo = () => {
  if (showNativeVideo.value) {
    // 如果原生Video已经显示，则关闭它
    closeNativeVideo()
    Message.info('关闭原生Video测试')
    return
  }
  
  errorMessage.value = ''
  showDefaultPlayer.value = false
  showArtPlayer.value = false
  showNativeVideo.value = true
  nativeVideoLogs.value = []
  
  nextTick(() => {
    if (nativeVideo.value) {
      addNativeVideoLog('开始加载视频: ' + testUrl.value)
      nativeVideo.value.src = testUrl.value
      nativeVideo.value.load()
    }
  })
  
  Message.info('启动原生Video测试')
}

const closeNativeVideo = () => {
  if (nativeVideo.value) {
    nativeVideo.value.pause()
    nativeVideo.value.src = ''
    nativeVideo.value.load() // 重置video元素状态
  }
  showNativeVideo.value = false
  nativeVideoLogs.value = [] // 清空日志
  errorMessage.value = '' // 清空错误信息
  Message.success('原生Video测试已关闭')
}

// 错误处理
const handlePlayerError = (error) => {
  errorMessage.value = `播放器错误: ${error}`
  Message.error('播放器测试失败')
}

// 播放器类型切换处理
const handlePlayerTypeChange = (newType) => {
  // 关闭当前播放器
  showDefaultPlayer.value = false
  showArtPlayer.value = false
  showNativeVideo.value = false
  
  // 根据新类型打开对应播放器
  if (newType === 'default') {
    showDefaultPlayer.value = true
    Message.info('切换到默认播放器')
  } else if (newType === 'artplayer') {
    showArtPlayer.value = true
    Message.info('切换到ArtPlayer')
  }
}

// 原生视频事件处理
const addNativeVideoLog = (message) => {
  const timestamp = new Date().toLocaleTimeString()
  nativeVideoLogs.value.push(`[${timestamp}] ${message}`)
}

const handleNativeVideoError = (event) => {
  const error = event.target.error
  let errorMsg = '未知错误'
  
  if (error) {
    switch (error.code) {
      case error.MEDIA_ERR_ABORTED:
        errorMsg = 'MEDIA_ERR_ABORTED: 播放被中止'
        break
      case error.MEDIA_ERR_NETWORK:
        errorMsg = 'MEDIA_ERR_NETWORK: 网络错误'
        break
      case error.MEDIA_ERR_DECODE:
        errorMsg = 'MEDIA_ERR_DECODE: 解码错误'
        break
      case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
        errorMsg = 'MEDIA_ERR_SRC_NOT_SUPPORTED: 不支持的媒体格式'
        break
    }
  }
  
  addNativeVideoLog(`播放错误: ${errorMsg}`)
  errorMessage.value = `原生Video错误: ${errorMsg}`
}

const handleNativeVideoLoadStart = () => {
  addNativeVideoLog('开始加载视频数据')
}

const handleNativeVideoLoadedMetadata = () => {
  addNativeVideoLog('视频元数据加载完成')
  if (nativeVideo.value) {
    addNativeVideoLog(`视频时长: ${nativeVideo.value.duration}秒`)
    addNativeVideoLog(`视频尺寸: ${nativeVideo.value.videoWidth}x${nativeVideo.value.videoHeight}`)
  }
}

const handleNativeVideoCanPlay = () => {
  addNativeVideoLog('视频可以开始播放')
}

// 导航方法
const goToActionTest = () => {
  router.push('/action-test')
}

const goToCSPTest = () => {
  router.push('/csp-test')
}

const goToDebugTest = () => {
  router.push('/action-debug-test')
}
</script>

<style scoped>
.video-test-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-1);
  overflow: hidden;
}

/* 固定头部区域 */
.test-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--color-bg-1);
  border-bottom: 1px solid var(--color-border-2);
  padding: 24px 32px;
  backdrop-filter: blur(8px);
}

.header-content {
  width: 100%;
  margin: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-left {
  flex: 1;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 28px;
  font-weight: 600;
  color: var(--color-text-1);
  margin: 0 0 8px 0;
}

.nav-button-group {
  max-width: fit-content;
  max-height: 200px;
  overflow-y: auto;
  padding: 4px;
  border-radius: 8px;
  background: var(--color-bg-2);
  border: 1px solid var(--color-border-2);
}

.nav-button-grid {
  display: grid;
  grid-template-columns: auto auto;
  gap: 6px;
  padding: 6px;
  justify-content: start;
}

.nav-grid-button {
  min-height: 32px;
  padding: 6px 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.3s ease;
  text-align: center;
  line-height: 1;
  white-space: nowrap;
  width: fit-content;
}

.nav-grid-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  background: var(--color-bg-3);
  border-color: var(--color-primary-6);
}

.nav-grid-button span {
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-grid-placeholder {
  min-height: 32px;
  padding: 6px 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  background: var(--color-bg-3);
  border: 1px dashed var(--color-border-3);
  border-radius: 6px;
  transition: all 0.3s ease;
  text-align: center;
  line-height: 1;
  white-space: nowrap;
  width: fit-content;
}

.nav-grid-placeholder:hover {
  border-color: var(--color-primary-6);
  background: var(--color-primary-1);
}

.placeholder-text {
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--color-text-4);
  text-align: center;
}

.title-icon {
  font-size: 32px;
  color: var(--color-primary-6);
}

.page-subtitle {
  color: var(--color-text-3);
  font-size: 16px;
  margin: 0;
  line-height: 1.5;
}

/* 可滚动内容区域 */
.test-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
  width: 100%;
  margin: 0;
}

.test-section {
  margin-bottom: 32px;
  padding: 24px;
  background: var(--color-bg-2);
  border-radius: 12px;
  border: 1px solid var(--color-border-2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.test-section:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border-color: var(--color-border-3);
}

.test-section h2 {
  color: var(--color-text-1);
  margin-bottom: 20px;
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.test-section h2::before {
  content: '';
  width: 4px;
  height: 20px;
  background: var(--color-primary-6);
  border-radius: 2px;
}

.test-buttons, .player-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.analysis-result {
  background: var(--color-bg-1);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid var(--color-border-2);
  margin-top: 16px;
}

.analysis-result ul {
  margin: 12px 0;
  padding-left: 24px;
}

.analysis-result li {
  margin-bottom: 8px;
  color: var(--color-text-2);
}

.analysis-result p {
  margin-bottom: 12px;
  color: var(--color-text-1);
}

.native-video-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.native-video-header h2 {
  margin: 0;
  color: var(--color-text-1);
}

.native-video-controls {
  display: flex;
  gap: 12px;
}

.native-video-container {
  width: 100%;
  margin-bottom: 20px;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.native-video-player {
  width: 100%;
  height: 400px;
  display: block;
  background: #000;
}

.native-video-logs {
  margin-top: 20px;
  max-height: 300px;
  overflow-y: auto;
  background: var(--color-bg-1);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--color-border-2);
}

.native-video-logs h3 {
  color: var(--color-text-1);
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
}

.log-item {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  margin-bottom: 6px;
  color: var(--color-text-2);
  line-height: 1.4;
  padding: 4px 8px;
  background: var(--color-bg-2);
  border-radius: 4px;
  border-left: 3px solid var(--color-primary-6);
}

.error-section {
  background: var(--color-danger-light-1);
  border: 1px solid var(--color-danger-light-3);
}

.error-section h2 {
  color: var(--color-danger-6);
}

.error-section pre {
  color: var(--color-danger-6);
  white-space: pre-wrap;
  word-break: break-all;
  background: var(--color-bg-1);
  padding: 16px;
  border-radius: 6px;
  margin-top: 12px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
}

/* 播放器容器样式 - 在页面内显示 */
.video-test-container :deep(.video-player-section) {
  margin: 24px 0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}



/* 播放器区域样式 */
.player-section {
  padding: 0 !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.player-section h2 {
  padding: 24px 24px 16px 24px;
  margin-bottom: 0;
  background: var(--color-bg-2);
  border-radius: 12px 12px 0 0;
  border: 1px solid var(--color-border-2);
  border-bottom: none;
}

/* 播放器容器样式调整 */
.video-test-container :deep(.video-player-section) {
  margin-bottom: 0;
  border-radius: 0 0 12px 12px;
  border-top: none;
}

.video-test-container :deep(.video-player-section .arco-card) {
  width: 100%;
  max-width: 100%;
  background: var(--color-bg-1);
  border-radius: 0 0 12px 12px;
  overflow: hidden;
  margin: 0;
}

.video-test-container :deep(.video-player-section .arco-card-body) {
  padding: 0;
}

.video-test-container :deep(.video-player-container) {
  position: relative;
  width: 100%;
  max-width: 100%;
  background: #000;
  border-radius: 0;
  overflow: hidden;
}

.video-test-container :deep(.video-player) {
  width: 100%;
  height: auto;
  min-height: 400px;
  max-height: 60vh;
  background: #000;
  outline: none;
}

/* ArtPlayer 容器样式调整 */
.video-test-container :deep(.art-player-container) {
  position: relative;
  width: 100%;
  max-width: 100%;
  background: #000;
  border-radius: 0;
  overflow: hidden;
}

.video-test-container :deep(.art-player-container .artplayer-app) {
  width: 100%;
  height: 400px;
  max-height: 60vh;
  border-radius: 0;
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .test-header {
    padding: 16px 20px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
  }
  
  .nav-buttons {
    align-items: stretch;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .test-content {
    padding: 20px;
  }
  
  .test-section {
    padding: 20px;
    margin-bottom: 24px;
  }
  
  .test-buttons, .player-buttons {
    grid-template-columns: 1fr;
  }
  
  .video-test-container :deep(.video-player-section) {
    padding: 10px;
  }
  
  .video-test-container :deep(.video-player-section .arco-card) {
    max-width: 100%;
    max-height: 95vh;
  }
  
  .video-test-container :deep(.video-player) {
    min-height: 200px;
    max-height: calc(95vh - 80px);
  }
  
  .video-test-container :deep(.art-video-player) {
    padding: 10px !important;
  }
  
  .video-test-container :deep(.art-video-player .artplayer-app) {
    max-width: 100% !important;
    max-height: 95vh !important;
  }
}
</style>