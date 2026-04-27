<template>
  <a-modal
    v-model:visible="dialogVisible"
    title="阅读设置"
    width="min(500px, calc(100vw - 24px))"
    :footer="false"
    @cancel="handleClose"
    modal-class="reading-settings-dialog"
    align-center
  >
    <div class="dialog-container">
      <!-- 滚动内容区域 -->
      <div class="settings-content">
        <!-- 字体设置 -->
        <div class="setting-section">
          <div class="section-title">
            <icon-font-colors />
            <span>字体设置</span>
          </div>
          
          <div class="setting-item">
            <label class="setting-label">字体大小</label>
            <div class="font-size-controls">
              <a-button size="small" @click="adjustFontSize(-1)" :disabled="localSettings.fontSize <= 12">
                <template #icon>
                  <icon-minus />
                </template>
              </a-button>
              <span class="font-size-value">{{ localSettings.fontSize }}px</span>
              <a-button size="small" @click="adjustFontSize(1)" :disabled="localSettings.fontSize >= 24">
                <template #icon>
                  <icon-plus />
                </template>
              </a-button>
            </div>
          </div>

          <div class="setting-item">
            <label class="setting-label">行间距</label>
            <a-slider
              v-model="localSettings.lineHeight"
              :min="1.2"
              :max="2.5"
              :step="0.1"
              :format-tooltip="(value) => `${value}`"
              class="line-height-slider"
            />
          </div>

          <div class="setting-item">
            <label class="setting-label">字体族</label>
            <a-select v-model="localSettings.fontFamily" class="font-family-select">
              <a-option value="system-ui">系统默认</a-option>
              <a-option value="'Microsoft YaHei', sans-serif">微软雅黑</a-option>
              <a-option value="'SimSun', serif">宋体</a-option>
              <a-option value="'KaiTi', serif">楷体</a-option>
              <a-option value="'SimHei', sans-serif">黑体</a-option>
              <a-option value="'Times New Roman', serif">Times New Roman</a-option>
              <a-option value="'Arial', sans-serif">Arial</a-option>
            </a-select>
          </div>

          <div class="setting-item">
            <label class="setting-label">阅读宽度</label>
            <a-slider
              v-model="localSettings.maxWidth"
              :min="600"
              :max="1200"
              :step="50"
              :format-tooltip="(value) => `${value}px`"
              class="max-width-slider"
            />
          </div>
        </div>

        <!-- 主题设置 -->
        <div class="setting-section">
          <div class="section-title">
            <icon-palette />
            <span>主题设置</span>
          </div>
          
          <div class="theme-options">
            <div
              v-for="theme in themes"
              :key="theme.key"
              :class="[
                'theme-option',
                { 'active': localSettings.theme === theme.key }
              ]"
              @click="selectTheme(theme.key)"
            >
              <div class="theme-preview" :style="theme.style">
                <div class="preview-text">Aa</div>
              </div>
              <div class="theme-name">{{ theme.name }}</div>
            </div>
          </div>
        </div>

        <!-- 自定义颜色 -->
        <div class="setting-section" v-if="localSettings.theme === 'custom'">
          <div class="section-title">
            <icon-bg-colors />
            <span>自定义颜色</span>
          </div>
          
          <div class="color-settings">
            <div class="color-item">
              <label class="color-label">背景颜色</label>
              <input
                type="color"
                v-model="localSettings.backgroundColor"
                class="color-picker"
              />
            </div>
            <div class="color-item">
              <label class="color-label">文字颜色</label>
              <input
                type="color"
                v-model="localSettings.textColor"
                class="color-picker"
              />
            </div>
          </div>
        </div>

        <!-- 预览区域 -->
        <div class="setting-section">
          <div class="section-title">
            <icon-eye />
            <span>预览效果</span>
          </div>
          
          <div class="preview-area" :style="previewStyles">
            <h3 class="preview-title">第一章 开始的地方</h3>
            <p class="preview-text">
              这是一段示例文字，用于预览当前的阅读设置效果。您可以调整上方的设置来获得最佳的阅读体验。
              字体大小、行间距、字体族和颜色主题都会影响阅读的舒适度。
            </p>
          </div>
        </div>
      </div>

      <!-- 固定底部按钮 -->
      <div class="dialog-footer">
        <a-button @click="resetSettings" class="reset-btn">
          重置默认
        </a-button>
        <div class="action-buttons">
          <a-button @click="handleClose">
            取消
          </a-button>
          <a-button type="primary" @click="handleSave">
            保存设置
          </a-button>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { 
  IconFontColors, 
  IconPalette, 
  IconBgColors, 
  IconEye,
  IconMinus,
  IconPlus
} from '@arco-design/web-vue/es/icon'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  settings: {
    type: Object,
    default: () => ({
      fontSize: 16,
      lineHeight: 1.8,
      fontFamily: 'system-ui',
      backgroundColor: '#ffffff',
      textColor: '#333333',
      maxWidth: 800,
      theme: 'light'
    })
  }
})

// Emits
const emit = defineEmits(['close', 'settings-change'])

// 响应式数据
const dialogVisible = ref(false)
const localSettings = ref({ ...props.settings })

// 主题选项
const themes = [
  {
    key: 'light',
    name: '明亮',
    style: {
      backgroundColor: '#ffffff',
      color: '#333333'
    }
  },
  {
    key: 'dark',
    name: '暗黑',
    style: {
      backgroundColor: '#1a1a1a',
      color: '#e6e6e6'
    }
  },
  {
    key: 'sepia',
    name: '护眼',
    style: {
      backgroundColor: '#f4f1e8',
      color: '#5c4b37'
    }
  },
  {
    key: 'green',
    name: '绿豆沙',
    style: {
      backgroundColor: '#c7edcc',
      color: '#2d5016'
    }
  },
  {
    key: 'parchment',
    name: '羊皮纸',
    style: {
      backgroundColor: '#fdf6e3',
      color: '#657b83'
    }
  },
  {
    key: 'night',
    name: '夜间护眼',
    style: {
      backgroundColor: '#2b2b2b',
      color: '#c9aa71'
    }
  },
  {
    key: 'blue',
    name: '蓝光护眼',
    style: {
      backgroundColor: '#e8f4f8',
      color: '#1e3a5f'
    }
  },
  {
    key: 'pink',
    name: '粉色护眼',
    style: {
      backgroundColor: '#fdf2f8',
      color: '#831843'
    }
  },
  {
    key: 'custom',
    name: '自定义',
    style: {
      backgroundColor: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
      color: '#ffffff'
    }
  }
]

// 计算属性
const previewStyles = computed(() => {
  let backgroundColor = localSettings.value.backgroundColor
  let textColor = localSettings.value.textColor
  
  // 根据主题设置颜色
  if (localSettings.value.theme !== 'custom') {
    const theme = themes.find(t => t.key === localSettings.value.theme)
    if (theme) {
      backgroundColor = theme.style.backgroundColor
      textColor = theme.style.color
    }
  }
  
  return {
    fontSize: `${localSettings.value.fontSize}px`,
    lineHeight: localSettings.value.lineHeight,
    fontFamily: localSettings.value.fontFamily,
    backgroundColor,
    color: textColor,
    maxWidth: `${localSettings.value.maxWidth}px`
  }
})

// 方法
const adjustFontSize = (delta) => {
  const newSize = localSettings.value.fontSize + delta
  if (newSize >= 12 && newSize <= 24) {
    localSettings.value.fontSize = newSize
  }
}

const selectTheme = (themeKey) => {
  localSettings.value.theme = themeKey
  
  // 根据主题设置默认颜色
  const theme = themes.find(t => t.key === themeKey)
  if (theme && themeKey !== 'custom') {
    localSettings.value.backgroundColor = theme.style.backgroundColor
    localSettings.value.textColor = theme.style.color
  }
}

const resetSettings = () => {
  localSettings.value = {
    fontSize: 16,
    lineHeight: 1.8,
    fontFamily: 'system-ui',
    backgroundColor: '#ffffff',
    textColor: '#333333',
    maxWidth: 800,
    theme: 'light'
  }
  Message.success('已重置为默认设置')
}

const handleSave = () => {
  emit('settings-change', { ...localSettings.value })
  handleClose()
  Message.success('阅读设置已保存')
}

const handleClose = () => {
  emit('close')
}

// 监听props变化
watch(() => props.visible, (visible) => {
  dialogVisible.value = visible
  if (visible) {
    localSettings.value = { ...props.settings }
  }
})

watch(() => props.settings, (newSettings) => {
  localSettings.value = { ...newSettings }
}, { deep: true })

watch(dialogVisible, (visible) => {
  if (!visible) {
    emit('close')
  }
})
</script>

<style scoped>
/* 重写模态框样式，确保头部和底部固定 */
:global(.arco-modal-wrapper-align-center:has(.reading-settings-dialog)) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 12px;
  overflow: hidden;
}

:global(.reading-settings-dialog) {
  height: min(46vh, 420px);
  max-height: calc(100vh - 96px);
  display: flex !important;
  flex-direction: column;
  overflow: hidden;
  margin: 0 !important;
}

:global(.reading-settings-dialog .arco-modal-header) {
  flex-shrink: 0;
  border-bottom: 1px solid var(--color-border-2);
  padding: 12px 20px;
}

:global(.reading-settings-dialog .arco-modal-body) {
  height: 0;
  flex: 1 1 0;
  min-height: 0;
  max-height: none !important;
  padding: 0 !important;
  display: flex;
  flex-direction: column;
  overflow: hidden !important;
}

.dialog-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.settings-content {
  flex: 1 1 auto;
  min-height: 0;
  padding: 16px;
  overflow-y: auto;
  overflow-x: hidden;
}

.setting-section {
  margin-bottom: 16px;
}

.setting-section:last-of-type {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-1);
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--color-border-2);
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.setting-label {
  font-size: 14px;
  color: var(--color-text-2);
  min-width: 80px;
}

.font-size-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.font-size-value {
  font-size: 14px;
  color: var(--color-text-1);
  min-width: 40px;
  text-align: center;
}

.line-height-slider,
.max-width-slider {
  width: 180px;
}

.font-family-select {
  width: 180px;
}

.theme-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
  gap: 10px;
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px;
  border: 2px solid var(--color-border-2);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-option:hover {
  border-color: var(--color-border-3);
  transform: translateY(-1px);
}

.theme-option.active {
  border-color: var(--color-primary-6);
  background: var(--color-primary-light-1);
}

.theme-preview {
  width: 50px;
  height: 32px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.theme-name {
  font-size: 11px;
  color: var(--color-text-2);
}

.color-settings {
  display: flex;
  gap: 16px;
}

.color-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.color-label {
  font-size: 11px;
  color: var(--color-text-2);
}

.color-picker {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  outline: none;
}

.preview-area {
  padding: 16px;
  border: 1px solid var(--color-border-2);
  border-radius: 6px;
  margin: 0 auto;
  transition: all 0.3s ease;
}

.preview-title {
  margin: 0 0 12px 0;
  font-weight: 600;
}

.preview-text {
  margin: 0;
  text-align: justify;
  text-indent: 2em;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-top: 1px solid var(--color-border-2);
  background: var(--color-bg-1);
  flex: 0 0 auto;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.reset-btn {
  color: var(--color-text-3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  :global(.arco-modal-wrapper-align-center:has(.reading-settings-dialog)) {
    padding: 12px;
  }

  :global(.reading-settings-dialog) {
    width: calc(100vw - 24px) !important;
    height: min(46vh, calc(100vh - 220px)) !important;
    max-height: min(46vh, calc(100vh - 220px)) !important;
    margin: 0 !important;
  }

  :global(.reading-settings-dialog .arco-modal-header) {
    padding: 12px 14px !important;
  }

  :global(.reading-settings-dialog .arco-modal-body) {
    height: 0;
    flex: 1 1 0;
    min-height: 0;
    max-height: none !important;
    padding: 0 !important;
    overflow: hidden !important;
  }

  .dialog-container {
    min-height: 0;
  }

  .settings-content {
    min-height: 0;
    padding: 10px 12px;
  }

  .setting-section {
    margin-bottom: 10px;
  }

  .section-title {
    margin-bottom: 8px;
    padding-bottom: 4px;
    font-size: 14px;
  }

  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    margin-bottom: 8px;
  }

  .line-height-slider,
  .max-width-slider,
  .font-family-select {
    width: 100%;
  }

  .theme-options {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
  }

  .theme-option {
    padding: 6px;
    gap: 4px;
  }

  .theme-preview {
    width: 42px;
    height: 26px;
  }

  .color-settings {
    justify-content: center;
  }

  .preview-area {
    padding: 10px;
  }

  .preview-title {
    margin-bottom: 8px;
    font-size: 15px;
  }

  .dialog-footer {
    padding: 8px 12px calc(8px + env(safe-area-inset-bottom));
    gap: 8px;
  }

  .action-buttons {
    gap: 8px;
  }

  .dialog-footer :deep(.arco-btn) {
    min-width: 0;
    padding: 0 12px;
  }
}

/* 滚动条样式 */
.settings-content::-webkit-scrollbar {
  width: 6px;
}

.settings-content::-webkit-scrollbar-track {
  background: var(--color-fill-1);
  border-radius: 3px;
}

.settings-content::-webkit-scrollbar-thumb {
  background: var(--color-fill-3);
  border-radius: 3px;
}

.settings-content::-webkit-scrollbar-thumb:hover {
  background: var(--color-fill-4);
}
</style>