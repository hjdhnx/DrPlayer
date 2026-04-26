<template>
  <div class="csp-test-container">
    <!-- 固定头部区域 -->
    <div class="test-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
          <icon-safe class="title-icon" />
          CSP测试工具
        </h1>
          <p class="page-subtitle">测试内容安全策略(CSP)绕过功能和Referrer策略设置</p>
        </div>
        <div class="nav-button-group">
          <div class="nav-button-grid">
            <a-button type="primary" status="success" @click="goToActionTest" class="nav-grid-button">
              <icon-arrow-left />
              <span>Action测试</span>
            </a-button>
            <a-button type="primary" status="warning" @click="goToVideoTest" class="nav-grid-button">
              <icon-play-arrow />
              <span>视频测试</span>
            </a-button>
            <a-button type="primary" status="normal" @click="goToSettings" class="nav-grid-button">
              <icon-settings />
              <span>CSP设置</span>
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
    <div class="test-content">
      <!-- 当前CSP配置 -->
      <div class="test-section">
        <h2>当前CSP配置</h2>
        <div class="config-info">
          <div class="config-item">
            <label>CSP绕过状态:</label>
            <span :class="cspConfig.enabled ? 'status-enabled' : 'status-disabled'">
              {{ cspConfig.enabled ? '✅ 启用' : '❌ 禁用' }}
            </span>
          </div>
          <div class="config-item">
            <label>Referrer策略:</label>
            <code class="config-value">{{ cspConfig.referrerPolicy }}</code>
          </div>
          <div class="config-item">
            <label>策略名称:</label>
            <span class="config-name">{{ getCurrentReferrerPolicyName() }}</span>
          </div>
        </div>
      </div>

      <!-- 测试操作 -->
      <div class="test-section">
        <h2>测试操作</h2>
        <div class="test-buttons">
          <a-button type="outline" status="success" shape="round" @click="testApplyCSP">
            <icon-play-arrow />
            测试应用CSP绕过
          </a-button>
          <a-button type="outline" status="success" shape="round" @click="testReferrerPolicy">
            <icon-link />
            测试Referrer策略
          </a-button>
          <a-button type="outline" status="success" shape="round" @click="refreshConfig">
            <icon-refresh />
            刷新配置
          </a-button>
          <a-button type="outline" status="warning" shape="round" @click="clearResults">
            <icon-delete />
            清除结果
          </a-button>
        </div>
      </div>

      <!-- 视频播放测试 -->
      <div class="test-section">
        <h2>视频播放测试</h2>
        <div class="video-test">
          <a-input 
            v-model="testVideoUrl" 
            placeholder="输入测试视频URL"
            style="margin-bottom: 16px;"
          />
          <div class="video-test-buttons">
            <a-button type="primary" @click="testVideoPlay" :disabled="!testVideoUrl">
              <icon-play-arrow />
              测试视频播放
            </a-button>
            <a-button @click="testVideoUrl = defaultTestUrl" type="outline">
              使用默认测试链接
            </a-button>
          </div>
          <div v-if="videoTestResult" class="video-result">
            {{ videoTestResult }}
          </div>
        </div>
      </div>

      <!-- 测试结果 -->
      <div class="test-section">
        <h2>测试结果</h2>
        <div class="test-results">
          <div v-if="testResults.length === 0" class="no-results">
            暂无测试结果
          </div>
          <div v-for="(result, index) in testResults" :key="index" 
               :class="['test-result', result.type]">
            <div class="result-header">
              <span class="timestamp">{{ result.timestamp }}</span>
              <span :class="['result-status', result.type]">
                {{ getStatusIcon(result.type) }} {{ getStatusText(result.type) }}
              </span>
            </div>
            <div class="result-message">{{ result.message }}</div>
          </div>
        </div>
      </div>

      <!-- 系统信息 -->
      <div class="test-section">
        <h2>系统信息</h2>
        <div class="system-info">
          <div class="info-item">
            <label>浏览器:</label>
            <span>{{ browserInfo.name }} {{ browserInfo.version }}</span>
          </div>
          <div class="info-item">
            <label>用户代理:</label>
            <code class="user-agent">{{ browserInfo.userAgent }}</code>
          </div>
          <div class="info-item">
            <label>支持的视频格式:</label>
            <div class="format-support">
              <span v-for="(supported, format) in videoSupport" :key="format" 
                    :class="['format-item', supported ? 'supported' : 'not-supported']">
                {{ format.toUpperCase() }}: {{ supported ? '✅' : '❌' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { 
  IconSafe, 
  IconArrowLeft, 
  IconSettings, 
  IconPlayArrow, 
  IconLink, 
  IconRefresh, 
  IconDelete 
} from '@arco-design/web-vue/es/icon'
import { 
  getCSPConfig, 
  applyCSPBypass, 
  setVideoReferrerPolicy, 
  REFERRER_POLICIES_LIST,
  getCurrentReferrerPolicy,
  setGlobalReferrerPolicy
} from '@/utils/csp'

const router = useRouter()

const cspConfig = ref({
  enabled: false,
  referrerPolicy: 'no-referrer'
})

const testResults = ref([])
const testVideoUrl = ref('')
const videoTestResult = ref('')
const defaultTestUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'

// 浏览器信息
const browserInfo = computed(() => {
  const ua = navigator.userAgent
  let name = 'Unknown'
  let version = 'Unknown'
  
  if (ua.includes('Chrome')) {
    name = 'Chrome'
    const match = ua.match(/Chrome\/(\d+)/)
    if (match) version = match[1]
  } else if (ua.includes('Firefox')) {
    name = 'Firefox'
    const match = ua.match(/Firefox\/(\d+)/)
    if (match) version = match[1]
  } else if (ua.includes('Safari')) {
    name = 'Safari'
    const match = ua.match(/Version\/(\d+)/)
    if (match) version = match[1]
  } else if (ua.includes('Edge')) {
    name = 'Edge'
    const match = ua.match(/Edge\/(\d+)/)
    if (match) version = match[1]
  }
  
  return {
    name,
    version,
    userAgent: ua
  }
})

// 视频格式支持检测
const videoSupport = computed(() => {
  const video = document.createElement('video')
  return {
    mp4: video.canPlayType('video/mp4') !== '',
    webm: video.canPlayType('video/webm') !== '',
    ogg: video.canPlayType('video/ogg') !== '',
    hls: video.canPlayType('application/vnd.apple.mpegurl') !== '' || window.Hls?.isSupported()
  }
})

const addTestResult = (message, type = 'info') => {
  testResults.value.unshift({
    timestamp: new Date().toLocaleTimeString(),
    message,
    type
  })
  
  // 限制结果数量
  if (testResults.value.length > 10) {
    testResults.value = testResults.value.slice(0, 10)
  }
}

const getCurrentReferrerPolicyName = () => {
  const policy = REFERRER_POLICIES_LIST.find(p => p.value === cspConfig.value.referrerPolicy)
  return policy ? policy.label : '未知策略'
}

// 导航方法
const goToActionTest = () => {
  router.push('/action-test')
}

const goToVideoTest = () => {
  router.push('/video-test')
}

const goToSettings = () => {
  router.push('/settings')
}

// 状态显示方法
const getStatusIcon = (type) => {
  switch (type) {
    case 'success': return '✅'
    case 'error': return '❌'
    case 'warning': return '⚠️'
    case 'info': return 'ℹ️'
    default: return '📝'
  }
}

const getStatusText = (type) => {
  switch (type) {
    case 'success': return '成功'
    case 'error': return '错误'
    case 'warning': return '警告'
    case 'info': return '信息'
    default: return '未知'
  }
}

// 清除结果
const clearResults = () => {
  testResults.value = []
  videoTestResult.value = ''
  addTestResult('测试结果已清除', 'info')
}

const refreshConfig = () => {
  try {
    cspConfig.value = getCSPConfig()
    addTestResult('配置刷新成功', 'success')
  } catch (error) {
    addTestResult(`配置刷新失败: ${error.message}`, 'error')
  }
}

const testApplyCSP = async () => {
  try {
    addTestResult('开始测试CSP绕过...', 'info')
    
    const result = await applyCSPBypass()
    if (result.success) {
      addTestResult(`CSP绕过应用成功: ${result.message}`, 'success')
    } else {
      addTestResult(`CSP绕过应用失败: ${result.message}`, 'warning')
    }
  } catch (error) {
    addTestResult(`CSP绕过测试出错: ${error.message}`, 'error')
  }
}

const testReferrerPolicy = () => {
  try {
    addTestResult('开始测试Referrer策略...', 'info')
    
    const currentPolicy = getCurrentReferrerPolicy()
    addTestResult(`当前Referrer策略: ${currentPolicy}`, 'info')
    
    // 测试设置策略
    setGlobalReferrerPolicy(cspConfig.value.referrerPolicy)
    addTestResult(`已设置全局Referrer策略为: ${cspConfig.value.referrerPolicy}`, 'success')
    
    // 测试视频元素策略
    const testElement = document.createElement('video')
    setVideoReferrerPolicy(testElement, cspConfig.value.referrerPolicy)
    addTestResult(`已为测试视频元素设置Referrer策略`, 'success')
    
  } catch (error) {
    addTestResult(`Referrer策略测试出错: ${error.message}`, 'error')
  }
}

const testVideoPlay = () => {
  try {
    addTestResult('开始测试视频播放...', 'info')
    
    if (!testVideoUrl.value) {
      addTestResult('请输入测试视频URL', 'warning')
      return
    }
    
    // 创建测试视频元素
    const video = document.createElement('video')
    video.src = testVideoUrl.value
    video.crossOrigin = 'anonymous'
    
    // 应用CSP策略
    if (cspConfig.value.enabled) {
      setVideoReferrerPolicy(video, cspConfig.value.referrerPolicy)
      addTestResult('已为测试视频应用CSP策略', 'info')
    }
    
    // 测试加载
    video.addEventListener('loadstart', () => {
      addTestResult('视频开始加载', 'info')
    })
    
    video.addEventListener('canplay', () => {
      addTestResult('视频可以播放', 'success')
      videoTestResult.value = '✅ 视频加载成功'
    })
    
    video.addEventListener('error', (e) => {
      addTestResult(`视频加载失败: ${e.message || '未知错误'}`, 'error')
      videoTestResult.value = '❌ 视频加载失败'
    })
    
    // 开始加载
    video.load()
    
  } catch (error) {
    addTestResult(`视频播放测试出错: ${error.message}`, 'error')
    videoTestResult.value = `❌ 测试出错: ${error.message}`
  }
}

onMounted(() => {
  refreshConfig()
  addTestResult('CSP测试页面已加载', 'success')
})
</script>

<style scoped>
.csp-test-container {
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

.title-icon {
  font-size: 32px;
  color: var(--color-primary-6);
}

.page-subtitle {
  color: var(--dp-text-secondary);
  font-size: 16px;
  margin: 0;
  line-height: 1.5;
}

.nav-button-group {
  max-width: fit-content;
  max-height: 200px;
  overflow-y: auto;
  padding: 4px;
  border-radius: 8px;
  background: var(--color-bg-2);
  border: 1px solid var(--color-border-2);
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
  color: var(--dp-text-secondary);
  text-align: center;
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

/* 配置信息样式 */
.config-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-bg-1);
  border-radius: 8px;
  border: 1px solid var(--color-border-2);
}

.config-item label {
  font-weight: 600;
  color: var(--color-text-2);
  min-width: 120px;
}

.status-enabled {
  color: var(--color-success-6);
  font-weight: 600;
}

.status-disabled {
  color: var(--color-danger-6);
  font-weight: 600;
}

.config-value {
  background: var(--color-fill-2);
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
}

.config-name {
  color: var(--color-text-1);
  font-weight: 500;
}

/* 按钮样式 */
.test-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

/* 视频测试样式 */
.video-test {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.video-test-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.video-result {
  padding: 16px;
  border-radius: 8px;
  background: var(--color-bg-1);
  border: 1px solid var(--color-border-2);
  font-weight: 600;
  color: var(--color-text-1);
}

/* 测试结果样式 */
.test-results {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--color-border-2);
  border-radius: 8px;
  background: var(--color-bg-1);
}

.no-results {
  padding: 32px;
  text-align: center;
  color: var(--color-text-3);
  font-style: italic;
}

.test-result {
  padding: 16px;
  border-bottom: 1px solid var(--color-border-2);
  transition: background 0.2s ease;
}

.test-result:last-child {
  border-bottom: none;
}

.test-result:hover {
  background: var(--color-fill-1);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.timestamp {
  font-size: 12px;
  color: var(--color-text-3);
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.result-status {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.result-status.success {
  background: var(--color-success-light-1);
  color: var(--color-success-6);
}

.result-status.error {
  background: var(--color-danger-light-1);
  color: var(--color-danger-6);
}

.result-status.warning {
  background: var(--color-warning-light-1);
  color: var(--color-warning-6);
}

.result-status.info {
  background: var(--color-info-light-1);
  color: var(--color-info-6);
}

.result-message {
  color: var(--color-text-1);
  line-height: 1.5;
  word-break: break-word;
}

/* 系统信息样式 */
.system-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: var(--color-bg-1);
  border-radius: 8px;
  border: 1px solid var(--color-border-2);
}

.info-item label {
  font-weight: 600;
  color: var(--color-text-2);
  font-size: 14px;
}

.user-agent {
  background: var(--color-fill-2);
  padding: 8px 12px;
  border-radius: 6px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  word-break: break-all;
  line-height: 1.4;
}

.format-support {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.format-item {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.format-item.supported {
  background: var(--color-success-light-1);
  color: var(--color-success-6);
}

.format-item.not-supported {
  background: var(--color-danger-light-1);
  color: var(--color-danger-6);
}

/* 响应式设计 */
@media (min-width: 769px) {
  .test-header {
    padding: 14px 16px;
    background: var(--dp-bg-surface);
    border-bottom-color: var(--dp-border-subtle);
  }

  .header-content {
    align-items: center;
    gap: 16px;
  }

  .page-title {
    gap: 8px;
    margin-bottom: 4px;
    font-size: 22px;
    line-height: 1.2;
  }

  .title-icon {
    font-size: 24px;
  }

  .page-subtitle {
    font-size: 13px;
    line-height: 1.35;
  }

  .nav-button-group {
    padding: 2px;
    border-radius: var(--dp-radius-md);
    background: var(--dp-bg-surface-muted);
  }

  .nav-button-grid {
    gap: 4px;
    padding: 4px;
  }

  .nav-grid-button,
  .nav-grid-placeholder {
    min-height: 28px;
    padding: 4px 9px;
    border-radius: var(--dp-radius-sm);
  }

  .test-content {
    padding: 0;
  }

  .test-section {
    margin-bottom: 8px;
    padding: 12px 14px;
    border-radius: var(--dp-radius-lg);
    box-shadow: var(--dp-shadow-sm);
  }

  .test-section:hover {
    box-shadow: var(--dp-shadow-sm);
  }

  .test-section h2 {
    gap: 6px;
    margin: 0 0 10px;
    font-size: 15px;
    line-height: 1.25;
  }

  .test-section h2::before {
    width: 3px;
    height: 15px;
  }

  .config-info,
  .video-test,
  .system-info {
    gap: 8px;
  }

  .config-item,
  .info-item,
  .video-result,
  .test-result {
    padding: 8px 10px;
    border-radius: var(--dp-radius-md);
  }

  .config-item label {
    min-width: 96px;
    font-size: 12px;
  }

  .config-value,
  .config-name,
  .result-message,
  .info-item label,
  .user-agent {
    font-size: 12px;
    line-height: 1.35;
  }

  .test-buttons {
    grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
    gap: 8px;
  }

  .video-test-buttons {
    gap: 8px;
  }

  .test-buttons :deep(.arco-btn),
  .video-test-buttons :deep(.arco-btn) {
    min-height: 30px;
    padding: 4px 10px;
    font-size: 12px;
  }

  .test-results {
    max-height: 300px;
    border-radius: var(--dp-radius-md);
  }

  .no-results {
    padding: 18px;
  }

  .result-header {
    margin-bottom: 5px;
  }

  .user-agent {
    padding: 6px 8px;
  }

  .format-support {
    gap: 6px;
  }
}
@media (max-width: 768px) {
  .csp-test-container {
    min-height: 100%;
    background:
      radial-gradient(circle at top left, rgba(0, 180, 42, 0.1), transparent 34%),
      var(--dp-bg-app);
  }

  .test-header {
    position: static;
    padding: 10px 0 12px;
    background: transparent;
    border-bottom: none;
    backdrop-filter: none;
  }

  .header-content {
    flex-direction: column;
    gap: 12px;
  }

  .nav-button-group {
    max-width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 3px;
    border-radius: 999px;
    background: var(--dp-bg-surface);
    border-color: var(--dp-border-subtle);
    box-shadow: var(--dp-shadow-sm);
    scrollbar-width: none;
  }

  .nav-button-group::-webkit-scrollbar {
    display: none;
  }

  .nav-button-grid {
    display: flex;
    min-width: max-content;
    gap: 6px;
    padding: 3px;
  }

  .nav-grid-button,
  .nav-grid-placeholder {
    min-height: 34px;
    border-radius: 999px;
  }

  .page-title {
    font-size: 22px;
    line-height: 1.25;
    font-weight: 800;
  }

  .title-icon {
    font-size: 24px;
  }

  .page-subtitle {
    font-size: 13px;
  }

  .test-content {
    padding: 0 0 12px;
  }

  .test-section {
    padding: 14px;
    margin-bottom: 12px;
    border-radius: 18px;
    background: var(--dp-bg-surface);
    border-color: var(--dp-border-subtle);
    box-shadow: var(--dp-shadow-sm);
  }

  .test-buttons {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .test-buttons :deep(.arco-btn),
  .video-test-buttons :deep(.arco-btn) {
    min-width: 0;
    min-height: 40px;
    border-radius: 999px;
  }

  .config-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    border-radius: 14px;
  }

  .config-item label {
    min-width: auto;
  }

  .video-test-buttons {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .result-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .user-agent,
  .config-value {
    max-width: 100%;
    overflow-x: auto;
  }
}
</style>