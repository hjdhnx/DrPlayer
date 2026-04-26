<template>
  <div class="search-grid-container">
    <!-- 错误状态 -->
    <div v-if="error" class="error-state">
      <a-result status="error" :title="error">
        <template #extra>
          <a-button type="primary" @click="$emit('retry')">重试</a-button>
        </template>
      </a-result>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="loading && (!videos || videos.length === 0)" class="loading-state">
      <a-spin :size="32" />
      <div class="loading-text">正在搜索...</div>
    </div>

    <!-- 搜索结果 -->
    <div v-else-if="videos && videos.length > 0" class="search-scroll-container">
      <a-scrollbar
        ref="scrollbarRef"
        :style="{ height: scrollHeight, maxHeight: scrollHeight, overflow: 'auto' }"
        @scroll="handleScroll"
      >
        <div class="search-results-grid" :style="{ padding: gridPadding }">
          <a-grid class="search-video-grid" :cols="{ xs: 2, sm: 3, md: 4, lg: 5, xl: 6, xxl: 8 }" :rowGap="12" :colGap="12">
            <a-grid-item
              v-for="(video, index) in videos"
              :key="`${video.vod_id}_${index}`"
              :class="itemClass"
            >
              <div
                :class="cardClass"
                @click="handleVideoClick(video)"
                @mouseenter="handleMouseEnter(video, index)"
                @mouseleave="handleMouseLeave"
              >
                <!-- 视频海报 -->
                <div :class="posterClass">
                  <!-- 文件夹图标 -->
                  <div v-if="video.type_name === 'folder'" :class="folderIconContainerClass">
                    <icon-folder :class="folderIconClass" />
                  </div>
                  <!-- 文件类型图标 -->
                  <div v-else-if="video.type_name && video.type_name !== 'folder'" :class="fileIconContainerClass">
                    <component :is="getFileIcon(video.type_name)" :class="fileIconClass" />
                  </div>
                  <!-- 视频图片 -->
                  <template v-else>
                    <a-image
                      v-if="variant === 'search-results'"
                      :src="video.vod_pic"
                      :alt="video.vod_name"
                      :class="imageClass"
                      fit="cover"
                      :preview="false"
                      :fallback="defaultPoster"
                    />
                    <img
                      v-else
                      :src="video.vod_pic || defaultPoster"
                      :alt="video.vod_name"
                      :class="imageClass"
                      @error="handleImageError"
                    />
                  </template>

                  <!-- Action 标识 (仅聚合搜索) -->
                  <div v-if="variant === 'aggregation' && video.action" class="action-badge">
                    <icon-play-arrow />
                  </div>

                  <!-- 播放按钮覆盖层 (仅聚合搜索) -->
                  <div v-if="variant === 'aggregation' && video.type_name !== 'folder'" class="play-overlay">
                    <icon-play-arrow />
                  </div>

                  <!-- vod_remarks 浮层 -->
                  <div
                    v-if="video.vod_remarks"
                    :class="remarksOverlayClass"
                  >
                    {{ video.vod_remarks }}
                  </div>
                </div>

                <!-- 视频信息 -->
                <div :class="infoClass">
                  <!-- 标题部分 - 统一使用跑马灯结构 -->
                  <div class="video_list_item_title">
                    <span class="title-text">{{ video.vod_name }}</span>
                  </div>
                  
                  <!-- 聚合搜索的额外元数据 -->
                  <template v-if="variant === 'aggregation'">
                    <div v-if="video.vod_blurb" class="video-desc">{{ video.vod_blurb }}</div>
                    <div class="video-meta">
                      <span v-if="video.vod_note" class="video-note">{{ video.vod_note }}</span>
                      <span v-if="video.vod_year" class="video-year">{{ video.vod_year }}</span>
                      <span v-if="video.vod_area" class="video-area">{{ video.vod_area }}</span>
                    </div>
                  </template>
                </div>
              </div>
            </a-grid-item>
          </a-grid>

          <!-- 加载更多 -->
          <div v-if="hasMore && !loading" class="load-more-container">
            <a-button type="text" @click="$emit('load-more')">
              加载更多
            </a-button>
          </div>

          <!-- 没有更多数据 -->
          <div v-if="!hasMore && videos.length > 0" class="no-more-data">
            没有更多数据了
          </div>

          <!-- 底部间距 -->
          <div class="bottom-spacing"></div>
        </div>
      </a-scrollbar>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <a-empty description="暂无搜索结果" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, nextTick, watch } from 'vue'
import {
  IconFolder,
  IconPlayArrow,
  IconFile,
  IconFileVideo,
  IconFileAudio,
  IconFileImage
} from '@arco-design/web-vue/es/icon'

// 滚动容器引用
const scrollbarRef = ref(null)

const props = defineProps({
  // 视频数据
  videos: {
    type: Array,
    default: () => []
  },
  // 加载状态
  loading: {
    type: Boolean,
    default: false
  },
  // 错误信息
  error: {
    type: String,
    default: ''
  },
  // 是否有更多数据
  hasMore: {
    type: Boolean,
    default: true
  },
  // 组件变体：'search-results' 或 'aggregation'
  variant: {
    type: String,
    default: 'search-results',
    validator: (value) => ['search-results', 'aggregation'].includes(value)
  },
  // 滚动容器高度
  scrollHeight: {
    type: String,
    default: '600px'
  },
  // 网格内边距
  gridPadding: {
    type: String,
    default: '2px 20px 2px 16px'
  },
  // 默认海报
  defaultPoster: {
    type: String,
    default: '/default-poster.jpg'
  }
})

const emit = defineEmits(['video-click', 'load-more', 'retry', 'scroll', 'mouse-enter', 'mouse-leave'])

// 计算样式类名
const itemClass = computed(() => {
  return props.variant === 'search-results' ? 'video_list_item' : 'video-card-item'
})

const cardClass = computed(() => {
  return props.variant === 'search-results' ? 'video_list_hover' : 'video-card'
})

const posterClass = computed(() => {
  return props.variant === 'search-results' ? 'video_list_item_img' : 'video-poster'
})

const imageClass = computed(() => {
  return props.variant === 'search-results' ? '' : 'video-poster-img'
})

const folderIconContainerClass = computed(() => {
  return 'folder-icon-container'
})

const folderIconClass = computed(() => {
  return 'folder-icon'
})

const fileIconContainerClass = computed(() => {
  return 'file-icon-container'
})

const fileIconClass = computed(() => {
  return 'file-icon'
})

const remarksOverlayClass = computed(() => {
  return props.variant === 'search-results' ? 'vod-remarks-overlay' : 'video-remarks-overlay'
})

const infoClass = computed(() => {
  return props.variant === 'search-results' ? 'video-info-simple' : 'video-info'
})

const titleClass = computed(() => {
  return props.variant === 'search-results' ? 'video-title-simple' : 'video-title'
})

// 获取文件类型图标
const getFileIcon = (typeName) => {
  const iconMap = {
    video: IconFileVideo,
    audio: IconFileAudio,
    image: IconFileImage,
    default: IconFile
  }
  return iconMap[typeName] || iconMap.default
}

// 事件处理
const handleVideoClick = (video) => {
  emit('video-click', video)
}

const handleScroll = (event) => {
  emit('scroll', event)
}

const handleMouseEnter = (video, index) => {
  emit('mouse-enter', video, index)
}

const handleMouseLeave = () => {
  emit('mouse-leave')
}

const handleImageError = (event) => {
  event.target.src = props.defaultPoster
}

// 文本溢出检测和跑马灯效果
const checkTextOverflow = () => {
  try {
    const titleElements = document.querySelectorAll('.search-grid-container .title-text')
    if (titleElements && titleElements.length > 0) {
      titleElements.forEach(element => {
        if (element && element.scrollWidth && element.clientWidth) {
          const hasOverflow = element.scrollWidth > element.clientWidth
          if (hasOverflow) {
            element.setAttribute('data-overflow', 'true')
            element.setAttribute('title', element.textContent || '')
          } else {
            element.removeAttribute('data-overflow')
            element.removeAttribute('title')
          }
        }
      })
    }
  } catch (error) {
    console.error('checkTextOverflow error:', error)
  }
}

// 监听videos变化，重新检测文本溢出
watch(() => props.videos, () => {
  nextTick(() => {
    setTimeout(checkTextOverflow, 100)
  })
}, { deep: true })

// 组件挂载后检测文本溢出
onMounted(() => {
  nextTick(() => {
    setTimeout(checkTextOverflow, 200)
  })
})

// 暴露滚动容器访问方法
defineExpose({
  getScrollContainer: () => {
    return scrollbarRef.value?.$el?.querySelector('.arco-scrollbar-container')
  },
  scrollTo: (options) => {
    const container = scrollbarRef.value?.$el?.querySelector('.arco-scrollbar-container')
    if (container) {
      container.scrollTo(options)
    }
  },
  getScrollTop: () => {
    const container = scrollbarRef.value?.$el?.querySelector('.arco-scrollbar-container')
    return container?.scrollTop || 0
  }
})
</script>

<style scoped>
/* 基础容器样式 */
.search-grid-container {
  width: 100%;
  height: 100%;
}

.error-state,
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
}

.loading-text {
  margin-top: 16px;
  color: var(--color-text-3);
}

/* 搜索结果滚动容器 */
.search-scroll-container {
  border-radius: 8px;
  border: 1px solid var(--color-border-2);
  height: 100%;
  overflow: hidden;
}

.search-results-grid {
  padding: 8px 16px;
}

/* SearchResults 样式变体 */
.video_list_item {
  width: 100%;
}

.video_list_hover {
  background: var(--color-bg-2);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--color-border-2);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.video_list_hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: var(--color-primary-light-4);
}

.video_list_item_img {
  position: relative;
  width: 100%;
  height: 280px;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--color-fill-2);
  display: flex;
  align-items: center;
  justify-content: center;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.video_list_item_img :deep(.arco-image) {
  width: 100%;
  height: 100%;
}

.video_list_item_img :deep(.arco-image img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.video_list_hover:hover .video_list_item_img :deep(.arco-image img) {
  transform: scale(1.05);
}

.video-info-simple {
  padding: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.video-title-simple {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-1);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* VideoGrid一致的标题样式 */
.video_list_item_title {
  padding: 6px 8px;
  background: white;
  flex-shrink: 0;
  height: auto;
  min-height: 16px;
  display: flex;
  align-items: center;
  overflow: hidden;
  position: relative;
}

.title-text {
  font-size: 12px;
  font-weight: 500;
  color: #2c2c2c;
  line-height: 1;
  white-space: nowrap;
  transition: color 0.2s ease;
  margin: 0;
  width: 100%;
  display: block;
}

/* 普通状态下隐藏溢出文本 */
.title-text:not([data-overflow="true"]) {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 跑马灯效果 - 电子公告屏幕样式 */
.title-text[data-overflow="true"] {
  animation: marquee 10s linear infinite;
  animation-delay: 1s;
  width: max-content;
  min-width: 100%;
}

.title-text[data-overflow="true"]:hover {
  animation-play-state: paused;
}

@keyframes marquee {
  0% {
    transform: translateX(0);
  }
  15% {
    transform: translateX(0);
  }
  85% {
    transform: translateX(calc(-100% + 100px));
  }
  100% {
    transform: translateX(calc(-100% + 100px));
  }
}

.video_list_hover:hover .title-text {
  color: #1890ff;
}

/* SearchAggregation 样式变体 */
.video-card-item {
  width: 100%;
}

.video-card {
  background: var(--color-bg-2);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--color-border-2);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.video-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: var(--color-primary-light-4);
}

.video-poster {
  position: relative;
  width: 100%;
  height: 280px;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--color-fill-2);
  display: flex;
  align-items: center;
  justify-content: center;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.video-poster-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.video-card:hover .video-poster-img {
  transform: scale(1.05);
}

.video-info {
  padding: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.video-title {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-1);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-desc {
  margin: 0 0 8px 0;
  padding: 0 8px;
  font-size: 12px;
  color: var(--color-text-3);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px 8px 8px;
  font-size: 12px;
  color: var(--color-text-3);
  flex-wrap: wrap;
}

.video-note {
  background: var(--color-primary-light-1);
  color: var(--color-primary-6);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
}

.video-year,
.video-area {
  color: var(--color-text-3);
}

/* 共用样式 */
.folder-icon-container,
.file-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--color-fill-3);
}

.folder-icon,
.file-icon {
  font-size: 48px;
  color: var(--color-text-3);
}

.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50px;
  height: 50px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.video-card:hover .play-overlay {
  opacity: 1;
}

.action-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: var(--color-warning-6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  z-index: 2;
}

.vod-remarks-overlay,
.video-remarks-overlay {
  position: absolute;
  top: 4px;
  right: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  z-index: 2;
}

.load-more-container {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

.no-more-data {
  text-align: center;
  padding: 16px 0;
  color: var(--color-text-3);
  font-size: 14px;
}

.bottom-spacing {
  height: 10px;
}

.search-grid-container,
.search-scroll-container,
.search-grid-container :deep(.arco-scrollbar),
.search-grid-container :deep(.arco-scrollbar-container) {
  min-height: 0;
}

.search-results-grid {
  padding: 8px 12px;
}

.video_list_item_img,
.video-poster {
  height: auto;
  aspect-ratio: 2 / 3;
}

.video_list_item_img :deep(.arco-image),
.video_list_item_img :deep(.arco-image img),
.video-poster-img {
  height: 100%;
}

.video_list_item_title {
  min-height: 34px;
  padding: 9px 10px;
  background: var(--dp-bg-surface);
}

.title-text {
  color: var(--dp-text-primary);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.25;
}

.video_list_hover,
.video-card {
  background: var(--dp-bg-surface);
  border-color: var(--dp-border-subtle);
  border-radius: 12px;
  box-shadow: var(--dp-shadow-sm);
}

.video_list_hover:hover,
.video-card:hover {
  border-color: color-mix(in srgb, var(--dp-primary-readable) 30%, var(--dp-border-subtle));
  box-shadow: var(--dp-shadow-md);
}

.video_list_item_img,
.video-poster {
  border-radius: 12px 12px 0 0;
}

@media (min-width: 769px) {
  .search-video-grid :deep(.arco-grid) {
    row-gap: 18px !important;
    column-gap: 16px !important;
  }
}

@media (max-width: 768px) {
  .search-results-grid {
    padding: 8px;
  }

  .search-video-grid :deep(.arco-grid) {
    row-gap: 8px !important;
    column-gap: 8px !important;
  }

  .error-state,
  .loading-state,
  .empty-state {
    min-height: 240px;
    height: auto;
  }
}
</style>