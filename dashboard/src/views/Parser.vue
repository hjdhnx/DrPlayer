<template>
  <div class="parser-container">
    <!-- 简化的标题显示 -->
    <div class="simple-header">
      <span class="navigation-title">解析</span>
    </div>

    <!-- 操作按钮区域 -->
    <div class="parser-header">
      <div class="header-content">
        <div class="header-left">
          <div class="header-info">
            <h2 class="page-title">解析</h2>
            <p class="page-subtitle">管理视频解析接口，支持排序、测试和配置</p>
            <a-badge :count="parserStore.parserCount" class="count-badge" />
          </div>
        </div>
        <div class="header-actions">
          <a-button type="outline" @click="showAddDialog = true">
            <template #icon>
              <icon-plus />
            </template>
            添加解析
          </a-button>
          <a-button type="outline" @click="showImportDialog = true">
            <template #icon>
              <icon-import />
            </template>
            导入
          </a-button>
          <a-button type="outline" @click="exportParsers">
            <template #icon>
              <icon-export />
            </template>
            导出
          </a-button>
          <a-button type="outline" @click="resetFromConfig">
            <template #icon>
              <icon-refresh />
            </template>
            重置配置
          </a-button>
          <a-dropdown @select="handleMoreAction">
            <a-button type="outline">
              <template #icon>
                <icon-more />
              </template>
              更多
            </a-button>
            <template #content>
              <a-doption value="enable-all">
                <template #icon>
                  <icon-check />
                </template>
                一键启用
              </a-doption>
              <a-doption value="disable-all">
                <template #icon>
                  <icon-close />
                </template>
                一键停用
              </a-doption>
              <a-divider style="margin: 4px 0;" />
              <a-doption value="load-config">
                <template #icon>
                  <icon-link />
                </template>
                从地址加载
              </a-doption>
              <a-doption value="test-all">
                <template #icon>
                  <icon-play-arrow />
                </template>
                批量测试
              </a-doption>
              <a-doption value="clear-all" class="danger-option">
                <template #icon>
                  <icon-delete />
                </template>
                清空所有
              </a-doption>
            </template>
          </a-dropdown>
        </div>
      </div>
    </div>

    <!-- 可滚动内容区域 -->
    <div class="parser-content">
      <!-- 加载状态 -->
      <div v-if="parserStore.loading" class="loading-container">
        <a-spin :size="32" tip="正在加载解析配置..." />
      </div>

      <!-- 错误状态 -->
      <div v-else-if="parserStore.error" class="error-container">
        <a-result
          status="error"
          :title="parserStore.error"
          sub-title="请检查网络连接或配置地址"
        >
          <template #extra>
            <a-button type="primary" @click="retryLoad">
              重新加载
            </a-button>
          </template>
        </a-result>
      </div>

      <!-- 空状态 -->
      <div v-else-if="parserStore.parserCount === 0" class="empty-container">
        <a-empty description="暂无解析配置">
          <template #image>
            <icon-code :size="64" />
          </template>
          <a-button type="primary" @click="showAddDialog = true">
            添加第一个解析
          </a-button>
        </a-empty>
      </div>

      <!-- 解析列表 -->
      <div v-else class="parsers-section">
        <!-- 筛选和搜索 -->
        <div class="filter-section">
          <a-input-search
            v-model="searchKeyword"
            placeholder="搜索解析名称或URL..."
            style="width: 300px"
            allow-clear
          />
          <div class="filter-controls">
            <a-select v-model="filterStatus" placeholder="状态筛选" style="width: 120px">
              <a-option value="">全部</a-option>
              <a-option value="enabled">已启用</a-option>
              <a-option value="disabled">已禁用</a-option>
            </a-select>
            <a-select v-model="filterType" placeholder="类型筛选" style="width: 120px">
              <a-option value="">全部类型</a-option>
              <a-option value="0">嗅探</a-option>
              <a-option value="1">Json</a-option>
            </a-select>
          </div>
        </div>

        <!-- 解析器列表 -->
        <div class="parsers-list">
          <draggable
            v-model="dragParsers"
            @end="handleDragEnd"
            item-key="id"
            class="drag-container"
            handle=".parser-drag-handle"
            :delay="180"
            :delay-on-touch-only="true"
            :touch-start-threshold="8"
            :fallback-tolerance="8"
            ghost-class="parser-drag-ghost"
            chosen-class="parser-drag-chosen"
          >
            <template #item="{ element: parser }">
              <div class="parser-item" :class="{ disabled: !parser.enabled }">
                <div class="parser-drag-handle">
                  <icon-drag-arrow />
                </div>
                
                <div class="parser-info">
                  <div class="parser-header-row">
                    <div class="parser-name">{{ parser.name }}</div>
                    <div class="parser-actions">
                      <a-switch
                        v-model="parser.enabled"
                        @update:model-value="(value) => handleSwitchChange(parser.id, value)"
                        size="small"
                      />
                      <a-button
                        type="text"
                        size="small"
                        @click="testParser(parser)"
                        :loading="testingParsers.has(parser.id)"
                      >
                        <template #icon>
                          <icon-play-arrow />
                        </template>
                        测试
                      </a-button>
                      <a-button
                        type="text"
                        size="small"
                        @click="editParser(parser)"
                      >
                        <template #icon>
                          <icon-edit />
                        </template>
                        编辑
                      </a-button>
                      <a-popconfirm
                        content="确定要删除这个解析器吗？"
                        @ok="deleteParser(parser.id)"
                      >
                        <a-button
                          type="text"
                          size="small"
                          status="danger"
                        >
                          <template #icon>
                            <icon-delete />
                          </template>
                          删除
                        </a-button>
                      </a-popconfirm>
                    </div>
                  </div>
                  
                  <div class="parser-details">
                    <div class="parser-url">{{ parser.url }}</div>
                    <div class="parser-meta">
                      <a-tag :color="String(parser.type) === '0' ? 'blue' : 'green'" size="small">
                        {{ String(parser.type) === '0' ? '嗅探' : 'Json' }}
                      </a-tag>
                      <span v-if="parser.ext && parser.ext.flag" class="parser-flags">
                        支持: {{ parser.ext.flag.join(', ') }}
                      </span>
                    </div>
                  </div>
                  
                  <!-- 测试结果 -->
                  <div v-if="testResults[parser.id]" class="test-result">
                    <a-alert
                      :type="testResults[parser.id].success ? 'success' : 'error'"
                      :message="testResults[parser.id].message"
                      show-icon
                      closable
                      @close="delete testResults[parser.id]"
                    />
                  </div>
                </div>
              </div>
            </template>
          </draggable>
        </div>
      </div>
    </div>

    <!-- 添加/编辑解析器对话框 -->
    <a-modal
      v-model:visible="showAddDialog"
      :title="editingParser ? '编辑解析器' : '添加解析器'"
      width="600px"
      @ok="handleSaveParser"
      @cancel="handleCancelEdit"
    >
      <a-form :model="parserForm" layout="vertical">
        <a-form-item label="解析器名称" required>
          <a-input v-model="parserForm.name" placeholder="请输入解析器名称" />
        </a-form-item>
        
        <a-form-item label="解析地址" required>
          <a-input v-model="parserForm.url" placeholder="请输入解析地址，视频地址会直接与解析地址相加" />
          <template #extra>
            <div class="form-help">
              示例: https://jx.example.com/api?url=
            </div>
          </template>
        </a-form-item>
        
        <a-form-item label="解析类型">
          <a-select v-model="parserForm.type" placeholder="选择解析类型">
            <a-option value="0">嗅探</a-option>
            <a-option value="1">Json</a-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="支持的播放器标识">
          <a-select
            v-model="parserForm.flags"
            multiple
            placeholder="选择支持的播放器标识"
            allow-create
          >
            <a-option value="youku">优酷</a-option>
            <a-option value="qq">腾讯</a-option>
            <a-option value="iqiyi">爱奇艺</a-option>
            <a-option value="mgtv">芒果TV</a-option>
            <a-option value="bilibili">哔哩哔哩</a-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="请求头 (JSON格式)">
          <a-textarea
            v-model="parserForm.headerJson"
            placeholder='{"User-Agent": "Mozilla/5.0...", "Referer": "https://example.com"}'
            :rows="4"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 导入对话框 -->
    <a-modal
      v-model:visible="showImportDialog"
      title="导入解析配置"
      @ok="handleImport"
      @cancel="showImportDialog = false"
    >
      <a-upload
        ref="uploadRef"
        :file-list="[]"
        :auto-upload="false"
        accept=".json"
        @change="handleFileChange"
      >
        <template #upload-button>
          <div class="upload-area">
            <icon-upload :size="48" />
            <div class="upload-text">
              <div>点击选择文件或拖拽文件到此处</div>
              <div class="upload-hint">支持 JSON 格式的解析配置文件</div>
            </div>
          </div>
        </template>
      </a-upload>
    </a-modal>

    <!-- 从配置加载对话框 -->
    <a-modal
      v-model:visible="showConfigDialog"
      title="从配置地址加载"
      @ok="handleLoadConfig"
      @cancel="showConfigDialog = false"
    >
      <a-form :model="configForm" layout="vertical">
        <a-form-item label="配置地址">
          <a-input
            v-model="configForm.url"
            placeholder="请输入配置地址"
          />
          <template #extra>
            <div class="form-help">
              输入包含 parses 字段的 JSON 配置地址
            </div>
          </template>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 批量测试对话框 -->
    <a-modal
      v-model:visible="showBatchTestDialog"
      title="批量测试解析器"
      width="800px"
      :footer="false"
    >
      <div class="batch-test-content">
        <a-form :model="batchTestForm" layout="vertical">
          <a-form-item label="测试视频地址">
            <a-select v-model="batchTestForm.videoUrl" placeholder="选择或输入测试视频地址">
              <a-option value="https://v.qq.com/x/cover/mzc00200mp8vo9b.html">腾讯视频示例</a-option>
              <a-option value="https://www.iqiyi.com/v_19rr7aqk5o.html">爱奇艺示例</a-option>
              <a-option value="https://v.youku.com/v_show/id_XNDkxMjQ4NjA4MA==.html">优酷示例</a-option>
            </a-select>
          </a-form-item>
        </a-form>
        
        <div class="test-actions">
          <a-button type="primary" @click="startBatchTest" :loading="batchTesting">
            开始测试
          </a-button>
          <a-button @click="showBatchTestDialog = false">
            关闭
          </a-button>
        </div>
        
        <div v-if="batchTestResults.length > 0" class="batch-results">
          <h4>测试结果</h4>
          <div class="results-list">
            <div
              v-for="result in batchTestResults"
              :key="result.id"
              class="result-item"
            >
              <div class="result-header">
                <span class="parser-name">{{ result.name }}</span>
                <a-tag :color="result.success ? 'green' : 'red'">
                  {{ result.success ? '成功' : '失败' }}
                </a-tag>
              </div>
              <div class="result-message">{{ result.message }}</div>
            </div>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import draggable from 'vuedraggable'
import { useParserStore } from '@/stores/parser'
import configService from '@/api/services/config'
import {
  IconCode,
  IconPlus,
  IconImport,
  IconExport,
  IconMore,
  IconRefresh,
  IconPlayArrow,
  IconDelete,
  IconDragArrow,
  IconEdit,
  IconUpload,
  IconLink
} from '@arco-design/web-vue/es/icon'

// Store
const parserStore = useParserStore()

// 响应式数据
const searchKeyword = ref('')
const filterStatus = ref('')
const filterType = ref('')
const showAddDialog = ref(false)
const showImportDialog = ref(false)
const showConfigDialog = ref(false)
const showBatchTestDialog = ref(false)
const editingParser = ref(null)
const testingParsers = ref(new Set())
const testResults = ref({})
const batchTesting = ref(false)
const batchTestResults = ref([])
const uploadRef = ref(null)
const importFile = ref(null)

// 表单数据
const parserForm = ref({
  name: '',
  url: '',
  type: '0',
  flags: [],
  headerJson: ''
})

const configForm = ref({
  url: ''
})

const batchTestForm = ref({
  videoUrl: 'https://v.qq.com/x/cover/mzc00200mp8vo9b.html'
})

// 用于拖拽的响应式数据
const dragParsers = ref([])

// 计算属性 - 过滤后的解析器
const filteredParsers = computed(() => {
  let result = [...parserStore.parsers]
  
  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(parser =>
      parser.name.toLowerCase().includes(keyword) ||
      parser.url.toLowerCase().includes(keyword)
    )
  }
  
  // 状态过滤
  if (filterStatus.value === 'enabled') {
    result = result.filter(parser => parser.enabled)
  } else if (filterStatus.value === 'disabled') {
    result = result.filter(parser => !parser.enabled)
  }
  
  // 类型过滤 - 处理数字和字符串类型的兼容性
  if (filterType.value) {
    result = result.filter(parser => {
      // 将两个值都转换为字符串进行比较，确保兼容性
      return String(parser.type) === String(filterType.value)
    })
  }
  
  return result
})

// 监听过滤结果变化，更新拖拽数据
watch(filteredParsers, (newFiltered) => {
  // 只在筛选条件变化时才完全重新创建数组
  // 避免在开关切换时重新创建，保持响应式绑定
  if (dragParsers.value.length !== newFiltered.length || 
      !dragParsers.value.every(item => newFiltered.some(filtered => filtered.id === item.id))) {
    dragParsers.value = [...newFiltered]
  } else {
    // 如果数组长度和ID都相同，只更新现有项的属性
    dragParsers.value.forEach((dragItem, index) => {
      const filteredItem = newFiltered.find(item => item.id === dragItem.id)
      if (filteredItem) {
        Object.assign(dragItem, filteredItem)
      }
    })
  }
}, { immediate: true })

// 监听筛选条件变化，确保筛选功能正常工作
watch([searchKeyword, filterStatus, filterType], () => {
  // 当筛选条件变化时，完全重新创建拖拽列表
  dragParsers.value = [...filteredParsers.value]
}, { immediate: false })

// 方法
const toggleParser = (id) => {
  parserStore.toggleParser(id)
  Message.success('解析器状态已更新')
}

const handleSwitchChange = (id, value) => {
  // 直接更新store中的状态，不需要切换，因为v-model已经更新了本地状态
  const parser = parserStore.parsers.find(p => p.id === id)
  if (parser) {
    parser.enabled = value
    parserStore.saveToLocalStorage()
    Message.success('解析器状态已更新')
  }
}

const enableAllParsers = () => {
  const count = parserStore.parsers.length
  if (count === 0) {
    Message.warning('没有可启用的解析器')
    return
  }
  
  parserStore.parsers.forEach(parser => {
    parser.enabled = true
  })
  parserStore.saveToLocalStorage()
  Message.success(`已启用所有 ${count} 个解析器`)
}

const disableAllParsers = () => {
  const count = parserStore.parsers.length
  if (count === 0) {
    Message.warning('没有可停用的解析器')
    return
  }
  
  parserStore.parsers.forEach(parser => {
    parser.enabled = false
  })
  parserStore.saveToLocalStorage()
  Message.success(`已停用所有 ${count} 个解析器`)
}

const editParser = (parser) => {
  editingParser.value = parser
  parserForm.value = {
    name: parser.name,
    url: parser.url,
    type: parser.type || '0',
    flags: parser.ext?.flag || [],
    headerJson: parser.header ? JSON.stringify(parser.header, null, 2) : ''
  }
  showAddDialog.value = true
}

const deleteParser = (id) => {
  if (parserStore.deleteParser(id)) {
    Message.success('解析器已删除')
  }
}

const testParser = async (parser) => {
  testingParsers.value.add(parser.id)
  
  try {
    const result = await parserStore.testParser(parser, batchTestForm.value.videoUrl)
    testResults.value[parser.id] = result
    
    Message[result.success ? 'success' : 'error'](result.message)
  } catch (err) {
    Message.error(`测试失败: ${err.message}`)
  } finally {
    testingParsers.value.delete(parser.id)
  }
}

const handleSaveParser = () => {
  if (!parserForm.value.name || !parserForm.value.url) {
    Message.error('请填写必要信息')
    return
  }
  
  try {
    const parserData = {
      name: parserForm.value.name,
      url: parserForm.value.url,
      type: parserForm.value.type,
      ext: {
        flag: parserForm.value.flags
      },
      header: parserForm.value.headerJson ? JSON.parse(parserForm.value.headerJson) : {}
    }
    
    if (editingParser.value) {
      parserStore.updateParser(editingParser.value.id, parserData)
      Message.success('解析器已更新')
    } else {
      parserStore.addParser(parserData)
      Message.success('解析器已添加')
    }
    
    handleCancelEdit()
  } catch (err) {
    Message.error('保存失败: ' + err.message)
  }
}

const handleCancelEdit = () => {
  showAddDialog.value = false
  editingParser.value = null
  parserForm.value = {
    name: '',
    url: '',
    type: '0',
    flags: [],
    headerJson: ''
  }
}

const handleDragEnd = () => {
  // 获取拖拽后的解析器列表
  const reorderedParsers = dragParsers.value
  
  // 创建一个映射，记录新的顺序
  const orderMap = new Map()
  reorderedParsers.forEach((parser, index) => {
    orderMap.set(parser.id, index)
  })
  
  // 更新解析器顺序
  parserStore.reorderParsersById(orderMap)
  Message.success('排序已保存')
}

const exportParsers = () => {
  parserStore.exportParsers()
  Message.success('配置已导出')
}

const handleFileChange = (fileList) => {
  if (fileList.length > 0) {
    importFile.value = fileList[0].file
  }
}

const handleImport = async () => {
  if (!importFile.value) {
    Message.error('请选择文件')
    return
  }
  
  const result = await parserStore.importParsers(importFile.value)
  if (result.success) {
    Message.success(`成功导入 ${result.count} 个解析器`)
    showImportDialog.value = false
    importFile.value = null
  } else {
    Message.error('导入失败: ' + result.error)
  }
}

const handleLoadConfig = async () => {
  if (!configForm.value.url) {
    Message.error('请输入配置地址')
    return
  }
  
  const success = await parserStore.loadParsersFromConfig(configForm.value.url)
  if (success) {
    Message.success('配置加载成功')
    showConfigDialog.value = false
    configForm.value.url = ''
  }
}

const startBatchTest = async () => {
  if (!batchTestForm.value.videoUrl) {
    Message.error('请输入测试视频地址')
    return
  }
  
  batchTesting.value = true
  batchTestResults.value = []
  
  for (const parser of parserStore.enabledParsers) {
    try {
      const result = await parserStore.testParser(parser, batchTestForm.value.videoUrl)
      batchTestResults.value.push({
        id: parser.id,
        name: parser.name,
        success: result.success,
        message: result.message
      })
    } catch (err) {
      batchTestResults.value.push({
        id: parser.id,
        name: parser.name,
        success: false,
        message: `测试失败: ${err.message}`
      })
    }
  }
  
  batchTesting.value = false
  Message.success('批量测试完成')
}

const resetFromConfig = async () => {
  try {
    // 从配置服务获取当前配置的地址
    const configUrl = configService.getConfigUrl()
    if (!configUrl) {
      Message.warning('未配置点播地址，请先在设置中配置点播地址')
      return
    }
    
    // 确认重置操作
    const confirmed = await new Promise((resolve) => {
      Modal.confirm({
        title: '重置解析配置',
        content: '确定要从点播配置重置解析列表吗？这将覆盖当前的解析配置。',
        onOk: () => resolve(true),
        onCancel: () => resolve(false)
      })
    })
    
    if (!confirmed) return
    
    // 从配置地址加载解析列表
    const success = await parserStore.loadParsersFromConfig(configUrl)
    if (success) {
      Message.success('已从点播配置重置解析列表')
    } else {
      Message.error('重置失败，请检查点播配置是否正确')
    }
  } catch (err) {
    Message.error('重置失败: ' + err.message)
  }
}

const handleMoreAction = (value) => {
  switch (value) {
    case 'enable-all':
      enableAllParsers()
      break
    case 'disable-all':
      disableAllParsers()
      break
    case 'load-config':
      showConfigDialog.value = true
      break
    case 'test-all':
      showBatchTestDialog.value = true
      break
    case 'clear-all':
      if (confirm('确定要清空所有解析器吗？此操作不可恢复！')) {
        parserStore.clearAllParsers()
        Message.success('已清空所有解析器')
      }
      break
  }
}

const retryLoad = () => {
  parserStore.error = null
  // 可以在这里重新加载配置
}

// 组件挂载时加载数据
onMounted(async () => {
  // 首先从本地存储加载
  parserStore.loadFromLocalStorage()
  
  // 如果本地没有解析器数据，且配置了点播地址，则自动从配置加载
  if (parserStore.parserCount === 0) {
    const configUrl = configService.getConfigUrl()
    if (configUrl) {
      try {
        const success = await parserStore.loadParsersFromConfig(configUrl)
        if (success) {
          Message.info('已自动从点播配置加载解析列表')
        }
      } catch (err) {
        console.warn('自动加载解析配置失败:', err)
      }
    }
  }
})
</script>

<style scoped>
.parser-container {
  width: 100%;
  max-width: var(--dp-page-narrow-width);
  height: 100%;
  min-height: 0;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: transparent;
}

.simple-header {
  display: none;
}

.navigation-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--dp-text-primary);
}

.parser-header {
  padding: 20px 22px;
  margin-bottom: 16px;
  background: var(--dp-bg-surface);
  border: 1px solid var(--dp-border-subtle);
  border-radius: var(--dp-radius-xl);
  box-shadow: var(--dp-shadow-sm);
}

.header-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.page-title {
  font-size: 24px;
  line-height: 1.25;
  font-weight: 800;
  color: var(--dp-text-primary);
  margin: 0;
}

.page-subtitle {
  font-size: 14px;
  line-height: 1.5;
  color: var(--dp-text-tertiary);
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
  gap: 10px;
}

.parser-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 0 28px;
  background: transparent;
}

.loading-container,
.error-container,
.empty-container {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.filter-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  padding: 14px 16px;
  background: var(--dp-bg-surface);
  border-radius: var(--dp-radius-xl);
  border: 1px solid var(--dp-border-subtle);
  box-shadow: var(--dp-shadow-sm);
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.parsers-list {
  background: var(--dp-bg-surface);
  border-radius: var(--dp-radius-xl);
  border: 1px solid var(--dp-border-subtle);
  box-shadow: var(--dp-shadow-sm);
  overflow: hidden;
}

.drag-container {
  min-height: 100px;
}

.parser-item {
  display: flex;
  align-items: flex-start;
  padding: 16px 18px;
  border-bottom: 1px solid var(--dp-border-subtle);
  transition: background 0.2s ease;
  background: var(--dp-bg-surface);
  touch-action: pan-y;
}

.parser-drag-ghost {
  opacity: 0.7;
}

.parser-drag-chosen {
  background: var(--dp-bg-surface-muted);
}

.parser-item:last-child {
  border-bottom: none;
}

.parser-item:hover {
  background: var(--dp-bg-surface-muted);
}

.parser-item.disabled {
  opacity: 0.62;
}

.parser-drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-right: 12px;
  cursor: grab;
  color: var(--dp-text-tertiary);
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.parser-drag-handle:active {
  cursor: grabbing;
}

.parser-info {
  flex: 1;
  min-width: 0;
}

.parser-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.parser-name {
  font-size: 16px;
  font-weight: 800;
  color: var(--dp-text-primary);
}

.parser-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.parser-details {
  margin-bottom: 8px;
}

.parser-url {
  font-size: 13px;
  color: var(--dp-text-secondary);
  margin-bottom: 8px;
  word-break: break-all;
}

.parser-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.parser-flags {
  font-size: 12px;
  color: var(--color-text-3);
}

.test-result {
  margin-top: 12px;
}

.danger-option {
  color: var(--color-danger-6);
}

.form-help {
  font-size: 12px;
  color: var(--color-text-3);
  margin-top: 4px;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  border: 2px dashed var(--color-border-2);
  border-radius: 8px;
  background: var(--color-fill-1);
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-area:hover {
  border-color: var(--color-primary-6);
  background: var(--color-primary-light-1);
}

.upload-text {
  text-align: center;
  margin-top: 12px;
}

.upload-hint {
  font-size: 12px;
  color: var(--color-text-3);
  margin-top: 4px;
}

.batch-test-content {
  max-height: 500px;
  overflow-y: auto;
}

.test-actions {
  display: flex;
  gap: 12px;
  margin: 16px 0;
}

.batch-results {
  margin-top: 24px;
}

.results-list {
  max-height: 300px;
  overflow-y: auto;
}

.result-item {
  padding: 12px;
  border: 1px solid var(--color-border-2);
  border-radius: 6px;
  margin-bottom: 8px;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.result-message {
  font-size: 12px;
  color: var(--color-text-3);
}

@media (max-width: 1024px) {
  .header-content,
  .filter-section {
    align-items: stretch;
    flex-direction: column;
  }

  .header-actions,
  .filter-controls {
    justify-content: flex-start;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .parser-container {
    min-height: 100%;
    background:
      radial-gradient(circle at top left, rgba(22, 93, 255, 0.1), transparent 34%),
      var(--dp-bg-app);
  }

  .simple-header {
    display: none;
  }

  .parser-header {
    padding: 10px 0 12px;
    margin-bottom: 0;
    background: transparent;
    border: none;
    border-radius: 0;
    box-shadow: none;
  }

  .header-content {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .header-left {
    justify-content: space-between;
    gap: 10px;
  }

  .page-title {
    font-size: 22px;
    line-height: 1.25;
    font-weight: 800;
    color: var(--dp-text-primary);
  }

  .page-subtitle {
    font-size: 13px;
    color: var(--dp-text-secondary);
  }

  .header-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .header-actions :deep(.arco-btn) {
    min-width: 0;
    height: 40px;
    border-radius: 999px;
  }

  .parser-content {
    padding: 0 0 12px;
    background: transparent;
  }

  .filter-section {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
    margin-bottom: 12px;
    padding: 12px;
    border-radius: 18px;
    background: var(--dp-bg-surface);
    border-color: var(--dp-border-subtle);
    box-shadow: var(--dp-shadow-sm);
  }

  .filter-controls {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 8px;
  }

  .filter-controls :deep(.arco-select),
  .filter-controls :deep(.arco-input-wrapper) {
    min-width: 0;
    width: 100% !important;
  }

  .filter-section > :deep(.arco-btn) {
    height: 40px;
    border-radius: 999px;
  }

  .parsers-list {
    border-radius: 18px;
    background: transparent;
    border: none;
    overflow: visible;
  }

  .drag-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .parser-item {
    padding: 12px;
    border: 1px solid var(--dp-border-subtle);
    border-radius: 18px;
    background: var(--dp-bg-surface);
    box-shadow: var(--dp-shadow-sm);
  }

  .parser-header-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .parser-actions {
    align-self: stretch;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px;
  }

  .parser-actions :deep(.arco-btn) {
    min-width: 0;
  }

  .parser-meta {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
