<template>
  <div class="comic-reader" v-if="visible">
    <!-- 漫画阅读器头部 -->
    <ComicReaderHeader
      :chapter-name="chapterName"
      :comic-title="comicTitle"
      :visible="visible"
      :chapters="chapters"
      :current-chapter-index="currentChapterIndex"
      :reading-settings="readingSettings"
      @close="handleClose"
      @settings-change="handleShowSettings"
      @next-chapter="handleNextChapter"
      @prev-chapter="handlePrevChapter"
      @chapter-selected="handleChapterSelected"
    />

    <!-- 阅读内容区域 -->
    <div class="reader-content" :style="readerStyles">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <a-spin :size="40" />
        <div class="loading-text">正在加载漫画内容...</div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-container">
        <a-result status="error" :title="error" />
        <a-button type="primary" @click="retryLoad">重新加载</a-button>
      </div>

      <!-- 漫画内容 -->
      <div v-else-if="comicImages.length > 0" class="comic-container">
        <!-- 章节标题 -->
        <h1 class="chapter-title" :style="titleStyles">
          {{ chapterName }}
        </h1>

        <!-- 图片列表 -->
        <div class="images-container" :style="imagesContainerStyles">
          <div 
            v-for="(image, index) in comicImages" 
            :key="index"
            class="image-wrapper"
            :style="imageWrapperStyles"
          >
            <!-- 图片加载状态 -->
            <div v-if="!image.loaded && !image.error" class="image-loading">
              <a-spin :size="24" />
              <div class="loading-text">加载中...</div>
            </div>

            <!-- 图片加载错误 -->
            <div v-else-if="image.error" class="image-error">
              <icon-image />
              <div class="error-text">图片加载失败</div>
              <a-button size="small" @click="retryImage(index)">重试</a-button>
            </div>

            <!-- 图片内容 -->
            <img
              v-else
              :src="image.url"
              :alt="`第${index + 1}页`"
              class="comic-image"
              :style="imageStyles"
              @load="handleImageLoad(index)"
              @error="handleImageError(index)"
              @click="handleImageClick(index)"
            />

            <!-- 图片序号 -->
            <div class="image-index" v-if="readingSettings.showPageNumber">
              {{ index + 1 }} / {{ comicImages.length }}
            </div>
          </div>
        </div>

        <!-- 章节导航 -->
        <div class="chapter-navigation">
          <a-button 
            :disabled="currentChapterIndex <= 0" 
            @click="handlePrevChapter"
            class="nav-btn prev-btn"
            size="large"
          >
            <template #icon>
              <icon-left />
            </template>
            上一章
          </a-button>
          
          <div class="chapter-info">
            <div class="chapter-progress">
              第 {{ currentChapterIndex + 1 }} 章 / 共 {{ chapters.length }} 章
            </div>
            <div class="page-progress">
              {{ comicImages.length }} 页
            </div>
          </div>
          
          <a-button 
            :disabled="currentChapterIndex >= chapters.length - 1" 
            @click="handleNextChapter"
            class="nav-btn next-btn"
            size="large"
          >
            下一章
            <template #icon>
              <icon-right />
            </template>
          </a-button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-container">
        <a-empty description="暂无漫画内容" />
      </div>
    </div>

    <!-- 阅读设置对话框 -->
    <ComicSettingsDialog
      :visible="showSettingsDialog"
      :settings="readingSettings"
      @close="showSettingsDialog = false"
      @settings-change="handleSettingsChange"
    />

    <!-- v-viewer 图片查看器 -->
    <div v-viewer="viewerOptions" class="viewer" v-show="false">
      <img 
        v-for="(imageData, index) in viewerImageData" 
        :key="index"
        :src="imageData.src" 
        :alt="imageData.alt"
        :data-source="imageData.src"
        :title="imageData.title"
      />
    </div>


  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Message } from '@arco-design/web-vue'
import ComicReaderHeader from './ComicReaderHeader.vue'
import ComicSettingsDialog from './ComicSettingsDialog.vue'
import { IconLeft, IconRight, IconImage } from '@arco-design/web-vue/es/icon'
import videoService from '@/api/services/video'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  comicTitle: {
    type: String,
    default: ''
  },
  chapterName: {
    type: String,
    default: ''
  },
  chapters: {
    type: Array,
    default: () => []
  },
  currentChapterIndex: {
    type: Number,
    default: 0
  },
  comicDetail: {
    type: Object,
    default: () => ({})
  },
  comicContent: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits([
  'close',
  'next-chapter',
  'prev-chapter',
  'chapter-selected',
  'settings-change'
])

// 响应式数据
const loading = ref(false)
const error = ref('')
const comicImages = ref([])
const showSettingsDialog = ref(false)

// v-viewer 图片查看器相关
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

// 阅读设置
const readingSettings = ref({
  imageWidth: 800,
  imageGap: 10,
  pagePadding: 20,
  readingDirection: 'vertical',
  imageFit: 'width',
  preloadPages: 3,
  backgroundColor: '#1a1a1a',
  textColor: '#e6e6e6',
  theme: 'dark',
  showPageNumber: true
})

// 从localStorage加载阅读设置
const loadReadingSettings = () => {
  try {
    const saved = localStorage.getItem('drplayer_comic_reading_settings')
    if (saved) {
      const settings = JSON.parse(saved)
      readingSettings.value = { ...readingSettings.value, ...settings }
    }
  } catch (error) {
    console.warn('加载漫画阅读设置失败:', error)
  }
}

// 保存阅读设置到localStorage
const saveReadingSettings = () => {
  try {
    localStorage.setItem('drplayer_comic_reading_settings', JSON.stringify(readingSettings.value))
  } catch (error) {
    console.warn('保存漫画阅读设置失败:', error)
  }
}

// 阅读器样式
const readerStyles = computed(() => ({
  backgroundColor: readingSettings.value.backgroundColor,
  color: readingSettings.value.textColor,
  padding: `${readingSettings.value.pagePadding}px`
}))

const titleStyles = computed(() => ({
  color: readingSettings.value.backgroundColor === '#000000' ? '#ffffff' : '#333333',
  marginBottom: `${readingSettings.value.imageGap * 2}px`
}))

const imagesContainerStyles = computed(() => ({
  gap: `${readingSettings.value.imageGap}px`,
  flexDirection: readingSettings.value.readingDirection === 'vertical' ? 'column' : 'row'
}))

const imageWrapperStyles = computed(() => ({
  marginBottom: readingSettings.value.readingDirection === 'vertical' ? `${readingSettings.value.imageGap}px` : '0'
}))

const imageStyles = computed(() => {
  const styles = {
    maxWidth: `${readingSettings.value.imageWidth}px`,
    width: '100%',
    height: 'auto'
  }

  switch (readingSettings.value.imageFit) {
    case 'width':
      styles.width = '100%'
      styles.height = 'auto'
      break
    case 'height':
      styles.width = 'auto'
      styles.height = '100vh'
      break
    case 'contain':
      styles.objectFit = 'contain'
      break
    case 'cover':
      styles.objectFit = 'cover'
      break
  }

  return styles
})

// 解析pics://协议的内容
const parsePicsContent = (picsUrl) => {
  try {
    if (!picsUrl.startsWith('pics://')) {
      throw new Error('不是有效的漫画内容格式')
    }
    
    const imageUrlsStr = picsUrl.substring(7) // 移除 "pics://" 前缀
    const imageUrls = imageUrlsStr.split('&&').filter(url => url.trim())
    
    if (imageUrls.length === 0) {
      throw new Error('漫画内容为空')
    }
    
    return imageUrls.map((url, index) => ({
      url: url.trim(),
      loaded: false,
      error: false,
      index
    }))
  } catch (error) {
    console.error('解析漫画内容失败:', error)
    throw new Error('解析漫画内容失败: ' + error.message)
  }
}

// 从props加载漫画内容
const loadComicContentFromProps = async (comicContent) => {
  loading.value = true
  error.value = ''
  comicImages.value = []
  
  try {
    console.log('从props加载漫画内容:', comicContent)
    
    if (comicContent && comicContent.images && Array.isArray(comicContent.images)) {
      // 直接使用传入的图片URL数组
      comicImages.value = comicContent.images.map((url, index) => ({
        url: url.trim(),
        loaded: false,
        error: false,
        index
      }))
      
      // 预加载图片
      await preloadImages()
    } else {
      throw new Error('漫画内容格式错误')
    }
  } catch (err) {
    console.error('加载漫画内容失败:', err)
    error.value = err.message || '加载漫画内容失败'
    Message.error(error.value)
  } finally {
    loading.value = false
  }
}

// 加载章节内容（通过API）
const loadChapterContent = async (chapterIndex) => {
  // 如果有传入的漫画内容，优先使用
  if (props.comicContent) {
    await loadComicContentFromProps(props.comicContent)
    return
  }
  
  if (!props.chapters[chapterIndex]) {
    error.value = '章节不存在'
    return
  }
  
  loading.value = true
  error.value = ''
  comicImages.value = []
  
  try {
    const chapter = props.chapters[chapterIndex]
    console.log('加载漫画章节:', chapter)
    
    // 调用T4 API获取章节内容
    const response = await videoService.getPlayUrl(
      props.comicDetail.module,
      chapter.url,
      props.comicDetail.api_url,
      props.comicDetail.ext
    )
    
    console.log('漫画章节内容响应:', response)
    
    if (response && response.url) {
      // 解析pics://协议的内容
      const images = parsePicsContent(response.url)
      comicImages.value = images
      console.log('解析后的漫画图片:', images)
      
      // 预加载前几张图片
      await preloadImages()
    } else {
      throw new Error('获取漫画内容失败')
    }
  } catch (err) {
    console.error('加载漫画章节内容失败:', err)
    error.value = err.message || '加载漫画章节内容失败'
    Message.error(error.value)
  } finally {
    loading.value = false
  }
}

// 预加载图片
const preloadImages = async () => {
  const preloadCount = Math.min(readingSettings.value.preloadPages, comicImages.value.length)
  
  for (let i = 0; i < preloadCount; i++) {
    const image = comicImages.value[i]
    if (image && !image.loaded && !image.error) {
      try {
        await loadImage(image.url)
        image.loaded = true
      } catch (error) {
        console.warn(`预加载图片失败: ${image.url}`, error)
        image.error = true
      }
    }
  }
}

// 加载单张图片
const loadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = url
  })
}

// 图片事件处理
const handleImageLoad = (index) => {
  if (comicImages.value[index]) {
    comicImages.value[index].loaded = true
    comicImages.value[index].error = false
  }
}

const handleImageError = (index) => {
  if (comicImages.value[index]) {
    comicImages.value[index].loaded = false
    comicImages.value[index].error = true
  }
}

// 准备 v-viewer 图片数据
const prepareViewerImages = () => {
  viewerImageData.value = comicImages.value.map((image, index) => ({
    src: image.url,
    alt: `第${index + 1}页`,
    title: `${props.chapterName || '漫画'} - 第${index + 1}页`
  }))
}

const handleImageClick = (index) => {
  // 准备图片数据
  prepareViewerImages()
  
  // 使用 nextTick 确保 DOM 更新后再触发 viewer
  nextTick(() => {
    const viewerContainer = document.querySelector('.viewer')
    if (viewerContainer) {
      const images = viewerContainer.querySelectorAll('img')
      if (images[index]) {
        // 触发指定索引的图片查看器
        images[index].click()
      }
    }
  })
}

const retryImage = async (index) => {
  const image = comicImages.value[index]
  if (image) {
    image.error = false
    image.loaded = false
    
    try {
      await loadImage(image.url)
      image.loaded = true
    } catch (error) {
      image.error = true
      Message.error(`重新加载第${index + 1}页失败`)
    }
  }
}

// 重试加载
const retryLoad = () => {
  loadChapterContent(props.currentChapterIndex)
}

// 事件处理
const handleClose = () => {
  emit('close')
}

const handleNextChapter = () => {
  if (props.currentChapterIndex < props.chapters.length - 1) {
    emit('next-chapter')
  }
}

const handlePrevChapter = () => {
  if (props.currentChapterIndex > 0) {
    emit('prev-chapter')
  }
}

const handleChapterSelected = (index) => {
  emit('chapter-selected', index)
}

const handleShowSettings = (event) => {
  if (event.showDialog) {
    showSettingsDialog.value = true
  }
}

const handleSettingsChange = (newSettings) => {
  readingSettings.value = { ...readingSettings.value, ...newSettings }
  saveReadingSettings()
  emit('settings-change', readingSettings.value)
}

// 监听章节索引变化
watch(() => props.currentChapterIndex, (newIndex) => {
  if (props.visible && newIndex >= 0) {
    loadChapterContent(newIndex)
  }
}, { immediate: true })

// 监听可见性变化
watch(() => props.visible, (visible) => {
  if (visible && props.currentChapterIndex >= 0) {
    loadChapterContent(props.currentChapterIndex)
  }
})

// 监听漫画内容变化
watch(() => props.comicContent, (newContent) => {
  if (newContent && props.visible) {
    loadComicContentFromProps(newContent)
  }
}, { immediate: true })

// 键盘快捷键
const handleKeydown = (event) => {
  if (!props.visible) return
  
  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      handlePrevChapter()
      break
    case 'ArrowRight':
      event.preventDefault()
      handleNextChapter()
      break
    case 'Escape':
      event.preventDefault()
      handleClose()
      break
    case 'ArrowUp':
      event.preventDefault()
      // 向上滚动
      window.scrollBy(0, -100)
      break
    case 'ArrowDown':
      event.preventDefault()
      // 向下滚动
      window.scrollBy(0, 100)
      break
  }
}

// 组件挂载
onMounted(() => {
  loadReadingSettings()
  document.addEventListener('keydown', handleKeydown)
})

// 组件卸载
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.comic-reader {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-bg-1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.reader-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  transition: all 0.3s ease;
}

.loading-container,
.error-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
}

.loading-text {
  margin-top: 16px;
  color: var(--color-text-2);
  font-size: 14px;
}

.comic-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
}

.chapter-title {
  text-align: center;
  margin-bottom: 40px;
  font-weight: 600;
  border-bottom: 2px solid var(--color-border-2);
  padding-bottom: 20px;
}

.images-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 auto 60px;
}

.image-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 100%;
}

.comic-image {
  display: block;
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--color-border-3);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.comic-image:hover {
  transform: scale(1.02);
}

.image-loading,
.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  background: var(--color-bg-2);
  border-radius: 8px;
  color: var(--color-text-2);
  width: 100%;
  max-width: 800px;
}

.image-error {
  gap: 12px;
}

.error-text {
  font-size: 14px;
  color: var(--color-text-3);
}

.image-index {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: inherit;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.chapter-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 40px;
}

.nav-btn {
  min-width: 120px;
}

.chapter-info {
  text-align: center;
  color: inherit;
}

.chapter-progress {
  font-size: 14px;
  color: inherit;
  opacity: 0.8;
  font-weight: 500;
  margin-bottom: 4px;
}

.page-progress {
  font-size: 14px;
  color: inherit;
  opacity: 0.6;
}



/* 响应式设计 */
@media (max-width: 768px) {
  .reader-content {
    padding: 10px;
  }
  
  .comic-container {
    padding: 20px 10px;
  }
  
  .chapter-title {
    font-size: 20px;
    margin-bottom: 30px;
  }
  
  .chapter-navigation {
    flex-direction: column;
    gap: 15px;
  }
  
  .nav-btn {
    width: 100%;
    min-width: auto;
  }
}

/* v-viewer 自定义样式 */
.viewer {
  display: none;
}

/* 主题样式 */
.comic-reader[data-theme="dark"] {
  background: #1a1a1a;
}

.comic-reader[data-theme="sepia"] {
  background: #f4f1e8;
}
</style>