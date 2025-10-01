<template>
  <div class="action-debug-test">
    <!-- 固定头部区域 -->
    <div class="debug-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <icon-code class="title-icon" />
            Action功能综合测试工具
          </h1>
          <p class="page-subtitle">用于排查T4 API返回的action数据解析问题，并测试VideoGrid和SearchResults组件中的action功能</p>
        </div>
        <div class="nav-button-group">
          <div class="nav-button-grid">
            <a-button type="primary" status="success" @click="goToActionTest" class="nav-grid-button">
              <icon-bug />
              <span>Action测试</span>
            </a-button>
            <a-button type="primary" status="warning" @click="goToVideoTest" class="nav-grid-button">
              <icon-play-arrow />
              <span>视频播放测试</span>
            </a-button>
            <a-button type="primary" status="normal" @click="goToCSPTest" class="nav-grid-button">
              <icon-safe />
              <span>CSP测试工具</span>
            </a-button>
            <!-- 预留位置，可以添加更多测试工具 -->
            <div class="nav-grid-placeholder">
              <span class="placeholder-text">更多工具</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 可滚动内容区域 -->
    <div class="debug-content">
      <div class="debug-sections">
        <!-- 原始数据输入 -->
        <div class="debug-section">
          <h2>1. 原始数据输入</h2>
          <p>请粘贴T4 API返回的vod_id字段内容：</p>
          <textarea 
            v-model="rawData" 
            class="debug-textarea"
            placeholder="粘贴vod_id字段的JSON字符串..."
            rows="8"
          ></textarea>
          <a-button @click="parseData" type="outline" status="success" shape="round">解析数据</a-button>
        </div>

        <!-- 解析结果 -->
        <div class="debug-section" v-if="parseResult">
          <h2>2. 解析结果</h2>
          <div class="debug-result">
            <h3>解析状态：<span :class="parseResult.success ? 'success' : 'error'">
              {{ parseResult.success ? '成功' : '失败' }}
            </span></h3>
            
            <div v-if="parseResult.success">
              <h4>解析后的配置对象：</h4>
              <pre class="debug-json">{{ JSON.stringify(parseResult.config, null, 2) }}</pre>
              
              <h4>关键字段检查：</h4>
              <ul class="debug-fields">
                <li>actionId: <code>{{ parseResult.config.actionId || 'undefined' }}</code></li>
                <li>type: <code>{{ parseResult.config.type || 'undefined' }}</code></li>
                <li>title: <code>{{ parseResult.config.title || 'undefined' }}</code></li>
                <li>id: <code>{{ parseResult.config.id || 'undefined' }}</code></li>
              </ul>

              <h4>类型验证：</h4>
              <ul class="debug-validation">
                <li>type字段存在: <span :class="parseResult.config.type ? 'success' : 'error'">
                  {{ parseResult.config.type ? '是' : '否' }}
                </span></li>
                <li>type值有效: <span :class="isValidType(parseResult.config.type) ? 'success' : 'error'">
                  {{ isValidType(parseResult.config.type) ? '是' : '否' }}
                </span></li>
                <li>actionId存在: <span :class="parseResult.config.actionId ? 'success' : 'error'">
                  {{ parseResult.config.actionId ? '是' : '否' }}
                </span></li>
              </ul>
            </div>
            
            <div v-else>
              <h4>错误信息：</h4>
              <pre class="debug-error">{{ parseResult.error }}</pre>
            </div>
          </div>
        </div>

        <!-- ActionRenderer测试 -->
        <div class="debug-section" v-if="parseResult && parseResult.success">
          <h2>3. ActionRenderer组件测试</h2>
          <a-button @click="testActionRenderer" type="outline" status="success" shape="round">测试ActionRenderer</a-button>
          
          <div v-if="rendererError" class="debug-error-box">
            <h4>ActionRenderer错误：</h4>
            <pre>{{ rendererError }}</pre>
          </div>
        </div>

        <!-- 预设测试数据 -->
        <div class="debug-section">
          <h2>4. 预设测试数据</h2>
          <p>使用你提供的真实T4 API数据进行测试：</p>
          <div class="preset-buttons">
            <a-button @click="loadPresetData('push_video')" type="outline" status="success" shape="round">推送视频播放</a-button>
            <a-button @click="loadPresetData('push_novel')" type="outline" status="success" shape="round">推送番茄小说</a-button>
            <a-button @click="loadPresetData('t4_api_test')" type="outline" status="warning" shape="round">T4接口测试</a-button>
          </div>
        </div>

        <!-- 集成测试 -->
        <div class="debug-section">
          <h2>5. 组件集成测试</h2>
          <p>测试VideoGrid和SearchResults组件中的action功能：</p>
          
          <!-- VideoGrid测试 -->
          <div class="integration-test-subsection">
            <h3>VideoGrid组件Action测试</h3>
            <p>点击下面的action项目应该弹出ActionRenderer组件：</p>
            <VideoGrid 
              :videos="testVideosWithAction" 
              :loading="false" 
              :hasMore="false"
            />
          </div>

          <!-- SearchResults测试 -->
          <div class="integration-test-subsection">
            <h3>SearchResults组件Action测试</h3>
            <p>搜索结果中的action项目测试：</p>
            <SearchResults
              keyword="action测试"
              :videos="testVideosWithAction"
              :loading="false"
              :error="null"
              :currentPage="1"
              :totalPages="1"
              :hasMore="false"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Toast提示 -->
    <Transition name="action-toast">
      <div v-if="toast" class="action-toast" :class="toastType">
        {{ toast }}
      </div>
    </Transition>

    <!-- ActionRenderer组件 -->
    <ActionRenderer
      v-if="showActionRenderer"
      ref="actionRendererRef"
      :action-data="currentActionData"
      :module="testModule"
      :api-url="testApiUrl"
      :extend="testExtend"
      @close="handleActionClose"

      @error="handleActionError"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button as AButton } from '@arco-design/web-vue'
import { IconCode, IconBug, IconPlayArrow, IconSafe } from '@arco-design/web-vue/es/icon'
import ActionRenderer from '@/components/actions/ActionRenderer.vue'
import VideoGrid from '@/components/VideoGrid.vue'
import SearchResults from '@/components/SearchResults.vue'
import { ActionType, parseActionConfig, validateActionConfig } from '@/components/actions/types.js'

// Router
const router = useRouter()

// 跳转到Action测试页面
const goToActionTest = () => {
  router.push('/action-test')
}

// 跳转到视频测试页面
const goToVideoTest = () => {
  router.push('/video-test')
}

// 跳转到CSP测试页面
const goToCSPTest = () => {
  router.push('/csp-test')
}

const rawData = ref('')
const parseResult = ref(null)
const showActionRenderer = ref(false)
const currentActionData = ref(null)
const actionRendererRef = ref(null)
const rendererError = ref(null)

// Toast相关
const toast = ref('')
const toastType = ref('success')
const toastTimer = ref(null)

// T4接口测试参数
const testModule = ref('test_module')  // 测试模块名
const testApiUrl = ref('http://localhost:5173/mock/t4-api-test.json')  // 测试API地址（使用模拟数据）
const testExtend = ref({ test: true })  // 测试扩展参数

// 图片URL（从public目录，支持子目录部署）
const livesImage = import.meta.env.BASE_URL + 'lives.jpg'

// 预设测试数据
const presetData = {
  push_video: `{"actionId":"推送视频播放","id":"push","type":"input","title":"推送视频地址进行播放","tip":"支持网盘、官链、直链、待嗅探链接","value":"","msg":"请输入待推送的视频地址","imageUrl":"http://127.0.0.1:5757/public/images/lives.jpg","imageHeight":200,"imageType":"card_pic_3","keep":true,"button":4,"width":640,"selectData":"123:=\`https://www.123684.com/s/oec7Vv-DggWh?ZY4K,腾讯:=https://v.qq.com/x/cover/mzc00200vkqr54u/u4100l66fas.html,爱奇艺:=http://www.iqiyi.com/v_1b0tk1b8tl8.html,夸克:=https://pan.quark.cn/s/6c8158e258f3,UC:=https://drive.uc.cn/s/59023f57d3ce4?public=1,阿里:=https://www.alipan.com/s/vgXMcowK8pQ,天翼:=https://cloud.189.cn/web/share?code=INJbU3NbqyUj,百度:=https://pan.baidu.com/s/1L0UIv4p0X0QrbbKErJuc_w?pwd=2pwj,移动1:=https://yun.139.com/shareweb/#/w/i/0i5CLQ7BpV7Ai,移动2:=https://caiyun.139.com/m/i?2jexC1gcjeN7q,移动3:=https://yun.139.com/shareweb/#/w/i/2i2MoE9ZHn9p1,直链1:=https://vdse.bdstatic.com//628ca08719cef5987ea2ae3c6f0d2386.mp4,嗅探1:=https://www.6080kk.cc/haokanplay/178120-1-1.html,嗅探2:=https://www.hahads.com/play/537106-3-1.html,多集:=https://v.qq.com/x/cover/m441e3rjq9kwpsc/m00253deqqo.html@https://pan.quark.cn/s/6c8158e258f3@https://pan.baidu.com/s/1TdbgcwaMG1dK7B5pQ1LbBg?pwd=1234,海阔二级单线路:=H4sIAAAAAAAAA52Uy27TQBSGXwUZlsT2GefadZ+AN3ATk7qKL7guUoKQXAQFeoEG6oKaVBUFlBZFbdQ0TXAIeRjPTJwVr8AYCsNyijQbnzPfPz72p3kk6WXf8aQFibzszFsb0l2p7Ni+YfusFAe78/W383C6eC8OmnEQsEVal7NxiEebeLQ/i75oKvl6iccfZwdPWY0OhnR8+uPbdnJ2kUx7ONrAo094skMOD+ZHHbL1nIbHbCf53KdBh7RPaP+Yfm8n5x+S3gWr016TtCb03VUa2Brh6A0Nm8ngVRysk7Nt+mI3aYfk9fs0YfMERxENn+FoKw6e3KJ7V8lgyF6+YnrG9UAPTLu6ZNgrpu4ZNlJRlrXve47FWrNomgzPEdJYydYtIx1/Z0rbXTzps9zrza5ZZo1l33dXFxSFPWlyvdGom5ZeNVblsmMpa27N0SvKQ6eipEwGIINAgYKGIA+lYg7kFbfKkta8Wnpqt6sC+8Z3/kQuyXm1qDZ+RbEMt6bXFVBBQ6UMy5KXfat2O4WQMIQ4pAlDGoeywlCWQzlhKMehvDCU51BBGCpwqCgMFTlUEoZKfyFQxX+uyqkbKMGdAHEnAP0Xxa0AcZWAawHiLgH3AsRlAi4GiNsE3AwQ1wm4GiDuE/zjhrhQiLuBxI1C3A0kbhTibqAb3DK/3ZAe/wSSQMKkPgYAAA==\`"}`,
  push_novel: `{"actionId":"推送番茄小说","id":"push","type":"input","title":"推送番茄小说网页目录链接进行解析","tip":"支持番茄小说网页版链接","value":"\`https://fanqienovel.com/page/7421167583522458648\`","msg":"请输入待推送的番茄小说网页版链接","imageUrl":"http://127.0.0.1:5757/public/images/icon_cookie/%E9%98%85%E8%AF%BB.png","imageHeight":200,"imageType":"card_pic_3","keep":false,"selectData":"大一实习:=\`https://fanqienovel.com/page/7421167583522458648,十日终焉:=https://fanqienovel.com/page/7143038691944959011,斩神:=https://fanqienovel.com/page/6982529841564224526\`"}`,
  t4_api_test: `{"actionId":"like","id":"t4_test","type":"input","title":"T4接口测试","tip":"测试T4接口调用（ac=action&action=like&value=xxx）","value":"1","msg":"请输入点赞值（1表示点赞，0表示取消点赞）","button":2}`
}

// 集成测试数据 - 包含action类型的视频
const testVideosWithAction = ref([
  // 普通视频
  {
    vod_id: '1',
    vod_name: '普通视频1',
    vod_pic: livesImage,
    vod_remarks: '正常视频',
    vod_tag: 'normal'
  },
  // Action视频 - 普通文本Toast测试
  {
    vod_id: '这是一个普通文本的Toast提示测试',
    vod_name: 'Action: Toast文本测试',
    vod_pic: livesImage,
    vod_remarks: 'Toast',
    vod_tag: 'action'
  },
  // Action视频 - 单项输入
  {
    vod_id: JSON.stringify({
      actionId: '单项输入测试',
      type: 'input',
      title: '请输入内容',
      tip: '请输入您的姓名',
      value: '',
      msg: '这是一个单项输入测试',
      button: 2
    }),
    vod_name: 'Action: 单项输入',
    vod_pic: livesImage,
    vod_remarks: 'Action',
    vod_tag: 'action'
  },
  // Action视频 - 消息弹窗
  {
    vod_id: JSON.stringify({
      actionId: '消息弹窗测试',
      type: 'msgbox',
      title: '提示信息',
      msg: '这是一个消息弹窗测试\n\n点击确定关闭',
      button: 1
    }),
    vod_name: 'Action: 消息弹窗',
    vod_pic: livesImage,
    vod_remarks: 'Action',
    vod_tag: 'action'
  },
  // Action视频 - 单项选择
  {
    vod_id: JSON.stringify({
      actionId: '单项选择测试',
      type: 'menu',
      title: '请选择选项',
      msg: '请从下面的选项中选择一个：',
      column: 2,
      option: [
        { name: '选项1', action: 'option1' },
        { name: '选项2', action: 'option2' },
        { name: '选项3', action: 'option3' },
        { name: '选项4', action: 'option4' }
      ]
    }),
    vod_name: 'Action: 单项选择',
    vod_pic: livesImage,
    vod_remarks: 'Action',
    vod_tag: 'action'
  },
  // 更多普通视频
  {
    vod_id: '2',
    vod_name: '普通视频2',
    vod_pic: livesImage,
    vod_remarks: '正常视频',
    vod_tag: 'normal'
  }
])

// 检查type是否有效
const isValidType = (type) => {
  return Object.values(ActionType).includes(type)
}

// 解析数据
const parseData = () => {
  if (!rawData.value.trim()) {
    parseResult.value = {
      success: false,
      error: '请输入数据'
    }
    return
  }

  try {
    console.log('原始数据:', rawData.value)
    
    // 检查是否是普通字符串（非JSON格式）
    const trimmedData = rawData.value.trim()
    
    // 如果不是以 { 开头，可能是普通的vod_id字符串
    if (!trimmedData.startsWith('{')) {
      // 显示toast提示，模拟action响应
      showToast(`Action响应: ${trimmedData}`, 'info')
      
      parseResult.value = {
        success: false,
        error: '检测到普通字符串，已作为Action响应显示Toast提示'
      }
      return
    }
    
    // 使用ActionRenderer相同的解析逻辑
    const config = parseActionConfig(rawData.value)
    console.log('解析后的配置:', config)
    
    // 验证配置
    validateActionConfig(config)
    
    parseResult.value = {
      success: true,
      config: config
    }
  } catch (error) {
    console.error('解析错误:', error)
    
    // 如果JSON解析失败，也尝试作为普通字符串处理
    const trimmedData = rawData.value.trim()
    if (trimmedData && !trimmedData.startsWith('{')) {
      showToast(`Action响应: ${trimmedData}`, 'info')
      parseResult.value = {
        success: false,
        error: '检测到普通字符串，已作为Action响应显示Toast提示'
      }
    } else {
      parseResult.value = {
        success: false,
        error: error.message || error.toString()
      }
    }
  }
}

// 显示Toast
const showToast = (message, type = 'success') => {
  if (toastTimer.value) {
    clearTimeout(toastTimer.value)
  }
  
  toast.value = message
  toastType.value = type
  
  toastTimer.value = setTimeout(() => {
    toast.value = ''
    toastTimer.value = null
  }, 3000)
}

// 测试ActionRenderer
const testActionRenderer = () => {
  if (!parseResult.value || !parseResult.value.success) {
    return
  }

  try {
    rendererError.value = null
    currentActionData.value = parseResult.value.config
    showActionRenderer.value = true
  } catch (error) {
    rendererError.value = error.message || error.toString()
  }
}

// 加载预设数据
const loadPresetData = (type) => {
  rawData.value = presetData[type]
  parseData()
}

// ActionRenderer事件处理
const handleActionClose = () => {
  showActionRenderer.value = false
  currentActionData.value = null
}

const handleActionSubmit = (result) => {
  console.log('Action提交结果:', result)
  showActionRenderer.value = false
  currentActionData.value = null
}

const handleActionError = (error) => {
  console.error('ActionRenderer错误:', error)
  rendererError.value = error.message || error.toString()
}
</script>

<style scoped>
.action-debug-test {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-1);
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 固定头部区域 */
.debug-header {
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

/* 导航按钮组样式 */
.nav-button-group {
  max-width: fit-content;
  background: var(--color-bg-2);
  border: 1px solid var(--color-border-2);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.nav-button-grid {
  display: grid;
  grid-template-columns: auto auto;
  gap: 6px;
  padding: 6px;
  justify-content: start;
}

.nav-grid-button {
  min-height: 32px;
  padding: 6px 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.3s ease;
  text-align: center;
  line-height: 1;
  white-space: nowrap;
  width: fit-content;
}

.nav-grid-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  background: var(--color-bg-3);
  border-color: var(--color-primary-6);
}

.nav-grid-button span {
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-grid-placeholder {
  min-height: 32px;
  padding: 6px 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  background: var(--color-bg-3);
  border: 1px dashed var(--color-border-3);
  border-radius: 6px;
  transition: all 0.3s ease;
  text-align: center;
  line-height: 1;
  white-space: nowrap;
  width: fit-content;
}

.nav-grid-placeholder:hover {
  border-color: var(--color-primary-6);
  background: var(--color-primary-1);
}

.placeholder-text {
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--color-text-4);
  text-align: center;
}

/* 可滚动内容区域 */
.debug-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
  width: 100%;
  margin: 0;
}

.debug-sections {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.debug-section {
  margin-bottom: 32px;
  padding: 24px;
  background: var(--color-bg-2);
  border-radius: 12px;
  border: 1px solid var(--color-border-2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.debug-section:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border-color: var(--color-border-3);
}

.debug-section h2 {
  color: var(--color-text-1);
  margin-bottom: 20px;
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.debug-section h2::before {
  content: '';
  width: 4px;
  height: 20px;
  background: var(--color-primary-6);
  border-radius: 2px;
}

.debug-section p {
  color: var(--color-text-3);
  margin-bottom: 15px;
}

.debug-textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border: 1px solid var(--color-border-2);
  border-radius: 6px;
  background: var(--color-bg-1);
  color: var(--color-text-1);
  font-family: 'Courier New', monospace;
  font-size: 12px;
  resize: vertical;
  margin-bottom: 15px;
}

.debug-result {
  margin-top: 15px;
}

.debug-result h3 {
  color: var(--color-text-1);
  margin-bottom: 15px;
}

.debug-result h4 {
  color: var(--color-text-2);
  margin: 20px 0 10px 0;
  font-size: 16px;
}

.debug-json {
  background: var(--color-bg-1);
  border: 1px solid var(--color-border-2);
  border-radius: 6px;
  padding: 15px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  overflow-x: auto;
  color: var(--color-text-1);
}

.debug-fields, .debug-validation {
  list-style: none;
  padding: 0;
  margin: 0;
}

.debug-fields li, .debug-validation li {
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border-3);
  color: var(--color-text-2);
}

.debug-fields code {
  background: var(--color-bg-1);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  color: var(--color-text-1);
}

.success {
  color: #52c41a;
  font-weight: bold;
}

.error {
  color: #f5222d;
  font-weight: bold;
}

.debug-error {
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  padding: 15px;
  color: #f5222d;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  overflow-x: auto;
}

.debug-error-box {
  margin-top: 15px;
  padding: 15px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
}

.debug-error-box h4 {
  color: #f5222d;
  margin-bottom: 10px;
}

.preset-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* 集成测试样式 */
.integration-test-subsection {
  margin-top: 30px;
  padding: 20px;
  border: 1px solid var(--color-border-3);
  border-radius: 6px;
  background: var(--color-bg-1);
}

.integration-test-subsection h3 {
  color: var(--color-text-1);
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: 600;
}

.integration-test-subsection p {
  color: var(--color-text-3);
  margin-bottom: 15px;
  font-size: 14px;
}

/* Toast样式 */
.action-toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 12px 24px;
  border-radius: 6px;
  color: white;
  font-weight: 500;
  z-index: 9999;
  max-width: 80%;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-toast.success {
  background-color: #52c41a;
}

.action-toast.error {
  background-color: #f5222d;
}

.action-toast.warning {
  background-color: #faad14;
}

.action-toast.info {
  background-color: #1890ff;
}

/* Toast动画 */
.action-toast-enter-active,
.action-toast-leave-active {
  transition: all 0.3s ease;
}

.action-toast-enter-from {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.8);
}

.action-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.8);
}

.integration-test-subsection:first-child {
  margin-top: 20px;
}
</style>