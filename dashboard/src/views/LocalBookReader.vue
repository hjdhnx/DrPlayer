<template>
  <div class="local-book-reader" v-if="visible" :style="readerStyles">
    <!-- 阅读器头部 -->
    <ReaderHeader
      :book-title="bookData?.title || ''"
      :chapter-name="currentChapter?.name || currentChapter?.title || ''"
      :chapters="chapters"
      :current-chapter-index="currentChapterIndex"
      :visible="true"
      :reading-settings="readingSettings"
      @close="handleClose"
      @settings-change="handleShowSettings"
      @next-chapter="handleNextChapter"
      @prev-chapter="handlePrevChapter"
      @chapter-selected="handleChapterSelected"
      @chapter-list="handleToggleChapterPanel"
    />

    <div class="reader-main-layout">
      <!-- 章节侧边栏遮罩（移动端） -->
      <div
        v-if="showChapterPanel && isMobileViewport()"
        class="chapter-sidebar-mask"
        @click="showChapterPanel = false"
      ></div>

      <!-- 章节侧边栏 -->
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

        <div
          class="chapter-sidebar-list"
          ref="chapterPanelListRef"
          @scroll="handleChapterListScroll"
        >
          <div
            class="chapter-sidebar-spacer"
            :style="{
              paddingTop: `${virtualTopPadding}px`,
              paddingBottom: `${virtualBottomPadding}px`
            }"
          >
            <button
              v-for="chapter in virtualChapters"
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
        </div>

        <div v-if="filteredChapters.length === 0" class="chapter-sidebar-empty">
          <a-empty description="未找到匹配章节" />
        </div>
      </aside>

      <!-- 阅读内容区域 -->
      <div class="reader-content" :style="readerStyles" @scroll="handleScroll" ref="contentRef">
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
      <div v-else-if="currentChapter" class="chapter-container" :style="bookContainerStyles">
        <!-- 章节标题 -->
        <h1 class="chapter-title" :style="titleStyles">
          {{ currentChapter.title || currentChapter.name }}
        </h1>

        <!-- 章节正文 -->
        <div 
          class="chapter-text" 
          :style="textStyles"
        >
          <div 
            v-for="(paragraph, index) in formattedChapterContent" 
            :key="index"
            class="paragraph"
          >
            {{ paragraph }}
          </div>
        </div>

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
    </div>

    <!-- 阅读进度条 -->
    <div class="progress-bar" v-if="readingSettings.showProgress">
      <div class="progress-fill" :style="{ width: `${readingProgress}%` }"></div>
      <div class="progress-text">{{ Math.round(readingProgress) }}%</div>
    </div>

    <!-- 阅读设置对话框 -->
    <ReadingSettingsDialog
      :visible="showSettings"
      :settings="readingSettings"
      @close="showSettings = false"
      @settings-change="handleSettingsChange"
    />

    <!-- 书签管理对话框 -->
    <BookmarkDialog
      v-model:visible="showBookmarks"
      :bookmarks="bookmarks"
      @bookmark-selected="handleBookmarkSelected"
      @bookmark-added="handleBookmarkAdded"
      @bookmark-deleted="handleBookmarkDeleted"
      @bookmark-updated="handleBookmarkUpdated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { IconLeft, IconRight } from '@arco-design/web-vue/es/icon'
import ReaderHeader from '@/components/readers/ReaderHeader.vue'
import ReadingSettingsDialog from '@/components/readers/ReadingSettingsDialog.vue'
import BookmarkDialog from '@/components/readers/BookmarkDialog.vue'
import localBookService from '@/services/localBookService'
import { parseChapters } from '@/utils/chapterParser'

const route = useRoute()
const router = useRouter()

// 响应式数据
const visible = ref(true)
const loading = ref(true)
const error = ref('')
const showSettings = ref(false)
const showBookmarks = ref(false)

// 图书数据
const bookId = ref(route.params.bookId)
const bookData = ref(null)
const bookContent = ref('')
const bookTitle = ref('')
const bookAuthor = ref('')

// 章节数据
const chapters = ref([])
const currentChapterIndex = ref(0)
const currentChapter = ref(null)
const showChapterPanel = ref(false)
const chapterSearchKeyword = ref('')
const chapterPanelListRef = ref(null)

// 虚拟滚动参数
const CHAPTER_ITEM_HEIGHT = 38
const CHAPTER_LIST_BUFFER = 12
const chapterListScrollTop = ref(0)
const chapterListViewportHeight = ref(0)

// 阅读状态
const currentPosition = ref(0)
const readingProgress = ref(0)
const bookmarks = ref([])
const readingStartTime = ref(Date.now())

// DOM引用
const contentRef = ref(null)

// 阅读设置 - 与在线阅读器共享相同的localStorage键名和结构
const readingSettings = ref({
  fontSize: 16,
  lineHeight: 1.8,
  fontFamily: 'system-ui',
  backgroundColor: '#ffffff',
  textColor: '#333333',
  maxWidth: 800,
  theme: 'light',
  padding: 40,
  showProgress: true,
  autoSave: true,
  saveInterval: 30000 // 30秒自动保存
})

// 计算属性
const readerStyles = computed(() => {
  let backgroundColor = readingSettings.value.backgroundColor
  let textColor = readingSettings.value.textColor
  
  // 根据主题设置颜色
  if (readingSettings.value.theme !== 'custom') {
    const themeColors = {
      light: { backgroundColor: '#ffffff', textColor: '#333333' },
      dark: { backgroundColor: '#1a1a1a', textColor: '#e6e6e6' },
      sepia: { backgroundColor: '#f4f1e8', textColor: '#5c4b37' },
      green: { backgroundColor: '#c7edcc', textColor: '#2d5016' },
      parchment: { backgroundColor: '#fdf6e3', textColor: '#657b83' },
      night: { backgroundColor: '#2b2b2b', textColor: '#c9aa71' },
      blue: { backgroundColor: '#e8f4f8', textColor: '#1e3a5f' },
      pink: { backgroundColor: '#fdf2f8', textColor: '#831843' }
    }
    
    const theme = themeColors[readingSettings.value.theme]
    if (theme) {
      backgroundColor = theme.backgroundColor
      textColor = theme.textColor
    }
  }
  
  return {
    backgroundColor,
    color: textColor,
    fontFamily: readingSettings.value.fontFamily
  }
})

const bookContainerStyles = computed(() => ({
  maxWidth: `${readingSettings.value.maxWidth}px`,
  margin: '0 auto',
  padding: `${readingSettings.value.padding}px`
}))

const titleStyles = computed(() => ({
  fontSize: `${readingSettings.value.fontSize + 4}px`,
  lineHeight: readingSettings.value.lineHeight,
  fontFamily: readingSettings.value.fontFamily,
  color: readerStyles.value.color
}))

const textStyles = computed(() => ({
  fontSize: `${readingSettings.value.fontSize}px`,
  lineHeight: readingSettings.value.lineHeight,
  color: readerStyles.value.color,
  maxWidth: `${readingSettings.value.maxWidth}px`,
  margin: '0 auto'
}))

const formattedChapterContent = computed(() => {
  if (!currentChapter.value?.content) return []

  return currentChapter.value.content
    .split('\n')
    .filter(line => line.trim())
    .map(line => line.trim())
})

// 章节侧边栏：筛选和虚拟滚动
const isMobileViewport = () => window.matchMedia('(max-width: 768px)').matches

const filteredChapters = computed(() => {
  const keyword = chapterSearchKeyword.value.trim().toLowerCase()
  return chapters.value
    .map((chapter, index) => ({
      ...chapter,
      index,
      name: chapter.name || chapter.title || `第${index + 1}章`
    }))
    .filter(chapter => {
      if (!keyword) return true
      return chapter.name.toLowerCase().includes(keyword) || String(chapter.index + 1).includes(keyword)
    })
})

const virtualStartIndex = computed(() => {
  if (filteredChapters.value.length === 0) return 0
  return Math.max(0, Math.floor(chapterListScrollTop.value / CHAPTER_ITEM_HEIGHT) - CHAPTER_LIST_BUFFER)
})

const virtualVisibleCount = computed(() => {
  const viewportRows = Math.ceil((chapterListViewportHeight.value || 360) / CHAPTER_ITEM_HEIGHT)
  return viewportRows + CHAPTER_LIST_BUFFER * 2
})

const virtualEndIndex = computed(() => {
  return Math.min(filteredChapters.value.length, virtualStartIndex.value + virtualVisibleCount.value)
})

const virtualChapters = computed(() => {
  return filteredChapters.value.slice(virtualStartIndex.value, virtualEndIndex.value)
})

const virtualTopPadding = computed(() => virtualStartIndex.value * CHAPTER_ITEM_HEIGHT)

const virtualBottomPadding = computed(() => {
  return Math.max(0, (filteredChapters.value.length - virtualEndIndex.value) * CHAPTER_ITEM_HEIGHT)
})

const formatReadingTime = computed(() => {
  const now = Date.now()
  const duration = now - readingStartTime.value
  const minutes = Math.floor(duration / 60000)
  
  if (minutes < 1) return '刚开始阅读'
  if (minutes < 60) return `${minutes}分钟`
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}小时${remainingMinutes}分钟`
})

// 方法
const loadBook = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const book = localBookService.getBookById(bookId.value)
    if (!book) {
      throw new Error('未找到指定的图书')
    }
    
    bookData.value = book
    bookContent.value = book.content
    bookTitle.value = book.title
    bookAuthor.value = book.author
    
    // 智能断章
    await parseBookChapters()

    // 显示章节侧边栏（桌面端默认展开）
    showChapterPanel.value = !isMobileViewport()
    
    // 加载阅读进度
    if (book.readingProgress) {
      currentPosition.value = book.readingProgress.position || 0
      readingProgress.value = book.readingProgress.percentage || 0
      
      // 恢复章节位置
      if (book.readingProgress.chapterIndex !== undefined && chapters.value[book.readingProgress.chapterIndex]) {
        currentChapterIndex.value = book.readingProgress.chapterIndex
        currentChapter.value = chapters.value[book.readingProgress.chapterIndex]
      }
    }
    
    // 加载书签
    bookmarks.value = book.bookmarks || []
    
    // 恢复阅读位置
    await nextTick()
    if (currentPosition.value > 0) {
      restoreReadingPosition()
    }
    
  } catch (err) {
    console.error('加载图书失败:', err)
    error.value = err.message || '加载图书失败'
  } finally {
    loading.value = false
  }
}

const parseBookChapters = async () => {
  try {
    if (!bookContent.value) return
    
    // 使用智能断章工具解析章节
    const parsedChapters = parseChapters(bookContent.value)
    
    // 确保章节对象有name属性供ReaderHeader使用
    chapters.value = parsedChapters.map(chapter => ({
      ...chapter,
      name: chapter.title || chapter.name || `第${chapter.id + 1}章`
    }))
    
    if (chapters.value.length > 0) {
      currentChapter.value = chapters.value[0]
      currentChapterIndex.value = 0
    }
    
    console.log(`成功解析 ${chapters.value.length} 个章节`)
  } catch (error) {
    console.error('章节解析失败:', error)
    // 如果解析失败，创建一个默认章节
    chapters.value = [{
      title: bookTitle.value || '全文',
      name: bookTitle.value || '全文',
      content: bookContent.value,
      startIndex: 0,
      endIndex: bookContent.value.length
    }]
    currentChapter.value = chapters.value[0]
    currentChapterIndex.value = 0
  }
}

const handleNextChapter = () => {
  if (currentChapterIndex.value < chapters.value.length - 1) {
    currentChapterIndex.value++
    currentChapter.value = chapters.value[currentChapterIndex.value]
    
    // 重置滚动位置
    nextTick(() => {
      if (contentRef.value) {
        contentRef.value.scrollTop = 0
      }
    })
    
    saveReadingProgress()
  } else {
    Message.info('已经是最后一章了')
  }
}

const handlePrevChapter = () => {
  if (currentChapterIndex.value > 0) {
    currentChapterIndex.value--
    currentChapter.value = chapters.value[currentChapterIndex.value]
    
    // 重置滚动位置
    nextTick(() => {
      if (contentRef.value) {
        contentRef.value.scrollTop = 0
      }
    })
    
    saveReadingProgress()
  } else {
    Message.info('已经是第一章了')
  }
}

const handleChapterSelected = (chapterIndex) => {
  if (chapterIndex >= 0 && chapterIndex < chapters.value.length) {
    currentChapterIndex.value = chapterIndex
    currentChapter.value = chapters.value[chapterIndex]

    // 重置滚动位置
    nextTick(() => {
      if (contentRef.value) {
        contentRef.value.scrollTop = 0
      }
    })

    saveReadingProgress()
  }
}

// 章节侧边栏方法
const handleToggleChapterPanel = async () => {
  showChapterPanel.value = !showChapterPanel.value
  if (showChapterPanel.value) {
    await scrollActiveChapterIntoView()
  }
}

const handlePanelChapterSelect = (index) => {
  if (isMobileViewport()) {
    showChapterPanel.value = false
  }
  chapterSearchKeyword.value = ''
  handleChapterSelected(index)
}

const handleChapterListScroll = () => {
  if (chapterPanelListRef.value) {
    chapterListScrollTop.value = chapterPanelListRef.value.scrollTop
    chapterListViewportHeight.value = chapterPanelListRef.value.clientHeight
  }
}

const updateChapterListViewport = async () => {
  await nextTick()
  if (chapterPanelListRef.value) {
    chapterListViewportHeight.value = chapterPanelListRef.value.clientHeight
    chapterListScrollTop.value = chapterPanelListRef.value.scrollTop
  }
}

const findFilteredChapterPosition = (chapterIndex) => {
  return filteredChapters.value.findIndex(chapter => chapter.index === chapterIndex)
}

const scrollChapterPositionIntoView = async (position, block = 'center') => {
  await nextTick()
  const list = chapterPanelListRef.value
  if (!list || position < 0) return

  const itemTop = position * CHAPTER_ITEM_HEIGHT
  const itemBottom = itemTop + CHAPTER_ITEM_HEIGHT
  const viewportHeight = list.clientHeight
  let nextScrollTop = list.scrollTop

  if (block === 'center') {
    nextScrollTop = itemTop - viewportHeight / 2 + CHAPTER_ITEM_HEIGHT / 2
  } else if (itemTop < list.scrollTop) {
    nextScrollTop = itemTop
  } else if (itemBottom > list.scrollTop + viewportHeight) {
    nextScrollTop = itemBottom - viewportHeight
  }

  list.scrollTop = Math.max(0, nextScrollTop)
  chapterListScrollTop.value = list.scrollTop
  chapterListViewportHeight.value = viewportHeight
}

const scrollActiveChapterIntoView = async () => {
  await updateChapterListViewport()
  await scrollChapterPositionIntoView(findFilteredChapterPosition(currentChapterIndex.value), 'center')
}

const retryLoad = () => {
  loadBook()
}

const handleClose = () => {
  saveReadingProgress()
  visible.value = false
  router.push('/book-gallery')
}

const handleShowSettings = (event) => {
  if (event && event.showDialog) {
    showSettings.value = true
  } else {
    showSettings.value = true
  }
}

const handleSettingsChange = (newSettings) => {
  readingSettings.value = { ...readingSettings.value, ...newSettings }
  saveReadingSettings()
}

const handleBookmark = () => {
  showBookmarks.value = true
}

const handleFullscreen = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    document.documentElement.requestFullscreen()
  }
}

const handleScroll = () => {
  if (!contentRef.value) return
  
  const element = contentRef.value
  const scrollTop = element.scrollTop
  const scrollHeight = element.scrollHeight
  const clientHeight = element.clientHeight
  
  // 计算阅读进度
  const progress = (scrollTop / (scrollHeight - clientHeight)) * 100
  readingProgress.value = Math.min(100, Math.max(0, progress))
  currentPosition.value = scrollTop
  
  // 自动保存进度
  if (readingSettings.value.autoSave) {
    debouncedSaveProgress()
  }
}

const saveReadingProgress = () => {
  if (!bookData.value) return
  
  const progress = {
    position: currentPosition.value,
    percentage: readingProgress.value,
    chapterIndex: currentChapterIndex.value,
    lastReadTime: Date.now()
  }
  
  localBookService.updateReadingProgress(bookId.value, progress)
}

const restoreReadingPosition = () => {
  if (contentRef.value && currentPosition.value > 0) {
    contentRef.value.scrollTop = currentPosition.value
  }
}

const handleBookmarkSelected = (bookmark) => {
  if (contentRef.value) {
    contentRef.value.scrollTop = bookmark.position
    currentPosition.value = bookmark.position
  }
  showBookmarks.value = false
}

const handleBookmarkAdded = (bookmark) => {
  bookmarks.value.push({
    id: Date.now(),
    title: bookmark.title || `书签 ${bookmarks.value.length + 1}`,
    position: currentPosition.value,
    percentage: readingProgress.value,
    createdAt: Date.now()
  })
  
  // 保存书签到本地存储
  if (bookData.value) {
    bookData.value.bookmarks = bookmarks.value
    localBookService.updateBook(bookId.value, { bookmarks: bookmarks.value })
  }
  
  Message.success('书签已添加')
}

const handleBookmarkDeleted = (bookmarkId) => {
  const index = bookmarks.value.findIndex(b => b.id === bookmarkId)
  if (index !== -1) {
    bookmarks.value.splice(index, 1)
    
    // 更新本地存储
    if (bookData.value) {
      bookData.value.bookmarks = bookmarks.value
      localBookService.updateBook(bookId.value, { bookmarks: bookmarks.value })
    }
    
    Message.success('书签已删除')
  }
}

const handleBookmarkUpdated = (updatedBookmark) => {
  const index = bookmarks.value.findIndex(b => b.id === updatedBookmark.id)
  if (index !== -1) {
    bookmarks.value[index].title = updatedBookmark.title
    
    // 更新本地存储
    if (bookData.value) {
      bookData.value.bookmarks = bookmarks.value
      localBookService.updateBook(bookId.value, { bookmarks: bookmarks.value })
    }
    
    Message.success('书签已更新')
  }
}

// 防抖保存进度
let saveProgressTimer = null
const debouncedSaveProgress = () => {
  if (saveProgressTimer) {
    clearTimeout(saveProgressTimer)
  }
  saveProgressTimer = setTimeout(() => {
    saveReadingProgress()
  }, 1000)
}

// 加载阅读设置 - 与在线阅读器共享设置
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

// 保存阅读设置 - 与在线阅读器共享设置
const saveReadingSettings = () => {
  try {
    localStorage.setItem('drplayer_reading_settings', JSON.stringify(readingSettings.value))
  } catch (error) {
    console.warn('保存阅读设置失败:', error)
  }
}

const SCROLL_STEP = 300

// 键盘快捷键
const handleKeydown = (event) => {
  const target = event.target
  const isInputFocused = target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)

  switch (event.key) {
    case 'ArrowUp':
      if (isInputFocused) return
      event.preventDefault()
      if (contentRef.value) {
        contentRef.value.scrollBy({ top: -SCROLL_STEP, behavior: 'smooth' })
      }
      break
    case 'ArrowDown':
      if (isInputFocused) return
      event.preventDefault()
      if (contentRef.value) {
        contentRef.value.scrollBy({ top: SCROLL_STEP, behavior: 'smooth' })
      }
      break
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
    case 'F11':
      event.preventDefault()
      handleFullscreen()
      break
    case 's':
      if (event.ctrlKey) {
        event.preventDefault()
        handleShowSettings()
      }
      break
    case 'b':
      if (event.ctrlKey) {
        event.preventDefault()
        handleBookmark()
      }
      break
  }
}

// 自动保存定时器
let autoSaveTimer = null
const startAutoSave = () => {
  if (readingSettings.value.autoSave && readingSettings.value.saveInterval > 0) {
    autoSaveTimer = setInterval(() => {
      saveReadingProgress()
    }, readingSettings.value.saveInterval)
  }
}

const stopAutoSave = () => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
}

// 监听路由参数变化
watch(() => route.params.bookId, (newBookId) => {
  if (newBookId && newBookId !== bookId.value) {
    bookId.value = newBookId
    loadBook()
  }
})

// 监听章节搜索关键词变化
watch(() => chapterSearchKeyword.value, async () => {
  chapterListScrollTop.value = 0
  await nextTick()
  if (chapterPanelListRef.value) {
    chapterPanelListRef.value.scrollTop = 0
    updateChapterListViewport()
  }
})

// 组件挂载
onMounted(() => {
  loadReadingSettings()
  loadBook()
  startAutoSave()
  document.addEventListener('keydown', handleKeydown)
})

// 组件卸载
onUnmounted(() => {
  saveReadingProgress()
  stopAutoSave()
  document.removeEventListener('keydown', handleKeydown)
  
  if (saveProgressTimer) {
    clearTimeout(saveProgressTimer)
  }
})
</script>

<style scoped>
.local-book-reader {
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

.reader-main-layout {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

.chapter-sidebar {
  width: 0;
  flex: 0 0 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-right: 0;
  background: var(--color-bg-1);
  box-shadow: none;
  overflow: hidden;
  z-index: 2;
  transition: width 0.2s ease, flex-basis 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.chapter-sidebar.open {
  width: 320px;
  flex-basis: 320px;
  border-right: 1px solid var(--color-border-2);
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.04);
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

.book-header {
  text-align: center;
  margin-bottom: 40px;
  padding-top: 40px;
}

.book-title {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--color-text-1);
}

.book-meta {
  display: flex;
  justify-content: center;
  gap: 20px;
  color: var(--color-text-2);
  font-size: 14px;
}



.chapter-title {
  font-size: 24px;
  font-weight: 600;
  text-align: center;
  margin: 40px 0 30px 0;
  color: var(--color-text-1);
  border-bottom: 2px solid var(--color-border-2);
  padding-bottom: 16px;
}

.chapter-text {
  margin: 0 auto 60px;
  text-align: justify;
  word-break: break-word;
  hyphens: auto;
  line-height: 1.8;
}

.paragraph {
  margin-bottom: 1.5em;
  text-align: justify;
  word-break: break-word;
  line-height: inherit;
  text-indent: 2em;
}

.chapter-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 40px;
  padding: 20px 0;
  border-top: 1px solid var(--color-border-2);
}

.nav-btn {
  min-width: 120px;
  height: 40px;
  border-radius: 20px;
  font-weight: 500;
}

.prev-btn {
  margin-right: auto;
}

.next-btn {
  margin-left: auto;
}

.chapter-progress {
  font-size: 14px;
  color: var(--color-text-2);
  font-weight: 500;
}

.progress-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--color-fill-2);
  z-index: 1001;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  right: 10px;
  top: -25px;
  font-size: 12px;
  color: var(--color-text-2);
  background: var(--color-bg-1);
  padding: 2px 6px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 滚动条样式 */
.reader-content::-webkit-scrollbar {
  width: 6px;
}

.reader-content::-webkit-scrollbar-track {
  background: var(--color-fill-1);
  border-radius: 3px;
}

.reader-content::-webkit-scrollbar-thumb {
  background: var(--color-fill-3);
  border-radius: 3px;
}

.reader-content::-webkit-scrollbar-thumb:hover {
  background: var(--color-fill-4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .local-book-reader {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
  }

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
    height: calc(100dvh - 172px);
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
    -webkit-overflow-scrolling: touch;
  }

  .chapter-container {
    padding: 18px 18px 72px !important;
    max-width: none !important;
  }

  .chapter-title {
    font-size: 22px !important;
    line-height: 1.35 !important;
    margin: 18px 0 24px;
    padding-bottom: 14px;
    border-bottom: 1px solid color-mix(in srgb, currentColor 16%, transparent);
    text-align: left;
  }

  .chapter-text {
    max-width: none !important;
    margin-bottom: 36px;
  }

  .chapter-navigation {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 10px;
    align-items: center;
    margin-top: 28px;
    padding: 16px 0 0;
    border-top: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  }

  .nav-btn {
    width: 100%;
    min-width: 0;
    height: 42px;
    margin: 0 !important;
    border-radius: 999px;
  }

  .chapter-progress {
    grid-column: 1 / -1;
    text-align: center;
    order: -1;
    padding: 8px 12px;
    border-radius: 999px;
    background: color-mix(in srgb, currentColor 8%, transparent);
  }

  .paragraph {
    text-indent: 1.6em;
    margin-bottom: 1.25em;
  }

  .progress-bar {
    height: calc(4px + env(safe-area-inset-bottom));
    padding-bottom: env(safe-area-inset-bottom);
  }

  .progress-text {
    right: 12px;
    top: -28px;
    border-radius: 999px;
  }
}
</style>