<template>
  <div class="video-detail">
    <!-- 头部导航 -->
    <div class="detail-header">
      <a-button type="text" @click="goBack" class="back-btn">
        <template #icon>
          <icon-left />
        </template>
        返回
      </a-button>
      <div class="header-title">
        <span v-if="!originalVideoInfo.name">视频详情</span>
        <span v-else class="title-with-info">
          <span class="title-main">视频详情 - {{ originalVideoInfo.name }}</span>
          <span class="title-source" v-if="currentSiteInfo.name">
            ({{ currentSiteInfo.name }} - ID: {{ originalVideoInfo.id }})
          </span>
        </span>
      </div>
      <!-- 操作按钮 -->
      <div class="header-actions" v-if="originalVideoInfo.id">
        <!-- 清除推送覆盖按钮 -->
        <a-button 
          v-if="hasPushOverride"
          type="outline"
          status="warning"
          @click="clearPushOverride"
          class="clear-push-btn"
        >
          <template #icon>
            <icon-refresh />
          </template>
          恢复原始数据
        </a-button>
        <!-- 收藏按钮 -->
        <a-button 
          :type="isCurrentFavorited ? 'primary' : 'outline'"
          @click="toggleFavorite"
          class="favorite-btn"
          :loading="favoriteLoading"
        >
          <template #icon>
            <icon-heart-fill v-if="isCurrentFavorited" />
            <icon-heart v-else />
          </template>
          {{ isCurrentFavorited ? '取消收藏' : '收藏' }}
        </a-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <a-spin :size="40" />
      <div class="loading-text">正在加载详情...</div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <a-result status="error" :title="error" />
      <a-button type="primary" @click="loadVideoDetail">重新加载</a-button>
    </div>

    <!-- 详情内容 -->
    <div v-else-if="videoDetail" class="detail-content">
      <!-- 默认视频播放器组件 -->
      <VideoPlayer 
        v-if="showVideoPlayer && (actualVideoUrl || needsParsing) && playerType === 'default'"
        :video-url="actualVideoUrl"
        :episode-name="currentEpisodeName"
        :poster="videoDetail?.vod_pic"
        :visible="showVideoPlayer"
        :player-type="playerType"
        :episodes="currentRouteEpisodes"
        :current-episode-index="currentEpisodeIndex"
        :headers="parsedHeaders"
        :qualities="parsedQualities"
        :has-multiple-qualities="hasMultipleQualities"
        :initial-quality="initialQuality"
        :needs-parsing="needsParsing"
        :parse-data="parseData"
        @close="handlePlayerClose"
        @player-change="handlePlayerTypeChange"
        @parser-change="handleParserChange"
        @next-episode="handleNextEpisode"
        @episode-selected="handleEpisodeSelected"
        @quality-change="handleQualityChange"
      />

      <!-- ArtPlayer 播放器组件 -->
      <ArtVideoPlayer 
        v-if="showVideoPlayer && (actualVideoUrl || needsParsing) && playerType === 'artplayer'"
        :video-url="actualVideoUrl"
        :episode-name="currentEpisodeName"
        :poster="videoDetail?.vod_pic"
        :visible="showVideoPlayer"
        :player-type="playerType"
        :episodes="currentRouteEpisodes"
        :current-episode-index="currentEpisodeIndex"
        :auto-next="true"
        :headers="parsedHeaders"
        :danmaku-url="parsedDanmakuUrl"
        :qualities="parsedQualities"
        :has-multiple-qualities="hasMultipleQualities"
        :initial-quality="initialQuality"
        :needs-parsing="needsParsing"
        :parse-data="parseData"
        @close="handlePlayerClose"
        @player-change="handlePlayerTypeChange"
        @parser-change="handleParserChange"
        @next-episode="handleNextEpisode"
        @episode-selected="handleEpisodeSelected"
        @quality-change="handleQualityChange"
      />

      <!-- 小说阅读器组件 -->
      <BookReader 
        v-if="showBookReader && parsedNovelContent"
        :book-detail="videoDetail"
        :book-title="videoDetail?.vod_name"
        :chapter-name="currentEpisodeName"
        :chapter-content="parsedNovelContent"
        :chapters="currentRouteEpisodes"
        :current-chapter-index="currentEpisode"
        :visible="showBookReader"
        @close="handleReaderClose"
        @next-chapter="handleNextChapter"
        @prev-chapter="handlePrevChapter"
        @chapter-selected="handleChapterSelected"
        @chapter-change="handleChapterChange"
      />

      <!-- 漫画阅读器组件 -->
      <ComicReader 
        v-if="showComicReader && parsedComicContent"
        :comic-detail="videoDetail"
        :comic-title="videoDetail?.vod_name"
        :chapter-name="currentEpisodeName"
        :chapters="currentRouteEpisodes"
        :current-chapter-index="currentEpisode"
        :comic-content="parsedComicContent"
        :visible="showComicReader"
        @close="handleReaderClose"
        @next-chapter="handleNextChapter"
        @prev-chapter="handlePrevChapter"
        @chapter-selected="handleChapterSelected"
        @settings-change="handleSettingsChange"
      />

      <!-- 视频信息卡片 -->
      <a-card class="video-info-card" :class="{ 'collapsed-when-playing': showVideoPlayer || showBookReader }">
        <div class="video-header">
          <div class="video-poster" @click="showImageModal">
            <img :src="finalPosterImage" :alt="videoDetail.vod_name" @error="handleImageError" />
            <div class="poster-overlay">
              <icon-eye class="view-icon" />
              <span>查看大图</span>
            </div>
          </div>
          <div class="video-meta">
            <h1 class="video-title">{{ videoDetail.vod_name }}</h1>
            <div class="video-tags">
              <a-tag v-if="videoDetail.type_name" color="blue">{{ videoDetail.type_name }}</a-tag>
              <a-tag v-if="videoDetail.vod_year" color="green">{{ videoDetail.vod_year }}</a-tag>
              <a-tag v-if="videoDetail.vod_area" color="orange">{{ videoDetail.vod_area }}</a-tag>
            </div>
            <div class="mobile-detail-actions" v-if="originalVideoInfo.id">
              <a-button
                :type="isCurrentFavorited ? 'primary' : 'outline'"
                size="small"
                @click="toggleFavorite"
                class="mobile-favorite-btn"
                :loading="favoriteLoading"
              >
                <template #icon>
                  <icon-heart-fill v-if="isCurrentFavorited" />
                  <icon-heart v-else />
                </template>
                {{ isCurrentFavorited ? '取消收藏' : '收藏' }}
              </a-button>
              <a-button
                v-if="hasPushOverride"
                type="outline"
                status="warning"
                size="small"
                @click="clearPushOverride"
                class="mobile-clear-push-btn"
              >
                <template #icon>
                  <icon-refresh />
                </template>
                恢复原始数据
              </a-button>
            </div>
            <div class="video-info-grid">
              <div v-if="videoDetail.vod_director" class="info-item">
                <span class="label">导演：</span>
                <span class="value">{{ videoDetail.vod_director }}</span>
              </div>
              <div v-if="videoDetail.vod_actor" class="info-item">
                <span class="label">演员：</span>
                <span class="value">{{ videoDetail.vod_actor }}</span>
              </div>
              <div v-if="videoDetail.vod_remarks" class="info-item">
                <span class="label">备注：</span>
                <span class="value">{{ videoDetail.vod_remarks }}</span>
              </div>
            </div>
          </div>
          <div class="video-actions">
            <!-- 第一行按钮：播放和复制 -->
            <div v-if="currentEpisodeUrl" class="action-buttons-row">
              <!-- 播放/阅读按钮 -->
              <a-button 
                type="primary" 
                size="large" 
                @click="playVideo" 
                class="play-btn"
              >
                <template #icon>
                  <icon-play-arrow v-if="smartPlayButton.icon === 'icon-play-arrow'" />
                  <icon-book v-else-if="smartPlayButton.icon === 'icon-book'" />
                  <icon-image v-else-if="smartPlayButton.icon === 'icon-image'" />
                  <icon-sound v-else-if="smartPlayButton.icon === 'icon-sound'" />
                </template>
                {{ smartPlayButton.text }}
              </a-button>
              
              <!-- 复制链接按钮 -->
              <a-button 
                @click="copyPlayUrl" 
                class="copy-btn"
                size="large"
              >
                <template #icon>
                  <icon-copy />
                </template>
                复制链接
              </a-button>
            </div>
            
            <!-- 第二行按钮：下载 -->
            <div v-if="isNovelType" class="action-buttons-row download-row">
              <a-button 
                @click="showDownloadDialog" 
                class="download-btn"
                type="primary"
                status="success"
                size="large"
              >
                <template #icon>
                  <icon-download />
                </template>
                下载小说
              </a-button>
            </div>
          </div>
        </div>
        
        <!-- 剧情简介 -->
        <div v-if="videoDetail.vod_content" class="video-description">
          <h3>剧情简介</h3>
          <div class="description-content" :class="{ expanded: descriptionExpanded }">
            {{ videoDetail.vod_content }}
          </div>
          <a-button
            v-if="videoDetail.vod_content.length > 80"
            type="text"
            @click="toggleDescription"
            class="expand-btn"
          >
            {{ descriptionExpanded ? '收起' : '展开' }}
          </a-button>
        </div>
      </a-card>



      <!-- 播放线路和选集组件 -->
      <EpisodeSelector 
        :video-detail="videoDetail"
        :current-route="currentRoute"
        :current-episode="currentEpisode"
        @route-change="switchRoute"
        @episode-change="selectEpisode"
      />
    </div>

    <!-- v-viewer 图片查看器 -->
    <div v-viewer="viewerOptions" class="viewer" v-show="false">
      <img 
        v-for="(imageData, index) in viewerImageData" 
        :key="index"
        :src="imageData.src" 
        :alt="imageData.name"
        :data-source="imageData.src"
        :title="imageData.name"
      />
    </div>

    <!-- 解析提示弹窗 -->
    <ActionDialog
      :visible="showParseDialog"
      :title="parseDialogConfig.title"
      :width="400"
      @close="showParseDialog = false"
    >
      <div class="parse-dialog-content">
        <div class="parse-message">
          {{ parseDialogConfig.message }}
        </div>
        

        
        <!-- 嗅探结果显示 -->
        <div v-if="sniffResults.length > 0" class="sniff-results">
          <div class="results-title">嗅探到的视频链接：</div>
          <div class="results-list">
            <div 
              v-for="(result, index) in sniffResults.slice(0, 3)" 
              :key="index"
              class="result-item"
            >
              <div class="result-index">{{ index + 1 }}</div>
              <div class="result-info">
                <div class="result-url">{{ result.url }}</div>
                <div class="result-type" v-if="result.type">{{ result.type }}</div>
              </div>
            </div>
            <div v-if="sniffResults.length > 3" class="more-results">
              还有 {{ sniffResults.length - 3 }} 个链接...
            </div>
          </div>
        </div>
        
        <div v-if="!sniffing" class="parse-hint">
          <div class="hint-icon">
            <icon-eye />
          </div>
          <div class="hint-text">
            敬请期待后续版本支持！
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="parse-dialog-footer">
          <a-button type="primary" @click="showParseDialog = false" :disabled="sniffing">
            我知道了
          </a-button>
        </div>
      </template>
    </ActionDialog>

    <!-- 下载任务对话框 -->
    <AddDownloadTaskDialog
      :visible="showDownloadTaskDialog"
      :novel-detail="videoDetail"
      :chapters="currentRouteEpisodes"
      :source-name="currentSiteInfo?.name || ''"
      @close="showDownloadTaskDialog = false"
      @confirm="handleDownloadConfirm"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, onActivated, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import videoService from '@/api/services/video'
import siteService from '@/api/services/site'
import { sniffVideoWithConfig, isSnifferEnabled } from '@/api/services/sniffer'
import ParserService from '@/api/services/parser'
import { useSiteStore } from '@/stores/siteStore'
import { useFavoriteStore } from '@/stores/favoriteStore'
import { useHistoryStore } from '@/stores/historyStore'
import { usePageStateStore } from '@/stores/pageStateStore'
import { useParserStore } from '@/stores/parser'
import VideoPlayer from '@/components/players/VideoPlayer.vue'
import ArtVideoPlayer from '@/components/players/ArtVideoPlayer.vue'
import EpisodeSelector from '@/components/players/EpisodeSelector.vue'
import BookReader from '@/components/readers/BookReader.vue'
import ComicReader from '@/components/readers/ComicReader.vue'
import ActionDialog from '@/components/actions/ActionDialog.vue'
import AddDownloadTaskDialog from '@/components/downloader/AddDownloadTaskDialog.vue'
import downloadService from '@/services/downloadService'
import { 
  IconLeft, 
  IconPlayArrow, 
  IconCopy,
  IconHeart,
  IconHeartFill,
  IconEye,
  IconBook,
  IconImage,
  IconRefresh,
  IconSound,
  IconDownload
} from '@arco-design/web-vue/es/icon'

const route = useRoute()
const router = useRouter()
const siteStore = useSiteStore()
const favoriteStore = useFavoriteStore()
const historyStore = useHistoryStore()
const pageStateStore = usePageStateStore()
const parserStore = useParserStore()

// 响应式数据
const loading = ref(false)
const error = ref('')
const videoDetail = ref(null)
// 保存初始的folder状态，用于返回时恢复
const initialFolderState = ref(null)
const originalVideoInfo = ref({
  id: '',
  name: '',
  pic: '',
  year: '',
  area: '',
  type: '',
  remarks: '',
  content: '',
  actor: '',
  director: ''
})
const descriptionExpanded = ref(false)
const currentRoute = ref(0)
const currentEpisode = ref(0)
const favoriteLoading = ref(false)
const imageErrorCount = ref(0) // 图片加载失败计数器
// 当前使用的站源信息（可能是全局站源或临时站源）
const currentSiteInfo = ref({
  name: '',
  api: '',
  key: ''
})

// 推送协议相关状态
const isPushMode = ref(false)
// 推送覆盖标记，用于标识是否发生过推送覆盖需要强制刷新
// 使用sessionStorage持久化状态，避免组件重新创建时丢失
const hasPushOverride = ref(sessionStorage.getItem('hasPushOverride') === 'true')
// 当前活跃的源信息（推送模式下为push_agent，正常模式下为原始源）
const currentActiveSiteInfo = ref(null)

// 监听hasPushOverride变化，自动保存到sessionStorage
watch(hasPushOverride, (newValue) => {
  sessionStorage.setItem('hasPushOverride', newValue.toString())
  console.log('🔄 [状态持久化] hasPushOverride状态已保存:', newValue)
}, { immediate: true })

// 视频播放器相关
const showVideoPlayer = ref(false)
// 解析后的播放URL（用于T4接口解析结果）
const parsedVideoUrl = ref('')
// 解析后的请求头（用于T4接口解析结果）
const parsedHeaders = ref({})
// 解析后的弹幕链接（用于T4接口解析结果）
const parsedDanmakuUrl = ref('')
// 多画质相关数据
const parsedQualities = ref([])
const hasMultipleQualities = ref(false)
const initialQuality = ref('')

// 解析器相关数据
const needsParsing = ref(false)
const parseData = ref(null)
const selectedParser = ref(null)

// 下载相关数据
const showDownloadTaskDialog = ref(false)
const availableParsers = ref([])

// 小说阅读器相关
const showBookReader = ref(false)
// 解析后的小说内容（用于T4接口解析结果）
const parsedNovelContent = ref(null)

// 漫画阅读器相关
const showComicReader = ref(false)
// 解析后的漫画内容（用于T4接口解析结果）
const parsedComicContent = ref(null)

// 解析提示弹窗相关
const showParseDialog = ref(false)
const parseDialogConfig = ref({
  title: '',
  message: '',
  type: '' // 'sniff' 或 'parse'
})

// 嗅探相关
const sniffing = ref(false)
const sniffResults = ref([])

// 从localStorage读取用户的播放器偏好，默认为'default'
const getPlayerPreference = () => {
  try {
    const saved = localStorage.getItem('drplayer_preferred_player_type')
    return saved && ['default', 'artplayer'].includes(saved) ? saved : 'default'
  } catch (error) {
    console.warn('读取播放器偏好失败:', error)
    return 'default'
  }
}

// 保存播放器偏好到localStorage
const savePlayerPreference = (type) => {
  try {
    localStorage.setItem('drplayer_preferred_player_type', type)
    console.log('播放器偏好已保存:', type)
  } catch (error) {
    console.warn('保存播放器偏好失败:', error)
  }
}

const playerType = ref(getPlayerPreference()) // 'default' 或 'artplayer'

// 图片查看器相关
const viewerImages = ref([])
const viewerImageData = ref([])
const viewerOptions = ref({
  inline: false,
  button: true,
  navbar: true,
  title: true,
  toolbar: {
    zoomIn: 1,
    zoomOut: 1,
    oneToOne: 1,
    reset: 1,
    prev: 1,
    play: {
      show: 1,
      size: 'large',
    },
    next: 1,
    rotateLeft: 1,
    rotateRight: 1,
    flipHorizontal: 1,
    flipVertical: 1,
  },
  tooltip: true,
  movable: true,
  zoomable: true,
  rotatable: true,
  scalable: true,
  transition: true,
  fullscreen: true,
  keyboard: true,
  backdrop: true,
})

// 计算属性
// 最终显示的海报图片
const finalPosterImage = computed(() => {
  // 优先使用详情页接口返回的图片
  if (videoDetail.value?.vod_pic) {
    return videoDetail.value.vod_pic
  }
  // 其次使用来源页面传递的图片
  if (originalVideoInfo.value?.sourcePic) {
    return originalVideoInfo.value.sourcePic
  }
  // 最后使用默认图片
  return '/src/assets/default-poster.svg'
})

const playRoutes = computed(() => {
  if (!videoDetail.value?.vod_play_from || !videoDetail.value?.vod_play_url) {
    return []
  }
  
  const fromList = videoDetail.value.vod_play_from.split('$$$')
  const urlList = videoDetail.value.vod_play_url.split('$$$')
  
  return fromList.map((name, index) => ({
    name: name.trim(),
    episodes: parseEpisodes(urlList[index] || '')
  }))
})

// 解析选集数据
const parseEpisodes = (urlString) => {
  if (!urlString) return []
  
  return urlString.split('#').map(item => {
    const [name, url] = item.split('$')
    return {
      name: name?.trim() || '未知集数',
      url: url?.trim() || ''
    }
  }).filter(item => item.url)
}



// 当前线路的选集列表
const currentRouteEpisodes = computed(() => {
  return playRoutes.value[currentRoute.value]?.episodes || []
})

const currentEpisodeUrl = computed(() => {
  const episodes = playRoutes.value[currentRoute.value]?.episodes || []
  const episode = episodes[currentEpisode.value]
  return episode?.url || ''
})

// 实际播放URL（优先使用解析后的URL）
const actualVideoUrl = computed(() => {
  // 如果正在等待解析，不提供任何URL给播放器
  if (needsParsing.value && !parsedVideoUrl.value) {
    return ''
  }
  return parsedVideoUrl.value || currentEpisodeUrl.value
})

const currentEpisodeName = computed(() => {
  const episodes = playRoutes.value[currentRoute.value]?.episodes || []
  const episode = episodes[currentEpisode.value]
  return episode?.name || '未知选集'
})

const currentEpisodeIndex = computed(() => {
  return currentEpisode.value
})

const isCurrentFavorited = computed(() => {
  if (!originalVideoInfo.value.id || !currentSiteInfo.value.api) return false
  return favoriteStore.isFavorited(originalVideoInfo.value.id, currentSiteInfo.value.api)
})

// 判断当前内容是否为小说
const isNovelContent = computed(() => {
  return parsedNovelContent.value !== null
})

// 判断当前类型是否为小说（用于下载按钮显示）
const isNovelType = computed(() => {
  const siteName = currentSiteInfo.value?.name || ''
  // 通过站源名称标识判断，或者通过内容判断
  return siteName.includes('[书]') || isNovelContent.value
})

// 判断当前内容是否为漫画
const isComicContent = computed(() => {
  return showComicReader.value
})

// 智能播放按钮配置 - 根据站源名称标识显示不同的按钮文本和图标
const smartPlayButton = computed(() => {
  // 获取当前站源名称
  const siteName = currentSiteInfo.value?.name || ''
  
  // 根据站源名称的标识判断内容类型
  if (siteName.includes('[书]')) {
    return {
      text: '开始阅读',
      icon: 'icon-book'
    }
  } else if (siteName.includes('[听]')) {
    return {
      text: '播放音频',
      icon: 'icon-sound'
    }
  } else if (siteName.includes('[画]')) {
    return {
      text: '查看图片',
      icon: 'icon-image'
    }
  } else {
    // 默认情况，也要考虑现有的小说和漫画判断逻辑
    if (isNovelContent.value) {
      return {
        text: '开始阅读',
        icon: 'icon-book'
      }
    } else if (isComicContent.value) {
      return {
        text: '查看图片',
        icon: 'icon-image'
      }
    } else {
      return {
        text: '播放视频',
        icon: 'icon-play-arrow'
      }
    }
  }
})

// 方法

const loadVideoDetail = async () => {
  console.log('🔄 loadVideoDetail 函数被调用，开始加载详情数据:', {
    id: route.params.id,
    fullPath: route.fullPath,
    timestamp: new Date().toLocaleTimeString()
  })
  
  if (!route.params.id) {
    error.value = '视频ID不能为空'
    return
  }

  // 重置图片错误计数器
  imageErrorCount.value = 0

  // 重置推送状态
  isPushMode.value = false

  // 从路由参数中获取原始视频信息
  originalVideoInfo.value = {
    id: route.params.id,
    name: route.query.name || '',
    pic: route.query.pic || '',
    year: route.query.year || '',
    area: route.query.area || '',
    type: route.query.type || '',
    type_name: route.query.type_name || '',
    remarks: route.query.remarks || '',
    content: route.query.content || '',
    actor: route.query.actor || '',
    director: route.query.director || '',
    sourcePic: route.query.sourcePic || '' // 来源页面的图片，用于备用
  }

  // 检查是否有当前站点
  if (!siteStore.nowSite) {
    error.value = '请先选择一个视频源'
    return
  }

  loading.value = true
  error.value = ''
  
  // 检查是否从收藏、历史或推送进入，如果是则优先调用T4详情接口获取最新数据
  const fromCollection = route.query.fromCollection === 'true'
  const fromHistory = route.query.fromHistory === 'true'
  const fromPush = route.query.fromPush === 'true'
  const fromSpecialAction = route.query.fromSpecialAction === 'true'
  
  try {
    // 确定使用的站源信息
    let module, apiUrl, siteName, extend
    
    if ((fromCollection || fromHistory || fromPush||fromSpecialAction) && route.query.tempSiteKey) {
      // 调试：打印接收到的路由参数
      console.log('VideoDetail接收到的路由参数:', route.query)
      console.log('tempSiteExt参数值:', route.query.tempSiteExt)
      
      // 从收藏、历史或推送进入，使用临时站源信息，不影响全局状态
      module = route.query.tempSiteKey
      apiUrl = route.query.tempSiteApi
      siteName = route.query.tempSiteName
      extend = route.query.tempSiteExt || null
      
      const sourceType = fromCollection ? '收藏' : fromHistory ? '历史' : '推送'
      console.log(`从${sourceType}进入，使用临时站源:`, {
        siteName,
        module,
        apiUrl,
        extend
      })
    } else {
      // 正常进入，使用全局站源
      const currentSite = siteStore.nowSite
      module = currentSite.key || currentSite.name
      apiUrl = currentSite.api
      siteName = currentSite.name
      extend = currentSite.ext || null
    }
    
    // 设置当前使用的站源信息
    currentSiteInfo.value = {
      name: siteName,
      api: apiUrl,
      key: module,
      ext: extend
    }
    
    // 初始化当前活跃源信息为原始源
    currentActiveSiteInfo.value = currentSiteInfo.value
    
    console.log('获取视频详情:', {
      videoId: route.params.id,
      module: module,
      apiUrl: apiUrl,
      extend: extend,
      fromCollection: fromCollection,
      usingTempSite: fromCollection && route.query.tempSiteKey
    })
    
    if (fromCollection) {
      console.log('从收藏进入，优先调用T4详情接口获取最新数据')
    }
    
    // 从收藏进入时跳过缓存，强制获取最新数据
    const videoInfo = await videoService.getVideoDetails(module, route.params.id, apiUrl, fromCollection, extend)
    
    if (videoInfo) {
      // 添加API信息用于收藏
      videoInfo.module = module
      videoInfo.api_url = apiUrl
      videoInfo.site_name = siteName
      
      videoDetail.value = videoInfo
      console.log('视频详情获取成功:', videoInfo)
      
      // 处理历史记录恢复
      const historyRoute = route.query.historyRoute
      const historyEpisode = route.query.historyEpisode
      
      if (historyRoute && historyEpisode) {
        console.log('检测到历史记录参数，准备恢复播放位置:', { historyRoute, historyEpisode })
        // 等待DOM更新和计算属性更新后恢复历史记录位置
        nextTick(() => {
          // 再次等待，确保playRoutes计算属性已完全更新
          setTimeout(() => {
            console.log('开始恢复历史记录，当前playRoutes长度:', playRoutes.value.length)
            if (playRoutes.value.length > 0) {
              restoreHistoryPosition(historyRoute, historyEpisode)
            } else {
              console.warn('playRoutes为空，无法恢复历史记录')
            }
          }, 100)
        })
      } else {
        // 如果没有历史记录参数，确保默认选择第一个线路和选集
        nextTick(() => {
          setTimeout(() => {
            if (playRoutes.value.length > 0 && currentRoute.value === 0) {
              console.log('初始化默认播放位置')
              currentRoute.value = 0
              if (currentRouteEpisodes.value.length > 0) {
                currentEpisode.value = 0
              }
            }
          }, 100)
        })
      }
    } else {
      error.value = '未找到视频详情'
    }
  } catch (err) {
    console.error('加载视频详情失败:', err)
    error.value = err.message || '加载失败，请稍后重试'
  } finally {
    loading.value = false
    // 注意：不在这里清除hasPushOverride标记，因为可能是正常的路由变化触发的加载
    // hasPushOverride标记只在真正因为推送覆盖而重新加载时才清除
  }
}

const toggleFavorite = async () => {
  if (!originalVideoInfo.value.id || !currentSiteInfo.value.api) return
  
  favoriteLoading.value = true
  
  try {
    if (isCurrentFavorited.value) {
      const success = favoriteStore.removeFavorite(originalVideoInfo.value.id, currentSiteInfo.value.api)
      if (success) {
        Message.success('已取消收藏')
      }
    } else {
      // 构建收藏数据，优先使用列表数据，缺失时使用详情接口数据
      const favoriteData = {
        vod_id: originalVideoInfo.value.id,
        vod_name: originalVideoInfo.value.name || videoDetail.value?.vod_name || '',
        vod_pic: originalVideoInfo.value.pic || videoDetail.value?.vod_pic || '',
        vod_year: originalVideoInfo.value.year || videoDetail.value?.vod_year || '',
        vod_area: originalVideoInfo.value.area || videoDetail.value?.vod_area || '',
        vod_type: originalVideoInfo.value.type || videoDetail.value?.vod_type || '',
        type_name: originalVideoInfo.value.type_name || videoDetail.value?.type_name || '',
        vod_remarks: originalVideoInfo.value.remarks || videoDetail.value?.vod_remarks || '',
        vod_content: originalVideoInfo.value.content || videoDetail.value?.vod_content || '',
        vod_actor: originalVideoInfo.value.actor || videoDetail.value?.vod_actor || '',
        vod_director: originalVideoInfo.value.director || videoDetail.value?.vod_director || '',
        // 播放相关数据使用详情接口返回的数据
        vod_play_from: videoDetail.value?.vod_play_from || '',
        vod_play_url: videoDetail.value?.vod_play_url || '',
        // API信息使用当前站源信息
        module: currentSiteInfo.value.key,
        api_url: currentSiteInfo.value.api,
        site_name: currentSiteInfo.value.name,
        ext: currentSiteInfo.value.ext || null  // 添加站源扩展配置
      }
      
      const success = favoriteStore.addFavorite(favoriteData)
      if (success) {
        Message.success('收藏成功')
      } else {
        Message.warning('该视频已在收藏列表中')
      }
    }
  } catch (error) {
    Message.error('操作失败，请稍后重试')
    console.error('收藏操作失败:', error)
  } finally {
    favoriteLoading.value = false
  }
}

// 清除推送覆盖状态
const clearPushOverride = async () => {
  try {
    console.log('🔄 [用户操作] 手动清除推送覆盖状态')
    
    // 清除推送覆盖标记
    hasPushOverride.value = false
    isPushMode.value = false
    
    // 清除sessionStorage中的推送状态
    sessionStorage.removeItem('hasPushOverride')
    
    // 确保使用原始站源信息
    if (!siteStore.nowSite) {
      Message.error('无法恢复：当前没有选择视频源')
      return
    }
    
    const originalSite = siteStore.nowSite
    currentSiteInfo.value = {
      name: originalSite.name,
      api: originalSite.api,
      key: originalSite.key || originalSite.name,
      ext: originalSite.ext || null
    }
    
    // 重置为原始源信息
    currentActiveSiteInfo.value = currentSiteInfo.value
    
    console.log('🔄 [推送覆盖] 使用原始站源重新加载:', currentSiteInfo.value)
    
    // 重新加载原始数据，强制使用当前全局站源
    loading.value = true
    error.value = ''
    
    // 清除相关缓存，确保获取最新数据
    const cacheKey = `detail_${currentSiteInfo.value.key}_${route.params.id}`
    console.log('🔄 [推送覆盖] 清除缓存:', cacheKey)
    videoService.cache.delete(cacheKey)
    
    const videoInfo = await videoService.getVideoDetails(
      currentSiteInfo.value.key, 
      route.params.id, 
      currentSiteInfo.value.api, 
      true, // 强制跳过缓存
      currentSiteInfo.value.ext
    )
    
    if (videoInfo) {
      // 添加API信息
      videoInfo.module = currentSiteInfo.value.key
      videoInfo.api_url = currentSiteInfo.value.api
      videoInfo.site_name = currentSiteInfo.value.name
      
      videoDetail.value = videoInfo
      
      // 重置播放位置
      currentRoute.value = 0
      currentEpisode.value = 0
      
      console.log('✅ [推送覆盖] 原始数据恢复成功:', videoInfo)
      Message.success('已恢复原始数据')
    } else {
      throw new Error('无法获取原始视频数据')
    }
    
  } catch (error) {
    console.error('❌ [推送覆盖] 清除推送覆盖状态失败:', error)
    Message.error(`恢复原始数据失败: ${error.message}`)
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  // 检查是否有来源页面信息
  const sourceRouteName = route.query.sourceRouteName
  const sourceRouteParams = route.query.sourceRouteParams
  const sourceRouteQuery = route.query.sourceRouteQuery
  const fromSearch = route.query.fromSearch // 新增：标识是否来自搜索
  
  console.log('goBack 调用，来源信息:', { sourceRouteName, fromSearch, sourceRouteParams, sourceRouteQuery });
  
  if (sourceRouteName) {
    try {
      // 解析来源页面的参数和查询
      const params = sourceRouteParams ? JSON.parse(sourceRouteParams) : {}
      const query = sourceRouteQuery ? JSON.parse(sourceRouteQuery) : {}
      
      console.log('返回来源页面:', sourceRouteName, { params, query, fromSearch });
      
      // 根据来源页面类型和是否来自搜索处理状态恢复
      if (sourceRouteName === 'Video') {
        if (fromSearch === 'true') {
          // 来自Video页面的搜索结果，需要恢复搜索状态
          console.log('从Video页面搜索返回，恢复搜索状态');
          const savedSearchState = pageStateStore.getPageState('search');
          if (savedSearchState && savedSearchState.keyword && !pageStateStore.isStateExpired('search')) {
            console.log('发现保存的搜索状态，将恢复搜索结果:', savedSearchState);
            // 添加搜索恢复标识
            query._restoreSearch = 'true';
          }
        } else {
          // 来自Video页面的分类列表，恢复分类状态
          console.log('从Video页面分类返回，恢复分类状态');
          if (query.activeKey) {
            query._returnToActiveKey = query.activeKey;
            console.log('设置返回分类:', query.activeKey);
          }
          
          // 检查是否有目录状态需要恢复（使用保存的初始状态）
          if (initialFolderState.value) {
            try {
              const folderState = JSON.parse(initialFolderState.value);
              // 将保存的folderState添加到query参数中
              query.folderState = initialFolderState.value;
            } catch (error) {
              console.error('解析保存的目录状态失败:', error);
            }
          }
          
          // 检查是否有保存的Video页面状态
          const savedVideoState = pageStateStore.getPageState('video');
          if (savedVideoState && !pageStateStore.isStateExpired('video')) {
            console.log('发现保存的Video页面状态，将恢复状态而非重新加载');
          }
        }
      } else if (sourceRouteName === 'SearchAggregation') {
        // 返回聚合搜索页面，添加返回标识
        console.log('从聚合搜索页面返回，添加返回标识');
        query._returnFromDetail = 'true';
        // 清除时间戳参数，避免触发重新搜索
        if (query._t) {
          delete query._t;
          console.log('清除时间戳参数 _t，避免触发重新搜索');
        }
      } else if (sourceRouteName === 'Home') {
        // 返回Home页面，检查搜索状态
        const savedSearchState = pageStateStore.getPageState('search');
        if (savedSearchState && savedSearchState.keyword && !pageStateStore.isStateExpired('search')) {
          console.log('发现保存的搜索状态，将恢复搜索结果');
          // 添加搜索恢复标识
          query._restoreSearch = 'true';
        }
      }
      
      // 跳转到来源页面
      console.log('🔄 [DEBUG] ========== VideoDetail goBack 即将跳转 ==========');
      console.log('🔄 [DEBUG] sourceRouteName:', sourceRouteName);
      console.log('🔄 [DEBUG] params:', JSON.stringify(params, null, 2));
      console.log('🔄 [DEBUG] query参数完整内容:', JSON.stringify(query, null, 2));
      console.log('🔄 [DEBUG] folderState参数值:', query.folderState);
        console.log('🔄 [DEBUG] folderState参数类型:', typeof query.folderState);
        console.log('🔄 [DEBUG] initialFolderState.value:', initialFolderState.value);
        console.log('🔄 [DEBUG] _returnToActiveKey参数值:', query._returnToActiveKey);
        
        if (query.folderState) {
          try {
            const parsedFolderState = JSON.parse(query.folderState);
            console.log('🔄 [DEBUG] 解析后的folderState:', JSON.stringify(parsedFolderState, null, 2));
            console.log('🔄 [DEBUG] folderState.isActive:', parsedFolderState.isActive);
            console.log('🔄 [DEBUG] folderState.breadcrumbs:', parsedFolderState.breadcrumbs);
            console.log('🔄 [DEBUG] folderState.currentBreadcrumb:', parsedFolderState.currentBreadcrumb);
          } catch (e) {
            console.error('🔄 [ERROR] folderState解析失败:', e);
          }
        } else {
          console.log('🔄 [DEBUG] 没有folderState参数传递');
        }
      
      const routerPushParams = {
        name: sourceRouteName,
        params: params,
        query: query
      };
      console.log('🔄 [DEBUG] router.push完整参数:', JSON.stringify(routerPushParams, null, 2));
      
      router.push(routerPushParams);
      console.log('🔄 [DEBUG] ========== VideoDetail goBack 跳转完成 ==========');
    } catch (error) {
      console.error('解析来源页面信息失败:', error)
      // 如果解析失败，使用默认的返回方式
      router.back()
    }
  } else {
    console.log('没有来源信息，使用默认返回方式')
    // 没有来源信息，使用默认的返回方式
    router.back()
  }
}

const handleImageError = (event) => {
  // 防止无限循环：如果已经是默认图片，就不再重新设置
  if (event.target.src.includes('default-poster.svg')) {
    return
  }
  
  imageErrorCount.value++
  
  // 第一次失败：如果当前显示的是详情页接口返回的图片，尝试使用来源页面的图片
  if (imageErrorCount.value === 1 && originalVideoInfo.value?.sourcePic && 
      videoDetail.value?.vod_pic && event.target.src === videoDetail.value.vod_pic) {
    event.target.src = originalVideoInfo.value.sourcePic
    return
  }
  
  // 第二次失败或没有备用图片：使用默认图片
  const basePath = import.meta.env.BASE_URL || '/'
  event.target.src = `${basePath}default-poster.svg`
  event.target.style.objectFit = 'contain'
  event.target.style.backgroundColor = '#f7f8fa'
}

const showImageModal = () => {
  const currentImage = finalPosterImage.value
  // 只有当不是默认图片时才显示大图查看
  if (currentImage && !currentImage.includes('default-poster.svg')) {
    // 设置当前图片到 viewer，包含图片URL和名称
    viewerImages.value = [currentImage]
    viewerImageData.value = [{
      src: currentImage,
      name: videoDetail.value?.vod_name || originalVideoInfo.value?.name || '未知标题'
    }]
    
    // 等待下一个 tick 后显示 viewer
    setTimeout(() => {
      const viewerElement = document.querySelector('.viewer')
      if (viewerElement && viewerElement.$viewer) {
        viewerElement.$viewer.show()
      }
    }, 100)
  }
}

const restoreHistoryPosition = (historyRoute, historyEpisode) => {
  try {
    console.log('开始恢复历史记录位置:', { historyRoute, historyEpisode })
    
    // 查找对应的线路和选集
    const routes = playRoutes.value
    const targetRoute = routes.find(route => route.name === historyRoute)
    
    if (targetRoute) {
      console.log('找到历史线路:', targetRoute.name)
      
      // 设置当前线路索引
      const routeIndex = routes.indexOf(targetRoute)
      currentRoute.value = routeIndex
      
      // 等待currentRouteEpisodes更新后查找选集
      nextTick(() => {
        const episodes = currentRouteEpisodes.value
        const targetEpisode = episodes.find(ep => ep.name === historyEpisode)
        
        if (targetEpisode) {
          console.log('找到历史选集:', targetEpisode.name)
          
          // 设置当前选集索引
          const episodeIndex = episodes.indexOf(targetEpisode)
          currentEpisode.value = episodeIndex
          
          console.log('历史记录位置恢复成功:', { routeIndex, episodeIndex })
        } else {
          console.warn('未找到历史选集:', historyEpisode)
          // 如果找不到历史选集，默认选择第一个选集
          if (episodes.length > 0) {
            currentEpisode.value = 0
          }
        }
      })
    } else {
      console.warn('未找到历史线路:', historyRoute)
      // 如果找不到历史线路，默认选择第一个线路
      if (routes.length > 0) {
        currentRoute.value = 0
        nextTick(() => {
          if (currentRouteEpisodes.value.length > 0) {
            currentEpisode.value = 0
          }
        })
      }
    }
  } catch (error) {
    console.error('恢复历史记录位置失败:', error)
  }
}

const toggleDescription = () => {
  descriptionExpanded.value = !descriptionExpanded.value
}

const switchRoute = (index) => {
  currentRoute.value = index
  currentEpisode.value = 0 // 切换线路时重置选集
}

// 处理EpisodeSelector组件的事件
const handleRouteChange = (routeIndex) => {
  switchRoute(routeIndex)
}

const handleEpisodeChange = (episodeIndex) => {
  selectEpisode(episodeIndex)
}

// 处理VideoPlayer组件的关闭事件
const handlePlayerClose = () => {
  showVideoPlayer.value = false
}

// 处理阅读器组件的关闭事件（小说和漫画）
const handleReaderClose = () => {
  showBookReader.value = false
  showComicReader.value = false
  parsedNovelContent.value = null
  parsedComicContent.value = null
}

// 处理阅读器章节切换事件
const handleReaderChapterIndexChange = (chapterIndex) => {
  if (chapterIndex >= 0 && chapterIndex < currentRouteEpisodes.value.length) {
    currentEpisode.value = chapterIndex
    updateHistoryRecord()
  }
}

const handleChapterChange = (chapterIndex) => {
  console.log('切换到章节:', chapterIndex)
  handleReaderChapterIndexChange(chapterIndex)
}

// 处理下一章事件
const handleNextChapter = () => {
  if (currentEpisode.value < currentRouteEpisodes.value.length - 1) {
    const nextIndex = currentEpisode.value + 1
    console.log('切换到下一章:', nextIndex)
    handleReaderChapterIndexChange(nextIndex)
  }
}

// 处理上一章事件
const handlePrevChapter = () => {
  if (currentEpisode.value > 0) {
    const prevIndex = currentEpisode.value - 1
    console.log('切换到上一章:', prevIndex)
    handleReaderChapterIndexChange(prevIndex)
  }
}

// 处理章节选择事件
const handleChapterSelected = (chapterIndex) => {
  console.log('选择章节:', chapterIndex)
  handleReaderChapterIndexChange(chapterIndex)
}

// 处理播放器类型变更
const handlePlayerTypeChange = (newType) => {
  console.log('切换播放器类型:', newType)
  playerType.value = newType
  
  // 保存用户的播放器偏好
  savePlayerPreference(newType)
}

// 处理自动下一集事件
const handleNextEpisode = (nextEpisodeIndex) => {
  console.log('切换到下一集:', nextEpisodeIndex)
  
  // 检查索引是否有效
  if (nextEpisodeIndex >= 0 && nextEpisodeIndex < currentRouteEpisodes.value.length) {
    selectEpisode(nextEpisodeIndex)
  } else {
    console.warn('无效的选集索引:', nextEpisodeIndex)
    Message.warning('无法播放下一集')
  }
}

// 处理选集选择事件
const handleEpisodeSelected = (episodeParam) => {
  console.log('从播放器选择剧集:', episodeParam)
  
  // 判断传入的参数类型
  if (typeof episodeParam === 'number') {
    // 如果是数字，直接作为索引使用（循环播放场景）
    const episodeIndex = episodeParam
    if (episodeIndex >= 0 && episodeIndex < currentRouteEpisodes.value.length) {
      console.log('使用索引选择选集:', episodeIndex)
      selectEpisode(episodeIndex)
    } else {
      console.warn('无效的选集索引:', episodeIndex)
      Message.warning('选集切换失败：无效的选集索引')
    }
  } else if (episodeParam && typeof episodeParam === 'object') {
    // 如果是对象，按原来的逻辑查找索引
    const episodeIndex = currentRouteEpisodes.value.findIndex(ep => 
      ep.name === episodeParam.name && ep.url === episodeParam.url
    )
    
    if (episodeIndex !== -1) {
      console.log('通过对象查找到选集索引:', episodeIndex)
      selectEpisode(episodeIndex)
    } else {
      console.warn('未找到选集:', episodeParam)
      Message.warning('选集切换失败：未找到匹配的选集')
    }
  } else {
    console.warn('无效的选集参数:', episodeParam)
    Message.warning('选集切换失败：参数格式错误')
  }
}

// 处理阅读器设置变更事件
const handleSettingsChange = (settings) => {
  console.log('阅读器设置变更:', settings)
  // 这里可以添加设置保存逻辑，如果需要的话
}

// 处理画质切换事件
const handleQualityChange = (qualityData) => {
  console.log('画质切换事件:', qualityData)
  
  if (qualityData && qualityData.url) {
    // 更新当前播放URL
    parsedVideoUrl.value = qualityData.url
    console.log('画质切换完成，新URL:', qualityData.url)
  } else {
    console.warn('画质切换数据无效:', qualityData)
  }
}

// 处理解析器变更事件
const handleParserChange = async (parser) => {
  console.log('解析器变更事件:', parser)
  
  if (!parser || !parseData.value) {
    console.warn('解析器或解析数据无效')
    return
  }
  
  selectedParser.value = parser
  
  // 保存用户的解析器选择
  localStorage.setItem('selectedParser', JSON.stringify(parser))
  
  try {
    // 提取实际的解析器配置（处理嵌套结构）
    const actualParser = parser.parser || parser
    
    // 转换解析器类型字段（数字转字符串）
    const normalizedParser = {
      ...actualParser,
      type: actualParser.type === 1 ? 'json' : actualParser.type === 0 ? 'sniffer' : actualParser.type
    }
    
    // 为 JSON 类型解析器添加默认的 urlPath（如果没有配置）
    if (normalizedParser.type === 'json' && !normalizedParser.urlPath) {
      normalizedParser.urlPath = 'url' // 默认从响应的 url 字段提取视频地址
    }
    
    // 嗅探解析器支持直接拼接URL，不需要预处理占位符
    
    // 直接执行解析，不需要测试（测试逻辑仅用于解析器配置验证）
    console.log('🎬 [开始解析] 使用选定的解析器直接解析真实数据')
    console.log('🎬 [解析参数]', {
      parser: normalizedParser,
      parseData: parseData.value
    })
    
    // 执行解析
    await executeParsingWithSelectedParser(normalizedParser, parseData.value)
  } catch (error) {
    console.error('解析失败:', error)
    Message.error('解析失败，请稍后重试')
  }
}

// 获取可用的解析器列表
const getAvailableParsers = async () => {
  try {
    await parserStore.loadParsers()
    const enabledParsers = parserStore.parsers.filter(parser => parser.enabled)
    availableParsers.value = enabledParsers
    console.log('获取到可用解析器:', enabledParsers)
    return enabledParsers
  } catch (error) {
    console.error('获取解析器列表失败:', error)
    availableParsers.value = []
    return []
  }
}

// 使用选定的解析器执行解析
const executeParsingWithSelectedParser = async (parser, data) => {
  if (!parser || !data) {
    throw new Error('解析器或数据无效')
  }
  
  console.log('🎬🎬🎬 [真正解析开始] 这是真正的解析，不是测试！')
  console.log('🎬 [真正解析] 开始执行解析:', { 
    parser: parser.name, 
    data,
    dataType: typeof data,
    hasJxFlag: data && typeof data === 'object' && data.jx === 1,
    dataUrl: data && typeof data === 'object' ? data.url : data,
    isTestData: data && typeof data === 'object' && data.url === 'https://example.com/test.mp4'
  })
  
  // 标准化解析器类型：将数字类型转换为字符串类型
  const normalizedParser = {
    ...parser,
    type: parser.type === '0' ? 'sniffer' : parser.type === '1' ? 'json' : parser.type
  }
  
  console.log('🔧 [类型转换] 原始类型:', parser.type, '转换后类型:', normalizedParser.type)
  
  // 验证解析器配置
  const validation = ParserService.validateParserConfig(normalizedParser)
  if (!validation.valid) {
    const errorMessage = '解析器配置无效: ' + validation.errors.join(', ')
    console.error(errorMessage)
    Message.error(errorMessage)
    throw new Error(errorMessage)
  }
  
  try {
    let result
    
    if (normalizedParser.type === 'json') {
      // JSON类型解析
      console.log('🎬 [真正解析] 调用JSON解析器，传递数据:', data)
      result = await ParserService.parseWithJsonParser(normalizedParser, data)
    } else if (normalizedParser.type === 'sniffer') {
      // 嗅探类型解析 - 使用配置的代理嗅探接口
      console.log('🎬 [真正解析] 调用代理嗅探接口，传递数据:', data)
      
      // 导入嗅探服务
      const { sniffVideoWithConfig } = await import('@/api/services/sniffer.js')
      
      // 提取要嗅探的URL
      let targetUrl
      if (data && typeof data === 'object') {
        targetUrl = data.url || data.play_url || data
      } else {
        targetUrl = data
      }
      
      if (!targetUrl || typeof targetUrl !== 'string') {
        throw new Error('无效的嗅探目标URL')
      }
      
      // 构建完整的解析地址：解析器URL + 被解析URL
      const fullParseUrl = normalizedParser.url + encodeURIComponent(targetUrl)
      
      console.log('🔍 [嗅探解析] 解析器URL:', normalizedParser.url)
      console.log('🔍 [嗅探解析] 被解析URL:', targetUrl)
      console.log('🔍 [嗅探解析] 完整解析地址:', fullParseUrl)
      
      // 调用代理嗅探接口，传入完整的解析地址
      const sniffResult = await sniffVideoWithConfig(fullParseUrl)
      
      if (sniffResult.success && sniffResult.data && sniffResult.data.length > 0) {
        // 转换嗅探结果为解析器格式
        const videoData = sniffResult.data[0] // 取第一个结果
        result = {
          success: true,
          url: videoData.url,
          headers: {
            'Referer': fullParseUrl,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          qualities: [],
          message: '嗅探解析成功'
        }
      } else {
        throw new Error('嗅探未找到可播放的视频链接')
      }
    } else {
      throw new Error(`不支持的解析器类型: ${normalizedParser.type}`)
    }
    
    if (result && result.success) {
      // 解析成功，更新播放数据
      parsedVideoUrl.value = result.url
      parsedHeaders.value = result.headers || {}
      
      // 处理多画质数据
      if (result.qualities && result.qualities.length > 0) {
        parsedQualities.value = result.qualities
        hasMultipleQualities.value = true
        initialQuality.value = result.qualities[0].name
      } else {
        parsedQualities.value = []
        hasMultipleQualities.value = false
        initialQuality.value = ''
      }
      
      // 启动播放器
      showVideoPlayer.value = true
      Message.success(`解析成功，开始播放: ${currentEpisodeName.value}`)
      
      console.log('解析完成:', result)
    } else {
      throw new Error(result?.message || '解析失败')
    }
  } catch (error) {
    console.error('解析执行失败:', error)
    throw error
  }
}

const selectEpisode = async (index) => {
  currentEpisode.value = index
  
  // 获取当前选集的URL和线路信息
  const episodeUrl = currentRouteEpisodes.value[index]?.url
  const routeName = playRoutes.value[currentRoute.value]?.name
  
  if (!episodeUrl) {
    console.log('选集URL为空，无法播放')
    Message.error('选集URL为空，无法播放')
    return
  }

  try {
    console.log('开始解析选集播放地址:', { 
      episodeUrl, 
      routeName, 
      isPushMode: isPushMode.value,
      currentActiveSite: currentActiveSiteInfo.value?.key,
      originalSite: currentSiteInfo.value?.key
    })
    
    // 检测选集URL本身是否为push://协议
    if (episodeUrl.startsWith('push://')) {
      console.log('🚀🚀🚀 选集URL本身为push://协议，直接处理推送逻辑:', episodeUrl)
      await handlePushProtocol(episodeUrl, routeName)
      return
    }
    
    Message.info('正在解析播放地址...')
    
    // 调用T4播放API进行解析
    const parseParams = {
      play: episodeUrl,
      flag: routeName,
      apiUrl: currentActiveSiteInfo.value.api,
      extend: currentActiveSiteInfo.value.ext
    }
    
    const parseResult = await videoService.parseEpisodePlayUrl(currentActiveSiteInfo.value.key, parseParams)
    console.log('选集播放解析结果:', parseResult)
    
    // 检测T4播放API返回结果是否为push://协议
    if (parseResult.url && parseResult.url.startsWith('push://')) {
      console.log('🚀🚀🚀 T4播放API返回push://协议，开始处理推送逻辑:', parseResult.url)
      await handlePushProtocol(parseResult.url, parseResult.flag)
      return
    }
    
    // 根据解析结果处理播放
     if (parseResult.playType === 'direct') {
       // parse:0 - 直链播放
       // 检查是否为小说内容
       if (parseResult.url && parseResult.url.startsWith('novel://')) {
         console.log('检测到小说内容:', parseResult.url)
         try {
           // 解析小说内容
           const novelData = parseResult.url.replace('novel://', '')
           const novelContent = JSON.parse(novelData)
           
           console.log('解析小说内容成功:', novelContent)
           
           // 设置小说内容并显示阅读器
           parsedNovelContent.value = {
             title: novelContent.title || currentEpisodeName.value,
             content: novelContent.content || '',
             chapterIndex: index,
             totalChapters: currentRouteEpisodes.value.length
           }
           
           // 关闭视频播放器和漫画阅读器，显示小说阅读器
           showVideoPlayer.value = false
           showComicReader.value = false
           showBookReader.value = true
           
           Message.success(`开始阅读: ${novelContent.title || currentEpisodeName.value}`)
         } catch (error) {
           console.error('解析小说内容失败:', error)
           Message.error('解析小说内容失败')
         }
       } else if (parseResult.url && parseResult.url.startsWith('pics://')) {
         console.log('检测到漫画内容:', parseResult.url)
         try {
           // 解析漫画内容
           const comicData = parseResult.url.replace('pics://', '')
           const imageUrls = comicData.split('&&').filter(url => url.trim())
           
           console.log('解析漫画内容成功:', imageUrls)
           
           // 设置漫画内容并显示阅读器
           parsedComicContent.value = {
             title: currentEpisodeName.value,
             images: imageUrls,
             chapterIndex: index,
             totalChapters: currentRouteEpisodes.value.length
           }
           
           // 关闭视频播放器和小说阅读器，显示漫画阅读器
           showVideoPlayer.value = false
           showBookReader.value = false
           showComicReader.value = true
           
           Message.success(`开始看漫画: ${currentEpisodeName.value}`)
         } catch (error) {
           console.error('解析漫画内容失败:', error)
           Message.error('解析漫画内容失败')
         }
       } else {
         // 普通视频内容
         console.log('启动内置播放器播放直链视频:', parseResult.url)
         console.log('T4解析结果headers:', parseResult.headers)
         console.log('T4解析结果danmaku:', parseResult.danmaku)
         console.log('T4解析结果画质信息:', parseResult.qualities, parseResult.hasMultipleQualities)
         
         parsedVideoUrl.value = parseResult.url
         // 提取并存储headers，如果没有headers则使用空对象
         parsedHeaders.value = parseResult.headers || {}
         // 提取并存储弹幕链接，如果没有danmaku则使用空字符串
         parsedDanmakuUrl.value = parseResult.danmaku || ''
         // 提取并存储画质信息
         parsedQualities.value = parseResult.qualities || []
         hasMultipleQualities.value = parseResult.hasMultipleQualities || false
         // 设置初始画质：统一使用name字段
         if (parseResult.qualities && parseResult.qualities.length > 0) {
           initialQuality.value = parseResult.qualities[0].name || ''
         } else {
           initialQuality.value = ''
         }
         
         parsedNovelContent.value = null
         parsedComicContent.value = null
         showBookReader.value = false
         showComicReader.value = false
         showVideoPlayer.value = true
         Message.success(`开始播放: ${currentEpisodeName.value}`)
       }
     } else if (parseResult.playType === 'sniff') {
       // parse:1 - 需要嗅探
       console.log('需要嗅探播放:', parseResult)
       
       // 检查嗅探功能是否启用
       if (!isSnifferEnabled()) {
         // 清空解析URL、headers、画质数据和小说内容，不启动播放器
         parsedVideoUrl.value = ''
         parsedHeaders.value = {}
         parsedQualities.value = []
         hasMultipleQualities.value = false
         initialQuality.value = ''
         parsedNovelContent.value = null
         showBookReader.value = false
         
         // 显示嗅探配置提示弹窗
         parseDialogConfig.value = {
           title: '嗅探功能未启用',
           message: '该视频需要嗅探才能播放，请先在设置中配置嗅探器接口。',
           type: 'sniff'
         }
         showParseDialog.value = true
       } else {
         // 执行嗅探，传递原始的T4数据（parseResult.data）
         const sniffSuccess = await sniffVideoUrl(parseResult.data)
         if (!sniffSuccess) {
           // 嗅探失败，已在sniffVideoUrl函数中通过Message.error显示错误信息
           // 不需要额外的弹窗处理
         }
       }
     } else if (parseResult.playType === 'parse') {
       // jx:1 - 需要解析
       console.log('需要解析播放:', parseResult)
       
       // 设置解析状态
       needsParsing.value = true
       parseData.value = parseResult.data
       
       // 获取可用解析器
       const parsers = await getAvailableParsers()
       
       if (parsers.length === 0) {
         // 没有可用解析器，显示提示
         parseDialogConfig.value = {
           title: '播放提示',
           message: '该视频需要解析才能播放，但未配置可用的解析器。请前往解析器页面配置解析器。',
           type: 'parse'
         }
         showParseDialog.value = true
         needsParsing.value = false
         parseData.value = null
       } else {
         // 有可用解析器，尝试使用上次选择的解析器或第一个解析器
         let defaultParser = null
         
         // 尝试从本地存储获取上次选择的解析器
         try {
           const savedParser = localStorage.getItem('selectedParser')
           if (savedParser) {
             try {
               // 尝试解析为JSON对象（新格式）
               const parsedSavedParser = JSON.parse(savedParser)
               defaultParser = parsers.find(p => p.id === parsedSavedParser.id)
             } catch (jsonError) {
               // 如果JSON解析失败，尝试作为字符串ID处理（旧格式兼容）
               console.warn('JSON解析失败，尝试作为解析器ID处理:', savedParser)
               defaultParser = parsers.find(p => p.id === savedParser)
               console.log('defaultParser:',defaultParser)
               
               // 如果找到了解析器，更新为新格式
               if (defaultParser) {
                 localStorage.setItem('selectedParser', JSON.stringify(defaultParser))
               }
             }
           }
         } catch (error) {
           console.warn('获取保存的解析器失败:', error)
           // 清除无效的本地存储数据
           localStorage.removeItem('selectedParser')
         }
         
         // 如果没有保存的解析器或保存的解析器不可用，使用第一个解析器
         if (!defaultParser) {
           defaultParser = parsers[0]
         }
         
         selectedParser.value = defaultParser
         
         // 清空之前的播放数据
         parsedVideoUrl.value = ''
         parsedHeaders.value = {}
         parsedQualities.value = []
         hasMultipleQualities.value = false
         initialQuality.value = ''
         parsedNovelContent.value = null
         showBookReader.value = false
         showComicReader.value = false
         
         // 启动播放器（解析器选择器会在播放器头部显示）
         showVideoPlayer.value = true
         
         Message.info(`检测到需要解析的视频，请在播放器中选择解析器`)
       }
     } else {
       // 其他情况，回退到原始播放方式
       console.log('使用原始播放方式:', episodeUrl)
       parsedVideoUrl.value = ''
       parsedHeaders.value = {}
       parsedQualities.value = []
       hasMultipleQualities.value = false
       initialQuality.value = ''
       parsedNovelContent.value = null
       showBookReader.value = false
       showVideoPlayer.value = true
       Message.success(`开始播放: ${currentEpisodeName.value}`)
     }
  } catch (error) {
     console.error('解析选集播放地址失败:', error)
     Message.error('解析播放地址失败，请稍后重试')
     
     // 解析失败时回退到原始播放方式
     console.log('回退到原始播放方式:', episodeUrl)
     parsedVideoUrl.value = ''
     parsedHeaders.value = {}
     parsedQualities.value = []
     hasMultipleQualities.value = false
     initialQuality.value = ''
     parsedNovelContent.value = null
     showBookReader.value = false
     showVideoPlayer.value = true
     Message.warning(`播放可能不稳定: ${currentEpisodeName.value}`)
   }
  
  // 添加到历史记录
  if (videoDetail.value && currentRouteEpisodes.value[index]) {
    const videoInfo = {
      id: originalVideoInfo.value.id,
      name: originalVideoInfo.value.name || videoDetail.value.vod_name || '',
      pic: originalVideoInfo.value.pic || videoDetail.value.vod_pic || '',
      year: originalVideoInfo.value.year || videoDetail.value.vod_year || '',
      area: originalVideoInfo.value.area || videoDetail.value.vod_area || '',
      type: originalVideoInfo.value.type || videoDetail.value.vod_type || '',
      type_name: originalVideoInfo.value.type_name || videoDetail.value.type_name || '',
      remarks: originalVideoInfo.value.remarks || videoDetail.value.vod_remarks || '',
      api_info: {
        module: currentSiteInfo.value.key,
        api_url: currentSiteInfo.value.api,
        site_name: currentSiteInfo.value.name,
        ext: currentSiteInfo.value.ext || null  // 添加站源扩展配置
      }
    }
    
    const routeInfo = {
      name: playRoutes.value[currentRoute.value]?.name || '',
      index: currentRoute.value
    }
    
    const episodeInfo = {
      name: currentRouteEpisodes.value[index].name,
      index: index,
      url: currentRouteEpisodes.value[index].url
    }
    
    // 调试：检查添加历史记录时的ext参数
    console.log('=== 添加历史记录调试 ===')
    console.log('currentSiteInfo.value.ext:', currentSiteInfo.value.ext)
    console.log('videoInfo.api_info.ext:', videoInfo.api_info.ext)
    console.log('=== 调试结束 ===')
    
    historyStore.addToHistory(videoInfo, routeInfo, episodeInfo)
  }
}

// 处理push://协议
const handlePushProtocol = async (pushUrl, flagName) => {
  try {
    console.log('🚀🚀🚀 开始处理push://协议:', pushUrl)
    Message.info('正在处理推送链接...')
    
    // 提取push://后面的内容
    const pushContent = pushUrl.replace('push://', '').trim()
    console.log('提取的推送内容:', pushContent)
    
    // 设置推送模式
    isPushMode.value = true
    // 设置推送覆盖标记，表示数据已被推送覆盖，下次进入需要强制刷新
    hasPushOverride.value = true
    console.log('🚀 [推送操作] 已设置推送覆盖标记:', {
      hasPushOverride: hasPushOverride.value,
      isPushMode: isPushMode.value,
      timestamp: new Date().toLocaleTimeString()
    })
    
    // 获取push_agent源
    const pushAgentSite = siteService.getAllSites().find(site => site.key === 'push_agent')
    if (!pushAgentSite) {
      throw new Error('未找到push_agent源，请检查源配置')
    }
    
    console.log('找到push_agent源:', pushAgentSite)
    
    // 更新当前活跃源信息为push_agent
    currentActiveSiteInfo.value = pushAgentSite
    
    // 调用push_agent源的详情接口
    console.log('调用push_agent详情接口，参数:', {
      module: pushAgentSite.key,
      videoId: pushContent,
      apiUrl: pushAgentSite.api,
      extend: pushAgentSite.ext
    })
    const pushDetailResult = await videoService.getVideoDetails(
      pushAgentSite.key,
      pushContent,
      pushAgentSite.api,
      false,
      pushAgentSite.ext
    )
    console.log('push_agent详情接口返回结果:', pushDetailResult)
    
    if (!pushDetailResult || !pushDetailResult.vod_play_from || !pushDetailResult.vod_play_url) {
      throw new Error('push_agent源返回的数据格式不正确，缺少播放信息')
    }
    
    // 更新当前详情页的线路和选集数据
    videoDetail.value.vod_play_from = pushDetailResult.vod_play_from
    videoDetail.value.vod_play_url = pushDetailResult.vod_play_url
    
    // 更新其他必要的详情数据（只保留播放相关的核心字段）
    const updatedFields = []
    
    // 只更新播放相关的核心字段，避免显示过多不必要的属性
    const allowedFields = {
      'vod_content': '剧情简介',
      'vod_id': '视频ID', 
      'vod_pic': '封面图片',
      'vod_name': '视频名称',
      'vod_remarks': '备注信息',
      'vod_actor': '演员',
      'vod_director': '导演',
      'vod_year': '年份',
      'vod_area': '地区',
      'vod_lang': '语言',
      'vod_class': '分类'
    }
    
    Object.keys(allowedFields).forEach(field => {
      if (pushDetailResult[field] !== undefined && pushDetailResult[field] !== null && pushDetailResult[field] !== '') {
        videoDetail.value[field] = pushDetailResult[field]
        updatedFields.push(allowedFields[field])
      }
    })
    
    // 重置当前线路和选集
    currentRoute.value = 0
    currentEpisode.value = 0
    
    console.log('推送数据更新完成，新的播放信息:', {
      vod_play_from: videoDetail.value.vod_play_from,
      vod_play_url: videoDetail.value.vod_play_url,
      updatedFields: updatedFields
    })
    
    const updateMessage = updatedFields.length > 0 
      ? `推送成功: ${flagName || '未知来源'} (已更新: ${updatedFields.join('、')})`
      : `推送成功: ${flagName || '未知来源'}`
    Message.success(updateMessage)
    
  } catch (error) {
    console.error('处理push://协议失败:', error)
    Message.error(`推送失败: ${error.message}`)
    
    // 推送失败时重置推送状态和源信息
    isPushMode.value = false
    currentActiveSiteInfo.value = currentSiteInfo.value
  }
}

// 嗅探视频链接
const sniffVideoUrl = async (parseDataOrUrl) => {
  let loadingMessage = null
  
  try {
    // 检查嗅探功能是否启用
    if (!isSnifferEnabled()) {
      throw new Error('嗅探功能未启用，请在设置中配置嗅探器')
    }

    sniffing.value = true
    sniffResults.value = []
    
    // 使用全局消息提示，设置duration为0让消息持续显示直到手动关闭
    loadingMessage = Message.info({
      content: '正在全力嗅探中，请稍等...',
      duration: 0
    })

    console.log('开始嗅探视频链接:', parseDataOrUrl)
    
    // 检查是否是T4解析数据格式
    let sniffData
    if (typeof parseDataOrUrl === 'object' && parseDataOrUrl.parse === 1) {
      // T4解析数据格式，直接使用
      sniffData = parseDataOrUrl
      console.log('使用T4解析数据进行嗅探:', sniffData)
    } else {
      // 普通URL格式
      sniffData = typeof parseDataOrUrl === 'string' ? parseDataOrUrl : parseDataOrUrl.toString()
      console.log('使用普通URL进行嗅探:', sniffData)
    }

    // 调用嗅探服务
    const result = await sniffVideoWithConfig(sniffData, {
      mode: '0', // 单个链接模式
      is_pc: '0' // 移动设备模式
    })

    console.log('嗅探结果:', result)

    if (result.success && result.data) {
      // 处理不同的返回格式
      let videoData
      let videoCount
      
      if (Array.isArray(result.data)) {
        // 多个链接模式：返回数组
        if (result.data.length === 0) {
          throw new Error('嗅探失败，未找到有效的视频链接')
        }
        videoData = result.data
        videoCount = result.data.length
        sniffResults.value = result.data
      } else if (result.data.url) {
        // 单个链接模式：返回单个对象
        videoData = [result.data] // 转换为数组格式以保持一致性
        videoCount = 1
        sniffResults.value = videoData
      } else {
        throw new Error('嗅探结果格式无效')
      }
      
      // 关闭loading消息
      loadingMessage.close()
      
      // 自动选择第一个链接进行播放
      const firstVideo = videoData[0]
      if (firstVideo && firstVideo.url) {
        console.log('使用嗅探到的第一个链接:', firstVideo.url)
        parsedVideoUrl.value = firstVideo.url
        parsedNovelContent.value = null
        parsedComicContent.value = null
        showBookReader.value = false
        showComicReader.value = false
        showVideoPlayer.value = true
        
        Message.success(`嗅探成功，开始播放: ${currentEpisodeName.value}`)
        return true
      } else {
        throw new Error('嗅探到的链接无效')
      }
    } else {
      throw new Error(result.message || '嗅探失败，未找到有效的视频链接')
    }

  } catch (error) {
    console.error('嗅探失败:', error)
    // 关闭loading消息（如果存在）
    if (loadingMessage) {
      loadingMessage.close()
    }
    Message.error(`嗅探失败: ${error.message}`)
    return false
  } finally {
    sniffing.value = false
  }
}

const playVideo = async () => {
  // 检查是否有历史记录
  const videoId = originalVideoInfo.value.id
  const apiUrl = currentSiteInfo.value.api
  
  if (videoId && apiUrl) {
    const historyItem = historyStore.getHistoryByVideo(videoId, apiUrl)
    
    if (historyItem) {
      console.log('发现历史记录，播放历史位置:', historyItem)
      
      // 查找历史记录对应的线路和选集
      const routes = playRoutes.value
      const targetRoute = routes.find(route => route.name === historyItem.current_route_name)
      
      if (targetRoute) {
        const routeIndex = routes.indexOf(targetRoute)
        currentRoute.value = routeIndex
        
        // 等待currentRouteEpisodes更新后查找选集
        await nextTick()
        const episodes = currentRouteEpisodes.value
        const targetEpisode = episodes.find(ep => ep.name === historyItem.current_episode_name)
        
        if (targetEpisode) {
          const episodeIndex = episodes.indexOf(targetEpisode)
          // 调用selectEpisode进行T4解析
          await selectEpisode(episodeIndex)
        } else {
          console.warn('未找到历史选集，播放第一个选集')
          await playFirstEpisode()
        }
      } else {
        console.warn('未找到历史线路，播放第一个选集')
        await playFirstEpisode()
      }
    } else {
      console.log('无历史记录，播放第一个选集')
      await playFirstEpisode()
    }
  } else {
    await playFirstEpisode()
  }
}

// 智能查找第一个m3u8选集
const findFirstM3u8Episode = () => {
  console.log('开始智能查找第一个m3u8选集...')
  
  // 遍历所有线路
  for (let routeIndex = 0; routeIndex < playRoutes.value.length; routeIndex++) {
    const route = playRoutes.value[routeIndex]
    console.log(`检查线路 ${routeIndex}: ${route.name}`)
    
    // 遍历当前线路的所有选集
    for (let episodeIndex = 0; episodeIndex < route.episodes.length; episodeIndex++) {
      const episode = route.episodes[episodeIndex]
      
      // 检查URL是否包含m3u8
      if (episode.url && episode.url.toLowerCase().includes('.m3u8')) {
        console.log(`找到第一个m3u8选集: 线路${routeIndex} - ${episode.name}`)
        return {
          routeIndex,
          episodeIndex,
          route: route.name,
          episode: episode.name,
          url: episode.url
        }
      }
    }
  }
  
  console.log('未找到m3u8选集，将使用默认选集')
  return null
}

const playFirstEpisode = async () => {
  // 首先尝试智能查找第一个m3u8选集
  const m3u8Episode = findFirstM3u8Episode()
  
  if (m3u8Episode) {
    // 找到m3u8选集，播放该选集
    console.log(`智能播放m3u8选集: ${m3u8Episode.route} - ${m3u8Episode.episode}`)
    currentRoute.value = m3u8Episode.routeIndex
    
    await nextTick()
    // 调用selectEpisode进行T4解析
    await selectEpisode(m3u8Episode.episodeIndex)
  } else {
    // 未找到m3u8选集，播放第一个线路的第一个选集（默认行为）
    if (playRoutes.value.length > 0) {
      currentRoute.value = 0
      
      await nextTick()
      if (currentRouteEpisodes.value.length > 0) {
        // 调用selectEpisode进行T4解析
        await selectEpisode(0)
      }
    }
  }
}

const updateHistoryRecord = () => {
  // 添加到历史记录
  if (videoDetail.value && currentRouteEpisodes.value[currentEpisode.value]) {
    const videoInfo = {
      id: originalVideoInfo.value.id,
      name: originalVideoInfo.value.name || videoDetail.value.vod_name || '',
      pic: originalVideoInfo.value.pic || videoDetail.value.vod_pic || '',
      year: originalVideoInfo.value.year || videoDetail.value.vod_year || '',
      area: originalVideoInfo.value.area || videoDetail.value.vod_area || '',
      type: originalVideoInfo.value.type || videoDetail.value.vod_type || '',
      type_name: originalVideoInfo.value.type_name || videoDetail.value.type_name || '',
      remarks: originalVideoInfo.value.remarks || videoDetail.value.vod_remarks || '',
      api_info: {
        module: currentSiteInfo.value.key,
        api_url: currentSiteInfo.value.api,
        site_name: currentSiteInfo.value.name,
        ext: currentSiteInfo.value.ext || null  // 添加站源扩展配置
      }
    }
    
    const routeInfo = {
      name: playRoutes.value[currentRoute.value]?.name || '',
      index: currentRoute.value
    }
    
    const episodeInfo = {
      name: currentRouteEpisodes.value[currentEpisode.value].name,
      index: currentEpisode.value,
      url: currentRouteEpisodes.value[currentEpisode.value].url
    }
    
    // 调试：检查更新历史记录时的ext参数
    console.log('=== 更新历史记录调试 ===')
    console.log('currentSiteInfo.value.ext:', currentSiteInfo.value.ext)
    console.log('videoInfo.api_info.ext:', videoInfo.api_info.ext)
    console.log('=== 调试结束 ===')
    
    historyStore.addToHistory(videoInfo, routeInfo, episodeInfo)
  }
}

const copyPlayUrl = async () => {
  if (currentEpisodeUrl.value) {
    try {
      await navigator.clipboard.writeText(currentEpisodeUrl.value)
      Message.success('链接已复制到剪贴板')
    } catch (err) {
      Message.error('复制失败')
    }
  }
}

// 显示下载对话框
const showDownloadDialog = () => {
  showDownloadTaskDialog.value = true
}

// 关闭下载对话框
const closeDownloadDialog = () => {
  showDownloadTaskDialog.value = false
}

// 确认下载任务
const handleDownloadConfirm = async (taskData) => {
  try {
    console.log('确认下载任务:', taskData)
    
    // 准备小说信息
    const novelInfo = {
      title: taskData.novelDetail.vod_name,
      id: taskData.novelDetail.vod_id,
      url: currentEpisodeUrl.value || '',
      author: taskData.novelDetail.vod_actor || '未知',
      description: taskData.novelDetail.vod_content || '',
      cover: taskData.novelDetail.vod_pic || '' // 添加封面图片
    }
    
    // 准备选中的章节信息
    const selectedChapters = taskData.selectedChapters.map(index => {
      const chapter = taskData.chapters[index]
      return {
        name: chapter.name || `第${index + 1}章`,
        url: chapter.url || chapter.vod_play_url || '',
        index: index
      }
    })
    
    // 准备下载设置，包含必要的站点信息
    const downloadSettings = {
      ...taskData.settings,
      module: currentActiveSiteInfo.value?.key || '',
      apiUrl: currentActiveSiteInfo.value?.api || '',
      extend: currentActiveSiteInfo.value?.ext || '',
      flag: playRoutes.value[currentRoute.value]?.name || ''
    }
    
    console.log('下载设置:', downloadSettings)
    console.log('当前站点信息:', currentActiveSiteInfo.value)
    
    // 创建下载任务
    const task = downloadService.createTask(novelInfo, selectedChapters, downloadSettings)
    
    // 开始下载任务
    await downloadService.startTask(task.id)
    
    Message.success(`下载任务已创建：${taskData.novelDetail.vod_name}`)
    closeDownloadDialog()
    
  } catch (error) {
    console.error('创建下载任务失败:', error)
    Message.error('创建下载任务失败：' + error.message)
  }
}

// 监听路由变化（包括参数和查询参数）
watch(() => [route.params.id, route.query], () => {
  if (route.params.id) {
    console.log('🔍 [params监听器] 检测到路由变化，重新加载视频详情:', {
      id: route.params.id,
      fromCollection: route.query.fromCollection,
      name: route.query.name,
      folderState: route.query.folderState,
      timestamp: new Date().toLocaleTimeString()
    })
    
    // 保存初始的folderState（仅在首次加载时保存）
    if (route.query.folderState && !initialFolderState.value) {
      try {
        initialFolderState.value = route.query.folderState;
      } catch (error) {
        console.error('VideoDetail保存folderState失败:', error);
      }
    }
    
    loadVideoDetail()
  }
}, { immediate: true, deep: true })

// 监听路由完整路径变化，只在推送覆盖后才强制重新加载数据
watch(() => route.fullPath, (newPath, oldPath) => {
  console.log('🔍 [fullPath监听器] 路由fullPath变化监听器触发:', {
    newPath,
    oldPath,
    hasVideoInPath: newPath?.includes('/video/'),
    hasId: !!route.params.id,
    pathChanged: newPath !== oldPath,
    hasPushOverride: hasPushOverride.value,
    timestamp: new Date().toLocaleTimeString()
  })
  
  // fullPath监听器现在只负责记录路径变化，推送覆盖的处理交给onActivated
  if (newPath && newPath.includes('/video/') && newPath !== oldPath && route.params.id) {
    console.log('ℹ️ [fullPath监听器] 检测到路径变化，但推送覆盖处理已交给onActivated:', {
      oldPath,
      newPath,
      id: route.params.id,
      hasPushOverride: hasPushOverride.value
    })
  }
}, { immediate: true })

// 监听站点变化，换源后重新加载详情
watch(() => siteStore.nowSite, (newSite, oldSite) => {
  if (newSite && oldSite && newSite.api !== oldSite.api && route.params.id) {
    console.log('检测到站点切换，重新加载视频详情:', { 
      oldSite: oldSite?.name, 
      newSite: newSite?.name 
    })
    loadVideoDetail()
  }
}, { deep: true })





// 组件挂载时的初始化（watch已经设置了immediate: true，无需重复调用）
onMounted(async () => {
  console.log('VideoDetail组件已挂载')
  
  // 初始化解析器数据
  try {
    await getAvailableParsers()
  } catch (error) {
    console.error('初始化解析器失败:', error)
  }
})

// 组件激活时检查是否需要重新加载数据（处理缓存组件的情况）
onActivated(() => {
  console.log('🔄 [组件激活] VideoDetail组件激活:', {
    hasPushOverride: hasPushOverride.value,
    isPushMode: isPushMode.value,
    routeId: route.params.id,
    timestamp: new Date().toLocaleTimeString()
  })
  
  // 如果有推送覆盖标记，强制重新加载数据
  if (hasPushOverride.value && route.params.id) {
    console.log('✅ [组件激活] 检测到推送覆盖，强制重新加载数据')
    // 注意：不要在这里清除推送覆盖标记，让用户手动清除或在适当的时机清除
    // 这样可以保持推送覆盖状态，直到用户明确要恢复原始数据
    loadVideoDetail()
  } else {
    console.log('ℹ️ [组件激活] 未检测到推送覆盖标记，跳过强制重新加载:', {
      hasPushOverride: hasPushOverride.value,
      hasRouteId: !!route.params.id,
      routeId: route.params.id,
      condition1: hasPushOverride.value,
      condition2: !!route.params.id,
      bothConditions: hasPushOverride.value && route.params.id
    })
  }
})

// 组件卸载时清理资源
onUnmounted(() => {
  console.log('VideoDetail组件卸载')
  // 注意：不要在这里清理推送覆盖状态，因为用户可能会返回详情页
  // 推送覆盖状态应该由用户手动清除或在明确的时机清除
  console.log('🔄 [状态清理] 组件卸载，保留推送覆盖状态以便用户返回时恢复')
})
</script>

<style scoped>
.video-detail {
  min-height: 100%;
  background: var(--color-bg-1);
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: var(--color-bg-2);
  border-bottom: 1px solid var(--color-border-2);
  position: sticky;
  top: 0;
  z-index: 100;
}

.detail-header .left-section {
  display: flex;
  align-items: center;
  flex: 1;
}

.back-btn {
  margin-right: 16px;
  flex-shrink: 0;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-1);
  flex: 1;
  min-width: 0;
}

.title-with-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.title-main {
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.title-source {
  font-size: 12px;
  color: var(--color-text-3);
  font-weight: normal;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.favorite-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 100px;
  justify-content: center;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 16px;
}

.loading-text {
  color: var(--color-text-2);
  font-size: 14px;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 16px;
}

.detail-content {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}



.video-info-card {
  margin-bottom: 24px;
  transition: all 0.3s ease;
}

/* 当播放器显示时折叠视频信息卡片 */
.video-info-card.collapsed-when-playing {
  margin-bottom: 16px;
}

.video-info-card.collapsed-when-playing .video-header {
  margin-bottom: 12px;
}

.video-info-card.collapsed-when-playing .video-poster {
  width: 120px;
  height: 168px;
}

.video-info-card.collapsed-when-playing .video-info {
  gap: 8px;
}

.video-info-card.collapsed-when-playing .title-main {
  font-size: 18px;
  line-height: 1.3;
}

.video-info-card.collapsed-when-playing .video-meta {
  gap: 8px;
}

.video-info-card.collapsed-when-playing .meta-item {
  font-size: 12px;
  padding: 2px 6px;
}

.video-info-card.collapsed-when-playing .video-description {
  margin-top: 12px;
}

.video-info-card.collapsed-when-playing .video-description h3 {
  font-size: 14px;
  margin-bottom: 8px;
}

.video-info-card.collapsed-when-playing .description-content {
  font-size: 13px;
  line-height: 1.4;
  max-height: 60px;
  overflow: hidden;
}

.video-info-card.collapsed-when-playing .description-content.expanded {
  max-height: none;
}

.video-info-card.collapsed-when-playing .play-actions {
  gap: 8px;
}

.video-info-card.collapsed-when-playing .play-btn,
.video-info-card.collapsed-when-playing .copy-btn {
  height: 32px;
  font-size: 13px;
}

.video-header {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.video-poster {
  flex-shrink: 0;
  width: 200px;
  aspect-ratio: 5 / 7;
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-bg-3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  position: relative;
  cursor: pointer;
}

.video-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.poster-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.video-poster:hover .poster-overlay {
  opacity: 1;
}

.poster-overlay .view-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.poster-overlay span {
  font-size: 14px;
}

.video-meta {
  flex: 1;
}

.video-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-1);
  margin: 0 0 16px 0;
  line-height: 1.3;
}

.video-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.mobile-detail-actions {
  display: none;
}

.video-info-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: flex-start;
}

.info-item .label {
  font-weight: 600;
  color: var(--color-text-2);
  min-width: 60px;
  flex-shrink: 0;
}

.info-item .value {
  color: var(--color-text-1);
  line-height: 1.5;
}

.video-description {
  border-top: 1px solid var(--color-border-2);
  padding-top: 24px;
}

.video-description h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-1);
  margin: 0 0 16px 0;
}

.description-content {
  color: var(--color-text-1);
  line-height: 1.6;
  max-height: 120px;
  overflow: hidden;
  transition: max-height 0.3s ease;
  white-space: pre-wrap; /* 支持换行符显示 */
  word-wrap: break-word; /* 长单词自动换行 */
}

.description-content.expanded {
  max-height: none;
}

.expand-btn {
  margin-top: 8px;
  padding: 0;
}

.play-section {
  margin-bottom: 24px;
}

.play-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-1);
  margin: 0 0 16px 0;
}

.route-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.route-btn {
  min-width: 120px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.route-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.route-name {
  flex: 1;
  text-align: center;
}

.route-badge {
  flex-shrink: 0;
}

.episodes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.episodes-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-1);
  margin: 0;
}

.episodes-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sort-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-2);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.sort-btn:hover {
  color: var(--color-text-1);
  background-color: var(--color-bg-2);
}

.strategy-select, .layout-select {
  border-radius: 6px;
}

.strategy-select :deep(.arco-select-view-single), 
.layout-select :deep(.arco-select-view-single) {
  background-color: transparent;
  border: none;
  color: var(--color-text-2);
  font-size: 12px;
  padding: 4px 8px;
  min-height: 28px;
  white-space: nowrap;
  overflow: visible;
}

.strategy-select :deep(.arco-select-view-single):hover, 
.layout-select :deep(.arco-select-view-single):hover {
  background-color: var(--color-bg-2);
  color: var(--color-text-1);
}

.strategy-select :deep(.arco-select-view-value), 
.layout-select :deep(.arco-select-view-value) {
  overflow: visible;
  text-overflow: unset;
  white-space: nowrap;
}

.strategy-select :deep(.arco-select-view-suffix), 
.layout-select :deep(.arco-select-view-suffix) {
  margin-left: 4px;
}

.episodes-grid {
  display: grid;
  grid-template-columns: repeat(var(--episodes-columns, 12), 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.episode-btn {
  min-height: 40px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.episode-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.episode-text {
  display: block;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  padding: 0 8px;
}

.video-actions {
  margin-top: 20px;
  padding: 20px;
  background: color-mix(in srgb, var(--dp-primary-readable) 5%, var(--dp-bg-surface-muted));
  border-radius: 12px;
  border: 1px solid var(--dp-border-subtle);
}

.copy-btn {
  color: var(--dp-text-primary);
  background: var(--dp-bg-surface);
  border-color: var(--dp-border);
}

.copy-btn:hover {
  color: var(--dp-primary-readable);
  background: var(--dp-bg-hover);
  border-color: var(--dp-primary-readable);
}

.play-actions,
.action-buttons,
.action-buttons-row {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
}

.download-row {
  margin-top: 16px;
  justify-content: flex-start !important;
}

.play-btn {
  min-width: 140px;
  height: 44px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.3);
  transition: all 0.2s ease;
}

.play-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(22, 93, 255, 0.4);
}

.copy-btn {
  height: 44px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.copy-btn:hover {
  transform: translateY(-1px);
}

.download-btn {
  min-width: 140px;
  height: 44px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  box-shadow: 0 4px 12px rgba(0, 180, 42, 0.3);
  transition: all 0.2s ease;
}

.download-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 180, 42, 0.4);
}

.no-play-section {
  text-align: center;
  padding: 40px;
}

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
}

.player-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-1);
  margin: 0;
}

.player-controls {
  display: flex;
  gap: 8px;
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

/* 响应式设计 */
@media (max-width: 1200px) {
  .detail-content {
    max-width: 100%;
    padding: 20px;
  }
}

@media (max-width: 768px) {
  .detail-header {
    padding: 12px 16px;
  }
  
  .header-title {
    font-size: 14px;
  }
  
  .title-main {
    font-size: 14px;
  }
  
  .title-source {
    font-size: 11px;
  }
  
  .favorite-btn {
    min-width: 80px;
    font-size: 12px;
  }
  
  .detail-content {
    padding: 16px;
  }
  
  .video-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .video-poster {
    width: min(150px, 44vw);
    margin: 0 auto;
  }
  
  .video-title {
    font-size: 24px;
    text-align: center;
  }
  
  .route-tabs {
    gap: 8px;
  }
  
  .route-btn {
    min-width: 100px;
    height: 36px;
    font-size: 14px;
  }
  
  .episodes-grid {
    gap: 8px;
  }
  
  .episode-btn {
    min-height: 36px;
    font-size: 12px;
  }
  
  .play-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .play-btn {
    width: 100%;
    height: 40px;
    font-size: 14px;
  }
  
  .copy-btn {
    width: 100%;
    height: 40px;
  }

  /* 播放器响应式 */
  .video-player-section {
    margin-bottom: 16px;
  }

  .player-header h3 {
    font-size: 16px;
  }

  .video-player {
    min-height: 250px;
  }

  /* 折叠状态响应式 */
  .video-info-card.collapsed-when-playing .video-header {
    flex-direction: column;
    gap: 12px;
  }

  .video-info-card.collapsed-when-playing .video-poster {
    width: 100px;
    height: 140px;
    align-self: center;
  }

  .video-info-card.collapsed-when-playing .title-main {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .detail-header {
    padding: 10px 12px;
  }
  
  .header-title {
    font-size: 13px;
  }
  
  .title-main {
    font-size: 13px;
  }
  
  .favorite-btn {
    min-width: 70px;
    font-size: 11px;
  }
  
  .episodes-grid {
    gap: 8px;
  }

  /* 小屏幕播放器适配 */
  .video-player-section {
    margin-bottom: 12px;
  }

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

  /* 小屏幕折叠状态 */
  .video-info-card.collapsed-when-playing .video-poster {
    width: 80px;
    height: 112px;
  }

  .video-info-card.collapsed-when-playing .title-main {
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .video-detail {
    min-height: 100%;
    background:
      radial-gradient(circle at top right, rgba(22, 93, 255, 0.1), transparent 34%),
      var(--dp-bg-app);
  }

  .detail-header {
    display: none;
  }

  .detail-content {
    padding: 0;
    max-width: none;
  }

  .video-info-card {
    margin-bottom: 12px;
    border-radius: 24px;
    overflow: hidden;
    background: var(--dp-bg-surface);
    border-color: var(--dp-border-subtle);
    box-shadow: var(--dp-shadow-sm);
  }

  .video-info-card :deep(.arco-card-body) {
    padding: 14px;
  }

  .video-header {
    display: grid;
    grid-template-columns: 112px minmax(0, 1fr);
    gap: 14px;
    align-items: start;
    margin-bottom: 14px;
  }

  .video-poster {
    width: 112px;
    margin: 0;
    border-radius: 18px;
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18);
  }

  .video-meta {
    min-width: 0;
  }

  .video-title {
    margin: 0 0 10px;
    text-align: left;
    font-size: 21px;
    line-height: 1.24;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .video-tags {
    gap: 6px;
    margin-bottom: 8px;
  }

  .mobile-detail-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 10px;
  }

  .mobile-favorite-btn,
  .mobile-clear-push-btn {
    border-radius: 999px;
  }

  .mobile-detail-actions :deep(.arco-btn) {
    min-width: 0;
    padding: 0 10px;
  }

  .video-info-grid {
    gap: 6px;
    font-size: 12px;
  }

  .info-item {
    min-width: 0;
  }

  .info-item .label {
    min-width: 42px;
  }

  .info-item .value {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .video-actions {
    grid-column: 1 / -1;
    margin-top: 0;
    padding: 0;
    background: transparent;
    border: none;
  }

  .action-buttons-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 8px;
  }

  .play-btn,
  .copy-btn,
  .download-btn {
    width: 100%;
    min-width: 0;
    height: 40px;
    border-radius: 999px;
    font-size: 14px;
  }

  .download-row {
    margin-top: 8px;
    display: block;
  }

  .video-description {
    margin-top: 4px;
    padding-top: 14px;
  }

  .video-description h3 {
    margin-bottom: 8px;
    font-size: 15px;
  }

  .description-content {
    max-height: 84px;
    font-size: 13px;
    line-height: 1.55;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .description-content.expanded {
    max-height: 50vh;
    overflow-y: auto;
  }

  .episodes-header {
    align-items: flex-start;
    gap: 8px;
    flex-direction: column;
  }

  .episodes-controls {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 2px;
  }

  .route-tabs {
    display: flex;
    flex-wrap: nowrap;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .route-btn {
    flex: 0 0 auto;
    min-width: 104px;
    height: 36px;
    border-radius: 999px;
  }

  .episodes-grid {
    gap: 8px;
  }

  .episode-btn {
    min-height: 36px;
    border-radius: 999px;
  }

  .video-info-card.collapsed-when-playing .video-header {
    grid-template-columns: 78px minmax(0, 1fr);
    gap: 10px;
  }

  .video-info-card.collapsed-when-playing .video-poster {
    width: 78px;
    height: auto;
    align-self: start;
  }

  .video-info-card.collapsed-when-playing .video-title,
  .video-info-card.collapsed-when-playing .title-main {
    font-size: 17px;
  }
}

/* 解析提示弹窗样式 */
.parse-dialog-content {
  padding: 20px 0;
  text-align: center;
}

.parse-message {
  font-size: 16px;
  color: var(--color-text-1);
  margin-bottom: 20px;
  line-height: 1.5;
}

.parse-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background: var(--color-bg-2);
  border-radius: 8px;
  border-left: 4px solid var(--color-primary);
}

.hint-icon {
  color: var(--color-primary);
  font-size: 18px;
}

.hint-text {
  color: var(--color-text-2);
  font-size: 14px;
}

.parse-dialog-footer {
  display: flex;
  justify-content: center;
  padding-top: 16px;
}

/* 嗅探进度样式 */
.sniff-progress {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  background: var(--color-bg-2);
  border-radius: 8px;
  margin: 16px 0;
  border-left: 4px solid var(--color-warning);
}

.progress-icon {
  color: var(--color-warning);
}

.progress-text {
  color: var(--color-text-1);
  font-size: 14px;
}

/* 嗅探结果样式 */
.sniff-results {
  margin: 16px 0;
  text-align: left;
}

.results-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-1);
  margin-bottom: 12px;
}

.results-list {
  background: var(--color-bg-2);
  border-radius: 8px;
  padding: 12px;
  border-left: 4px solid var(--color-success);
}

.result-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}

.result-item:last-child {
  margin-bottom: 0;
}

.result-index {
  background: var(--color-success);
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0;
}

.result-info {
  flex: 1;
  min-width: 0;
}

.result-url {
  font-size: 12px;
  color: var(--color-text-2);
  word-break: break-all;
  line-height: 1.4;
}

.result-type {
  font-size: 11px;
  color: var(--color-text-3);
  margin-top: 2px;
}

.more-results {
  font-size: 12px;
  color: var(--color-text-3);
  text-align: center;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--color-border-2);
}

@media (max-width: 768px) {
  .detail-header {
    gap: 8px;
  }

  .detail-header .left-section,
  .header-title {
    min-width: 0;
  }

  .header-actions {
    gap: 6px;
  }

  .detail-content {
    padding: 12px;
  }

  .episodes-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .episodes-controls {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 2px;
  }

  .video-actions {
    padding: 12px;
  }

  .action-buttons,
  .action-buttons-row,
  .download-row {
    gap: 8px;
    justify-content: stretch !important;
  }

  .action-buttons :deep(.arco-btn),
  .action-buttons-row :deep(.arco-btn),
  .download-row :deep(.arco-btn) {
    flex: 1 1 120px;
  }
}

@media (max-width: 480px) {
  .detail-content {
    padding: 8px;
  }

  .video-title {
    font-size: 20px;
  }

  .route-btn {
    min-width: 0;
    flex: 1 1 calc(50% - 4px);
  }

  .video-player {
    min-height: 180px;
  }
}
</style>