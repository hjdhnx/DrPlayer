<template>
  <div
    class="video-card"
    :class="{ 'last-clicked': isLastClicked }"
    @click="handleCardClick"
  >
    <div class="card-poster">
      <img :src="cardImage" :alt="cardTitle" @error="handleImageError" />
      <!-- vod_remarks 浮层 (仅video类型显示) -->
      <div v-if="props.type === 'video' && item.vod_remarks" class="video-remarks-overlay" v-html="item.vod_remarks"></div>
      <div class="card-overlay">
        <a-button
          type="primary"
          size="small"
          shape="circle"
          class="overlay-action-btn play-btn"
          title="播放"
          @click.stop="handleCardClick"
        >
          <template #icon>
            <icon-play-arrow />
          </template>
        </a-button>
        <a-button
          v-if="props.type !== 'video'"
          type="outline"
          size="small"
          shape="circle"
          class="overlay-action-btn image-btn"
          title="查看封面"
          @click.stop="handleImageClick"
        >
          <template #icon>
            <icon-eye />
          </template>
        </a-button>
        <a-button
          v-if="showActionButton"
          type="outline"
          size="small"
          shape="circle"
          :class="['overlay-action-btn', actionButtonClass]"
          :title="actionButtonTitle"
          @click.stop="handleActionClick"
        >
          <template #icon>
            <component :is="actionButtonIcon" />
          </template>
        </a-button>
      </div>
    </div>
    <div class="card-info">
      <h3 class="card-title" :title="cardTitle">{{ cardTitle }}</h3>
      <div class="card-meta">
        <a-tag v-if="item.type_name" size="small" color="blue">{{ item.type_name }}</a-tag>
        <a-tag v-if="item.year" size="small" color="green">{{ item.year }}</a-tag>
        <a-tag v-if="item.area" size="small" color="orange">{{ item.area }}</a-tag>
      </div>
      <!-- 历史记录特有信息 -->
      <div v-if="showHistoryInfo" class="card-history">
        <div class="history-episode">
          <icon-play-arrow />
          <span>{{ item.current_route_name }} - {{ item.current_episode_name }}</span>
        </div>
      </div>
      <div v-if="showSourceInfo" class="card-source">
        <icon-link />
        <span>{{ item.api_info.site_name }}</span>
      </div>
      <div v-if="showTimeInfo" class="card-time">
        {{ timeLabel }} {{ formatDate(item[timeField]) }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  IconPlayArrow,
  IconEye,
  IconHeartFill,
  IconDelete
} from '@arco-design/web-vue/es/icon'
import { useVisitedStore } from '@/stores/visitedStore'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  type: {
    type: String,
    default: 'favorite', // 'favorite' | 'history' | 'video'
    validator: (value) => ['favorite', 'history', 'video'].includes(value)
  }
})

const emit = defineEmits(['card-click', 'image-click', 'action-click'])

// 访问状态管理
const visitedStore = useVisitedStore()

// 计算属性
const showHistoryInfo = computed(() => props.type === 'history')

const showSourceInfo = computed(() => props.type !== 'video')

const showTimeInfo = computed(() => props.type !== 'video')

const showActionButton = computed(() => {
  return props.type === 'favorite' || props.type === 'history'
})

const actionButtonClass = computed(() => 'delete-btn')

const actionButtonTitle = computed(() => '删除')

const actionButtonIcon = computed(() => IconDelete)

const timeLabel = computed(() => {
  return props.type === 'favorite' ? '收藏于' : '观看于'
})

const timeField = computed(() => {
  return props.type === 'favorite' ? 'created_at' : 'updated_at'
})

// 处理不同数据格式
const cardImage = computed(() => {
  return props.type === 'video' ? props.item.vod_pic : props.item.pic
})

const cardTitle = computed(() => {
  return props.type === 'video' ? props.item.vod_name : props.item.name
})

// 检查是否是最后点击的视频
const isLastClicked = computed(() => {
  const videoId = props.type === 'video' ? props.item.vod_id : props.item.id
  return visitedStore.isLastClicked(videoId)
})

// 事件处理
const handleCardClick = () => {
  emit('card-click', props.item)
}

const handleImageClick = () => {
  emit('image-click', props.item)
}

const handleActionClick = () => {
  emit('action-click', props.item)
}

const handleImageError = (event) => {
  // 防止无限循环：如果已经是默认图片，就不再重新设置
  if (event.target.src.includes('default-poster.svg')) {
    return
  }
  // 使用BASE_URL确保在任何路由层级和部署环境下都能正确访问
  const basePath = import.meta.env.BASE_URL || '/'
  event.target.src = `${basePath}default-poster.svg`
  event.target.style.objectFit = 'contain'
  event.target.style.backgroundColor = '#f7f8fa'
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.video-card {
  background: var(--dp-bg-surface);
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  cursor: pointer;
  border: 1px solid var(--dp-border-subtle);
  box-shadow: var(--dp-shadow-sm);
}

.video-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--dp-shadow-md);
  border-color: color-mix(in srgb, var(--dp-primary-readable) 30%, var(--dp-border-subtle));
}

/* 最后点击的视频样式 */
.video-card.last-clicked .card-title {
  color: var(--color-primary-6);
}

.card-poster {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  overflow: hidden;
}

.card-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.video-card:hover .card-poster img {
  transform: scale(1.05);
}

.card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(9, 14, 24, 0.18), rgba(9, 14, 24, 0.74));
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  opacity: 0;
  transition: opacity 0.22s ease;
}

.video-card:hover .card-overlay {
  opacity: 1;
}

.overlay-action-btn {
  width: 34px !important;
  height: 34px !important;
  min-width: 34px !important;
  padding: 0 !important;
  border: 1px solid rgba(255, 255, 255, 0.5) !important;
  color: #fff !important;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(10px);
  transform: translateY(6px) scale(0.94);
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease, border-color 0.18s ease;
}

.video-card:hover .overlay-action-btn {
  transform: translateY(0) scale(1);
}

.overlay-action-btn :deep(.arco-icon) {
  font-size: 17px;
}

.play-btn {
  background: linear-gradient(135deg, #16a34a, #22c55e) !important;
  border-color: rgba(134, 239, 172, 0.8) !important;
}

.image-btn {
  background: linear-gradient(135deg, #2563eb, #38bdf8) !important;
  border-color: rgba(147, 197, 253, 0.85) !important;
}

.remove-btn {
  background: linear-gradient(135deg, #e11d48, #fb7185) !important;
  border-color: rgba(253, 164, 175, 0.85) !important;
}

.delete-btn {
  background: linear-gradient(135deg, #dc2626, #f97316) !important;
  border-color: rgba(253, 186, 116, 0.85) !important;
}

.overlay-action-btn:hover {
  transform: translateY(-2px) scale(1.06) !important;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
}

.play-btn:hover,
.image-btn:hover,
.remove-btn:hover,
.delete-btn:hover {
  color: #fff !important;
}

.card-info {
  padding: 12px 12px 14px;
}

.card-title {
  font-size: 14px;
  line-height: 1.3;
  font-weight: 700;
  margin: 0 0 7px 0;
  color: var(--dp-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-meta {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.card-history {
  margin-bottom: 8px;
}

.history-episode {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-primary);
  background: var(--color-primary-light-1);
  padding: 4px 8px;
  border-radius: 4px;
}

.card-source {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-3);
  margin-bottom: 4px;
}

.card-time {
  font-size: 12px;
  color: var(--color-text-4);
}

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
}

/* 最后点击的视频样式 */
.video-card.last-clicked .card-title {
  color: var(--color-primary);
}

@media (min-width: 769px) {
  .video-card {
    border-radius: 10px;
  }

  .video-card:hover {
    transform: translateY(-2px);
  }

  .card-info {
    padding: 8px 8px 10px;
  }

  .card-title {
    margin-bottom: 5px;
    font-size: 12px;
    line-height: 1.25;
  }

  .card-meta,
  .card-history {
    margin-bottom: 5px;
  }

  .card-source,
  .card-time,
  .history-episode {
    font-size: 10px;
    line-height: 1.2;
  }

  .history-episode {
    padding: 3px 5px;
  }
}

@media (max-width: 768px) {
  .video-card {
    border-radius: 10px;
  }

  .video-card:hover {
    transform: none;
  }

  .card-info {
    padding: 7px 6px 8px;
  }

  .card-title {
    margin-bottom: 4px;
    font-size: 12px;
    line-height: 1.25;
    font-weight: 700;
  }

  .card-meta,
  .card-history {
    margin-bottom: 4px;
  }

  .card-source,
  .card-time,
  .history-episode {
    font-size: 10px;
    line-height: 1.2;
  }

  .history-episode {
    padding: 3px 5px;
  }

  .video-remarks-overlay {
    max-width: 72%;
    padding: 2px 4px;
    font-size: 9px;
  }
}
</style>