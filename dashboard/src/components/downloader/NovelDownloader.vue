<template>
  <div class="novel-downloader">
    <!-- 下载器头部 -->
    <div class="downloader-header">
      <div class="header-left">
        <h2 class="downloader-title">
          <icon-download />
          下载
        </h2>
        <div class="download-stats">
          <span class="stat-item">
            总任务: {{ totalTasks }}
          </span>
          <span class="stat-item">
            已完成: {{ completedTasks }}
          </span>
          <span class="stat-item">
            进行中: {{ downloadingTasks }}
          </span>
          <span class="stat-item">
            失败: {{ failedTasks }}
          </span>
        </div>
      </div>
      <div class="header-right">
        <a-button type="primary" @click="showAddTaskDialog = true">
          <template #icon>
            <icon-plus />
          </template>
          新建下载
        </a-button>
        <a-button @click="clearCompleted" :disabled="completedTasks === 0">
          清理已完成
        </a-button>
        <a-button @click="handleClose">
          <template #icon>
            <icon-close />
          </template>
          关闭
        </a-button>
      </div>
    </div>

    <!-- 过滤标签 -->
    <div class="filter-tabs">
      <div class="filter-left">
        <a-radio-group v-model="activeFilter" type="button">
          <a-radio value="all">全部 ({{ totalTasks }})</a-radio>
          <a-radio value="downloading">下载中 ({{ downloadingTasks }})</a-radio>
          <a-radio value="completed">已完成 ({{ completedTasks }})</a-radio>
          <a-radio value="failed">失败 ({{ failedTasks }})</a-radio>
          <a-radio value="pending">等待中 ({{ pendingTasks }})</a-radio>
        </a-radio-group>
      </div>
      
      <!-- 储存空间统计 -->
        <div class="storage-stats" v-if="downloadStore.tasks.length > 0">
          <div class="storage-info">
            <div class="storage-header">
               <icon-download class="storage-icon" />
               <span class="storage-title">本地储存空间</span>
              <a-tag 
                :color="storageStats.isOverLimit ? 'red' : storageStats.isNearLimit ? 'orange' : 'green'"
                size="small"
              >
                {{ Math.round(storageStats.usagePercentage) }}%
              </a-tag>
            </div>
            <div class="storage-progress">
              <a-progress 
                :percent="storageStats.usagePercentage" 
                :color="storageStats.isOverLimit ? '#f53f3f' : storageStats.isNearLimit ? '#ff7d00' : '#00b42a'"
                :show-text="false"
                size="small"
              />
            </div>
            <div class="storage-details">
              <span class="storage-used">已用: {{ storageStats.formattedUsed }}</span>
              <span class="storage-available">可用: {{ storageStats.formattedAvailable }}</span>
              <span class="storage-total">总计: {{ storageStats.formattedTotal }}</span>
            </div>
          </div>
        </div>
    </div>

    <!-- 下载任务列表 -->
    <div class="download-list">
      <div v-if="filteredTasks.length === 0" class="empty-state">
        <a-empty description="暂无下载任务" />
      </div>
      <div v-else>
        <DownloadTaskItem
          v-for="task in filteredTasks"
          :key="task.id"
          :task="task"
          @retry="handleRetryTask"
          @pause="handlePauseTask"
          @resume="handleResumeTask"
          @cancel="handleCancelTask"
          @delete="handleDeleteTask"
          @export="handleExportTask"
          @view-chapters="handleViewChapters"
        />
      </div>
    </div>

    <!-- 新建下载任务对话框 -->
    <AddDownloadTaskDialog
      :visible="showAddTaskDialog"
      @close="showAddTaskDialog = false"
      @confirm="handleAddTask"
    />

    <!-- 章节详情对话框 -->
    <ChapterDetailsDialog
      :visible="showChapterDialog"
      :task="currentSelectedTask"
      @close="showChapterDialog = false"
      @retry-chapter="handleRetryChapter"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { 
  IconDownload, 
  IconPlus, 
  IconClose 
} from '@arco-design/web-vue/es/icon'
import DownloadTaskItem from './DownloadTaskItem.vue'
import AddDownloadTaskDialog from './AddDownloadTaskDialog.vue'
import ChapterDetailsDialog from './ChapterDetailsDialog.vue'
import { useDownloadStore } from '@/stores/downloadStore'
import downloadService from '@/services/downloadService'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['close'])

// 路由和状态管理
const router = useRouter()
const downloadStore = useDownloadStore()

// 响应式数据
const activeFilter = ref('all')
const showAddTaskDialog = ref(false)
const showChapterDialog = ref(false)
const selectedTask = ref(null)
const storageStats = ref({}) // 储存空间统计

// 计算属性
const totalTasks = computed(() => downloadStore.tasks.length)
const completedTasks = computed(() => downloadStore.tasks.filter(task => task.status === 'completed').length)
const downloadingTasks = computed(() => downloadStore.tasks.filter(task => task.status === 'downloading').length)
const failedTasks = computed(() => downloadStore.tasks.filter(task => task.status === 'failed').length)
const pendingTasks = computed(() => downloadStore.tasks.filter(task => task.status === 'pending').length)

const filteredTasks = computed(() => {
  if (activeFilter.value === 'all') {
    return downloadStore.tasks
  }
  return downloadStore.tasks.filter(task => task.status === activeFilter.value)
})

// 实时获取选中任务的最新数据
const currentSelectedTask = computed(() => {
  if (!selectedTask.value) return null
  // 从最新的任务列表中找到对应的任务
  return downloadStore.tasks.find(task => task.id === selectedTask.value.id) || selectedTask.value
})

// 方法
const handleClose = () => {
  // 使用Vue Router导航，返回上一页或首页
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/')
  }
}

const handleAddTask = (taskData) => {
  downloadStore.addTask(taskData)
  updateStorageStats() // 更新储存统计
  showAddTaskDialog.value = false
  Message.success('下载任务已添加')
}

const handleRetryTask = (taskId) => {
  downloadStore.retryTask(taskId)
  updateStorageStats() // 更新储存统计
  Message.info('正在重试下载任务')
}

const handlePauseTask = (taskId) => {
  downloadStore.pauseTask(taskId)
  updateStorageStats() // 更新储存统计
  Message.info('下载任务已暂停')
}

const handleResumeTask = (taskId) => {
  downloadStore.resumeTask(taskId)
  updateStorageStats() // 更新储存统计
  Message.info('下载任务已恢复')
}

const handleCancelTask = (taskId) => {
  downloadStore.cancelTask(taskId)
  updateStorageStats() // 更新储存统计
  Message.info('下载任务已取消')
}

const handleDeleteTask = (taskId) => {
  downloadStore.deleteTask(taskId)
  updateStorageStats() // 更新储存统计
  Message.success('下载任务已删除')
}

const handleExportTask = async (taskId, options = {}) => {
  await downloadStore.exportTask(taskId, options)
}

const handleViewChapters = (task) => {
  selectedTask.value = task
  showChapterDialog.value = true
}

const handleRetryChapter = (taskId, chapterIndex) => {
  downloadStore.retryChapter(taskId, chapterIndex)
  Message.info('正在重试章节下载')
}

const clearCompleted = () => {
  downloadStore.clearCompleted()
  updateStorageStats() // 更新储存统计
  Message.success('已清理完成的下载任务')
}

// 更新储存空间统计
const updateStorageStats = () => {
  storageStats.value = downloadService.getStorageStats()
}

// 生命周期
onMounted(() => {
  downloadStore.loadTasks()
  updateStorageStats() // 初始化储存统计
})

onUnmounted(() => {
  downloadStore.saveTasks()
})
</script>

<style scoped>
.novel-downloader {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-1);
}

.downloader-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border-2);
  background: var(--color-bg-2);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.downloader-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-1);
}

.download-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  font-size: 14px;
  color: var(--color-text-2);
}

.header-right {
  display: flex;
  gap: 12px;
}

.filter-tabs {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border-2);
}

.filter-left {
  flex: 1;
}

.storage-stats {
  min-width: 200px;
}

.storage-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.storage-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.storage-icon {
  font-size: 14px;
  color: var(--color-text-2);
}

.storage-title {
  font-size: 12px;
  color: var(--color-text-2);
  font-weight: 500;
}

.storage-progress {
  width: 100%;
}

.storage-details {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--color-text-3);
}

.storage-used {
  color: var(--color-text-1);
  font-weight: 500;
}

.storage-available {
  color: var(--color-text-2);
}

.storage-total {
  color: var(--color-text-2);
}

.download-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px 24px;
  scroll-behavior: smooth;
}

/* 自定义滚动条样式 */
.download-list::-webkit-scrollbar {
  width: 6px;
}

.download-list::-webkit-scrollbar-track {
  background: var(--color-fill-2);
  border-radius: 3px;
}

.download-list::-webkit-scrollbar-thumb {
  background: var(--color-fill-4);
  border-radius: 3px;
  transition: background-color 0.2s ease;
}

.download-list::-webkit-scrollbar-thumb:hover {
  background: var(--color-fill-3);
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

@media (min-width: 769px) {
  .novel-downloader {
    background: var(--dp-bg-surface);
  }

  .downloader-header {
    padding: 10px 14px;
    background: var(--dp-bg-surface);
    border-bottom-color: var(--dp-border-subtle);
  }

  .header-left {
    gap: 14px;
    min-width: 0;
  }

  .downloader-title {
    gap: 6px;
    font-size: 16px;
    line-height: 1.25;
    white-space: nowrap;
  }

  .download-stats {
    gap: 8px;
    flex-wrap: wrap;
  }

  .stat-item {
    padding: 3px 8px;
    border-radius: 999px;
    background: var(--dp-bg-surface-muted);
    border: 1px solid var(--dp-border-subtle);
    font-size: 12px;
    line-height: 1.2;
  }

  .header-right {
    gap: 6px;
    flex-shrink: 0;
  }

  .header-right :deep(.arco-btn) {
    height: 30px;
    padding: 0 10px;
    font-size: 12px;
  }

  .filter-tabs {
    gap: 12px;
    padding: 8px 14px;
    border-bottom-color: var(--dp-border-subtle);
  }

  .filter-left {
    min-width: 0;
  }

  .filter-left :deep(.arco-radio-group-button) {
    min-height: 30px;
  }

  .filter-left :deep(.arco-radio-button-content) {
    padding: 4px 10px;
    font-size: 12px;
    line-height: 1.2;
  }

  .storage-stats {
    min-width: 260px;
    max-width: 340px;
  }

  .storage-info {
    gap: 4px;
  }

  .storage-header {
    gap: 6px;
  }

  .storage-title,
  .storage-details {
    font-size: 11px;
  }

  .download-list {
    padding: 0;
  }

  .empty-state {
    height: 220px;
    border: 1px solid var(--dp-border-subtle);
    border-radius: var(--dp-radius-lg);
    background: var(--dp-bg-surface-muted);
  }
}
@media (max-width: 768px) {
  .novel-downloader {
    min-height: 100%;
    background:
      radial-gradient(circle at top right, rgba(114, 46, 209, 0.1), transparent 32%),
      var(--dp-bg-app);
  }

  .downloader-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 10px 0 12px;
    background: transparent;
    border-bottom: none;
  }

  .header-left {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .downloader-title {
    font-size: 22px;
    line-height: 1.25;
    font-weight: 800;
    color: var(--dp-text-primary);
  }

  .download-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .stat-item {
    min-width: 0;
    padding: 10px 8px;
    border-radius: 16px;
    background: var(--dp-bg-surface);
    border: 1px solid var(--dp-border-subtle);
    box-shadow: var(--dp-shadow-sm);
    text-align: center;
    font-size: 12px;
  }

  .header-right {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .header-right :deep(.arco-btn) {
    min-width: 0;
    height: 40px;
    border-radius: 999px;
    padding: 0 10px;
  }

  .filter-tabs {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 0 0 12px;
    border-bottom: none;
  }

  .filter-left {
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .filter-left::-webkit-scrollbar {
    display: none;
  }

  .filter-left :deep(.arco-radio-group-button) {
    display: inline-flex;
    min-width: max-content;
    padding: 3px;
    border-radius: 999px;
    background: var(--dp-bg-surface);
    border: 1px solid var(--dp-border-subtle);
    box-shadow: var(--dp-shadow-sm);
  }

  .filter-left :deep(.arco-radio-button) {
    border-radius: 999px;
  }

  .filter-left :deep(.arco-radio-button-content) {
    min-width: 68px;
    text-align: center;
  }

  .storage-stats {
    min-width: 0;
    padding: 12px;
    border-radius: 18px;
    background: var(--dp-bg-surface);
    border: 1px solid var(--dp-border-subtle);
    box-shadow: var(--dp-shadow-sm);
  }

  .download-list {
    padding: 0 0 12px;
    min-height: 0;
  }

  .download-list :deep(.download-task-item) {
    border-radius: 18px;
    background: var(--dp-bg-surface);
    border-color: var(--dp-border-subtle);
    box-shadow: var(--dp-shadow-sm);
  }

  .empty-state {
    height: 320px;
    border-radius: 22px;
    background: var(--dp-bg-surface);
    border: 1px solid var(--dp-border-subtle);
  }
}

@media (max-width: 420px) {
  .header-right {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .header-right :deep(.arco-btn:last-child) {
    grid-column: 1 / -1;
  }
}
</style>