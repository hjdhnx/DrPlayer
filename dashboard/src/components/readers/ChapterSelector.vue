<template>
  <div class="chapter-selector">
    <!-- 章节线路选择 -->
    <a-card class="route-card" v-if="chapterRoutes.length > 1">
      <template #title>
        <div class="card-title">
          <icon-book />
          <span>章节线路</span>
        </div>
      </template>
      <div class="route-tabs">
        <a-button
          v-for="(route, index) in chapterRoutes"
          :key="index"
          :type="currentRoute === index ? 'primary' : 'outline'"
          @click="switchRoute(index)"
          class="route-btn"
        >
          {{ route.name }}
          <span class="route-count">({{ route.chapters.length }}章)</span>
        </a-button>
      </div>
    </a-card>

    <!-- 章节列表 -->
    <a-card class="chapter-card">
      <template #title>
        <div class="card-title">
          <icon-list />
          <span>章节列表</span>
          <span class="chapter-total" v-if="currentRouteChapters.length > 0">
            共{{ currentRouteChapters.length }}章
          </span>
        </div>
      </template>

      <!-- 搜索框 -->
      <div class="chapter-search" v-if="currentRouteChapters.length > 10">
        <a-input-search
          v-model="searchKeyword"
          placeholder="搜索章节..."
          allow-clear
          class="search-input"
        >
          <template #prefix>
            <icon-search />
          </template>
        </a-input-search>
      </div>

      <!-- 章节网格 -->
      <div class="chapter-grid" v-if="filteredChapters.length > 0">
        <div
          v-for="(chapter, index) in filteredChapters"
          :key="chapter.originalIndex"
          :class="[
            'chapter-item',
            { 
              'active': chapter.originalIndex === currentChapter,
              'reading': chapter.originalIndex < currentChapter
            }
          ]"
          @click="selectChapter(chapter.originalIndex)"
          :title="chapter.name"
        >
          <div class="chapter-number">{{ chapter.originalIndex + 1 }}</div>
          <div class="chapter-name">{{ chapter.name }}</div>
          <div class="chapter-status">
            <icon-check v-if="chapter.originalIndex < currentChapter" class="read-icon" />
            <icon-play-arrow v-else-if="chapter.originalIndex === currentChapter" class="current-icon" />
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="searchKeyword" class="empty-search">
        <a-empty description="未找到匹配的章节" />
        <a-button type="text" @click="searchKeyword = ''" class="clear-search-btn">
          清除搜索
        </a-button>
      </div>

      <div v-else class="empty-chapters">
        <a-empty description="暂无章节" />
      </div>

      <!-- 快速跳转 -->
      <div class="quick-nav" v-if="currentRouteChapters.length > 20">
        <div class="quick-nav-title">快速跳转</div>
        <div class="quick-nav-buttons">
          <a-button size="small" @click="scrollToChapter(0)" type="text">
            第一章
          </a-button>
          <a-button size="small" @click="scrollToChapter(currentChapter)" type="text">
            当前章节
          </a-button>
          <a-button size="small" @click="scrollToChapter(currentRouteChapters.length - 1)" type="text">
            最新章节
          </a-button>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { 
  IconBook, 
  IconList, 
  IconSearch, 
  IconCheck, 
  IconPlayArrow 
} from '@arco-design/web-vue/es/icon'

// Props
const props = defineProps({
  bookDetail: {
    type: Object,
    required: true
  },
  currentRoute: {
    type: Number,
    default: 0
  },
  currentChapter: {
    type: Number,
    default: 0
  }
})

// Emits
const emit = defineEmits(['route-change', 'chapter-change'])

// 响应式数据
const searchKeyword = ref('')

// 计算属性
const chapterRoutes = computed(() => {
  if (!props.bookDetail?.vod_play_url) return []
  
  const playUrls = props.bookDetail.vod_play_url.split('$$$')
  return playUrls.map((routeData, index) => {
    const [routeName, ...chapterData] = routeData.split('$')
    const chapters = chapterData.map((item, chapterIndex) => {
      const [name, url] = item.split('#')
      return {
        name: name || `第${chapterIndex + 1}章`,
        url: url || '',
        index: chapterIndex
      }
    }).filter(chapter => chapter.url) // 过滤掉没有URL的章节
    
    return {
      name: routeName || `线路${index + 1}`,
      chapters,
      index
    }
  }).filter(route => route.chapters.length > 0) // 过滤掉没有章节的线路
})

const currentRouteChapters = computed(() => {
  const route = chapterRoutes.value[props.currentRoute]
  return route ? route.chapters : []
})

const filteredChapters = computed(() => {
  if (!searchKeyword.value.trim()) {
    return currentRouteChapters.value.map((chapter, index) => ({
      ...chapter,
      originalIndex: index
    }))
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  return currentRouteChapters.value
    .map((chapter, index) => ({
      ...chapter,
      originalIndex: index
    }))
    .filter(chapter => 
      chapter.name.toLowerCase().includes(keyword) ||
      (chapter.originalIndex + 1).toString().includes(keyword)
    )
})

// 方法
const switchRoute = (routeIndex) => {
  if (routeIndex !== props.currentRoute) {
    emit('route-change', routeIndex)
  }
}

const selectChapter = (chapterIndex) => {
  if (chapterIndex !== props.currentChapter) {
    emit('chapter-change', chapterIndex)
  }
}

const scrollToChapter = async (chapterIndex) => {
  await nextTick()
  const chapterElement = document.querySelector(`.chapter-item:nth-child(${chapterIndex + 1})`)
  if (chapterElement) {
    chapterElement.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    })
  }
}

// 监听当前章节变化，自动滚动到当前章节
watch(() => props.currentChapter, async (newChapter) => {
  if (newChapter >= 0) {
    await nextTick()
    scrollToChapter(newChapter)
  }
}, { immediate: true })

// 监听线路变化，清除搜索
watch(() => props.currentRoute, () => {
  searchKeyword.value = ''
})
</script>

<style scoped>
.chapter-selector {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.route-card,
.chapter-card {
  background: var(--color-bg-2);
  border: 1px solid var(--color-border-2);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--color-text-1);
}

.chapter-total {
  margin-left: auto;
  font-size: 12px;
  color: var(--color-text-3);
  font-weight: normal;
}

.route-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.route-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

.route-count {
  font-size: 12px;
  opacity: 0.8;
}

.chapter-search {
  margin-bottom: 16px;
}

.search-input {
  max-width: 300px;
}

.chapter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
  max-height: 600px;
  overflow-y: auto;
  padding: 4px;
}

.chapter-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--color-bg-1);
  border: 1px solid var(--color-border-2);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.chapter-item:hover {
  background: var(--color-fill-2);
  border-color: var(--color-border-3);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chapter-item.active {
  background: var(--color-primary-light-1);
  border-color: var(--color-primary-6);
  color: var(--color-primary-6);
}

.chapter-item.reading {
  background: var(--color-success-light-1);
  border-color: var(--color-success-3);
}

.chapter-number {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-fill-2);
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-2);
}

.chapter-item.active .chapter-number {
  background: var(--color-primary-6);
  color: white;
}

.chapter-item.reading .chapter-number {
  background: var(--color-success-6);
  color: white;
}

.chapter-name {
  flex: 1;
  font-size: 13px;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chapter-status {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.read-icon {
  color: var(--color-success-6);
  font-size: 14px;
}

.current-icon {
  color: var(--color-primary-6);
  font-size: 14px;
}

.empty-search,
.empty-chapters {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.clear-search-btn {
  margin-top: 12px;
}

.quick-nav {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border-2);
}

.quick-nav-title {
  font-size: 12px;
  color: var(--color-text-3);
  margin-bottom: 8px;
}

.quick-nav-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chapter-selector {
    padding: 12px;
    gap: 12px;
  }
  
  .chapter-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 6px;
    max-height: 500px;
  }
  
  .chapter-item {
    padding: 10px;
  }
  
  .chapter-number {
    width: 28px;
    height: 28px;
    font-size: 11px;
  }
  
  .chapter-name {
    font-size: 12px;
  }
  
  .route-tabs {
    gap: 6px;
  }
  
  .search-input {
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .chapter-grid {
    grid-template-columns: 1fr;
    gap: 4px;
  }
  
  .chapter-item {
    padding: 8px;
  }
  
  .quick-nav-buttons {
    justify-content: center;
  }
}

/* 滚动条样式 */
.chapter-grid::-webkit-scrollbar {
  width: 6px;
}

.chapter-grid::-webkit-scrollbar-track {
  background: var(--color-fill-1);
  border-radius: 3px;
}

.chapter-grid::-webkit-scrollbar-thumb {
  background: var(--color-fill-3);
  border-radius: 3px;
}

.chapter-grid::-webkit-scrollbar-thumb:hover {
  background: var(--color-fill-4);
}
</style>