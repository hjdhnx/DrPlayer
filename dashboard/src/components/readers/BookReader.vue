<template>
  <div class="book-reader" v-if="visible">
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
      @chapter-list="handleToggleChapterPanel"
    />

    <div class="reader-main-layout">
      <div
        v-if="showChapterPanel"
        class="chapter-sidebar-mask"
        @click="showChapterPanel = false"
      ></div>

      <aside class="chapter-sidebar" :class="{ open: showChapterPanel }">
        <div class="chapter-sidebar-header">
          <div class="chapter-sidebar-heading">
            <div class="chapter-sidebar-title">章节目录</div>
            <button type="button" class="chapter-sidebar-close" @click="showChapterPanel = false">×</button>
          </div>
          <div class="chapter-sidebar-book" :title="bookTitle">{{ bookTitle || '当前小说' }}</div>
          <div class="chapter-sidebar-count">共 {{ chapters.length }} 章，当前第 {{ currentChapterIndex + 1 }} 章</div>
          <a-input-search
            v-model="chapterSearchKeyword"
            allow-clear
            placeholder="搜索章节名或序号"
            class="chapter-sidebar-search"
          />
        </div>

        <div class="chapter-sidebar-list" ref="chapterPanelListRef">
          <button
            v-for="chapter in filteredChapters"
            :key="chapter.index"
            type="button"
            class="chapter-sidebar-item"
            :class="{
              active: chapter.index === currentChapterIndex,
              read: chapter.index < currentChapterIndex
            }"
            @click="handlePanelChapterSelect(chapter.index)"
          >
            <span class="chapter-sidebar-number">{{ chapter.index + 1 }}</span>
            <span class="chapter-sidebar-item-title" :title="chapter.name">{{ chapter.name }}</span>
            <span class="chapter-sidebar-current" v-if="chapter.index === currentChapterIndex">当前</span>
          </button>
        </div>

        <div v-if="filteredChapters.length === 0" class="chapter-sidebar-empty">
          <a-empty description="未找到匹配章节" />
        </div>
      </aside>

      <!-- 阅读内容区域 -->
      <main
        class="reader-content"
        ref="readerContentRef"
        :style="contentStyles"
        @touchstart.passive="handleReaderTouchStart"
        @touchmove.passive="handleReaderTouchMove"
        @touchend="handleReaderTouchEnd"
        @wheel.passive="handleReaderWheel"
      >
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

          <div
            v-if="canAutoNextChapter && bottomSwipeProgress > 0"
            class="bottom-scroll-hint"
            :class="{ ready: bottomSwipeProgress >= 1 }"
          >
            {{ bottomSwipeProgress >= 1 ? '松开进入下一章' : '继续上滑进入下一章' }}
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-container">
          <a-empty description="暂无章节内容" />
        </div>
      </main>
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
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
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
const showChapterPanel = ref(false)
const chapterSearchKeyword = ref('')
const chapterPanelListRef = ref(null)
const readerContentRef = ref(null)
const bottomSwipeProgress = ref(0)
const touchStartY = ref(0)
const touchLastY = ref(0)
const bottomSwipeDistance = ref(0)
const bottomSwipeTriggered = ref(false)
const lastAutoNextAt = ref(0)
const AUTO_NEXT_COOLDOWN = 2000

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

const filteredChapters = computed(() => {
  const keyword = chapterSearchKeyword.value.trim().toLowerCase()
  return props.chapters
    .map((chapter, index) => ({
      ...chapter,
      index,
      name: chapter.name || `第${index + 1}章`
    }))
    .filter(chapter => {
      if (!keyword) return true
      return chapter.name.toLowerCase().includes(keyword) || String(chapter.index + 1).includes(keyword)
    })
})

const canAutoNextChapter = computed(() => props.currentChapterIndex < props.chapters.length - 1)

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

const isMobileViewport = () => window.matchMedia('(max-width: 768px)').matches

const scrollActiveChapterIntoView = async () => {
  await nextTick()
  const list = chapterPanelListRef.value
  const active = list?.querySelector('.chapter-sidebar-item.active')
  active?.scrollIntoView({ block: 'center' })
}

const scrollReaderToTop = async () => {
  resetBottomSwipe()
  await nextTick()
  if (readerContentRef.value) {
    readerContentRef.value.scrollTop = 0
  }
}

const resetBottomSwipe = () => {
  bottomSwipeProgress.value = 0
  bottomSwipeDistance.value = 0
  bottomSwipeTriggered.value = false
}

const canTriggerAutoNext = () => Date.now() - lastAutoNextAt.value >= AUTO_NEXT_COOLDOWN

const triggerAutoNextChapter = () => {
  if (!canAutoNextChapter.value || bottomSwipeTriggered.value || !canTriggerAutoNext()) return false
  bottomSwipeTriggered.value = true
  lastAutoNextAt.value = Date.now()
  handleNextChapter()
  return true
}

const isReaderScrolledToBottom = () => {
  const reader = readerContentRef.value
  if (!reader) return false
  return reader.scrollTop + reader.clientHeight >= reader.scrollHeight - 4
}

const handleReaderTouchStart = (event) => {
  if (!canAutoNextChapter.value || !canTriggerAutoNext()) return
  const touch = event.touches[0]
  touchStartY.value = touch.clientY
  touchLastY.value = touch.clientY
  bottomSwipeDistance.value = 0
  bottomSwipeTriggered.value = false
}

const handleReaderTouchMove = (event) => {
  if (!canAutoNextChapter.value || !canTriggerAutoNext() || !isReaderScrolledToBottom()) {
    bottomSwipeProgress.value = 0
    return
  }

  const touch = event.touches[0]
  const deltaY = touchLastY.value - touch.clientY
  touchLastY.value = touch.clientY

  if (deltaY <= 0) {
    bottomSwipeDistance.value = Math.max(0, bottomSwipeDistance.value + deltaY)
  } else {
    bottomSwipeDistance.value += deltaY
  }

  bottomSwipeProgress.value = Math.min(1, bottomSwipeDistance.value / 72)
}

const handleReaderTouchEnd = () => {
  if (bottomSwipeProgress.value >= 1) {
    triggerAutoNextChapter()
  }
  resetBottomSwipe()
}

const handleReaderWheel = (event) => {
  if (!canAutoNextChapter.value || event.deltaY <= 0 || !isReaderScrolledToBottom()) return
  if (triggerAutoNextChapter()) {
    window.setTimeout(resetBottomSwipe, AUTO_NEXT_COOLDOWN)
  }
}

const handleToggleChapterPanel = async () => {
  if (isMobileViewport()) {
    showChapterPanel.value = !showChapterPanel.value
    if (showChapterPanel.value) {
      await scrollActiveChapterIntoView()
    }
    return
  }
  await scrollActiveChapterIntoView()
}

const handlePanelChapterSelect = (index) => {
  if (isMobileViewport()) {
    showChapterPanel.value = false
  }
  chapterSearchKeyword.value = ''
  handleChapterSelected(index)
  scrollReaderToTop()
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
    scrollReaderToTop()
    scrollActiveChapterIntoView()
  }
}, { immediate: true })

// 监听可见性变化
watch(() => props.visible, (visible) => {
  if (visible && props.currentChapterIndex >= 0) {
    loadChapterContent(props.currentChapterIndex)
    scrollActiveChapterIntoView()
  } else {
    showChapterPanel.value = false
    chapterSearchKeyword.value = ''
  }
})

// 键盘快捷键
const handleKeydown = (event) => {
  if (!props.visible) return
  const target = event.target
  const isInputFocused = target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)

  switch (event.key) {
    case 'ArrowLeft':
      if (isInputFocused) return
      event.preventDefault()
      handlePrevChapter()
      break
    case 'ArrowRight':
      if (isInputFocused) return
      event.preventDefault()
      handleNextChapter()
      break
    case 'Escape':
      event.preventDefault()
      if (showChapterPanel.value) {
        showChapterPanel.value = false
        return
      }
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
  overflow: hidden;
}

.reader-main-layout {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

.chapter-sidebar {
  width: 320px;
  flex: 0 0 320px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--color-border-2);
  background: var(--color-bg-1);
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.04);
  z-index: 2;
}

.chapter-sidebar-header {
  flex-shrink: 0;
  padding: 14px 14px 12px;
  border-bottom: 1px solid var(--color-border-2);
  background: var(--color-bg-2);
}

.chapter-sidebar-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.chapter-sidebar-title {
  color: var(--color-text-1);
  font-size: 16px;
  font-weight: 700;
}

.chapter-sidebar-close {
  display: none;
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-2);
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
}

.chapter-sidebar-book {
  color: var(--color-text-1);
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chapter-sidebar-count {
  margin: 2px 0 10px;
  color: var(--color-text-3);
  font-size: 12px;
}

.chapter-sidebar-search {
  width: 100%;
}

.chapter-sidebar-list {
  flex: 1;
  min-height: 0;
  padding: 8px;
  overflow-y: auto;
}

.chapter-sidebar-item {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 38px;
  padding: 7px 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-1);
  text-align: left;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease;
}

.chapter-sidebar-item:hover {
  background: var(--color-fill-2);
}

.chapter-sidebar-item.active {
  background: var(--color-primary-light-1);
  color: var(--color-text-1);
  font-weight: 600;
}

.chapter-sidebar-item.read:not(.active) {
  color: var(--color-text-2);
}

.chapter-sidebar-number {
  color: var(--color-text-3);
  font-size: 12px;
  font-weight: 600;
  text-align: right;
}

.chapter-sidebar-item.active .chapter-sidebar-number {
  color: var(--color-text-3);
}

.chapter-sidebar-item-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.chapter-sidebar-current {
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--color-fill-3);
  color: var(--color-text-1);
  font-size: 11px;
  font-weight: 500;
}

.chapter-sidebar-empty {
  padding: 24px 12px;
}

.chapter-sidebar-mask {
  display: none;
}

.reader-content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding: 20px;
  transition: background-color 0.3s ease, color 0.3s ease;
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
  display: grid;
  grid-template-columns: minmax(110px, 1fr) auto minmax(110px, 1fr);
  align-items: center;
  gap: 14px;
  padding: 18px 0 8px;
  border-top: 1px solid var(--color-border-2);
  margin-top: 40px;
}

.nav-btn {
  width: 100%;
  min-width: 0;
  height: 40px;
  border-radius: 999px;
  font-weight: 500;
}

.prev-btn {
  justify-self: start;
}

.next-btn {
  justify-self: end;
}

.chapter-progress {
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--color-fill-2);
  color: var(--color-text-2);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

.bottom-scroll-hint {
  margin: 12px auto 0;
  width: fit-content;
  padding: 6px 14px;
  border-radius: 999px;
  background: var(--color-fill-2);
  color: var(--color-text-3);
  font-size: 12px;
  transition: background 0.2s ease, color 0.2s ease;
}

.bottom-scroll-hint.ready {
  background: var(--color-primary-light-1);
  color: var(--color-primary-6);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .reader-main-layout {
    display: block;
  }

  .chapter-sidebar-mask {
    position: absolute;
    inset: 0;
    display: block;
    background: rgba(0, 0, 0, 0.42);
    opacity: 1;
    z-index: 5;
  }

  .chapter-sidebar {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: min(82vw, 320px);
    max-width: calc(100vw - 52px);
    transform: translateX(-104%);
    transition: transform 0.24s ease;
    box-shadow: 6px 0 22px rgba(0, 0, 0, 0.18);
    z-index: 6;
  }

  .reader-main-layout .chapter-sidebar.open {
    transform: translateX(0) !important;
  }

  .chapter-sidebar-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .chapter-sidebar-header {
    padding: 12px;
  }

  .chapter-sidebar-list {
    padding: 6px;
  }

  .chapter-sidebar-item {
    min-height: 36px;
    padding: 6px 8px;
    border-radius: 7px;
  }

  .chapter-sidebar-item-title {
    font-size: 13px;
  }

  .reader-content {
    height: 100%;
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
    display: grid;
    grid-template-columns: minmax(84px, 1fr) auto minmax(84px, 1fr);
    gap: 8px;
  }

  .chapter-navigation .nav-btn {
    width: 100%;
    min-width: 0;
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