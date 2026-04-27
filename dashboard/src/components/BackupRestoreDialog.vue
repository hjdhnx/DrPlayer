<template>
  <a-modal
    v-model:visible="visible"
    title="数据备份还原"
    width="min(520px, calc(100vw - 24px))"
    :footer="false"
    modal-class="backup-restore-dialog"
    @cancel="handleCancel"
  >
    <div class="backup-restore-container">
      <!-- 数据统计信息 -->
      <div class="stats-section">
        <h3 class="section-title">
          <icon-info-circle class="title-icon" />
          当前数据统计
        </h3>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ stats.settings }}</div>
            <div class="stat-label">设置项</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.favorites }}</div>
            <div class="stat-label">收藏</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.watchHistory }}</div>
            <div class="stat-label">观看记录</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.parsers }}</div>
            <div class="stat-label">解析器</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.sites }}</div>
            <div class="stat-label">站点</div>
          </div>
        </div>
        <div class="data-size">
          数据大小: {{ formatSize(stats.totalSize) }}
        </div>
      </div>

      <!-- 备份操作 -->
      <div class="operation-section">
        <h3 class="section-title">
          <icon-download class="title-icon" />
          数据备份
        </h3>
        <div class="operation-content">
          <p class="operation-desc">
            将当前所有设置、收藏、历史记录、解析器等数据导出为JSON文件
          </p>
          <a-button
            type="primary"
            size="large"
            :loading="backupLoading"
            @click="handleBackup"
          >
            <template #icon>
              <icon-download />
            </template>
            导出备份文件
          </a-button>
        </div>
      </div>

      <!-- 还原操作 -->
      <div class="operation-section">
        <h3 class="section-title">
          <icon-upload class="title-icon" />
          数据还原
        </h3>
        <div class="operation-content">
          <p class="operation-desc">
            选择之前导出的备份文件来还原设置、收藏、历史记录、解析器等数据
          </p>
          <div class="restore-actions">
            <a-upload
              ref="uploadRef"
              :key="uploadKey"
              :show-file-list="false"
              :auto-upload="false"
              :custom-request="() => {}"
              :limit="1"
              accept=".json"
              @change="handleFileChange"
            >
              <a-button size="large">
                <template #icon>
                  <icon-folder />
                </template>
                选择备份文件
              </a-button>
            </a-upload>
            
            <!-- 手动显示文件列表 -->
            <div v-if="fileList.length > 0" class="custom-file-list">
              <div 
                v-for="fileItem in fileList" 
                :key="fileItem.uid"
                class="custom-upload-item"
              >
                <div class="file-info">
                  <icon-file class="file-icon" />
                  <span class="file-name">{{ fileItem.name }}</span>
                  <span class="file-size">({{ formatSize(fileItem.size) }})</span>
                </div>
                <a-button 
                  type="text" 
                  size="small" 
                  @click="handleRemoveFile(fileItem)"
                  class="remove-btn"
                >
                  <template #icon>
                    <icon-close />
                  </template>
                </a-button>
              </div>
            </div>
            
            <a-button
              type="primary"
              size="large"
              :loading="restoreLoading"
              :disabled="!canRestore"
              @click="handleRestore"
            >
              <template #icon>
                <icon-upload />
              </template>
              还原数据
            </a-button>
          </div>
        </div>
      </div>

      <!-- 警告提示 -->
      <div class="warning-section">
        <a-alert
          type="warning"
          show-icon
        >
          <template #icon>
            <icon-exclamation-circle />
          </template>
          <div>
            <strong>重要提示：</strong>
            <ul class="warning-list">
              <li>还原数据将覆盖当前所有设置和用户数据</li>
              <li>建议在还原前先备份当前数据</li>
              <li>还原完成后需要刷新页面才能生效</li>
            </ul>
          </div>
        </a-alert>
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import {
  IconInfoCircle,
  IconDownload,
  IconUpload,
  IconFolder,
  IconFile,
  IconClose,
  IconExclamationCircle
} from '@arco-design/web-vue/es/icon'
import backupService from '@/services/backupService'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:visible'])

// 响应式数据
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const stats = ref({
  settings: 0,
  favorites: 0,
  watchHistory: 0,
  sites: 0,
  parsers: 0,
  totalSize: 0
})

const backupLoading = ref(false)
const restoreLoading = ref(false)
const selectedFile = ref(null)
const fileList = ref([])
const uploadRef = ref(null)
const uploadKey = ref(0) // 用于强制重新渲染Upload组件

// 计算属性：是否可以还原
const canRestore = computed(() => {
  const result = !!selectedFile.value
  console.log('canRestore 计算结果:', result, 'selectedFile:', selectedFile.value)
  return result
})

// 格式化文件大小
const formatSize = (bytes) => {
  // 处理无效输入
  if (bytes === null || bytes === undefined || isNaN(bytes) || bytes === 0) {
    return '0 B'
  }
  
  const numBytes = Number(bytes)
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(numBytes) / Math.log(k))
  return parseFloat((numBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 加载数据统计
const loadStats = () => {
  try {
    stats.value = backupService.getBackupStats()
  } catch (error) {
    console.error('加载数据统计失败:', error)
  }
}

// 处理备份
const handleBackup = async () => {
  backupLoading.value = true
  try {
    const result = await backupService.exportBackupData()
    if (result.success) {
      // 刷新统计数据
      loadStats()
    }
  } catch (error) {
    console.error('备份失败:', error)
    Message.error('备份失败: ' + error.message)
  } finally {
    backupLoading.value = false
  }
}

// 处理文件变化事件
const handleFileChange = (fileListParam, file) => {
  console.log('=== 文件变化事件调试信息 ===')
  console.log('fileListParam:', fileListParam)
  console.log('file:', file)
  
  // 如果文件列表为空，清空状态
  if (!fileListParam || fileListParam.length === 0) {
    selectedFile.value = null
    fileList.value = []
    console.log('文件列表已清空')
    return
  }
  
  // 处理文件添加
  if (file && file.file) {
    const actualFile = file.file
    console.log('实际文件对象:', actualFile)
    console.log('文件名:', actualFile.name)
    console.log('文件大小:', actualFile.size, typeof actualFile.size)
    console.log('文件类型:', actualFile.type)
    
    // 检查文件类型
    if (!actualFile.name.endsWith('.json')) {
      Message.error('请选择JSON格式的备份文件')
      selectedFile.value = null
      fileList.value = []
      return
    }
    
    // 检查文件大小 (限制10MB)
    if (actualFile.size > 10 * 1024 * 1024) {
      Message.error('文件大小不能超过10MB')
      selectedFile.value = null
      fileList.value = []
      return
    }
    
    // 更新选中的文件和文件列表
    selectedFile.value = actualFile
    fileList.value = [{
      uid: file.uid || Date.now().toString(),
      name: actualFile.name,
      size: actualFile.size,
      status: 'success',
      file: actualFile,
      percent: 100
    }]
    
    console.log('selectedFile 设置为:', selectedFile.value)
    console.log('fileList 设置为:', fileList.value)
    console.log('canRestore 计算结果:', !!selectedFile.value)
    
    Message.success('文件选择成功，点击"还原数据"开始还原')
  }
}



// 处理文件移除
const handleRemoveFile = (file) => {
  selectedFile.value = null
  fileList.value = []
  // 强制重新渲染Upload组件
  uploadKey.value++
  
  Message.info('已移除选中的备份文件')
}



// 处理还原
const handleRestore = async () => {
  if (!selectedFile.value) {
    Message.error('请先选择备份文件')
    return
  }
  
  // 确认对话框
  Modal.confirm({
    title: '确认还原数据',
    content: '此操作将覆盖当前所有数据，是否继续？',
    okText: '确认还原',
    cancelText: '取消',
    onOk: async () => {
      restoreLoading.value = true
      try {
        const result = await backupService.importBackupFromFile(selectedFile.value)
        if (result.success) {
          selectedFile.value = null
          fileList.value = []
          loadStats()
          
          if (result.needsReload) {
            Modal.confirm({
              title: '还原成功',
              content: '数据还原成功！需要刷新页面才能生效，是否立即刷新？',
              okText: '立即刷新',
              cancelText: '稍后刷新',
              onOk: () => {
                window.location.reload()
              }
            })
          }
        }
      } catch (error) {
        console.error('还原失败:', error)
        Message.error('还原失败: ' + error.message)
      } finally {
        restoreLoading.value = false
      }
    }
  })
}

// 清空选中的文件
const clearSelectedFile = () => {
  selectedFile.value = null
  fileList.value = []
  // 强制重新渲染Upload组件
  uploadKey.value++
}

// 处理对话框关闭
const handleCancel = () => {
  visible.value = false
  clearSelectedFile()
}

// 监听对话框显示状态
watch(visible, (newVisible) => {
  if (newVisible) {
    loadStats()
  }
})

// 组件挂载时加载统计数据
onMounted(() => {
  loadStats()
})
</script>

<style>
.backup-restore-dialog .arco-modal-body {
  overflow: hidden;
}

@media (max-width: 768px) {
  .backup-restore-dialog {
    width: calc(100vw - 24px) !important;
  }

  .backup-restore-dialog .arco-modal-header {
    padding: 12px 14px;
  }

  .backup-restore-dialog .arco-modal-body {
    max-height: min(72vh, calc(100vh - 150px));
    padding: 10px 12px;
  }
}
</style>

<style scoped>
.backup-restore-container {
  padding: 4px 0; /* 进一步减少容器内边距 */
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-1);
  margin-bottom: 8px;
}

.title-icon {
  margin-right: 6px;
  color: var(--color-primary);
}

.stats-section {
  margin-bottom: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}

.stat-item {
  text-align: center;
  padding: 8px 4px;
  background: var(--color-bg-2);
  border-radius: 6px;
  border: 1px solid var(--color-border-2);
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: 2px;
  line-height: 1.2;
}

.stat-label {
  font-size: 11px;
  color: var(--color-text-3);
  line-height: 1.2;
}

.data-size {
  text-align: center;
  font-size: 12px;
  color: var(--color-text-2);
  padding: 6px;
  background: var(--color-bg-1);
  border-radius: 4px;
  line-height: 1.2;
}

.operation-section {
  margin-bottom: 16px;
}

.operation-content {
  background: var(--color-bg-1);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--color-border-2);
}

.operation-desc {
  margin-bottom: 10px;
  color: var(--color-text-2);
  line-height: 1.3;
  font-size: 13px;
}

.restore-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
  align-items: flex-start;
}

.selected-file {
  display: flex;
  align-items: center;
  padding: 8px;
  background: var(--color-bg-2);
  border-radius: 6px;
  border: 1px solid var(--color-border-2);
}

.file-icon {
  margin-right: 6px;
  color: var(--color-primary);
}

.file-name {
  flex: 1;
  font-size: 13px;
  color: var(--color-text-1);
  word-break: break-all;
  line-height: 1.3;
}

.warning-section {
  margin-top: 12px;
}

.warning-list {
  margin: 4px 0 0 0;
  padding-left: 16px;
}

.warning-list li {
  margin-bottom: 2px;
  color: var(--color-text-2);
  font-size: 12px;
  line-height: 1.3;
}

/* 自定义文件列表样式 */
.custom-file-list {
  margin-top: 8px;
}

/* 强制隐藏 Upload 组件内部的文件列表 */
.restore-actions .arco-upload-list {
  display: none !important;
}

.restore-actions .arco-upload-list-item {
  display: none !important;
}

.custom-upload-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--color-fill-2);
  border-radius: 4px;
  margin-top: 6px;
  min-height: 36px;
}

.file-info {
  display: flex;
  align-items: center;
  flex: 1;
  min-height: 20px;
}

.file-icon {
  margin-right: 6px;
  color: var(--color-text-3);
  font-size: 14px;
}

.file-name {
  color: var(--color-text-1);
  font-weight: 500;
  margin-right: 6px;
  line-height: 1.3;
  font-size: 13px;
}

.file-size {
  color: var(--color-text-3);
  font-size: 11px;
  line-height: 1.3;
}

.remove-btn {
  color: var(--color-text-3);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  min-height: 20px;
}

.remove-btn:hover {
  color: var(--color-danger);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.backup-restore-container {
  min-width: 0;
  max-height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 2px;
}

.stats-section,
.operation-section {
  padding: 12px;
  border: 1px solid var(--dp-border-subtle);
  border-radius: var(--dp-radius-md);
  background: var(--dp-bg-surface-muted);
}

.section-title {
  margin: 0 0 10px;
  color: var(--dp-text-primary);
}

.stats-grid {
  gap: 6px;
}

.stat-item {
  background: var(--dp-bg-surface);
  border-color: var(--dp-border-subtle);
}

.data-size,
.operation-content {
  background: var(--dp-bg-surface);
  border-color: var(--dp-border-subtle);
}

.operation-section {
  margin-bottom: 12px;
}

.operation-content {
  padding: 10px;
}

.restore-actions {
  width: 100%;
  align-items: stretch;
}

.restore-actions :deep(.arco-upload),
.restore-actions :deep(.arco-upload-trigger) {
  width: 100%;
}

.restore-actions :deep(.arco-btn) {
  justify-content: center;
}

.custom-file-list {
  width: 100%;
  min-width: 0;
}

.custom-upload-item {
  min-width: 0;
  background: var(--dp-bg-surface);
  border: 1px solid var(--dp-border-subtle);
}

.file-info {
  min-width: 0;
}

.file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.warning-section :deep(.arco-alert) {
  border-radius: var(--dp-radius-md);
}

@media (max-width: 560px) {
  .stats-section,
  .operation-section {
    padding: 8px;
    margin-bottom: 8px;
  }

  .stats-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 4px;
  }

  .stat-item {
    padding: 6px 2px;
  }

  .stat-value {
    font-size: 15px;
  }

  .stat-label {
    font-size: 10px;
  }

  .section-title {
    font-size: 14px;
    margin-bottom: 6px;
  }

  .operation-content {
    padding: 8px;
  }

  .operation-desc {
    margin-bottom: 8px;
    font-size: 12px;
  }

  .warning-section {
    margin-top: 8px;
  }

  .warning-section :deep(.arco-alert-content) {
    font-size: 12px;
  }

  .warning-list {
    padding-left: 14px;
  }
}
</style>