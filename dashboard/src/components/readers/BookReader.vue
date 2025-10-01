<template>
  <div class="book-reader" v-if="visible" :style="contentStyles">
    <!-- 阅读器头部 -->
    <ReaderHeader
      :chapter-name="chapterName"
      :book-title="bookTitle"
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
    <div class="reader-content" :style="contentStyles">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <a-spin :size="40" />
        <div class="loading-text">正在加载章节内容...</div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-container">
        <a-result status="error" :title="error" />
        <a-button type="primary" @click="retryLoad">重新加载</a-button>
      </div>

      <!-- 章节内容 -->
      <div v-else-if="chapterContent" class="chapter-container">
        <!-- 章节标题 -->
        <h1 class="chapter-title" :style="titleStyles">
          {{ chapterContent.title }}
        </h1>

        <!-- 章节正文 -->
        <div class="chapter-text" :style="textStyles" v-html="formattedContent"></div>

        <!-- 章节导航 -->
        <div class="chapter-navigation">
          <a-button 
            :disabled="currentChapterIndex <= 0" 
            @click="handlePrevChapter"
            class="nav-btn prev-btn"
          >
            <template #icon>
              <icon-left />
            </template>
            上一章
          </a-button>
          
          <span class="chapter-progress">
            {{ currentChapterIndex + 1 }} / {{ chapters.length }}
          </span>
          
          <a-button 
            :disabled="currentChapterIndex >= chapters.length - 1" 
            @click="handleNextChapter"
            class="nav-btn next-btn"
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
        <a-empty description="暂无章节内容" />
      </div>
    </div>

    <!-- 阅读设置对话框 -->
    <ReadingSettingsDialog
      :visible="showSettingsDialog"
      :settings="readingSettings"
      @close="showSettingsDialog = false"
      @settings-change="handleSettingsChange"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import ReaderHeader from './ReaderHeader.vue'
import ReadingSettingsDialog from './ReadingSettingsDialog.vue'
import { IconLeft, IconRight } from '@arco-design/web-vue/es/icon'
import videoService from '@/api/services/video'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  bookTitle: {
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
  bookDetail: {
    type: Object,
    default: () => ({})
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
const chapterContent = ref(null)
const showSettingsDialog = ref(false)

// 阅读设置
const readingSettings = ref({
  fontSize: 16,
  lineHeight: 1.8,
  fontFamily: 'system-ui',
  backgroundColor: '#ffffff',
  textColor: '#333333',
  maxWidth: 800,
  theme: 'light' // light, dark, sepia
})

// 从localStorage加载阅读设置
const loadReadingSettings = () => {
  try {
    const saved = localStorage.getItem('drplayer_reading_settings')
    if (saved) {
      const settings = JSON.parse(saved)
      readingSettings.value = { ...readingSettings.value, ...settings }
    }
  } catch (error) {
    console.warn('加载阅读设置失败:', error)
  }
}

// 保存阅读设置到localStorage
const saveReadingSettings = () => {
  try {
    localStorage.setItem('drplayer_reading_settings', JSON.stringify(readingSettings.value))
  } catch (error) {
    console.warn('保存阅读设置失败:', error)
  }
}

// 计算样式
const contentStyles = computed(() => ({
  backgroundColor: readingSettings.value.backgroundColor,
  color: readingSettings.value.textColor
}))

const titleStyles = computed(() => ({
  fontSize: `${readingSettings.value.fontSize + 4}px`,
  lineHeight: readingSettings.value.lineHeight,
  fontFamily: readingSettings.value.fontFamily,
  color: readingSettings.value.textColor
}))

const textStyles = computed(() => ({
  fontSize: `${readingSettings.value.fontSize}px`,
  lineHeight: readingSettings.value.lineHeight,
  fontFamily: readingSettings.value.fontFamily,
  maxWidth: `${readingSettings.value.maxWidth}px`,
  color: readingSettings.value.textColor
}))

// 格式化章节内容
const formattedContent = computed(() => {
  if (!chapterContent.value?.content) return ''
  
  // 将换行符转换为段落
  return chapterContent.value.content
    .split('\n')
    .filter(line => line.trim())
    .map(line => `<p>${line.trim()}</p>`)
    .join('')
})

// 解析novel://协议的内容
const parseNovelContent = (novelUrl) => {
  try {
    if (!novelUrl.startsWith('novel://')) {
      throw new Error('不是有效的小说内容格式')
    }
    
    const jsonStr = novelUrl.substring(8) // 移除 "novel://" 前缀
    const data = JSON.parse(jsonStr)
    
    if (!data.title || !data.content) {
      throw new Error('小说内容格式不完整')
    }
    
    return data
  } catch (error) {
    console.error('解析小说内容失败:', error)
    throw new Error('解析小说内容失败: ' + error.message)
  }
}

// 加载章节内容
const loadChapterContent = async (chapterIndex) => {
  if (!props.chapters[chapterIndex]) {
    error.value = '章节不存在'
    return
  }
  
  loading.value = true
  error.value = ''
  chapterContent.value = null
  
  try {
    const chapter = props.chapters[chapterIndex]
    console.log('加载章节:', chapter)
    
    // 调用T4 API获取章节内容
    const response = await videoService.getPlayUrl(
      props.bookDetail.module,
      chapter.url,
      props.bookDetail.api_url,
      props.bookDetail.ext
    )
    
    console.log('章节内容响应:', response)
    
    if (response && response.url) {
      // 解析novel://协议的内容
      const novelData = parseNovelContent(response.url)
      chapterContent.value = novelData
      console.log('解析后的章节内容:', novelData)
    } else {
      throw new Error('获取章节内容失败')
    }
  } catch (err) {
    console.error('加载章节内容失败:', err)
    error.value = err.message || '加载章节内容失败'
    Message.error(error.value)
  } finally {
    loading.value = false
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

// 监听章节变化
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
.book-reader {
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

.chapter-container {
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

.chapter-text {
  margin: 0 auto 60px;
  text-align: justify;
  word-break: break-word;
  hyphens: auto;
}

.chapter-text :deep(p) {
  margin-bottom: 1.5em;
  text-indent: 2em;
}

.chapter-text :deep(p:first-child) {
  margin-top: 0;
}

.chapter-text :deep(p:last-child) {
  margin-bottom: 0;
}

.chapter-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0;
  border-top: 1px solid var(--color-border-2);
  margin-top: 40px;
}

.nav-btn {
  min-width: 120px;
}

.chapter-progress {
  font-size: 14px;
  color: var(--color-text-2);
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .reader-content {
    padding: 10px;
  }
  
  .chapter-container {
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

/* 主题样式 */
.book-reader[data-theme="dark"] {
  background: #1a1a1a;
}

.book-reader[data-theme="sepia"] {
  background: #f4f1e8;
}
</style>