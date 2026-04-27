<template>
  <div class="reader-header">
    <div class="header-left">
      <!-- 返回按钮 -->
      <a-button type="text" @click="handleClose" class="close-btn">
        <template #icon>
          <icon-close />
        </template>
        关闭
      </a-button>
    </div>

    <div class="header-center">
      <!-- 书籍和章节信息 -->
      <div class="book-info">
        <div class="book-title" :title="bookTitle">{{ bookTitle }}</div>
        <div class="chapter-info" v-if="chapterName">
          <span class="chapter-name" :title="chapterName">{{ chapterName }}</span>
          <span class="chapter-progress" v-if="chapters.length > 0">
            ({{ currentChapterIndex + 1 }}/{{ chapters.length }})
          </span>
        </div>
      </div>
    </div>

    <div class="header-right">
      <!-- 章节导航 -->
      <div class="chapter-nav">
        <a-button 
          type="text" 
          :disabled="currentChapterIndex <= 0"
          @click="handlePrevChapter"
          class="nav-btn"
          title="上一章 (←)"
        >
          <template #icon>
            <icon-left />
          </template>
        </a-button>
        
        <a-button 
          type="text" 
          :disabled="currentChapterIndex >= chapters.length - 1"
          @click="handleNextChapter"
          class="nav-btn"
          title="下一章 (→)"
        >
          <template #icon>
            <icon-right />
          </template>
        </a-button>
      </div>

      <a-button type="text" @click="handleChapterListClick" class="chapter-list-btn" title="章节列表">
        <template #icon>
          <icon-list />
        </template>
        章节
      </a-button>

      <!-- 阅读设置按钮 -->
      <a-button type="text" @click="handleSettingsClick" class="settings-btn" title="阅读设置">
        <template #icon>
          <icon-settings />
        </template>
        设置
      </a-button>

      <!-- 全屏切换按钮 -->
      <a-button type="text" @click="toggleFullscreen" class="fullscreen-btn" :title="isFullscreen ? '退出全屏' : '全屏阅读'">
        <template #icon>
          <icon-fullscreen-exit v-if="isFullscreen" />
          <icon-fullscreen v-else />
        </template>
      </a-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { 
  IconClose, 
  IconLeft, 
  IconRight, 
  IconList, 
  IconSettings, 
  IconFullscreen,
  IconFullscreenExit
} from '@arco-design/web-vue/es/icon'

// Props
const props = defineProps({
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
  visible: {
    type: Boolean,
    default: false
  },
  readingSettings: {
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
  'chapter-list',
  'settings-change'
])

// 响应式数据
const isFullscreen = ref(false)

// 事件处理
const handleClose = () => {
  emit('close')
}

const handleNextChapter = () => {
  emit('next-chapter')
}

const handlePrevChapter = () => {
  emit('prev-chapter')
}

const handleChapterSelect = (index) => {
  emit('chapter-selected', index)
}

const handleChapterListClick = () => {
  emit('chapter-list')
}

const handleSettingsClick = () => {
  emit('settings-change', { showDialog: true })
}

// 全屏功能
const toggleFullscreen = async () => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
      isFullscreen.value = true
    } else {
      await document.exitFullscreen()
      isFullscreen.value = false
    }
  } catch (error) {
    console.warn('全屏切换失败:', error)
  }
}

// 监听全屏状态变化
const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

// 组件挂载
onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

// 组件卸载
onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})
</script>

<style scoped>
.reader-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--color-bg-2);
  border-bottom: 1px solid var(--color-border-2);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(8px);
}

.header-left {
  flex: 0 0 auto;
  min-width: 0;
}

.close-btn {
  color: var(--color-text-1);
  font-weight: 500;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  min-width: 0;
}

.book-info {
  text-align: center;
  max-width: 400px;
}

.book-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.chapter-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-3);
}

.chapter-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.chapter-progress {
  flex-shrink: 0;
}

.header-right {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.chapter-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-btn,
.chapter-list-btn,
.settings-btn,
.fullscreen-btn {
  color: var(--color-text-2);
  transition: color 0.2s ease;
}

.nav-btn:hover,
.chapter-list-btn:hover,
.settings-btn:hover,
.fullscreen-btn:hover {
  color: var(--color-text-1);
}

.nav-btn:disabled {
  color: var(--color-text-4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .reader-header {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 8px;
    padding: 8px 12px;
  }

  .close-btn {
    width: auto;
    min-width: 36px;
    padding: 0 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .close-btn span {
    display: inline;
    font-size: 12px;
  }

  .book-info {
    max-width: none;
    min-width: 0;
  }

  .book-title {
    font-size: 14px;
  }

  .chapter-info {
    min-width: 0;
    font-size: 11px;
  }

  .chapter-name {
    max-width: none;
  }

  .header-right {
    gap: 5px;
  }

  .chapter-nav {
    gap: 3px;
  }

  .nav-btn,
  .chapter-list-btn,
  .settings-btn,
  .fullscreen-btn {
    width: 32px;
    padding: 0;
  }

  .chapter-list-btn span,
  .settings-btn span {
    display: none;
  }
}

@media (max-width: 480px) {
  .reader-header {
    grid-template-columns: auto minmax(0, 1fr) auto;
    padding: 7px 10px;
  }

  .header-right {
    gap: 4px;
    overflow: hidden;
  }

  .chapter-nav {
    gap: 2px;
  }

  .nav-btn,
  .chapter-list-btn,
  .settings-btn,
  .fullscreen-btn {
    width: 29px;
    min-width: 29px;
    height: 30px;
    font-size: 14px;
  }

  .book-title {
    font-size: 13px;
  }

  .chapter-info {
    font-size: 10px;
  }
}
</style>