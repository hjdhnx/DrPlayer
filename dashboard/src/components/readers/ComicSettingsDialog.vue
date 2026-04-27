<template>
  <a-modal
    :visible="visible"
    title="漫画阅读设置"
    width="min(500px, calc(100vw - 24px))"
    :footer="false"
    @cancel="handleClose"
    unmount-on-close
    modal-class="comic-settings-dialog"
    align-center
  >
    <div class="dialog-container">
      <div class="settings-content">
        <div class="setting-section">
          <div class="section-title">
            <span>显示设置</span>
          </div>

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
                class="setting-slider"
                @change="handleSettingChange"
              />
              <span class="setting-value">{{ localSettings.imageWidth }}px</span>
            </div>
          </div>

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
                class="setting-slider"
                @change="handleSettingChange"
              />
              <span class="setting-value">{{ localSettings.imageGap }}px</span>
            </div>
          </div>

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
                class="setting-slider"
                @change="handleSettingChange"
              />
              <span class="setting-value">{{ localSettings.pagePadding }}px</span>
            </div>
          </div>
        </div>

        <div class="setting-section">
          <div class="section-title">
            <span>阅读模式</span>
          </div>

          <div class="setting-item">
            <label class="setting-label">阅读方向</label>
            <a-radio-group
              v-model="localSettings.readingDirection"
              class="reading-direction-group"
              @change="handleSettingChange"
            >
              <a-radio value="vertical">垂直滚动</a-radio>
              <a-radio value="horizontal">水平翻页</a-radio>
            </a-radio-group>
          </div>

          <div class="setting-item">
            <label class="setting-label">图片适应</label>
            <a-select
              v-model="localSettings.imageFit"
              class="image-fit-select"
              @change="handleSettingChange"
            >
              <a-option value="width">适应宽度</a-option>
              <a-option value="height">适应高度</a-option>
              <a-option value="contain">完整显示</a-option>
              <a-option value="cover">填充显示</a-option>
            </a-select>
          </div>

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
                class="setting-slider"
                @change="handleSettingChange"
              />
              <span class="setting-value">{{ localSettings.preloadPages }}页</span>
            </div>
          </div>
        </div>

        <div class="setting-section">
          <div class="section-title">
            <span>主题设置</span>
          </div>

          <div class="theme-options">
            <div
              v-for="theme in themes"
              :key="theme.key"
              :class="[
                'theme-option',
                { active: localSettings.theme === theme.key }
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

        <div class="setting-section" v-if="localSettings.theme === 'custom'">
          <div class="section-title">
            <span>自定义颜色</span>
          </div>

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
      </div>

      <div class="dialog-footer">
        <a-button @click="resetSettings" class="reset-btn">
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

const emit = defineEmits(['close', 'settings-change'])

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

const localSettings = ref({ ...defaultSettings, ...props.settings })

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

watch(() => props.settings, (newSettings) => {
  localSettings.value = { ...defaultSettings, ...newSettings }
}, { deep: true })

const handleClose = () => {
  emit('close')
}

const handleSettingChange = () => {
  emit('settings-change', { ...localSettings.value })
}

const selectTheme = (themeKey) => {
  localSettings.value.theme = themeKey

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
:global(.arco-modal-wrapper-align-center:has(.comic-settings-dialog)) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 12px;
  overflow: hidden;
}

:global(.comic-settings-dialog) {
  height: min(52vh, 460px);
  max-height: calc(100vh - 96px);
  display: flex !important;
  flex-direction: column;
  overflow: hidden;
  margin: 0 !important;
}

:global(.comic-settings-dialog .arco-modal-header) {
  flex-shrink: 0;
  border-bottom: 1px solid var(--color-border-2);
  padding: 12px 20px;
}

:global(.comic-settings-dialog .arco-modal-body) {
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
  gap: 16px;
  margin-bottom: 12px;
  min-height: 32px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-label {
  font-size: 14px;
  color: var(--color-text-2);
  min-width: 80px;
  flex-shrink: 0;
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  max-width: 280px;
  min-width: 0;
}

.setting-slider {
  flex: 1;
  min-width: 0;
}

.setting-value {
  font-size: 12px;
  color: var(--color-text-2);
  min-width: 44px;
  text-align: right;
}

.reading-direction-group {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 4px 10px;
}

.image-fit-select {
  width: 200px;
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
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
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

.preview-text {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.theme-name {
  font-size: 11px;
  line-height: 1.2;
  color: var(--color-text-2);
  text-align: center;
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

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-top: 1px solid var(--color-border-2);
  background: var(--color-bg-1);
  flex: 0 0 auto;
}

.reset-btn {
  color: var(--color-text-3);
}

@media (max-width: 768px) {
  :global(.arco-modal-wrapper-align-center:has(.comic-settings-dialog)) {
    padding: 12px;
  }

  :global(.comic-settings-dialog) {
    width: calc(100vw - 24px) !important;
    height: min(48vh, calc(100dvh - 220px)) !important;
    max-height: min(48vh, calc(100dvh - 220px)) !important;
    margin: 0 !important;
  }

  :global(.comic-settings-dialog .arco-modal-header) {
    padding: 12px 14px !important;
  }

  :global(.comic-settings-dialog .arco-modal-body) {
    height: 0;
    flex: 1 1 0;
    min-height: 0;
    max-height: none !important;
    padding: 0 !important;
    overflow: hidden !important;
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

  .setting-label {
    min-width: 0;
  }

  .setting-control,
  .image-fit-select {
    width: 100%;
    max-width: none;
  }

  .reading-direction-group {
    justify-content: flex-start;
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

  .dialog-footer {
    padding: 8px 12px calc(8px + env(safe-area-inset-bottom));
  }

  .dialog-footer :deep(.arco-btn) {
    min-width: 0;
    padding: 0 12px;
  }
}

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
