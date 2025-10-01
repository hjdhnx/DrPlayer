<template>
  <a-card v-if="visible && videoUrl" class="video-player-section">
    <!-- 使用PlayerHeader组件 -->
    <PlayerHeader
      :episode-name="episodeName"
      :player-type="playerType"
      :episodes="episodes"
      :auto-next-enabled="autoNext"
      :countdown-enabled="showCountdown"
      :skip-enabled="skipEnabled"
      @toggle-auto-next="toggleAutoNext"
      @toggle-countdown="toggleCountdown"
      @player-change="handlePlayerTypeChange"
      @open-skip-settings="openSkipSettingsDialog"
      @close="closePlayer"
    />
    <div class="video-player-container">
      <video 
        ref="videoPlayer"
        class="video-player"
        controls
        autoplay
        preload="auto"
        :poster="poster"
      >
        您的浏览器不支持视频播放
      </video>
      
      <!-- 倍速控制器 -->
      <div class="speed-control">
        <label for="speed-select">倍速：</label>
        <select 
          id="speed-select" 
          v-model="currentSpeed" 
          @change="changePlaybackRate"
          class="speed-selector"
        >
          <option value="0.5">0.5x</option>
          <option value="0.75">0.75x</option>
          <option value="1">1x</option>
          <option value="1.25">1.25x</option>
          <option value="1.5">1.5x</option>
          <option value="2">2x</option>
          <option value="2.5">2.5x</option>
          <option value="3">3x</option>
          <option value="4">4x</option>
          <option value="5">5x</option>
        </select>
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
      
      <!-- 使用SkipSettingsDialog组件 -->
      <SkipSettingsDialog
        :visible="showSkipSettingsDialog"
        :skip-intro-enabled="skipIntroEnabled"
        :skip-outro-enabled="skipOutroEnabled"
        :skip-intro-seconds="skipIntroSeconds"
        :skip-outro-seconds="skipOutroSeconds"
        @close="closeSkipSettingsDialog"
        @save="saveSkipSettings"
      />
    </div>
  </a-card>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconClose } from '@arco-design/web-vue/es/icon'
import Hls from 'hls.js'
import PlayerHeader from './PlayerHeader.vue'
import SkipSettingsDialog from './SkipSettingsDialog.vue'
import { useSkipSettings } from '@/composables/useSkipSettings'

// Props
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
    default: 'default'
  },
  // 自动下一集功能相关 props
  episodes: {
    type: Array,
    default: () => []
  },
  currentEpisodeIndex: {
    type: Number,
    default: 0
  }
})

// Emits
const emit = defineEmits(['close', 'error', 'player-change', 'next-episode'])

// 响应式数据
const videoPlayer = ref(null)
const hlsInstance = ref(null)
const autoNext = ref(true) // 默认开启自动连播
const showCountdown = ref(false)
const showAutoNextDialog = ref(false)
const autoNextCountdown = ref(10)
const countdownTimer = ref(null)
const isProcessingAutoNext = ref(false) // 防止重复触发自动连播
const currentSpeed = ref(1) // 当前播放倍速

// 检查是否有下一集
const hasNextEpisode = () => {
  return props.episodes && props.episodes.length > 0 && 
         props.currentEpisodeIndex < props.episodes.length - 1
}

// 获取下一集信息
const getNextEpisode = () => {
  if (hasNextEpisode()) {
    return props.episodes[props.currentEpisodeIndex + 1]
  }
  return null
}

// 隐藏自动下一集对话框
const hideAutoNextDialog = () => {
  showAutoNextDialog.value = false
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
    countdownTimer.value = null
  }
}

// 播放下一集
const playNextEpisode = () => {
  if (hasNextEpisode()) {
    const nextIndex = props.currentEpisodeIndex + 1
    emit('next-episode', nextIndex)
    hideAutoNextDialog()
    // 重置防抖标志
    setTimeout(() => {
      isProcessingAutoNext.value = false
    }, 2000) // 2秒后重置，给视频切换足够的时间
  }
}

// 使用片头片尾跳过功能组合式函数
const {
  showSkipSettingsDialog,
  skipIntroEnabled,
  skipOutroEnabled,
  skipIntroSeconds,
  skipOutroSeconds,
  skipEnabled,
  skipOutroTimer,
  initSkipSettings,
  applySkipSettings,
  handleTimeUpdate,
  resetSkipState,
  openSkipSettingsDialog,
  closeSkipSettingsDialog,
  saveSkipSettings: saveSkipSettingsComposable
} = useSkipSettings({
  onSkipToNext: playNextEpisode,
  getCurrentTime: () => videoPlayer.value?.currentTime || 0,
  setCurrentTime: (time) => {
    if (videoPlayer.value) {
      videoPlayer.value.currentTime = time
    }
  },
  getDuration: () => videoPlayer.value?.duration || 0
})

// 切换自动连播
const toggleAutoNext = () => {
  autoNext.value = !autoNext.value
}

// 切换倒计时显示
const toggleCountdown = () => {
  showCountdown.value = !showCountdown.value
}

// 显示自动下一集对话框
const showAutoNextDialogFunc = () => {
  if (!autoNext.value || !hasNextEpisode()) return
  
  showAutoNextDialog.value = true
  autoNextCountdown.value = 10
  
  countdownTimer.value = setInterval(() => {
    autoNextCountdown.value--
    if (autoNextCountdown.value <= 0) {
      playNextEpisode()
    }
  }, 1000)
}

// 取消自动下一集
const cancelAutoNext = () => {
  hideAutoNextDialog()
  // 重置防抖标志
  isProcessingAutoNext.value = false
}

// 改变播放倍速
const changePlaybackRate = () => {
  if (videoPlayer.value) {
    videoPlayer.value.playbackRate = parseFloat(currentSpeed.value)
    console.log('播放倍速已设置为:', currentSpeed.value)
  }
}

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

// 初始化视频播放器
const initVideoPlayer = (url) => {
  if (!videoPlayer.value || !url) return
  
  // 重置片头片尾跳过状态
  resetSkipState()
  
  // 首先判断链接类型
  if (!isDirectVideoLink(url)) {
    Message.info('检测到网页链接，正在新窗口打开...')
    window.open(url, '_blank')
    emit('close') // 关闭播放器
    return
  }
  
  // 清理之前的HLS实例
  if (hlsInstance.value) {
    hlsInstance.value.destroy()
    hlsInstance.value = null
  }
  
  const video = videoPlayer.value
  
  // 视频结束事件处理函数
  const handleVideoEnded = () => {
    // 防抖：如果正在处理自动连播，则忽略
    if (isProcessingAutoNext.value) {
      return
    }
    
    if (autoNext.value && hasNextEpisode()) {
      isProcessingAutoNext.value = true
      
      if (showCountdown.value) {
        showAutoNextDialogFunc()
      } else {
        // 如果不显示倒计时，直接播放下一集
        setTimeout(() => {
          playNextEpisode()
        }, 1000)
      }
    }
  }

  // 检测视频格式
  const isM3u8 = url.toLowerCase().includes('.m3u8') || url.toLowerCase().includes('m3u8')
  
  if (isM3u8) {
    // 处理m3u8格式
    if (Hls.isSupported()) {
      // 使用HLS.js播放m3u8
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      })
      
      hls.loadSource(url)
      hls.attachMedia(video)
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest 解析完成，开始播放')
        video.play().catch(err => {
          console.warn('自动播放失败:', err)
        })
      })
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS播放错误:', data)
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              Message.error('网络错误，请检查网络连接')
              hls.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              Message.error('媒体错误，尝试恢复播放')
              hls.recoverMediaError()
              break
            default:
              // 播放器错误时，检查是否为网页链接
              if (!isDirectVideoLink(url)) {
                console.log('HLS播放失败，检测到可能是网页链接，在新窗口打开:', url)
                Message.info('视频播放失败，检测到网页链接，正在新窗口打开...')
                window.open(url, '_blank')
                emit('close') // 关闭播放器
              } else {
                Message.error('播放器错误，请重试')
                emit('error', '播放器错误')
              }
              hls.destroy()
              break
          }
        }
      })
      
      hlsInstance.value = hls
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari原生支持HLS
      video.src = url
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(err => {
          console.warn('自动播放失败:', err)
        })
      })
    } else {
      Message.error('您的浏览器不支持HLS播放')
      emit('error', '浏览器不支持HLS播放')
      return // 如果不支持HLS，直接返回，不添加事件监听器
    }
  } else {
    // 处理其他格式的视频（mp4, webm, avi等）
    video.src = url
    
    // 添加事件监听器
    const handleLoadedMetadata = () => {
      video.play().catch(err => {
        console.warn('自动播放失败:', err)
        Message.warning('自动播放失败，请手动点击播放')
      })
      
      // 应用片头片尾设置
      applySkipSettings()
    }
    
    const handleError = (e) => {
      console.error('视频播放错误:', e)
      
      // 如果播放失败，再次检查是否为网页链接
      if (!isDirectVideoLink(url)) {
        Message.info('视频播放失败，检测到网页链接，正在新窗口打开...')
        window.open(url, '_blank')
        emit('close') // 关闭播放器
      } else {
        Message.error('视频播放失败，请检查视频链接或格式')
        emit('error', '视频播放失败')
      }
    }
    
    const handleLoadStart = () => {
      // 重置片头片尾跳过状态
      resetSkipState()
    }
    
    const handlePlaying = () => {
      // 延迟一点应用跳过设置，确保视频已经开始播放
      setTimeout(() => {
        applySkipSettings()
      }, 100)
    }
    
    // 移除之前的事件监听器（如果有）
    video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    video.removeEventListener('error', handleError)
    video.removeEventListener('loadstart', handleLoadStart)
    video.removeEventListener('playing', handlePlaying)
    video.removeEventListener('timeupdate', handleTimeUpdate)
    video.removeEventListener('ended', handleVideoEnded)
    
    // 添加新的事件监听器
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('error', handleError)
    video.addEventListener('loadstart', handleLoadStart)
    video.addEventListener('playing', handlePlaying)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleVideoEnded)
    
    // 开始加载视频
    video.load()
  }
  
  // 统一添加视频结束事件监听器（避免重复添加）
  video.removeEventListener('ended', handleVideoEnded)
  video.addEventListener('ended', handleVideoEnded)
}

// 片头片尾跳过功能相关方法

// 关闭片头片尾设置弹窗
// 保存片头片尾设置
const saveSkipSettings = (settings) => {
  saveSkipSettingsComposable(settings)
  Message.success('片头片尾设置已保存')
  closeSkipSettingsDialog()
}



// 关闭播放器
const closePlayer = () => {
  console.log('关闭视频播放器')
  
  // 停止播放
  if (videoPlayer.value) {
    videoPlayer.value.pause()
    videoPlayer.value.currentTime = 0
  }
  
  // 清理HLS实例
  if (hlsInstance.value) {
    hlsInstance.value.destroy()
    hlsInstance.value = null
  }
  
  // 清理片尾跳过定时器
  if (skipOutroTimer.value) {
    clearInterval(skipOutroTimer.value)
    skipOutroTimer.value = null
  }
  
  emit('close')
}

// 处理播放器类型变更
const handlePlayerTypeChange = (newType) => {
  emit('player-change', newType)
}

// 监听视频URL变化
watch(() => props.videoUrl, (newUrl) => {
  if (newUrl && props.visible) {
    resetSkipState() // 重置片头片尾跳过状态
    nextTick(() => {
      initVideoPlayer(newUrl)
    })
  }
}, { immediate: true })

// 监听显示状态变化
watch(() => props.visible, (newVisible) => {
  if (newVisible && props.videoUrl) {
    nextTick(() => {
      initVideoPlayer(props.videoUrl)
    })
  } else if (!newVisible) {
    // 隐藏时清理资源
    if (hlsInstance.value) {
      hlsInstance.value.destroy()
      hlsInstance.value = null
    }
  }
})

// 组件挂载时初始化
onMounted(() => {
  initSkipSettings()
})

// 组件卸载时清理资源
onUnmounted(() => {
  console.log('VideoPlayer组件卸载，清理播放器资源')
  
  // 清理视频播放器
  if (videoPlayer.value) {
    videoPlayer.value.pause()
    videoPlayer.value.src = ''
    videoPlayer.value.load() // 这会清理所有事件监听器
  }
  
  if (hlsInstance.value) {
    hlsInstance.value.destroy()
    hlsInstance.value = null
  }
  
  // 清理倒计时定时器
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
    countdownTimer.value = null
  }
})
</script>

<style scoped>
/* 视频播放器样式 */
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

.compact-button-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.compact-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  height: 28px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
  color: #666;
}

.compact-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.compact-btn.active {
  background: #1890ff;
  border-color: #1890ff;
  color: white;
}

.compact-btn.close-btn {
  background: #ff4d4f;
  border-color: #ff4d4f;
  color: white;
}

.compact-btn.close-btn:hover {
  background: #ff7875;
  border-color: #ff7875;
}

.btn-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.btn-text {
  font-size: 12px;
  white-space: nowrap;
}

.compact-select {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  font-size: 12px;
  min-width: 80px;
}

.compact-select .arco-select-view-single {
  border: none !important;
  background: transparent !important;
  padding: 0 !important;
  height: auto !important;
  min-height: auto !important;
}

.selector-btn {
  min-width: 120px;
}

.video-player-container {
  position: relative;
  width: 100%;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.video-player {
  width: 100%;
  height: auto;
  min-height: 400px;
  max-height: 70vh;
  background: #000;
  outline: none;
}

.video-player::-webkit-media-controls-panel {
  background-color: transparent;
}

.video-player::-webkit-media-controls-play-button,
.video-player::-webkit-media-controls-volume-slider,
.video-player::-webkit-media-controls-timeline,
.video-player::-webkit-media-controls-current-time-display,
.video-player::-webkit-media-controls-time-remaining-display {
  color: #fff;
}

/* 自动下一集倒计时弹窗样式 */
.auto-next-dialog {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.9);
  border-radius: 12px;
  padding: 24px;
  z-index: 1000;
  min-width: 300px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
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

/* 倍速控制器样式 */
.speed-control {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  padding: 8px 12px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 10;
}

.speed-control label {
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.speed-selector {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 14px;
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;
}

.speed-selector:hover {
  background: white;
  border-color: #23ade5;
}

.speed-selector:focus {
  border-color: #23ade5;
  box-shadow: 0 0 0 2px rgba(35, 173, 229, 0.2);
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

  .video-player {
    min-height: 200px;
  }
}
</style>