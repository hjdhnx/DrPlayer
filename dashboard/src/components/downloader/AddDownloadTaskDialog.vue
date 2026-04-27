<template>
  <a-modal
    :visible="visible"
    title="新建下载任务"
    width="min(800px, calc(100vw - 24px))"
    modal-class="add-download-task-dialog"
    align-center
    :mask-closable="false"
    @cancel="handleCancel"
    @ok="handleConfirm"
    :confirm-loading="loading"
  >
    <div class="add-task-form">
      <!-- 小说信息 -->
      <div class="form-section">
        <h4>小说信息</h4>
        <div class="novel-info" v-if="novelDetail">
          <div class="novel-cover">
            <img :src="novelDetail.vod_pic" :alt="novelDetail.vod_name" />
          </div>
          <div class="novel-details">
            <h3>{{ novelDetail.vod_name }}</h3>
            <p class="novel-author">作者: {{ novelDetail.vod_actor || '未知' }}</p>
            <div class="novel-desc-block">
              <p class="novel-desc" :class="{ expanded: descExpanded }">
                {{ novelDetail.vod_content || '暂无简介' }}
              </p>
              <a-button
                v-if="hasLongDescription"
                type="text"
                size="mini"
                class="desc-toggle"
                @click="descExpanded = !descExpanded"
              >
                {{ descExpanded ? '收起简介' : '展开全部简介' }}
              </a-button>
            </div>
            <div class="novel-meta">
              <span>来源: {{ sourceName }}</span>
              <span>总章节: {{ totalChapters }}</span>
            </div>
          </div>
        </div>
        <div v-else class="no-novel">
          <a-empty description="请从详情页面调用下载功能" />
        </div>
      </div>

      <!-- 章节选择 -->
      <div class="form-section" v-if="novelDetail">
        <h4>章节选择</h4>
        <div class="chapter-selection">
          <div class="selection-controls">
            <a-button-group>
              <a-button @click="selectAll">全选</a-button>
              <a-button @click="selectNone">全不选</a-button>
              <a-button @click="selectReverse">反选</a-button>
            </a-button-group>
            <div class="range-selector">
              <span>范围选择:</span>
              <a-input-number 
                v-model="rangeStart" 
                :min="1" 
                :max="totalChapters"
                placeholder="起始章节"
                size="small"
                style="width: 100px"
              />
              <span>-</span>
              <a-input-number 
                v-model="rangeEnd" 
                :min="1" 
                :max="totalChapters"
                placeholder="结束章节"
                size="small"
                style="width: 100px"
              />
              <a-button size="small" @click="selectRange">选择范围</a-button>
            </div>
          </div>
          
          <div class="chapter-summary">
            <div class="selected-info">
              已选择 {{ selectedChapters.length }} / {{ totalChapters }} 章
            </div>
            <a-button size="small" type="text" @click="chapterListExpanded = !chapterListExpanded">
              {{ chapterListExpanded ? '收起章节列表' : '展开章节列表' }}
            </a-button>
          </div>

          <div v-show="chapterListExpanded" class="chapter-list">
            <div class="chapter-grid">
              <div 
                v-for="(chapter, index) in chapters" 
                :key="index"
                class="chapter-item"
                :class="{ selected: selectedChapters.includes(index) }"
                @click="toggleChapter(index)"
              >
                <a-checkbox 
                  :model-value="selectedChapters.includes(index)"
                  @change="toggleChapter(index)"
                />
                <span class="chapter-title">{{ chapter.name || `第${index + 1}章` }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 下载设置 -->
      <div class="form-section" v-if="novelDetail">
        <h4>下载设置</h4>
        <div class="download-settings">
          <div class="setting-row">
            <label>文件名:</label>
            <a-input 
              v-model="downloadSettings.filename" 
              placeholder="自动生成"
              style="width: 300px"
            />
          </div>
          <div class="setting-row">
            <label>并发数:</label>
            <a-input-number 
              v-model="downloadSettings.concurrency" 
              :min="1" 
              :max="10"
              style="width: 120px"
            />
            <span class="setting-tip">同时下载的章节数量</span>
          </div>
          <div class="setting-row">
            <label>重试次数:</label>
            <a-input-number 
              v-model="downloadSettings.retryCount" 
              :min="0" 
              :max="5"
              style="width: 120px"
            />
            <span class="setting-tip">章节下载失败时的重试次数</span>
          </div>
          <div class="setting-row">
            <label>章节间隔:</label>
            <a-input-number 
              v-model="downloadSettings.interval" 
              :min="0" 
              :max="5000"
              style="width: 120px"
            />
            <span class="setting-tip">章节下载间隔时间(毫秒)</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <a-button @click="handleCancel">取消</a-button>
      <a-button 
        type="primary" 
        @click="handleConfirm"
        :loading="loading"
        :disabled="!canConfirm"
      >
        开始下载
      </a-button>
    </template>
  </a-modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Message } from '@arco-design/web-vue'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  novelDetail: {
    type: Object,
    default: null
  },
  chapters: {
    type: Array,
    default: () => []
  },
  sourceName: {
    type: String,
    default: ''
  },
  sourceKey: {
    type: String,
    default: ''
  },
  apiUrl: {
    type: String,
    default: ''
  },
  extend: {
    type: [String, Object],
    default: ''
  }
})

// Emits
const emit = defineEmits(['close', 'confirm'])

// 响应式数据
const loading = ref(false)
const selectedChapters = ref([])
const rangeStart = ref(1)
const rangeEnd = ref(1)
const descExpanded = ref(false)
const chapterListExpanded = ref(false)


const downloadSettings = ref({
  filename: '',
  concurrency: 3,
  retryCount: 2,
  interval: 1000
})

// 计算属性
const totalChapters = computed(() => props.chapters.length)

const hasLongDescription = computed(() => {
  const content = props.novelDetail?.vod_content || ''
  return content.length > 120
})

const canConfirm = computed(() => {
  return props.novelDetail && selectedChapters.value.length > 0
})

// 监听器
watch(() => props.visible, (visible) => {
  if (visible) {
    resetForm()
  }
})

watch(() => props.novelDetail, (detail) => {
  descExpanded.value = false
  chapterListExpanded.value = false
  if (detail) {
    downloadSettings.value.filename = detail.vod_name + '.txt'
    rangeEnd.value = totalChapters.value
  }
})

// 方法
const resetForm = () => {
  selectedChapters.value = []
  rangeStart.value = 1
  rangeEnd.value = totalChapters.value
  descExpanded.value = false
  chapterListExpanded.value = false
  downloadSettings.value = {
    filename: props.novelDetail?.vod_name + '.txt' || '',
    concurrency: 3,
    retryCount: 2,
    interval: 1000
  }
}

const selectAll = () => {
  selectedChapters.value = Array.from({ length: totalChapters.value }, (_, i) => i)
}

const selectNone = () => {
  selectedChapters.value = []
}

const selectReverse = () => {
  const allChapters = Array.from({ length: totalChapters.value }, (_, i) => i)
  selectedChapters.value = allChapters.filter(i => !selectedChapters.value.includes(i))
}

const selectRange = () => {
  if (rangeStart.value > rangeEnd.value) {
    Message.warning('起始章节不能大于结束章节')
    return
  }
  
  const start = Math.max(1, rangeStart.value) - 1
  const end = Math.min(totalChapters.value, rangeEnd.value)
  
  selectedChapters.value = Array.from({ length: end - start }, (_, i) => start + i)
}

const toggleChapter = (index) => {
  const selectedIndex = selectedChapters.value.indexOf(index)
  if (selectedIndex > -1) {
    selectedChapters.value.splice(selectedIndex, 1)
  } else {
    selectedChapters.value.push(index)
  }
}

const handleCancel = () => {
  emit('close')
}

const handleConfirm = async () => {
  if (!canConfirm.value) {
    Message.warning('请选择要下载的章节')
    return
  }

  loading.value = true
  
  try {
    const taskData = {
      novelDetail: props.novelDetail,
      chapters: props.chapters,
      selectedChapters: selectedChapters.value,
      sourceName: props.sourceName,
      sourceKey: props.sourceKey,
      apiUrl: props.apiUrl,
      extend: props.extend,
      settings: downloadSettings.value
    }
    
    emit('confirm', taskData)
  } catch (error) {
    console.error('创建下载任务失败:', error)
    Message.error('创建下载任务失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
:global(.arco-modal-wrapper-align-center:has(.add-download-task-dialog)) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 12px;
  overflow: hidden;
}

:global(.add-download-task-dialog) {
  height: min(760px, calc(100dvh - 24px));
  max-height: calc(100dvh - 24px);
  display: flex !important;
  flex-direction: column;
  overflow: hidden;
  margin: 0 !important;
}

:global(.add-download-task-dialog .arco-modal-header),
:global(.add-download-task-dialog .arco-modal-footer) {
  flex: 0 0 auto;
}

:global(.add-download-task-dialog .arco-modal-body) {
  height: 0;
  flex: 1 1 auto;
  min-height: 0;
  max-height: none !important;
  padding: 0 !important;
  display: flex;
  flex-direction: column;
  overflow: hidden !important;
}

.add-task-form {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none;
  padding: 16px 20px;
  overflow-y: auto;
  overflow-x: hidden;
}

.form-section {
  margin-bottom: 24px;
}

.form-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-1);
  border-bottom: 1px solid var(--color-border-2);
  padding-bottom: 8px;
}

.novel-info {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: var(--color-bg-1);
  border-radius: 8px;
}

.novel-cover img {
  width: 80px;
  height: 120px;
  object-fit: cover;
  border-radius: 4px;
}

.novel-details {
  flex: 1;
}

.novel-details h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: var(--color-text-1);
}

.novel-author {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: var(--color-text-3);
}

.novel-desc-block {
  margin: 0 0 12px;
}

.novel-desc {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-2);
  line-height: 1.6;
  max-height: 58px;
  overflow: hidden;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.novel-desc.expanded {
  max-height: min(28vh, 220px);
  overflow-y: auto;
  padding-right: 6px;
}

.novel-desc.expanded::-webkit-scrollbar {
  width: 5px;
}

.novel-desc.expanded::-webkit-scrollbar-track {
  background: var(--color-fill-2);
  border-radius: 999px;
}

.novel-desc.expanded::-webkit-scrollbar-thumb {
  background: var(--color-fill-4);
  border-radius: 999px;
}

.desc-toggle {
  margin-top: 6px;
  padding: 0;
  height: 22px;
}

.novel-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--color-text-3);
}

.no-novel {
  padding: 40px;
  text-align: center;
}

.chapter-selection {
  border: 1px solid var(--color-border-2);
  border-radius: 8px;
  padding: 16px;
}

.selection-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.range-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.chapter-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.selected-info {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary-6);
}

.chapter-list {
  overflow: visible;
}

.chapter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
}

.chapter-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid var(--color-border-2);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.chapter-item:hover {
  border-color: var(--color-primary-light-4);
  background: var(--color-primary-light-1);
}

.chapter-item.selected {
  border-color: var(--color-primary-6);
  background: var(--color-primary-light-2);
}

.chapter-title {
  font-size: 12px;
  color: var(--color-text-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.download-settings {
  background: var(--color-bg-1);
  border-radius: 8px;
  padding: 16px;
}

.setting-row {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
}

.setting-row:last-child {
  margin-bottom: 0;
}

.setting-row label {
  width: 80px;
  font-size: 14px;
  color: var(--color-text-2);
  flex-shrink: 0;
}

.setting-tip {
  font-size: 12px;
  color: var(--color-text-3);
}

@media (max-width: 768px) {
  :global(.arco-modal-wrapper-align-center:has(.add-download-task-dialog)) {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 12px;
    overflow: hidden;
  }

  :global(.add-download-task-dialog) {
    width: calc(100vw - 24px) !important;
    height: calc(100dvh - 24px);
    max-height: calc(100dvh - 24px);
  }

  .add-task-form {
    padding: 14px;
  }

  .form-section {
    margin-bottom: 18px;
  }

  .novel-info {
    gap: 12px;
    padding: 12px;
  }

  .novel-cover img {
    width: 68px;
    height: 102px;
  }

  .novel-details {
    min-width: 0;
  }

  .novel-details h3 {
    font-size: 15px;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .novel-desc.expanded {
    max-height: min(32vh, 240px);
  }

  .novel-meta {
    flex-wrap: wrap;
    gap: 6px 12px;
  }

  .chapter-summary,
  .selection-controls,
  .range-selector,
  .setting-row {
    align-items: stretch;
    flex-direction: column;
  }

  .range-selector :deep(.arco-input-wrapper),
  .setting-row :deep(.arco-input-wrapper),
  .setting-row :deep(.arco-input-number) {
    width: 100% !important;
  }

  .chapter-grid {
    grid-template-columns: 1fr;
  }
}
</style>
