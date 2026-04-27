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

    <div class="header-center"></div>

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

      <!-- 章节列表按钮 -->
      <a-button type="text" @click="handleChapterListClick" class="chapter-list-btn" title="章节列表">
        <template #icon>
          <icon-list />
        </template>
        章节
      </a-button>

      <!-- 阅读设置按钮 -->
      <a-button type="text" @click="handleSettings" class="settings-btn" title="阅读设置">
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
  'chapter-list',
  'settings-change',
  'toggle-fullscreen'
])

// 响应式数据
const isFullscreen = ref(false)

// 事件处理
const handleClose = () => {
  emit('close')
}

const handlePrevChapter = () => {
  emit('prev-chapter')
}

const handleNextChapter = () => {
  emit('next-chapter')
}

const handleChapterListClick = () => {
  emit('chapter-list')
}

const handleSettings = () => {
  emit('settings-change', { showDialog: true })
}

// 全屏功能
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

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
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .reader-header {
    padding: 8px 10px 8px 4px;
  }
  
  .book-info {
    max-width: 250px;
  }
  
  .book-title {
    font-size: 14px;
  }
  
  .chapter-info {
    font-size: 11px;
  }
  
  .chapter-name {
    max-width: 150px;
  }
  
  .header-right {
    gap: 4px;
  }
}

@media (max-width: 480px) {
  .close-btn {
    padding-left: 4px;
    padding-right: 6px;
  }

  .close-btn span {
    display: none;
  }
  
  .chapter-list-btn span,
  .settings-btn span {
    display: none;
  }
  
  .book-info {
    max-width: 180px;
  }
  
  .chapter-name {
    max-width: 120px;
  }
}

.header-center {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.header-center :deep(.arco-btn) {
  color: var(--color-text-1);
  border-color: var(--color-border-2);
}

.header-center :deep(.arco-btn:hover) {
  background: var(--color-fill-2);
  border-color: var(--color-border-3);
}

.header-center :deep(.arco-btn:disabled) {
  color: var(--color-text-4);
  border-color: var(--color-border-1);
}

.header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 1;
}

.settings-btn {
  color: var(--color-text-1);
}

.settings-btn:hover {
  background: var(--color-fill-2);
}
</style>