<template>
  <div class="action-test-container">
    <!-- 固定头部区域 -->
    <div class="test-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <icon-code class="title-icon" />
            Action组件测试
          </h1>
          <p class="page-subtitle">测试各种Action组件的功能和交互效果</p>
        </div>
        <div class="nav-buttons">
          <a-button type="primary" status="success" @click="goToDebugTest" class="nav-button">
            <icon-bug />
            综合测试工具
          </a-button>
          <a-button type="primary" status="warning" @click="goToVideoTest" class="nav-button">
            <icon-play-arrow />
            视频播放测试
          </a-button>
        </div>
      </div>
    </div>

    <!-- 可滚动内容区域 -->
    <div class="test-content">
      <!-- 基础测试 -->
      <div class="test-section">
        <h2>基础Action测试</h2>
        <div class="test-buttons">
          <a-button type="outline" status="success" shape="round" @click="testInputAction">输入框测试</a-button>
          <a-button type="outline" status="success" shape="round" @click="testQuickSelectAction">快速选择测试</a-button>
          <a-button type="outline" status="success" shape="round" @click="testEditAction">多行编辑测试</a-button>
          <a-button type="outline" status="success" shape="round" @click="testMultiInputAction">多输入框测试</a-button>
          <a-button type="outline" status="success" shape="round" @click="testMultiInputXAction">增强多输入框测试</a-button>
          <a-button type="outline" status="success" shape="round" @click="testMenuAction">菜单测试（单选）</a-button>
          <a-button type="outline" status="success" shape="round" @click="testMultiMenuAction">菜单测试（多选）</a-button>
          <a-button type="outline" status="success" shape="round" @click="testSelectAction">选择框测试</a-button>
          <a-button type="outline" status="success" shape="round" @click="testMsgBoxAction">消息框测试</a-button>
          <a-button type="outline" status="success" shape="round" @click="testWebViewAction">网页视图测试</a-button>
          <a-button type="outline" status="success" shape="round" @click="testHelpAction">帮助页面测试</a-button>
        </div>
      </div>

      <!-- 便捷方法测试 -->
      <div class="test-section">
        <h2>便捷方法测试</h2>
        <div class="test-buttons">
          <a-button type="outline" status="success" shape="round" @click="testAlert">Alert</a-button>
          <a-button type="outline" status="success" shape="round" @click="testConfirm">Confirm</a-button>
          <a-button type="outline" status="success" shape="round" @click="testInfo">Info</a-button>
          <a-button type="outline" status="success" shape="round" @click="testSuccess">Success</a-button>
          <a-button type="outline" status="success" shape="round" @click="testError">Error</a-button>
          <a-button type="outline" status="success" shape="round" @click="testWarning">Warning</a-button>
          <a-button type="outline" status="success" shape="round" @click="testLoading">Loading</a-button>
          <a-button type="outline" status="success" shape="round" @click="testProgress">Progress</a-button>
        </div>
      </div>

      <!-- 专项动作测试 -->
      <div class="test-section">
        <h2>专项动作测试</h2>
        <p class="section-description">测试T4接口返回的专项动作处理功能</p>
        <div class="test-buttons">
          <a-button type="outline" status="warning" shape="round" @click="testKeepAction">__keep__ 保持窗口</a-button>
          <a-button type="outline" status="warning" shape="round" @click="testDetailAction">__detail__ 详情跳转</a-button>
          <a-button type="outline" status="warning" shape="round" @click="testCopyAction">__copy__ 复制内容</a-button>
          <a-button type="outline" status="warning" shape="round" @click="testSelfSearchAction">__self_search__ 源内搜索</a-button>
          <a-button type="outline" status="warning" shape="round" @click="testRefreshListAction">__refresh_list__ 刷新列表</a-button>
          <a-button type="outline" status="warning" shape="round" @click="testKtvPlayerAction">__ktvplayer__ KTV播放</a-button>
        </div>
      </div>

      <!-- 高级功能测试 -->
      <div class="test-section">
        <h2>高级功能测试</h2>
        <!-- 图片预览测试 -->
        <div class="image-preview-test" style="margin-bottom: 16px;">
          <h3>图片加载测试:</h3>
          <img :src="livesImage" alt="Lives Image Test" style="max-width: 200px; max-height: 150px; border: 1px solid #ccc; border-radius: 4px;" />
          <p>图片URL: {{ livesImage }}</p>
        </div>
        <div class="test-buttons">
          <a-button type="outline" status="success" shape="round" @click="testTimeout">超时测试</a-button>
          <a-button type="outline" status="success" shape="round" @click="testQueue">队列测试</a-button>
          <a-button type="outline" status="success" shape="round" @click="testValidation">验证测试</a-button>
          <a-button type="outline" status="success" shape="round" @click="testCustomStyle">自定义样式</a-button>
          <a-button type="outline" status="success" shape="round" @click="testImageAction">图片Action</a-button>
          <a-button type="outline" status="success" shape="round" @click="testQRAction">二维码Action</a-button>
          <a-button type="outline" status="success" shape="round" @click="testQRText">文本二维码</a-button>
          <a-button type="outline" status="success" shape="round" @click="testQRWifi">WiFi二维码</a-button>
          <a-button type="outline" status="success" shape="round" @click="testQRContact">联系人二维码</a-button>
        </div>
      </div>

      <!-- Action数据解析调试 -->
      <div class="test-section">
        <h2>Action数据解析调试</h2>
        <div class="debug-area">
          <!-- 原始数据输入区域 -->
          <div class="debug-input-section">
            <h3>原始数据输入</h3>
            <p class="debug-description">请粘贴T4 API返回的vod_id字段内容：</p>
            <a-textarea 
              v-model="debugRawData" 
              :rows="8"
              placeholder="粘贴vod_id字段的JSON字符串..."
              class="debug-textarea"
            />
            <div class="debug-buttons">
              <a-button type="outline" status="success" shape="round" @click="parseDebugData">解析数据</a-button>
              <a-button type="outline" status="success" shape="round" @click="loadDebugTestData">加载测试数据</a-button>
            </div>
          </div>

          <!-- 解析结果 -->
          <div v-if="debugParseResult" class="debug-result-section">
            <h3>解析结果</h3>
            <div class="debug-status">
              <span class="debug-label">解析状态：</span>
              <span :class="debugParseResult.success ? 'debug-success' : 'debug-error'">
                {{ debugParseResult.success ? '成功' : '失败' }}
              </span>
            </div>
            
            <div v-if="debugParseResult.success" class="debug-success-content">
              <h4>解析后的配置对象：</h4>
              <pre class="debug-json">{{ JSON.stringify(debugParseResult.config, null, 2) }}</pre>
              
              <h4>关键字段检查：</h4>
              <div class="debug-fields">
                <div class="debug-field">
                  <span class="debug-field-label">actionId:</span>
                  <code class="debug-field-value">{{ debugParseResult.config.actionId || 'undefined' }}</code>
                </div>
                <div class="debug-field">
                  <span class="debug-field-label">type:</span>
                  <code class="debug-field-value">{{ debugParseResult.config.type || 'undefined' }}</code>
                </div>
                <div class="debug-field">
                  <span class="debug-field-label">title:</span>
                  <code class="debug-field-value">{{ debugParseResult.config.title || 'undefined' }}</code>
                </div>
              </div>

              <div class="debug-test-section">
                <a-button type="outline" status="success" @click="testDebugActionRenderer">
                  测试ActionRenderer
                </a-button>
              </div>
            </div>
            
            <div v-else class="debug-error-content">
              <h4>错误信息：</h4>
              <pre class="debug-error-message">{{ debugParseResult.error }}</pre>
            </div>
          </div>

          <!-- ActionRenderer错误显示 -->
          <div v-if="debugRendererError" class="debug-error-section">
            <h4>ActionRenderer错误：</h4>
            <pre class="debug-error-message">{{ debugRendererError }}</pre>
          </div>
        </div>
      </div>

      <!-- 系统验证测试 -->
      <div class="test-section">
        <h2>系统验证</h2>
        <div class="validation-info">
          <div class="validation-item">
            <label>验证状态:</label>
            <span :class="validationStatus.class">{{ validationStatus.text }}</span>
          </div>
          <div class="validation-item" v-if="validationResults">
            <label>通过率:</label>
            <span>{{ validationResults.passed }}/{{ validationResults.total }} ({{ ((validationResults.passed / validationResults.total) * 100).toFixed(1) }}%)</span>
          </div>
        </div>
        <div class="validation-buttons">
          <a-button type="outline" status="success" shape="round" @click="runSystemValidation">运行系统验证</a-button>
          <a-button type="outline" status="success" shape="round" @click="runQuickTest">快速测试</a-button>
          <a-button type="outline" status="success" shape="round" @click="showValidationReport">查看验证报告</a-button>
        </div>
      </div>

      <!-- 状态管理测试 -->
      <div class="test-section">
        <h2>状态管理</h2>
        <div class="status-info">
          <div class="status-item">
            <label>当前Action:</label>
            <span>{{ currentAction ? currentAction.type : '无' }}</span>
          </div>
          <div class="status-item">
            <label>队列长度:</label>
            <span>{{ actionQueue.length }}</span>
          </div>
          <div class="status-item">
            <label>历史记录:</label>
            <span>{{ actionHistory.length }}</span>
          </div>
          <div class="status-item">
            <label>成功率:</label>
            <span>{{ successRate }}%</span>
          </div>
        </div>
        <div class="status-buttons">
          <a-button type="outline" status="success" shape="round" @click="clearHistory">清除历史</a-button>
          <a-button type="outline" status="success" shape="round" @click="resetStatistics">重置统计</a-button>
          <a-button type="outline" status="success" shape="round" @click="showHistory">查看历史</a-button>
          <a-button type="outline" status="success" shape="round" @click="showStatistics">查看统计</a-button>
        </div>
      </div>

      <!-- 结果显示 -->
      <div class="test-section">
        <h2>测试结果</h2>
        <div class="result-area">
          <div v-for="(result, index) in testResults" :key="index" class="result-item">
            <div class="result-time">{{ formatTime(result.time) }}</div>
            <div class="result-type">{{ result.type }}</div>
            <div class="result-status" :class="result.status">{{ result.status }}</div>
            <div class="result-data">{{ formatResult(result.data) }}</div>
          </div>
        </div>
        <a-button type="outline" status="success" shape="round" @click="clearResults">清除结果</a-button>
      </div>
    </div>

    <!-- Action渲染器 -->
    <ActionRenderer
      v-if="currentAction"
      :action-data="currentAction"
      :visible="true"

      @cancel="handleActionCancel"
      @close="handleActionClose"
    />

    <!-- 调试ActionRenderer -->
    <ActionRenderer
      v-if="showDebugActionRenderer"
      :action-data="debugActionData"
      :visible="true"

      @cancel="handleDebugActionClose"
      @close="handleDebugActionClose"
      @error="handleDebugActionError"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { IconCode, IconBug, IconPlayArrow } from '@arco-design/web-vue/es/icon'
import { 
  ActionRenderer,
  Actions,
  actionStateManager,
  submitAction,
  cancelAction,
  currentAction,
  actionHistory,
  actionQueue,
  statistics,
  types
} from '@/components/actions'
import { ActionValidator } from '@/utils/action-validator'
import { parseActionConfig } from '@/components/actions/types.js'

export default {
  name: 'ActionTest',
  components: {
    ActionRenderer,
    IconCode,
    IconBug,
    IconPlayArrow
  },
  setup() {
    const router = useRouter()
    
    // 图片URL（从public目录，支持子目录部署）
    const livesImage = import.meta.env.BASE_URL + 'lives.jpg'
    const testResults = ref([])
    const validationStatus = ref({ text: '未开始', class: 'pending' })
    const validationResults = ref(null)
    const validationPassRate = ref(0)
    const validator = new ActionValidator()

    // 调试功能相关数据
    const debugRawData = ref('')
    const debugParseResult = ref(null)
    const debugRendererError = ref('')
    const showDebugActionRenderer = ref(false)
    const debugActionData = ref(null)

    // 测试数据
    const debugTestData = `{
  "actionId": "push_video",
  "type": "input",
  "title": "推送视频播放",
  "description": "请输入要推送的视频链接",
  "id": "video_url",
  "placeholder": "请输入视频链接",
  "required": true,
  "validation": {
    "pattern": "^https?://.*",
    "message": "请输入有效的视频链接"
  }
}`

    // 计算属性
    const successRate = computed(() => {
      const total = statistics.value.totalActions
      const successful = statistics.value.successfulActions
      return total > 0 ? Math.round((successful / total) * 100) : 0
    })

    // 添加测试结果
    const addResult = (type, status, data) => {
      testResults.value.unshift({
        time: Date.now(),
        type,
        status,
        data
      })
      
      // 限制结果数量
      if (testResults.value.length > 50) {
        testResults.value = testResults.value.slice(0, 50)
      }
    }

    // 跳转到综合测试工具
    const goToDebugTest = () => {
      router.push('/action-debug-test')
    }

    // 跳转到视频播放测试
    const goToVideoTest = () => {
      router.push('/video-test')
    }

    // 格式化时间
    const formatTime = (timestamp) => {
      return new Date(timestamp).toLocaleTimeString()
    }

    // 格式化结果
    const formatResult = (data) => {
      if (typeof data === 'object') {
        return JSON.stringify(data, null, 2)
      }
      return String(data)
    }

    // 基础Action测试
    const testInputAction = async () => {
      try {
        const result = await Actions.input({
          actionId: 'test-input',
          title: '输入测试',
          msg: '请输入您的姓名：',
          placeholder: '请输入姓名',
          required: true,
          maxLength: 20,
          quickOptions: ['张三', '李四', '王五'],
          button: 0  // 0 = OK_CANCEL，显示确认和取消按钮
        })
        addResult('InputAction', 'success', result)
      } catch (error) {
        addResult('InputAction', 'error', error.message)
      }
    }

    const testQuickSelectAction = async () => {
      try {
        const result = await Actions.input({
          actionId: '玩偶域名',
          id: 'domain',
          type: 'input',
          width: 450,
          title: '玩偶域名',
          tip: '请输入玩偶域名',
          value: '',
          msg: '选择或输入使用的域名',
          selectData: '1:=https://www.wogg.net/,2:=https://wogg.xxooo.cf/,3:=https://wogg.888484.xyz/,4:=https://www.wogg.bf/,5:=https://woggapi.333232.xyz/',
          button: 0
        })
        addResult('QuickSelectAction', 'success', result)
      } catch (error) {
        addResult('QuickSelectAction', 'error', error.message)
      }
    }

    const testEditAction = async () => {
      try {
        const result = await Actions.edit({
          actionId: 'test-edit',
          title: '多行编辑测试',
          msg: '请输入详细描述：',
          tip: '请输入详细描述',
          value: '这是一个多行编辑框的示例文本。\n您可以在这里输入多行内容。',
          width: 640,
          height: 400
        })
        addResult('EditAction', 'success', result)
      } catch (error) {
        addResult('EditAction', 'error', error.message)
      }
    }

    const testMultiInputAction = async () => {
      try {
        const result = await Actions.multiInput({
          actionId: 'test-multi-input',
          title: '多输入测试',
          msg: '请填写用户信息：',
          input: [
            { name: '姓名', required: true, tip: '请输入姓名' },
            { name: '邮箱', inputType: 3, required: true, tip: '请输入邮箱地址' },
            { name: '电话', tip: '请输入电话号码' },
            { name: '简介', multiLine: 3, tip: '请输入个人简介' }
          ]
        })
        addResult('MultiInputAction', 'success', result)
      } catch (error) {
        addResult('MultiInputAction', 'error', error.message)
      }
    }

    const testMultiInputXAction = async () => {
      try {
        const result = await Actions.multiInputX({
          actionId: 'test-multi-input-x',
          title: '增强多输入测试',
          msg: '请填写详细信息：',
          width: 716,
          height: -300,
          bottom: 1,
          dimAmount: 0.3,
          button: 3,
          input: [
            {
              id: 'folder',
              name: '文件夹路径',
              tip: '请选择文件夹路径',
              value: '',
              selectData: '[folder]',
              inputType: 0
            },
            {
              id: 'multiSelect',
              name: '多项选择',
              tip: '请选择多个选项',
              value: '',
              selectData: '[请选择字母]a,b,c,d,e,f,g',
              selectWidth: 640,
              multiSelect: true,
              selectColumn: 4,
              inputType: 0
            },
            {
              id: 'description',
              name: '详细描述',
              tip: '请输入详细描述',
              value: '',
              multiLine: 4,
              help: '支持<b>HTML</b>格式的帮助文本'
            }
          ]
        })
        addResult('MultiInputXAction', 'success', result)
      } catch (error) {
        addResult('MultiInputXAction', 'error', error.message)
      }
    }

    const testMenuAction = async () => {
      try {
        const result = await Actions.menu({
          actionId: 'test-menu',
          title: '菜单测试（单选）',
          msg: '请选择操作：',
          column: 2,
          option: [
            { name: '创建', action: 'create' },
            { name: '编辑', action: 'edit' },
            { name: '删除', action: 'delete' },
            { name: '导出', action: 'export' }
          ]
        })
        addResult('MenuAction', 'success', result)
      } catch (error) {
        addResult('MenuAction', 'error', error.message)
      }
    }

    const testMultiMenuAction = async () => {
      try {
        const result = await Actions.menu({
          actionId: 'test-multi-menu',
          title: '菜单测试（多选）',
          msg: '请选择多个功能：',
          column: 2,
          multiSelect: true,
          option: [
            { name: '数据导入', action: 'import' },
            { name: '数据导出', action: 'export' },
            { name: '数据备份', action: 'backup' },
            { name: '数据清理', action: 'cleanup' },
            { name: '数据分析', action: 'analyze' },
            { name: '数据同步', action: 'sync' }
          ]
        })
        addResult('MultiMenuAction', 'success', result)
      } catch (error) {
        addResult('MultiMenuAction', 'error', error.message)
      }
    }

    const testSelectAction = async () => {
      try {
        const result = await Actions.select({
          actionId: 'test-select',
          title: '选择测试（Tag组件）',
          msg: '请选择您喜欢的技术栈：',
          width: 800,
          height: 500,
          column: 3,
          type: 'multiSelect',
          searchable: true,
          option: [
            { name: 'JavaScript', action: 'js', description: '动态编程语言', selected: true },
            { name: 'TypeScript', action: 'ts', description: 'JS的超集' },
            { name: 'Vue.js', action: 'vue', description: '渐进式框架', selected: true },
            { name: 'React', action: 'react', description: 'UI库' },
            { name: 'Angular', action: 'angular', description: '完整框架' },
            { name: 'Node.js', action: 'node', description: '服务端JS' },
            { name: 'Python', action: 'python', description: '通用编程语言' },
            { name: 'Java', action: 'java', description: '企业级语言' }
          ]
        })
        addResult('SelectAction', 'success', result)
      } catch (error) {
        addResult('SelectAction', 'error', error.message)
      }
    }

    const testMsgBoxAction = async () => {
      try {
        const result = await Actions.msgBox({
          actionId: 'test-msgbox',
          title: '消息框测试',
          msg: '这是一个测试消息框，包含详细信息和列表内容。',
          details: '这里是详细信息，可以包含更多的说明文字。',
          list: ['项目1', '项目2', '项目3'],
          button: types.ButtonType.OK_CANCEL
        })
        addResult('MsgBoxAction', 'success', result)
      } catch (error) {
        addResult('MsgBoxAction', 'error', error.message)
      }
    }

    const testWebViewAction = async () => {
      try {
        const result = await Actions.webView({
          actionId: 'test-webview',
          title: '网页视图测试',
          url: 'https://www.baidu.com',
          width: '85%',
          height: '80%',
          showToolbar: true,
          showAddressBar: true,
          showStatus: true,
          escapeToClose: true
        })
        addResult('WebViewAction', 'success', result)
      } catch (error) {
        addResult('WebViewAction', 'error', error.message)
      }
    }

    const testHelpAction = async () => {
      try {
        const result = await Actions.help({
          actionId: 'test-help',
          title: '帮助测试',
          msg: '欢迎使用Action组件系统！',
          details: [
            { title: '功能特性', content: '支持多种类型的交互组件' },
            { title: '使用方法', content: '通过配置对象创建Action实例' }
          ],
          steps: [
            { title: '第一步', content: '导入Action组件' },
            { title: '第二步', content: '配置Action参数' },
            { title: '第三步', content: '调用显示方法' }
          ],
          faq: [
            { question: '如何自定义样式？', answer: '可以通过CSS变量或传入自定义类名' },
            { question: '支持哪些浏览器？', answer: '支持现代浏览器，包括Chrome、Firefox、Safari等' }
          ]
        })
        addResult('HelpAction', 'success', result)
      } catch (error) {
        addResult('HelpAction', 'error', error.message)
      }
    }

    // 便捷方法测试
    const testAlert = async () => {
      try {
        await Actions.alert('这是一个警告消息！')
        addResult('Alert', 'success', 'OK')
      } catch (error) {
        addResult('Alert', 'error', error.message)
      }
    }

    const testConfirm = async () => {
      try {
        const result = await Actions.confirm('确定要删除这个项目吗？')
        addResult('Confirm', 'success', result)
      } catch (error) {
        addResult('Confirm', 'error', error.message)
      }
    }

    const testInfo = async () => {
      try {
        await Actions.info('操作已成功完成！')
        addResult('Info', 'success', 'OK')
      } catch (error) {
        addResult('Info', 'error', error.message)
      }
    }

    const testSuccess = async () => {
      try {
        await Actions.success('数据保存成功！')
        addResult('Success', 'success', 'OK')
      } catch (error) {
        addResult('Success', 'error', error.message)
      }
    }

    const testError = async () => {
      try {
        await Actions.error('发生了一个错误！')
        addResult('Error', 'success', 'OK')
      } catch (error) {
        addResult('Error', 'error', error.message)
      }
    }

    const testWarning = async () => {
      try {
        await Actions.warning('请注意：这个操作不可撤销！')
        addResult('Warning', 'success', 'OK')
      } catch (error) {
        addResult('Warning', 'error', error.message)
      }
    }

    const testLoading = async () => {
      try {
        const loadingAction = Actions.loading('正在处理数据...')
        
        // 模拟异步操作
        setTimeout(() => {
          actionStateManager.submitAction('completed')
        }, 3000)
        
        await loadingAction
        addResult('Loading', 'success', 'completed')
      } catch (error) {
        addResult('Loading', 'error', error.message)
      }
    }

    const testProgress = async () => {
      try {
        const progressAction = Actions.progress('正在上传文件...', '上传进度', 0)
        
        // 模拟进度更新
        let progress = 0
        const interval = setInterval(() => {
          progress += 10
          if (progress >= 100) {
            clearInterval(interval)
            actionStateManager.submitAction({ progress: 100, status: 'completed' })
          } else {
            // 更新进度（这里需要实现进度更新机制）
            console.log(`Progress: ${progress}%`)
          }
        }, 500)
        
        await progressAction
        addResult('Progress', 'success', 'completed')
      } catch (error) {
        addResult('Progress', 'error', error.message)
      }
    }

    // 高级功能测试
    const testTimeout = async () => {
      try {
        const result = await Actions.input({
          actionId: 'test-timeout',
          title: '超时测试',
          msg: '这个输入框将在5秒后自动关闭',
          timeout: 5
        })
        addResult('Timeout', 'success', result)
      } catch (error) {
        addResult('Timeout', 'error', error.message)
      }
    }

    const testQueue = async () => {
      // 快速连续显示多个Action，测试队列功能
      for (let i = 1; i <= 3; i++) {
        Actions.alert(`队列测试 ${i}/3`).then(() => {
          addResult('Queue', 'success', `Action ${i} completed`)
        }).catch(error => {
          addResult('Queue', 'error', error.message)
        })
      }
    }

    const testValidation = async () => {
      try {
        const result = await Actions.input({
          actionId: 'test-validation',
          title: '验证测试',
          msg: '请输入一个有效的邮箱地址：',
          type: 'email',
          required: true,
          validator: (value) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            return emailRegex.test(value) ? null : '请输入有效的邮箱地址'
          }
        })
        addResult('Validation', 'success', result)
      } catch (error) {
        addResult('Validation', 'error', error.message)
      }
    }

    const testCustomStyle = async () => {
      try {
        const result = await Actions.msgBox({
          actionId: 'test-custom-style',
          title: '自定义样式测试',
          msg: '这个消息框使用了自定义样式',
          width: 500,
          height: 300,
          customClass: 'custom-action-style'
        })
        addResult('CustomStyle', 'success', result)
      } catch (error) {
        addResult('CustomStyle', 'error', error.message)
      }
    }

    const testImageAction = async () => {
      try {
        const result = await Actions.input({
          actionId: 'test-image-action',
          title: '图片Action测试',
          msg: '请点击图片上的任意位置：',
          imageUrl: livesImage,
          imageClickCoord: true,
          imageHeight: 300,
          tip: '请输入坐标或点击图片'
        })
        addResult('ImageAction', 'success', result)
      } catch (error) {
        addResult('ImageAction', 'error', error.message)
      }
    }

    const testQRAction = async () => {
      try {
        // 使用API生成的二维码进行测试
        const qrData = 'https://github.com/linyupark/DrPlayer'
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`
        
        const result = await Actions.msgBox({
          actionId: 'test-qr-action',
          title: '二维码测试',
          msg: '扫描下方二维码访问DrPlayer项目：',
          qr: qrUrl,
          qrSize: '250x250',
          qrText: '扫描二维码访问DrPlayer项目',
          width: 400,
          height: 500,
          button: 1
        })
        addResult('QRAction', 'success', result)
      } catch (error) {
        addResult('QRAction', 'error', error.message)
      }
    }

    const testQRText = async () => {
      try {
        const qrData = 'Hello DrPlayer! 这是一个文本二维码测试。'
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`
        
        const result = await Actions.msgBox({
          actionId: 'test-qr-text',
          title: '文本二维码测试',
          msg: '扫描下方二维码查看文本内容：',
          qr: qrUrl,
          qrSize: '200x200',
          qrText: '文本内容：Hello DrPlayer!',
          width: 350,
          height: 450,
          button: 1
        })
        addResult('QRText', 'success', result)
      } catch (error) {
        addResult('QRText', 'error', error.message)
      }
    }

    const testQRWifi = async () => {
      try {
        const wifiData = 'WIFI:T:WPA;S:DrPlayer-WiFi;P:drplayer123;H:false;;'
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(wifiData)}`
        
        const result = await Actions.msgBox({
          actionId: 'test-qr-wifi',
          title: 'WiFi二维码测试',
          msg: '扫描下方二维码连接WiFi：',
          qr: qrUrl,
          qrSize: '220x220',
          qrText: 'WiFi: DrPlayer-WiFi\n密码: drplayer123',
          width: 380,
          height: 480,
          button: 1
        })
        addResult('QRWifi', 'success', result)
      } catch (error) {
        addResult('QRWifi', 'error', error.message)
      }
    }

    const testQRContact = async () => {
      try {
        const contactData = 'BEGIN:VCARD\nVERSION:3.0\nFN:DrPlayer Team\nORG:DrPlayer\nTEL:+86-123-4567-8900\nEMAIL:contact@drplayer.com\nURL:https://github.com/linyupark/DrPlayer\nEND:VCARD'
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(contactData)}`
        
        const result = await Actions.msgBox({
          actionId: 'test-qr-contact',
          title: '联系人二维码测试',
          msg: '扫描下方二维码添加联系人：',
          qr: qrUrl,
          qrSize: '240x240',
          qrText: 'DrPlayer Team\ncontact@drplayer.com',
          width: 400,
          height: 520,
          button: 1
        })
        addResult('QRContact', 'success', result)
      } catch (error) {
        addResult('QRContact', 'error', error.message)
      }
    }

    // 调试功能方法
    const loadDebugTestData = () => {
      debugRawData.value = debugTestData
      parseDebugData()
    }

    const parseDebugData = () => {
      try {
        debugParseResult.value = null
        debugRendererError.value = ''
        
        if (!debugRawData.value.trim()) {
          debugParseResult.value = {
            success: false,
            error: '请输入数据'
          }
          return
        }
        
        // 尝试解析JSON
        let jsonData
        try {
          jsonData = JSON.parse(debugRawData.value)
        } catch (e) {
          debugParseResult.value = {
            success: false,
            error: `JSON解析失败: ${e.message}`
          }
          return
        }
        
        // 使用parseActionConfig解析
        try {
          const config = parseActionConfig(jsonData)
          debugParseResult.value = {
            success: true,
            config: config
          }
          addResult('DebugParse', 'success', 'Action配置解析成功')
        } catch (e) {
          debugParseResult.value = {
            success: false,
            error: `Action配置解析失败: ${e.message}`
          }
          addResult('DebugParse', 'error', e.message)
        }
      } catch (e) {
        debugParseResult.value = {
          success: false,
          error: `未知错误: ${e.message}`
        }
        addResult('DebugParse', 'error', e.message)
      }
    }

    const testDebugActionRenderer = () => {
      try {
        if (debugParseResult.value && debugParseResult.value.success) {
          debugActionData.value = debugParseResult.value.config
          showDebugActionRenderer.value = true
          debugRendererError.value = ''
          addResult('DebugRenderer', 'success', 'ActionRenderer测试启动')
        }
      } catch (e) {
        debugRendererError.value = `ActionRenderer测试失败: ${e.message}`
        addResult('DebugRenderer', 'error', e.message)
      }
    }

    // 调试ActionRenderer事件处理
    const handleDebugActionClose = () => {
      showDebugActionRenderer.value = false
      debugActionData.value = null
      addResult('DebugRenderer', 'info', 'ActionRenderer已关闭')
    }

    const handleDebugActionSubmit = (data) => {
      console.log('调试Action提交数据:', data)
      addResult('DebugRenderer', 'success', `Action提交成功: ${JSON.stringify(data)}`)
      showDebugActionRenderer.value = false
      debugActionData.value = null
    }

    const handleDebugActionError = (error) => {
      console.error('调试Action错误:', error)
      debugRendererError.value = `ActionRenderer错误: ${error.message || error}`
      addResult('DebugRenderer', 'error', error.message || error)
    }

    // 专项动作测试函数
    const testKeepAction = async () => {
      try {
        // 模拟一个带有__keep__专项动作的输入框
        const result = await Actions.input({
          actionId: 'test_keep_action',
          title: '__keep__专项动作测试',
          msg: '输入任意内容，点击确认后将触发__keep__动作',
          placeholder: '输入测试内容',
          button: 0
        })
        
        // 模拟T4接口返回__keep__专项动作
        console.log('模拟__keep__专项动作响应:', {
          action: {
            actionId: '__keep__',
            msg: '窗口保持打开，这是__keep__动作的效果',
            reset: false
          },
          toast: '__keep__专项动作测试成功'
        })
        
        addResult('KeepAction', 'success', result)
      } catch (error) {
        addResult('KeepAction', 'error', error.message)
      }
    }

    const testDetailAction = async () => {
      try {
        // 模拟一个带有__detail__专项动作的输入框
        const result = await Actions.input({
          actionId: 'test_detail_action',
          title: '__detail__专项动作测试',
          msg: '输入视频ID，点击确认后将触发__detail__动作',
          placeholder: '输入视频ID',
          button: 0
        })
        
        // 模拟T4接口返回__detail__专项动作
        console.log('模拟__detail__专项动作响应:', {
          action: {
            actionId: '__detail__',
            skey: 'test_site',
            ids: result.value || 'test_video_id'
          },
          toast: '__detail__专项动作测试成功'
        })
        
        addResult('DetailAction', 'success', result)
      } catch (error) {
        addResult('DetailAction', 'error', error.message)
      }
    }

    const testCopyAction = async () => {
      try {
        // 模拟一个带有__copy__专项动作的输入框
        const result = await Actions.input({
          actionId: 'test_copy_action',
          title: '__copy__专项动作测试',
          msg: '输入要复制的内容，点击确认后将触发__copy__动作',
          placeholder: '输入要复制的内容',
          value: '这是要复制的测试内容',
          button: 0
        })
        
        // 模拟T4接口返回__copy__专项动作
        console.log('模拟__copy__专项动作响应:', {
          action: {
            actionId: '__copy__',
            content: result.value || '测试复制内容'
          },
          toast: '__copy__专项动作测试成功'
        })
        
        addResult('CopyAction', 'success', result)
      } catch (error) {
        addResult('CopyAction', 'error', error.message)
      }
    }

    const testSelfSearchAction = async () => {
      try {
        // 模拟一个带有__self_search__专项动作的输入框
        const result = await Actions.input({
          actionId: 'test_self_search_action',
          title: '__self_search__专项动作测试',
          msg: '输入搜索关键词，点击确认后将触发__self_search__动作',
          placeholder: '输入搜索关键词',
          value: '测试搜索',
          button: 0
        })
        
        // 模拟T4接口返回__self_search__专项动作
        console.log('模拟__self_search__专项动作响应:', {
          action: {
            actionId: '__self_search__',
            skey: 'test_site',
            name: result.value || '测试搜索',
            tid: '1',
            flag: 'search',
            folder: '电影$' + (result.value || '测试搜索') + '$1#电视剧$' + (result.value || '测试搜索') + '$2'
          },
          toast: '__self_search__专项动作测试成功'
        })
        
        addResult('SelfSearchAction', 'success', result)
      } catch (error) {
        addResult('SelfSearchAction', 'error', error.message)
      }
    }

    const testRefreshListAction = async () => {
      try {
        // 模拟一个带有__refresh_list__专项动作的输入框
        const result = await Actions.input({
          actionId: 'test_refresh_list_action',
          title: '__refresh_list__专项动作测试',
          msg: '点击确认后将触发__refresh_list__动作',
          placeholder: '可选：输入刷新类型',
          button: 0
        })
        
        // 模拟T4接口返回__refresh_list__专项动作
        console.log('模拟__refresh_list__专项动作响应:', {
          action: {
            actionId: '__refresh_list__',
            type: result.value || 'video'
          },
          toast: '__refresh_list__专项动作测试成功'
        })
        
        addResult('RefreshListAction', 'success', result)
      } catch (error) {
        addResult('RefreshListAction', 'error', error.message)
      }
    }

    const testKtvPlayerAction = async () => {
      try {
        // 模拟一个带有__ktvplayer__专项动作的输入框
        const result = await Actions.input({
          actionId: 'test_ktvplayer_action',
          title: '__ktvplayer__专项动作测试',
          msg: '输入歌曲名称，点击确认后将触发__ktvplayer__动作',
          placeholder: '输入歌曲名称',
          value: '测试歌曲',
          button: 0
        })
        
        // 模拟T4接口返回__ktvplayer__专项动作
        console.log('模拟__ktvplayer__专项动作响应:', {
          action: {
            actionId: '__ktvplayer__',
            name: result.value || '测试歌曲',
            id: 'test_song_id',
            url: 'https://example.com/test_song.mp3',
            type: 'ktv'
          },
          toast: '__ktvplayer__专项动作测试成功'
        })
        
        addResult('KtvPlayerAction', 'success', result)
      } catch (error) {
        addResult('KtvPlayerAction', 'error', error.message)
      }
    }

    // 状态管理方法
    const clearHistory = () => {
      actionStateManager.clearHistory()
      addResult('ClearHistory', 'success', 'History cleared')
    }

    const resetStatistics = () => {
      actionStateManager.resetStatistics()
      addResult('System', 'success', 'Statistics reset')
    }

    const showHistory = async () => {
      const history = actionStateManager.getHistory({ limit: 10 })
      try {
        await Actions.help({
          actionId: 'show-history',
          title: '历史记录',
          msg: `最近${history.length}条记录：`,
          details: history.map((action, index) => ({
            title: `${index + 1}. ${action.type}`,
            content: `状态: ${action.status}, 时间: ${new Date(action.startTime).toLocaleString()}`
          }))
        })
      } catch (error) {
        console.error('显示历史记录失败:', error)
      }
    }

    const showStatistics = async () => {
      const stats = statistics.value
      try {
        await Actions.info(`
          总Action数: ${stats.totalActions}
          成功: ${stats.successfulActions}
          取消: ${stats.canceledActions}
          错误: ${stats.errorActions}
          平均响应时间: ${stats.averageResponseTime}ms
        `, '统计信息')
      } catch (error) {
        console.error('显示统计信息失败:', error)
      }
    }

    const clearResults = () => {
      testResults.value = []
    }

    // 验证功能
    const runSystemValidation = async () => {
      validationStatus.value = { text: '运行中...', class: 'running' }
      validationResults.value = null
      
      try {
        const results = await validator.runAllTests()
        validationResults.value = results
        
        const passedTests = results.filter(r => r.passed).length
        
        validationStatus.value = {
          text: `完成 (${passedTests}/${results.length})`,
          class: passedTests === results.length ? 'success' : 'warning'
        }
        
        addResult('SystemValidation', 'success', {
          total: results.length,
          passed: passedTests,
          passRate: Math.round((passedTests / results.length) * 100) + '%'
        })
      } catch (error) {
        validationStatus.value = { text: '失败', class: 'error' }
        addResult('SystemValidation', 'error', error.message)
      }
    }

    const runQuickTest = async () => {
      validationStatus.value = { text: '快速测试中...', class: 'running' }
      
      try {
        // 运行基础功能测试
        await testAlert()
        await testInputAction()
        await testConfirm()
        
        validationStatus.value = { text: '快速测试完成', class: 'success' }
        addResult('QuickTest', 'success', '基础功能正常')
      } catch (error) {
        validationStatus.value = { text: '快速测试失败', class: 'error' }
        addResult('QuickTest', 'error', error.message)
      }
    }

    const showValidationReport = async () => {
      if (!validationResults.value) {
        await Actions.alert('请先运行系统验证')
        return
      }

      const report = validator.generateReport(validationResults.value)
      const passedTests = validationResults.value.filter(r => r.passed).length
      const passRate = Math.round((passedTests / validationResults.value.length) * 100)
      
      Actions.msgBox({
        actionId: 'validation-report',
        title: '系统验证报告',
        msg: `验证完成，通过率：${passRate}%`,
        details: report,
        button: types.ButtonType.OK
      })
    }

    // Action事件处理
    const handleActionSubmit = (result) => {
      submitAction(result)
    }

    const handleActionCancel = () => {
      cancelAction('user_cancel')
    }

    const handleActionClose = () => {
      cancelAction('close')
    }

    onMounted(() => {
      // 注册错误处理器
      actionStateManager.registerErrorHandler('default', (error, config) => {
        console.error('Action错误:', error, config)
      })
      
      // 监听Action事件
      actionStateManager.on('action-show', (action) => {
        console.log('Action显示:', action)
      })
      
      actionStateManager.on('action-submit', ({ action, result }) => {
        console.log('Action提交:', action, result)
      })
      
      actionStateManager.on('action-cancel', ({ action, reason }) => {
        console.log('Action取消:', action, reason)
      })
    })

    return {
      testResults,
      validationStatus,
      validationResults,
      validationPassRate,
      currentAction,
      actionHistory,
      actionQueue,
      statistics,
      successRate,
      livesImage,
      // 调试功能
      debugRawData,
      debugParseResult,
      debugRendererError,
      showDebugActionRenderer,
      debugActionData,
      loadDebugTestData,
      parseDebugData,
      testDebugActionRenderer,
      handleDebugActionClose,
      handleDebugActionSubmit,
      handleDebugActionError,
      addResult,
      goToDebugTest,
      goToVideoTest,
      formatTime,
      formatResult,
      testInputAction,
      testQuickSelectAction,
      testEditAction,
      testMultiInputAction,
      testMultiInputXAction,
      testMenuAction,
      testMultiMenuAction,
      testSelectAction,
      testMsgBoxAction,
      testWebViewAction,
      testHelpAction,
      testAlert,
      testConfirm,
      testInfo,
      testSuccess,
      testError,
      testWarning,
      testLoading,
      testProgress,
      testTimeout,
      testQueue,
      testValidation,
      testCustomStyle,
      testImageAction,
      testQRAction,
      testQRText,
      testQRWifi,
      testQRContact,
      
      // 专项动作测试函数
      testKeepAction,
      testDetailAction,
      testCopyAction,
      testSelfSearchAction,
      testRefreshListAction,
      testKtvPlayerAction,
      
      clearHistory,
      resetStatistics,
      showHistory,
      showStatistics,
      clearResults,
      runSystemValidation,
      runQuickTest,
      showValidationReport,
      handleActionSubmit,
      handleActionCancel,
      handleActionClose
    }
  }
}
</script>

<style scoped>
.action-test-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-1);
  overflow: hidden;
}

/* 固定头部区域 */
.test-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--color-bg-1);
  border-bottom: 1px solid var(--color-border-2);
  padding: 24px 32px;
  backdrop-filter: blur(8px);
}

.header-content {
  width: 100%;
  margin: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-left {
  flex: 1;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 28px;
  font-weight: 600;
  color: var(--color-text-1);
  margin: 0 0 8px 0;
}

.nav-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.nav-button {
  padding: 8px 16px;
  background: var(--color-primary-6);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  text-decoration: none;
}

.nav-button:hover {
  background: var(--color-primary-7);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--primary-6), 0.3);
}

.title-icon {
  font-size: 32px;
  color: var(--color-primary-6);
}

.page-subtitle {
  color: var(--color-text-3);
  font-size: 16px;
  margin: 0;
  line-height: 1.5;
}

/* 可滚动内容区域 */
.test-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
  width: 100%;
  margin: 0;
}

.test-section {
  margin-bottom: 32px;
  padding: 24px;
  background: var(--color-bg-2);
  border-radius: 12px;
  border: 1px solid var(--color-border-2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.test-section:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border-color: var(--color-border-3);
}

.test-section h2 {
  color: var(--color-text-1);
  margin-bottom: 20px;
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.test-section h2::before {
  content: '';
  width: 4px;
  height: 20px;
  background: var(--color-primary-6);
  border-radius: 2px;
}

.test-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}



.status-info {
  background: var(--color-bg-2);
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 32px;
  border: 1px solid var(--color-border-2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--color-bg-1);
  border-radius: 8px;
  border: 1px solid var(--color-border-1);
  transition: all 0.2s ease;
}

.status-item:hover {
  background: var(--color-bg-3);
  border-color: var(--color-border-2);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.status-item label {
  font-weight: 600;
  color: var(--color-text-1);
  font-size: 14px;
}

.status-item span {
  color: var(--color-primary-6);
  font-weight: 600;
  font-size: 16px;
}

.status-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 20px;
}

.result-area {
  max-height: 500px;
  overflow-y: auto;
  background: var(--color-bg-2);
  border: 1px solid var(--color-border-2);
  border-radius: 12px;
  margin-bottom: 32px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.result-item {
  display: grid;
  grid-template-columns: 80px 120px 80px 1fr;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid var(--color-border-1);
  font-size: 13px;
  background: var(--color-bg-1);
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
}

.result-item:hover {
  background: var(--color-bg-3);
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.result-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.result-time {
  color: #6c757d;
}

.result-type {
  font-weight: 500;
  color: #495057;
}

.result-status {
  font-weight: 500;
}

.result-status.success {
  color: #28a745;
}

.result-status.error {
  color: #dc3545;
}

.result-data {
  color: #6c757d;
  word-break: break-all;
  max-height: 60px;
  overflow: hidden;
}

/* 调试功能样式 */
.debug-area {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-top: 16px;
}

.debug-input-section {
  margin-bottom: 24px;
}

.debug-input-section h3 {
  color: #495057;
  margin-bottom: 12px;
  font-size: 16px;
}

.debug-description {
  color: #6c757d;
  margin-bottom: 12px;
  font-size: 14px;
}

.debug-textarea {
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.debug-buttons {
  margin-top: 12px;
  display: flex;
  gap: 12px;
}

.debug-result-section {
  margin-bottom: 24px;
  padding: 16px;
  background: white;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.debug-result-section h3 {
  color: #495057;
  margin-bottom: 16px;
  font-size: 16px;
}

.debug-status {
  margin-bottom: 16px;
}

.debug-label {
  font-weight: 600;
  color: #495057;
}

.debug-success {
  color: #28a745;
  font-weight: 600;
}

.debug-error {
  color: #dc3545;
  font-weight: 600;
}

.debug-success-content h4,
.debug-error-content h4 {
  color: #495057;
  margin: 20px 0 12px 0;
  font-size: 14px;
}

.debug-json {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  font-family: 'Courier New', monospace;
  border: 1px solid #e9ecef;
  margin-bottom: 16px;
}

.debug-fields {
  margin-bottom: 16px;
}

.debug-field {
  padding: 6px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.debug-field-label {
  font-weight: 600;
  color: #495057;
  min-width: 80px;
}

.debug-field-value {
  background: #f8f9fa;
  padding: 2px 8px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  border: 1px solid #e9ecef;
}

.debug-test-section {
  margin-top: 16px;
}

.debug-error-content {
  color: #721c24;
}

.debug-error-message {
  background: #f8d7da;
  padding: 12px;
  border-radius: 4px;
  color: #721c24;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  border: 1px solid #f5c6cb;
}

.debug-error-section {
  padding: 16px;
  background: #f8d7da;
  border-radius: 6px;
  border: 1px solid #f5c6cb;
}

.debug-error-section h4 {
  color: #721c24;
  margin-bottom: 12px;
  font-size: 14px;
}

/* 自定义样式示例 */
:global(.custom-action-style) {
  --action-color-primary: #e91e63;
  --action-color-primary-light: #f8bbd9;
}

.custom-style-example {
  background: linear-gradient(135deg, var(--color-primary-6) 0%, var(--color-primary-7) 100%);
  color: white;
  padding: 24px;
  border-radius: 12px;
  margin: 24px 0;
  text-align: center;
  box-shadow: 0 4px 16px rgba(var(--primary-6), 0.2);
}

.custom-style-example h4 {
  margin: 0 0 12px 0;
  font-size: 20px;
  font-weight: 600;
}

.custom-style-example p {
  margin: 0;
  opacity: 0.9;
  font-size: 16px;
  line-height: 1.5;
}

/* 滚动条样式 */
.test-content::-webkit-scrollbar,
.result-area::-webkit-scrollbar {
  width: 6px;
}

.test-content::-webkit-scrollbar-track,
.result-area::-webkit-scrollbar-track {
  background: var(--color-bg-2);
  border-radius: 3px;
}

.test-content::-webkit-scrollbar-thumb,
.result-area::-webkit-scrollbar-thumb {
  background: var(--color-border-3);
  border-radius: 3px;
}

.test-content::-webkit-scrollbar-thumb:hover,
.result-area::-webkit-scrollbar-thumb:hover {
  background: var(--color-border-4);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .test-content {
    padding: 24px;
  }
  
  .test-buttons {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .test-header {
    padding: 20px 24px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .title-icon {
    font-size: 28px;
  }
  
  .test-content {
    padding: 20px;
  }
  
  .test-buttons {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .test-section {
    padding: 20px;
  }
  
  .status-info {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .status-buttons {
    flex-direction: column;
    gap: 8px;
  }
  
  .result-item {
    grid-template-columns: 1fr;
    gap: 8px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .test-header {
    padding: 16px 20px;
  }
  
  .page-title {
    font-size: 20px;
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
  
  .test-content {
    padding: 16px;
  }
  
  .test-section {
    padding: 16px;
    margin-bottom: 24px;
  }
  
  .status-info,
  .result-area {
    padding: 16px;
  }
}
</style>