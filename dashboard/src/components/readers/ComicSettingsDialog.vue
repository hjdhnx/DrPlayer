<template>
  <a-modal
    :visible="visible"
    title="漫画阅读设置"
    :width="480"
    :footer="false"
    @cancel="handleClose"
    unmount-on-close
  >
    <div class="comic-settings">
      <!-- 显示设置 -->
      <div class="setting-section">
        <h3 class="section-title">显示设置</h3>
        
        <!-- 图片宽度 -->
        <div class="setting-item">
          <label class="setting-label">图片宽度</label>
          <div class="setting-control">
            <a-slider
              v-model="localSettings.imageWidth"
              :min="300"
              :max="1200"
              :step="50"
              :show-tooltip="true"
              :format-tooltip="(value) => `${value}px`"
              @change="handleSettingChange"
            />
            <span class="setting-value">{{ localSettings.imageWidth }}px</span>
          </div>
        </div>

        <!-- 图片间距 -->
        <div class="setting-item">
          <label class="setting-label">图片间距</label>
          <div class="setting-control">
            <a-slider
              v-model="localSettings.imageGap"
              :min="0"
              :max="50"
              :step="5"
              :show-tooltip="true"
              :format-tooltip="(value) => `${value}px`"
              @change="handleSettingChange"
            />
            <span class="setting-value">{{ localSettings.imageGap }}px</span>
          </div>
        </div>

        <!-- 页面边距 -->
        <div class="setting-item">
          <label class="setting-label">页面边距</label>
          <div class="setting-control">
            <a-slider
              v-model="localSettings.pagePadding"
              :min="10"
              :max="100"
              :step="10"
              :show-tooltip="true"
              :format-tooltip="(value) => `${value}px`"
              @change="handleSettingChange"
            />
            <span class="setting-value">{{ localSettings.pagePadding }}px</span>
          </div>
        </div>
      </div>

      <!-- 阅读模式 -->
      <div class="setting-section">
        <h3 class="section-title">阅读模式</h3>
        
        <!-- 阅读方向 -->
        <div class="setting-item">
          <label class="setting-label">阅读方向</label>
          <a-radio-group 
            v-model="localSettings.readingDirection" 
            @change="handleSettingChange"
          >
            <a-radio value="vertical">垂直滚动</a-radio>
            <a-radio value="horizontal">水平翻页</a-radio>
          </a-radio-group>
        </div>

        <!-- 图片适应方式 -->
        <div class="setting-item">
          <label class="setting-label">图片适应</label>
          <a-select 
            v-model="localSettings.imageFit" 
            @change="handleSettingChange"
            :style="{ width: '200px' }"
          >
            <a-option value="width">适应宽度</a-option>
            <a-option value="height">适应高度</a-option>
            <a-option value="contain">完整显示</a-option>
            <a-option value="cover">填充显示</a-option>
          </a-select>
        </div>

        <!-- 预加载页数 -->
        <div class="setting-item">
          <label class="setting-label">预加载页数</label>
          <div class="setting-control">
            <a-slider
              v-model="localSettings.preloadPages"
              :min="1"
              :max="10"
              :step="1"
              :show-tooltip="true"
              :format-tooltip="(value) => `${value}页`"
              @change="handleSettingChange"
            />
            <span class="setting-value">{{ localSettings.preloadPages }}页</span>
          </div>
        </div>
      </div>

      <!-- 主题设置 -->
      <div class="setting-section">
        <h3 class="section-title">主题设置</h3>
        
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
        <h3 class="section-title">自定义颜色</h3>
        
        <div class="color-settings">
          <div class="color-item">
            <label class="color-label">背景颜色</label>
            <input
              type="color"
              v-model="localSettings.backgroundColor"
              class="color-picker"
              @change="handleSettingChange"
            />
          </div>
          <div class="color-item">
            <label class="color-label">文字颜色</label>
            <input
              type="color"
              v-model="localSettings.textColor"
              class="color-picker"
              @change="handleSettingChange"
            />
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="setting-actions">
        <a-button @click="resetSettings" type="outline">
          重置默认
        </a-button>
        <a-button @click="handleClose" type="primary">
          完成
        </a-button>
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, watch } from 'vue'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  settings: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits(['close', 'settings-change'])

// 默认设置
const defaultSettings = {
  imageWidth: 800,
  imageGap: 10,
  pagePadding: 20,
  readingDirection: 'vertical',
  imageFit: 'width',
  preloadPages: 3,
  backgroundColor: '#000000',
  textColor: '#ffffff',
  theme: 'dark'
}

// 本地设置
const localSettings = ref({ ...defaultSettings, ...props.settings })

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

// 监听props变化
watch(() => props.settings, (newSettings) => {
  localSettings.value = { ...defaultSettings, ...newSettings }
}, { deep: true })

// 事件处理
const handleClose = () => {
  emit('close')
}

const handleSettingChange = () => {
  emit('settings-change', { ...localSettings.value })
}

const selectTheme = (themeKey) => {
  localSettings.value.theme = themeKey
  
  // 根据主题设置默认颜色
  const theme = themes.find(t => t.key === themeKey)
  if (theme && themeKey !== 'custom') {
    localSettings.value.backgroundColor = theme.style.backgroundColor
    localSettings.value.textColor = theme.style.color
  }
  
  handleSettingChange()
}

const resetSettings = () => {
  localSettings.value = { ...defaultSettings }
  handleSettingChange()
}
</script>

<style scoped>
.comic-settings {
  padding: 20px 0;
}

.setting-section {
  margin-bottom: 32px;
}

.setting-section:last-of-type {
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--color-text-1);
  border-bottom: 1px solid var(--color-border-2);
  padding-bottom: 8px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  min-height: 32px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-label {
  font-size: 14px;
  color: var(--color-text-1);
  min-width: 80px;
  flex-shrink: 0;
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  max-width: 280px;
}

.setting-control :deep(.arco-slider) {
  flex: 1;
}

.setting-value {
  font-size: 12px;
  color: var(--color-text-2);
  min-width: 50px;
  text-align: right;
}

.theme-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 12px;
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 2px solid var(--color-border-2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-option:hover {
  border-color: var(--color-border-3);
  transform: translateY(-2px);
}

.theme-option.active {
  border-color: var(--color-primary-6);
  background: var(--color-primary-light-1);
}

.theme-preview {
  width: 60px;
  height: 40px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
}

.preview-text {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.theme-name {
  font-size: 12px;
  color: var(--color-text-2);
  text-align: center;
}

.color-settings {
  display: flex;
  gap: 20px;
}

.color-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.color-label {
  font-size: 14px;
  color: var(--color-text-2);
}

.color-picker {
  width: 60px;
  height: 40px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  outline: none;
}

.setting-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border-2);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .setting-control {
    width: 100%;
    max-width: none;
  }
  
  .theme-options {
    width: 100%;
  }
  
  .theme-option {
    flex: 1;
    min-width: 50px;
  }
}
</style>