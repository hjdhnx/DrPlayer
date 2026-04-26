<template>
  <div class="download-task-item" :class="taskStatusClass">
    <!-- 任务基本信息 -->
    <div class="task-info">
      <div class="task-header">
        <div class="task-title">
          <h3>{{ task.novelTitle }}</h3>
          <div class="task-meta">
            <span class="source-info">{{ task.sourceName }}</span>
            <span class="chapter-count">共 {{ task.totalChapters }} 章</span>
            <span class="create-time">{{ formatTime(task.createTime) }}</span>
          </div>
        </div>
        <div class="task-status">
          <a-tag :color="statusColor">{{ statusText }}</a-tag>
        </div>
      </div>

      <!-- 下载进度 -->
      <div class="task-progress" v-if="task.status !== 'pending'">
        <div class="progress-info">
          <span class="progress-text">
            {{ task.completedChapters || 0 }} / {{ task.totalChapters }} 章
            <span v-if="task.status === 'downloading'" class="download-speed">
              ({{ downloadSpeed }})
            </span>
          </span>
          <span class="progress-percent">{{ progressPercent }}%</span>
        </div>
        <a-progress 
          :percent="progressPercent" 
          :status="progressStatus"
          :show-text="false"
          size="small"
        />
      </div>

      <!-- 错误信息 -->
      <div v-if="task.status === 'failed' && task.errorMessage" class="error-message">
        <icon-exclamation-circle-fill />
        {{ task.errorMessage }}
      </div>

      <!-- 任务详情 -->
      <div class="task-details" v-if="showDetails">
        <div class="detail-row">
          <span class="label">下载路径:</span>
          <span class="value">{{ task.downloadPath || '默认路径' }}</span>
        </div>
        <div class="detail-row">
          <span class="label">文件大小:</span>
          <span class="value">{{ getFileSizeDisplay() }}</span>
        </div>
        <div class="detail-row">
          <span class="label">开始时间:</span>
          <span class="value">{{ getStartTimeDisplay() }}</span>
        </div>
        <div class="detail-row" v-if="task.completeTime">
          <span class="label">完成时间:</span>
          <span class="value">{{ formatTime(task.completeTime) }}</span>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="task-actions">
      <a-button-group v-if="task.status === 'downloading'">
        <a-button size="small" @click="$emit('pause', task.id)">
          <template #icon>
            <icon-pause />
          </template>
          暂停
        </a-button>
        <a-button size="small" @click="$emit('cancel', task.id)">
          <template #icon>
            <icon-stop />
          </template>
          取消
        </a-button>
      </a-button-group>

      <a-button-group v-else-if="task.status === 'paused'">
        <a-button size="small" type="primary" @click="$emit('resume', task.id)">
          <template #icon>
            <icon-play-arrow />
          </template>
          继续
        </a-button>
        <a-button size="small" @click="$emit('cancel', task.id)">
          <template #icon>
            <icon-stop />
          </template>
          取消
        </a-button>
      </a-button-group>

      <a-button-group v-else-if="task.status === 'failed'">
        <a-button size="small" type="primary" @click="$emit('retry', task.id)">
          <template #icon>
            <icon-refresh />
          </template>
          重试
        </a-button>
        <a-button size="small" @click="$emit('delete', task.id)">
          <template #icon>
            <icon-delete />
          </template>
          删除
        </a-button>
      </a-button-group>

      <a-button-group v-else-if="task.status === 'completed'">
        <a-dropdown @select="handleExportSelect">
          <a-button size="small" type="primary">
            <template #icon>
              <icon-download />
            </template>
            导出
            <icon-down />
          </a-button>
          <template #content>
            <a-doption value="download">
              <template #icon>
                <icon-download />
              </template>
              下载TXT文件
            </a-doption>
            <a-doption value="gallery">
              <template #icon>
                <icon-book />
              </template>
              导出到书画柜
            </a-doption>
          </template>
        </a-dropdown>
        <a-button size="small" @click="$emit('delete', task.id)">
          <template #icon>
            <icon-delete />
          </template>
          删除
        </a-button>
      </a-button-group>

      <a-button-group v-else-if="task.status === 'pending'">
        <a-button size="small" @click="$emit('delete', task.id)">
          <template #icon>
            <icon-delete />
          </template>
          删除
        </a-button>
      </a-button-group>

      <!-- 通用操作 -->
      <a-button size="small" @click="$emit('view-chapters', task)">
        <template #icon>
          <icon-list />
        </template>
        章节详情
      </a-button>

      <a-button size="small" @click="toggleDetails">
        <template #icon>
          <icon-down v-if="!showDetails" />
          <icon-up v-else />
        </template>
        {{ showDetails ? '收起' : '详情' }}
      </a-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { 
  IconPause, 
  IconPlayArrow, 
  IconStop, 
  IconRefresh, 
  IconDelete, 
  IconDownload, 
  IconList, 
  IconDown, 
  IconUp,
  IconExclamationCircleFill,
  IconBook
} from '@arco-design/web-vue/es/icon'

// Props
const props = defineProps({
  task: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits([
  'retry', 
  'pause', 
  'resume', 
  'cancel', 
  'delete', 
  'export', 
  'view-chapters'
])

// 响应式数据
const showDetails = ref(false)

// 计算属性
const taskStatusClass = computed(() => {
  return `task-${props.task.status}`
})

const statusColor = computed(() => {
  const colors = {
    pending: 'gray',
    downloading: 'blue',
    paused: 'orange',
    completed: 'green',
    failed: 'red',
    cancelled: 'gray'
  }
  return colors[props.task.status] || 'gray'
})

const statusText = computed(() => {
  const texts = {
    pending: '等待中',
    downloading: '下载中',
    paused: '已暂停',
    completed: '已完成',
    failed: '下载失败',
    cancelled: '已取消'
  }
  return texts[props.task.status] || '未知状态'
})

const progressPercent = computed(() => {
  if (!props.task.totalChapters || props.task.totalChapters === 0) return 0
  const completed = props.task.completedChapters || 0
  return Math.round((completed / props.task.totalChapters) * 100)
})

const progressStatus = computed(() => {
  if (props.task.status === 'failed') return 'danger'
  if (props.task.status === 'completed') return 'success'
  return 'normal'
})

const downloadSpeed = computed(() => {
  if (!props.task.downloadSpeed) return '0 章/分钟'
  return `${props.task.downloadSpeed} 章/分钟`
})

// 方法
const toggleDetails = () => {
  showDetails.value = !showDetails.value
}

// 处理导出选择
const handleExportSelect = (value) => {
  if (value === 'download') {
    emit('export', props.task.id, { exportToGallery: false })
  } else if (value === 'gallery') {
    emit('export', props.task.id, { exportToGallery: true })
  }
}

const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString('zh-CN')
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

const getFileSizeDisplay = () => {
  if (props.task.totalSize > 0) {
    return formatFileSize(props.task.totalSize)
  } else if (props.task.status === 'pending') {
    return '等待计算'
  } else if (props.task.status === 'downloading') {
    const downloadedSize = props.task.downloadedSize || 0
    if (downloadedSize > 0) {
      return `${formatFileSize(downloadedSize)} (下载中)`
    }
    return '计算中...'
  } else {
    return '未知'
  }
}

const getStartTimeDisplay = () => {
  if (props.task.startTime) {
    return formatTime(props.task.startTime)
  } else if (props.task.status === 'pending') {
    return '未开始'
  } else if (props.task.status === 'downloading') {
    return '正在启动...'
  } else {
    return '-'
  }
}
</script>

<style scoped>
.download-task-item {
  border: 1px solid var(--color-border-2);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  background: var(--color-bg-2);
  transition: all 0.2s ease;
}

.download-task-item:hover {
  border-color: var(--color-border-3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.task-downloading {
  border-color: var(--color-primary-light-4);
  background: var(--color-primary-light-1);
}

.task-completed {
  border-color: var(--color-success-light-4);
  background: var(--color-success-light-1);
}

.task-failed {
  border-color: var(--color-danger-light-4);
  background: var(--color-danger-light-1);
}

.task-info {
  margin-bottom: 16px;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.task-title h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-1);
}

.task-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--color-text-3);
}

.task-progress {
  margin-bottom: 12px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 12px;
  color: var(--color-text-2);
}

.download-speed {
  color: var(--color-primary-6);
}

.progress-percent {
  font-weight: 600;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--color-danger-light-1);
  border: 1px solid var(--color-danger-light-4);
  border-radius: 4px;
  font-size: 12px;
  color: var(--color-danger-6);
  margin-bottom: 12px;
}

.task-details {
  padding: 12px;
  background: var(--color-bg-1);
  border-radius: 4px;
  margin-bottom: 12px;
}

.detail-row {
  display: flex;
  margin-bottom: 6px;
  font-size: 12px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.label {
  width: 80px;
  color: var(--color-text-3);
  flex-shrink: 0;
}

.value {
  color: var(--color-text-2);
  flex: 1;
}

.task-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

@media (min-width: 769px) {
  .download-task-item {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    margin-bottom: 6px;
    border-radius: var(--dp-radius-lg);
    background: var(--dp-bg-surface-muted);
    border-color: var(--dp-border-subtle);
  }

  .download-task-item:hover {
    border-color: var(--dp-border);
    box-shadow: var(--dp-shadow-sm);
  }

  .task-info {
    min-width: 0;
    margin-bottom: 0;
  }

  .task-header {
    align-items: center;
    gap: 10px;
    margin-bottom: 6px;
  }

  .task-title {
    min-width: 0;
  }

  .task-title h3 {
    margin-bottom: 2px;
    font-size: 14px;
    line-height: 1.25;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .task-meta {
    gap: 8px;
    font-size: 11px;
    line-height: 1.2;
    flex-wrap: wrap;
  }

  .task-status {
    flex-shrink: 0;
  }

  .task-progress {
    margin-bottom: 6px;
  }

  .progress-info {
    margin-bottom: 3px;
    font-size: 11px;
  }

  .error-message {
    margin-bottom: 6px;
    padding: 5px 8px;
    font-size: 11px;
  }

  .task-details {
    margin-bottom: 0;
    padding: 8px;
  }

  .detail-row {
    margin-bottom: 4px;
    font-size: 11px;
  }

  .task-actions {
    justify-content: flex-end;
    gap: 6px;
    flex-wrap: nowrap;
  }

  .task-actions :deep(.arco-btn) {
    height: 28px;
    padding: 0 8px;
    font-size: 12px;
  }

  .task-actions :deep(.arco-btn-icon) {
    font-size: 14px;
  }
}
</style>