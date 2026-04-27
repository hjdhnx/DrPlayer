<template>
  <div class="history-container">
    <!-- 页面头部 -->
    <div class="history-header">
      <div class="header-left">
        <h1 class="page-title">历史</h1>
        <a-badge :count="historyStore.historyCount" class="count-badge" />
      </div>
      <div class="header-actions">
        <a-input-search
          v-model="searchKeyword"
          placeholder="搜索历史记录..."
          style="width: 300px"
          allow-clear
        />
        <a-dropdown @select="handleAction">
          <a-button type="outline">
            <template #icon>
              <icon-more />
            </template>
            更多操作
          </a-button>
          <template #content>
            <a-doption value="export">
              <template #icon>
                <icon-download />
              </template>
              导出历史
            </a-doption>
            <a-doption value="import">
              <template #icon>
                <icon-upload />
              </template>
              导入历史
            </a-doption>
            <a-doption value="manage-api">
              <template #icon>
                <icon-settings />
              </template>
              API地址管理
            </a-doption>
            <a-doption value="clear" class="danger-option">
              <template #icon>
                <icon-delete />
              </template>
              清空历史
            </a-doption>
          </template>
        </a-dropdown>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section" v-if="historyStore.historyCount > 0">
      <div class="filter-tabs">
        <a-radio-group v-model="activeFilter" type="button">
          <a-radio value="all">全部 ({{ historyStore.historyCount }})</a-radio>
          <a-radio
            v-for="(items, category) in historyStore.historiesByType"
            :key="category"
            :value="category"
          >
            {{ category }} ({{ items.length }})
          </a-radio>
        </a-radio-group>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="history-content">
      <!-- 空状态 -->
      <div v-if="filteredHistory.length === 0" class="empty-state">
        <a-empty description="暂无观看历史">
          <template #image>
            <icon-history />
          </template>
        </a-empty>
      </div>

      <!-- 历史网格 -->
      <div v-else class="history-grid">
        <VideoCard
          v-for="item in filteredHistory"
          :key="`${item.id}-${item.api_info.api_url}`"
          :item="item"
          type="history"
          @card-click="goToDetail"
          @image-click="showImageModal"
          @action-click="removeHistory"
        />
      </div>
    </div>

    <!-- API地址管理组件 -->
    <ApiUrlManager
      v-model="showApiManager"
      @completed="handleApiManagerCompleted"
    />

    <!-- v-viewer 图片查看器 -->
    <div v-viewer="viewerOptions" class="viewer" v-show="false">
      <img 
        v-for="(imageData, index) in viewerImageData" 
        :key="index"
        :src="imageData.src" 
        :alt="imageData.name"
        :data-source="imageData.src"
        :title="imageData.name"
      />
    </div>

    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInput"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleFileImport"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Message, Modal } from '@arco-design/web-vue'
import { useHistoryStore } from '@/stores/historyStore'
import { useSiteStore } from '@/stores/siteStore'
import VideoCard from '@/components/VideoCard.vue'
import ApiUrlManager from '@/components/ApiUrlManager.vue'
import {
  IconHistory,
  IconMore,
  IconDownload,
  IconUpload,
  IconSettings,
  IconDelete,
  IconEye
} from '@arco-design/web-vue/es/icon'

const router = useRouter()
const historyStore = useHistoryStore()
const siteStore = useSiteStore()

// 响应式数据
const searchKeyword = ref('')
const activeFilter = ref('all')
const showApiManager = ref(false)
const fileInput = ref(null)

// 图片查看器相关
const viewerImages = ref([])
const viewerImageData = ref([])
const viewerOptions = ref({
  inline: false,
  button: true,
  navbar: true,
  title: true,
  toolbar: {
    zoomIn: 1,
    zoomOut: 1,
    oneToOne: 1,
    reset: 1,
    prev: 1,
    play: {
      show: 1,
      size: 'large',
    },
    next: 1,
    rotateLeft: 1,
    rotateRight: 1,
    flipHorizontal: 1,
    flipVertical: 1,
  },
  tooltip: true,
  movable: true,
  zoomable: true,
  rotatable: true,
  scalable: true,
  transition: true,
  fullscreen: true,
  keyboard: true,
  backdrop: true,
})

// 过滤后的历史记录
const filteredHistory = computed(() => {
  let result = historyStore.histories || []

  // 分类筛选
  if (activeFilter.value !== 'all') {
    result = result.filter(item => {
      // 根据站源名称中的标识进行分类（与Collection.vue中的逻辑保持一致）
      const siteName = item.api_info?.site_name || ''
      let type = '影视' // 默认分类
      
      if (siteName.includes('[书]')) {
        type = '小说'
      } else if (siteName.includes('[画]')) {
        type = '漫画'
      } else if (siteName.includes('[密]')) {
        type = '密'
      } else if (siteName.includes('[听]')) {
        type = '音频'
      } else if (siteName.includes('[儿]')) {
        type = '少儿'
      }
      
      return type === activeFilter.value
    })
  }

  // 搜索筛选
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(item =>
      item.name.toLowerCase().includes(keyword) ||
      (item.director && item.director.toLowerCase().includes(keyword)) ||
      (item.actor && item.actor.toLowerCase().includes(keyword))
    )
  }

  return result
})

// 生命周期
onMounted(() => {
  historyStore.loadHistories()
  
  // 临时调试：检查现有历史记录数据结构
  setTimeout(() => {
    console.log('=== 历史记录数据结构调试 ===')
    console.log('历史记录总数:', historyStore.historyCount)
    if (historyStore.histories.length > 0) {
      console.log('第一条历史记录完整数据:', historyStore.histories[0])
      console.log('第一条历史记录api_info:', historyStore.histories[0].api_info)
      console.log('第一条历史记录是否有ext字段:', 'ext' in historyStore.histories[0].api_info)
    }
    console.log('=== 调试结束 ===')
  }, 1000)
})

// 方法
const handleAction = (action) => {
  switch (action) {
    case 'import':
      importHistory()
      break
    case 'export':
      exportHistory()
      break
    case 'manage-api':
      showApiManager.value = true
      break
    case 'clear':
      clearAllHistory()
      break
  }
}

const importHistory = () => {
  fileInput.value?.click()
}

const handleFileImport = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    const importCount = await historyStore.importHistories(file)
    Message.success(`成功导入 ${importCount} 个历史记录`)
  } catch (error) {
    Message.error(`导入失败: ${error.message}`)
  }

  // 清空文件输入
  event.target.value = ''
}

const exportHistory = () => {
  if (historyStore.historyCount === 0) {
    Message.warning('没有历史数据可以导出')
    return
  }

  try {
    historyStore.exportHistories()
    Message.success('历史数据导出成功')
  } catch (error) {
    Message.error('导出失败，请稍后重试')
  }
}

const clearAllHistory = () => {
  Modal.confirm({
    title: '确认清空历史',
    content: `确定要清空所有 ${historyStore.historyCount} 个历史记录吗？此操作不可恢复。`,
    okText: '确认清空',
    cancelText: '取消',
    okButtonProps: { status: 'danger' },
    onOk: () => {
      historyStore.clearHistories()
      Message.success('已清空所有历史记录')
    }
  })
}

const removeHistory = (item) => {
  Modal.confirm({
    title: '删除历史记录',
    content: `确定要删除《${item.name}》的观看历史吗？`,
    okText: '确认删除',
    cancelText: '保留',
    okButtonProps: { status: 'danger' },
    onOk: () => {
      historyStore.removeFromHistory(item)
      Message.success('已删除历史记录')
    }
  })
}

const goToDetail = async (item) => {
  try {
    // 调试：打印完整的历史记录项
    console.log('历史记录项完整数据:', item)
    console.log('历史记录api_info:', item.api_info)
    
    // 通过路由参数传递站源信息
    const siteInfo = {
      name: item.api_info.site_name,
      api: item.api_info.api_url,
      key: item.api_info.module,
      ext: item.api_info.ext || null  // 从历史数据中获取extend参数
    }
    
    console.log('从历史进入详情页，使用临时站源:', siteInfo.name, '扩展参数:', siteInfo.ext)
    console.log('siteInfo完整对象:', siteInfo)
    
    // 跳转到详情页，传递站源信息和历史记录信息
    router.push({
        name: 'VideoDetail',
        params: { id: item.id },
        query: {
          name: item.name,
          pic: item.pic,
          year: item.year,
          area: item.area,
          type: item.type,
          type_name: item.type_name,
          remarks: item.remarks,
          content: item.content,
          actor: item.actor,
          director: item.director,
          fromHistory: 'true',  // 标识从历史进入
          // 传递站源信息
          tempSiteName: siteInfo.name,
          tempSiteApi: siteInfo.api,
          tempSiteKey: siteInfo.key,
          tempSiteExt: siteInfo.ext,  // 添加extend参数传递
          // 传递历史记录信息，用于恢复播放状态
          historyRoute: item.current_route_name,
          historyEpisode: item.current_episode_name,
          historyProgress: item.progress || 0,
          // 添加来源页面信息
          sourceRouteName: 'History',
          sourceRouteParams: JSON.stringify({}),
          sourceRouteQuery: JSON.stringify({}),
          // 添加来源图片信息，用于详情页图片备用
          sourcePic: item.pic
        }
    })
  } catch (error) {
    console.error('跳转到详情页失败:', error)
    Message.error('跳转失败，请稍后重试')
  }
}

const showImageModal = (item) => {
  // 设置当前图片到 viewer，包含图片URL和名称
  viewerImages.value = [item.pic]
  viewerImageData.value = [{
    src: item.pic,
    name: item.name || item.title || '未知标题'
  }]
  
  // 等待下一个 tick 后显示 viewer
  setTimeout(() => {
    const viewerElement = document.querySelector('.viewer')
    if (viewerElement && viewerElement.$viewer) {
      viewerElement.$viewer.show()
    }
  }, 100)
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

const handleApiManagerCompleted = (result) => {
  console.log('API地址管理完成:', result)
  Message.success(`API地址管理完成，共处理 ${result.replacedCount} 条记录`)
  // 可以在这里添加其他后续处理逻辑
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  
  // 小于1分钟
  if (diff < 60000) {
    return '刚刚'
  }
  
  // 小于1小时
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  }
  
  // 小于1天
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  }
  
  // 小于7天
  if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`
  }
  
  // 超过7天显示具体日期
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.history-container {
  width: 100%;
  max-width: var(--dp-page-max-width);
  height: 100%;
  min-height: 0;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  background: transparent;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 20px 22px;
  margin-bottom: 16px;
  background: var(--dp-bg-surface);
  border: 1px solid var(--dp-border-subtle);
  border-radius: var(--dp-radius-xl);
  box-shadow: var(--dp-shadow-sm);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.page-title {
  font-size: 24px;
  line-height: 1.25;
  font-weight: 800;
  color: var(--dp-text-primary);
  margin: 0;
}

.count-badge {
  margin-left: 8px;
}

.header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-section {
  padding: 14px 16px;
  margin-bottom: 16px;
  background: var(--dp-bg-surface);
  border: 1px solid var(--dp-border-subtle);
  border-radius: var(--dp-radius-xl);
  box-shadow: var(--dp-shadow-sm);
}

.filter-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.history-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow-y: auto;
}

.empty-state {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--dp-border-subtle);
  border-radius: var(--dp-radius-xl);
  background: var(--dp-bg-surface);
  box-shadow: var(--dp-shadow-sm);
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.danger-option {
  color: var(--color-danger-6);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .history-grid {
    grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
    gap: 10px;
  }
}

@media (max-width: 768px) {
  .history-container {
    min-height: 100%;
    background:
      radial-gradient(circle at top left, rgba(0, 180, 42, 0.1), transparent 32%),
      var(--dp-bg-app);
  }

  .history-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    padding: 10px 0 12px;
    background: transparent;
    border-bottom: none;
  }

  .header-left {
    justify-content: space-between;
    gap: 8px;
  }

  .page-title {
    font-size: 0;
  }

  .page-title::before {
    content: '历史';
    display: block;
    font-size: 22px;
    line-height: 1.25;
    font-weight: 800;
    color: var(--dp-text-primary);
  }

  .count-badge {
    margin-left: 0;
  }

  .header-actions {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px;
    align-items: center;
  }

  .header-actions .arco-input-wrapper {
    width: 100% !important;
    height: 42px;
    border-radius: 999px;
    background: var(--dp-bg-surface);
    border-color: var(--dp-border-subtle);
  }

  .header-actions :deep(.arco-btn) {
    height: 42px;
    border-radius: 999px;
  }

  .filter-section {
    padding: 0 0 12px;
    background: transparent;
    border-bottom: none;
  }

  .filter-tabs {
    flex-wrap: nowrap;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 2px;
    scrollbar-width: none;
  }

  .filter-tabs::-webkit-scrollbar {
    display: none;
  }

  .filter-tabs :deep(.arco-btn) {
    flex: 0 0 auto;
    min-width: 74px;
    height: 36px;
    border-radius: 999px;
    background: var(--dp-bg-surface);
    border-color: var(--dp-border-subtle);
    color: var(--dp-text-secondary);
    box-shadow: var(--dp-shadow-sm);
  }

  .filter-tabs :deep(.arco-btn-primary) {
    background: var(--dp-primary-readable) !important;
    border-color: var(--dp-primary-readable) !important;
    color: #fff !important;
    font-weight: 800;
  }

  .filter-tabs :deep(.arco-btn-outline:not(.arco-btn-disabled)) {
    background: var(--dp-bg-surface) !important;
    border-color: var(--dp-border) !important;
    color: var(--dp-text-secondary) !important;
    font-weight: 700;
  }

  .history-content {
    padding: 0;
    min-height: 0;
  }

  .history-grid {
    padding-bottom: 12px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .empty-state {
    border-radius: 22px;
    background: var(--dp-bg-surface);
    border: 1px solid var(--dp-border-subtle);
  }
}

@media (max-width: 480px) {
  .history-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* v-viewer 自定义样式 */
.viewer {
  display: none;
}
</style>
