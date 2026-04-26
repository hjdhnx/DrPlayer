<template>
  <div class="action-doc-card">
    <a-card 
      :bordered="false" 
      class="card-container"
      :body-style="{ padding: '20px' }"
    >
      <template #title>
        <div class="card-title">
          <icon-book class="title-icon" />
          <span>Action 动作指令文档</span>
        </div>
      </template>
      
      <template #extra>
        <a-button 
          type="text" 
          size="small" 
          @click="toggleExpanded"
          class="expand-btn"
        >
          <icon-down v-if="!isExpanded" />
          <icon-up v-if="isExpanded" />
          {{ isExpanded ? '收起' : '展开' }}
        </a-button>
      </template>

      <div class="card-content">
        <!-- 概览信息 -->
        <div class="overview-section">
          <div class="overview-item">
            <div class="overview-label">总条目数</div>
            <div class="overview-value">{{ totalItems }}</div>
          </div>
          <div class="overview-item">
            <div class="overview-label">动作类型</div>
            <div class="overview-value">{{ actionTypes.length }}</div>
          </div>
          <div class="overview-item">
            <div class="overview-label">专项动作</div>
            <div class="overview-value">{{ specialActions.length }}</div>
          </div>
        </div>

        <!-- 快速导航 -->
        <div class="quick-nav" v-if="!isExpanded">
          <a-tag 
            v-for="category in quickNavItems" 
            :key="category.key"
            :color="category.color"
            class="nav-tag"
            @click="scrollToSection(category.key)"
          >
            {{ category.name }}
          </a-tag>
        </div>

        <!-- 展开内容 -->
        <div v-if="isExpanded" class="expanded-content">
          <!-- 基础概念 -->
          <div class="section" id="basic-concepts">
            <h3 class="section-title">
              <icon-info-circle class="section-icon" />
              基础概念
            </h3>
            <div class="concept-grid">
              <div class="concept-item" v-for="concept in basicConcepts" :key="concept.key">
                <div class="concept-title">{{ concept.title }}</div>
                <div class="concept-desc">{{ concept.description }}</div>
              </div>
            </div>
          </div>

          <!-- 动作类型 -->
          <div class="section" id="action-types">
            <h3 class="section-title">
              <icon-settings class="section-icon" />
              动作类型
            </h3>
            <div class="action-types-grid">
              <a-card 
                v-for="type in actionTypeDetails" 
                :key="type.key"
                size="small"
                class="action-type-card"
                :hoverable="true"
              >
                <div class="action-type-header">
                  <a-tag :color="type.color">{{ type.name }}</a-tag>
                  <span class="action-type-code">{{ type.type }}</span>
                </div>
                <div class="action-type-desc">{{ type.description }}</div>
                <div class="action-type-usage" v-if="type.usage">
                  <strong>用途：</strong>{{ type.usage }}
                </div>
              </a-card>
            </div>
          </div>

          <!-- 专项动作 -->
          <div class="section" id="special-actions">
            <h3 class="section-title">
              <icon-star class="section-icon" />
              专项动作
            </h3>
            <div class="special-actions-list">
              <div 
                v-for="action in specialActionDetails" 
                :key="action.key"
                class="special-action-item"
              >
                <div class="special-action-header">
                  <code class="action-id">{{ action.actionId }}</code>
                  <span class="action-name">{{ action.name }}</span>
                </div>
                <div class="special-action-desc">{{ action.description }}</div>
                <div class="special-action-params" v-if="action.params">
                  <strong>参数：</strong>
                  <span v-for="param in action.params" :key="param" class="param-tag">
                    {{ param }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 配置参数 -->
          <div class="section" id="config-params">
            <h3 class="section-title">
              <icon-code class="section-icon" />
              配置参数
            </h3>
            <div class="params-grid">
              <div 
                v-for="param in configParams" 
                :key="param.key"
                class="param-item"
              >
                <div class="param-header">
                  <code class="param-name">{{ param.name }}</code>
                  <a-tag size="small" :color="param.typeColor">{{ param.type }}</a-tag>
                </div>
                <div class="param-desc">{{ param.description }}</div>
              </div>
            </div>
          </div>

          <!-- 示例代码 -->
          <div class="section" id="examples">
            <h3 class="section-title">
              <icon-code-block class="section-icon" />
              示例代码
            </h3>
            <a-tabs type="card" class="example-tabs">
              <a-tab-pane key="basic" title="基础动作">
                <pre class="code-block">{{ basicActionExample }}</pre>
              </a-tab-pane>
              <a-tab-pane key="input" title="单项输入">
                <pre class="code-block">{{ inputActionExample }}</pre>
              </a-tab-pane>
              <a-tab-pane key="multi" title="多项输入">
                <pre class="code-block">{{ multiInputExample }}</pre>
              </a-tab-pane>
            </a-tabs>
          </div>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  IconBook, 
  IconDown, 
  IconUp, 
  IconInfoCircle, 
  IconSettings, 
  IconStar, 
  IconCode, 
  IconCodeBlock 
} from '@arco-design/web-vue/es/icon'
import actionDataJson from '@/assets/action.json'

const isExpanded = ref(false)
const actionData = ref(actionDataJson)

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const scrollToSection = (sectionId) => {
  isExpanded.value = true
  setTimeout(() => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }, 100)
}

// action.json数据已通过静态导入加载
onMounted(() => {
  // 数据已在组件初始化时加载，无需额外操作
})

// 计算属性
const totalItems = computed(() => Object.keys(actionData.value).length)

const actionTypes = computed(() => {
  const types = new Set()
  Object.values(actionData.value).forEach(action => {
    if (action.type) types.add(action.type)
  })
  return Array.from(types)
})

const specialActions = computed(() => {
  return Object.entries(actionData.value).filter(([key, action]) => 
    action.special === true
  ).map(([key, action]) => ({ key, ...action }))
})

const quickNavItems = ref([
  { key: 'basic-concepts', name: '基础概念', color: 'blue' },
  { key: 'action-types', name: '动作类型', color: 'green' },
  { key: 'special-actions', name: '专项动作', color: 'orange' },
  { key: 'config-params', name: '配置参数', color: 'purple' },
  { key: 'examples', name: '示例代码', color: 'red' }
])

const basicConcepts = computed(() => [
  {
    key: 'interaction',
    title: '交互动作',
    description: actionData.value['交互动作'] || ''
  },
  {
    key: 'action-command',
    title: '动作指令',
    description: actionData.value['动作指令']?.split('\n\n')[0] || ''
  },
  {
    key: 'video-vod',
    title: '视频VOD',
    description: actionData.value['视频VOD']?.split('例如：')[0] || ''
  },
  {
    key: 'interface-action',
    title: '接口action',
    description: actionData.value['接口action'] || ''
  }
])

const actionTypeDetails = ref([
  {
    key: 'basic',
    name: '基础动作',
    type: 'string',
    color: 'blue',
    description: '简单的动作指令字符串，用户点击时无信息输入窗口',
    usage: '直接发送指令'
  },
  {
    key: 'input',
    name: '单项输入',
    type: 'input',
    color: 'green',
    description: '要求用户输入一个字段的动作',
    usage: '获取用户单个输入值'
  },
  {
    key: 'edit',
    name: '多行编辑',
    type: 'edit',
    color: 'cyan',
    description: '要求用户在多行编辑区输入单个字段内容',
    usage: '长文本输入'
  },
  {
    key: 'multiInput',
    name: '多项输入',
    type: 'multiInput',
    color: 'purple',
    description: '要求用户输入多个字段（5个以内）',
    usage: '少量多字段输入'
  },
  {
    key: 'multiInputX',
    name: '增强多项输入',
    type: 'multiInputX',
    color: 'orange',
    description: '要求用户输入多个字段（不限制个数）',
    usage: '复杂表单输入'
  },
  {
    key: 'menu',
    name: '单项选择',
    type: 'menu',
    color: 'lime',
    description: '要求用户在列表中选择一个项目',
    usage: '单选操作'
  },
  {
    key: 'select',
    name: '多项选择',
    type: 'select',
    color: 'gold',
    description: '要求用户在列表中选择多个项目',
    usage: '多选操作'
  },
  {
    key: 'msgbox',
    name: '消息弹窗',
    type: 'msgbox',
    color: 'red',
    description: '弹出窗口显示消息',
    usage: '信息展示'
  }
])

const specialActionDetails = computed(() => [
  {
    key: 'self_search',
    actionId: '__self_search__',
    name: '源内搜索',
    description: actionData.value['__self_search__']?.split('\n\n')[0] || '',
    params: ['skey', 'name', 'tid', 'flag', 'folder']
  },
  {
    key: 'detail',
    actionId: '__detail__',
    name: '详情页跳转',
    description: actionData.value['__detail__']?.split('\n\n')[0] || '',
    params: ['skey', 'ids']
  },
  {
    key: 'ktvplayer',
    actionId: '__ktvplayer__',
    name: 'KTV播放',
    description: actionData.value['__ktvplayer__']?.split('\n\n')[0] || '',
    params: ['name', 'id']
  },
  {
    key: 'refresh_list',
    actionId: '__refresh_list__',
    name: '刷新列表',
    description: actionData.value['__refresh_list__'] || '',
    params: []
  },
  {
    key: 'copy',
    actionId: '__copy__',
    name: '复制内容',
    description: actionData.value['__copy__'] || '',
    params: ['content']
  },
  {
    key: 'keep',
    actionId: '__keep__',
    name: '保持窗口',
    description: actionData.value['__keep__']?.split('\n\n')[0] || '',
    params: ['msg', 'reset']
  }
])

const configParams = ref([
  { key: 'actionId', name: 'actionId', type: '字符型', typeColor: 'blue', description: '识别动作的路由ID或专项动作指令，必须' },
  { key: 'type', name: 'type', type: '字符型', typeColor: 'blue', description: '动作的类型' },
  { key: 'title', name: 'title', type: '字符型', typeColor: 'blue', description: '标题' },
  { key: 'width', name: 'width', type: '整型', typeColor: 'green', description: '宽度' },
  { key: 'height', name: 'height', type: '整型', typeColor: 'green', description: '高度' },
  { key: 'msg', name: 'msg', type: '字符型', typeColor: 'blue', description: '文本消息内容' },
  { key: 'button', name: 'button', type: '整型', typeColor: 'green', description: '按键的数量。0-无按键，1-取消，2-确定/取消, 3-确定/取消/重置' },
  { key: 'timeout', name: 'timeout', type: '整型', typeColor: 'green', description: '超时时间（秒）。超时自动关闭窗口' },
  { key: 'keep', name: 'keep', type: '逻辑型', typeColor: 'purple', description: '输入确认后，窗口是否保持' },
  { key: 'tip', name: 'tip', type: '字符型', typeColor: 'blue', description: '单项输入的输入提示，单项输入时必须' }
])

const basicActionExample = ref(`{
  "vod_id": "hello world",
  "vod_name": "基础动作",
  "vod_tag": "action"
}`)

const inputActionExample = ref(`{
  "actionId": "动作路由ID",
  "type": "input",
  "width": 450,
  "title": "输入窗口标题",
  "tip": "输入提示",
  "value": "输入初始值",
  "msg": "窗口文本说明",
  "button": 2,
  "selectData": "1:=快速输入一,2:=快速输入二,3:=快速输入三"
}`)

const multiInputExample = ref(`{
  "actionId": "多项输入",
  "type": "multiInputX",
  "title": "多项输入(multiInputX)",
  "width": 716,
  "button": 3,
  "input": [
    {
      "id": "item1",
      "name": "文件夹路径",
      "tip": "请输入文件夹路径",
      "selectData": "[folder]",
      "inputType": 0
    },
    {
      "id": "item2",
      "name": "多行输入",
      "tip": "请输入内容",
      "multiLine": 5
    }
  ]
}`)
</script>

<style scoped>
.action-doc-card {
  margin-bottom: 20px;
}

.card-container {
  background: var(--dp-bg-surface);
  border: 1px solid var(--dp-border-subtle);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.card-container:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.card-title {
  display: flex;
  align-items: center;
  color: var(--dp-text-primary);
  font-weight: 600;
  font-size: 16px;
}

.title-icon {
  margin-right: 8px;
  font-size: 18px;
}

.expand-btn {
  color: var(--dp-primary-readable) !important;
  border: 1px solid color-mix(in srgb, var(--dp-primary-readable) 30%, transparent) !important;
  background: var(--dp-bg-hover) !important;
  transition: all 0.3s ease;
}

.expand-btn:hover {
  background: color-mix(in srgb, var(--dp-primary-readable) 12%, transparent) !important;
  border-color: color-mix(in srgb, var(--dp-primary-readable) 45%, transparent) !important;
}

.card-content {
  color: var(--dp-text-primary);
}

.overview-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.overview-item {
  text-align: center;
  padding: 15px;
  background: var(--dp-bg-surface-muted);
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.overview-label {
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 5px;
}

.overview-value {
  font-size: 24px;
  font-weight: bold;
}

.quick-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 15px;
}

.nav-tag {
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--dp-text-primary) !important;
  background: var(--dp-bg-surface-muted) !important;
  border: 1px solid var(--dp-border) !important;
}

.nav-tag:hover {
  transform: scale(1.05);
}

.expanded-content {
  margin-top: 20px;
}

.section {
  margin-bottom: 30px;
  padding: 20px;
  background: var(--dp-bg-hover);
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.section-title {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  color: var(--dp-text-primary);
  font-size: 18px;
  font-weight: 600;
}

.section-icon {
  margin-right: 8px;
  font-size: 20px;
}

.concept-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
}

.concept-item {
  padding: 15px;
  background: var(--dp-bg-surface-muted);
  border-radius: 6px;
}

.concept-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--dp-primary-readable);
}

.concept-desc {
  font-size: 14px;
  line-height: 1.5;
  opacity: 0.9;
}

.action-types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 15px;
}

.action-type-card {
  background: var(--dp-bg-surface) !important;
  border: 1px solid var(--dp-border-subtle) !important;
}

.action-type-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.action-type-code {
  font-family: 'Courier New', monospace;
  background: var(--dp-bg-surface);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--dp-primary-readable);
}

.action-type-desc {
  color: var(--dp-text-primary);
  margin-bottom: 8px;
  font-size: 14px;
}

.action-type-usage {
  color: var(--dp-text-secondary);
  font-size: 12px;
}

.special-actions-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.special-action-item {
  padding: 15px;
  background: var(--dp-bg-surface-muted);
  border-radius: 6px;
  border-left: 4px solid var(--dp-primary-readable);
}

.special-action-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.action-id {
  background: var(--dp-bg-surface);
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  color: var(--dp-primary-readable);
  font-size: 12px;
}

.action-name {
  font-weight: 600;
  color: var(--dp-text-primary);
}

.special-action-desc {
  margin-bottom: 8px;
  font-size: 14px;
  opacity: 0.9;
}

.special-action-params {
  font-size: 12px;
  opacity: 0.8;
}

.param-tag {
  display: inline-block;
  background: color-mix(in srgb, var(--dp-primary-readable) 12%, var(--dp-bg-surface));
  padding: 2px 6px;
  margin: 0 4px 4px 0;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

.params-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
}

.param-item {
  padding: 12px;
  background: var(--dp-bg-surface-muted);
  border-radius: 6px;
}

.param-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.param-name {
  font-family: 'Courier New', monospace;
  background: var(--dp-bg-surface);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--dp-primary-readable);
  font-size: 12px;
}

.param-desc {
  font-size: 14px;
  opacity: 0.9;
}

.example-tabs {
  background: var(--dp-bg-surface-muted);
  border-radius: 6px;
  padding: 15px;
}

.code-block {
  background: var(--dp-bg-surface);
  padding: 15px;
  border-radius: 6px;
  color: var(--dp-primary-readable);
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
}

/* 主题适配 */
:deep(.arco-card-header) {
  background: transparent !important;
  border-bottom: 1px solid color-mix(in srgb, currentColor 16%, transparent) !important;
}

:deep(.arco-card-body) {
  background: transparent !important;
}

:deep(.arco-tabs-nav) {
  background: color-mix(in srgb, var(--dp-bg-surface-muted) 92%, transparent) !important;
  border: 1px solid var(--dp-border-subtle);
  border-radius: 10px;
}

:deep(.arco-tabs-tab) {
  color: var(--dp-text-secondary) !important;
  font-weight: 600;
}

:deep(.arco-tabs-tab-active) {
  color: var(--dp-primary-readable) !important;
}

:deep(.arco-tabs-content) {
  background: transparent !important;
}

@media (prefers-color-scheme: dark) {
  :deep(.arco-tabs-nav) {
    background: rgba(255, 255, 255, 0.1) !important;
  }

  :deep(.arco-tabs-tab) {
    color: rgba(255, 255, 255, 0.82) !important;
  }

  :deep(.arco-tabs-tab-active) {
    color: #fff !important;
  }
}
</style>