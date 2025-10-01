<template>
  <div v-if="visible" class="skip-settings-overlay" @click="handleOverlayClick">
    <div class="skip-settings-dialog" @click.stop>
      <div class="dialog-header">
        <h3>片头片尾设置</h3>
        <button class="close-btn" @click="$emit('close')">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
      </div>
      
      <div class="dialog-content">
        <div class="setting-row">
          <div class="setting-label">
            <span>跳过片头</span>
            <div class="setting-hint">自动跳过视频开头的片头部分</div>
          </div>
          <div class="setting-control">
            <a-switch 
              v-model="localSkipIntroEnabled" 
              size="small"
            />
            <a-input-number
              v-if="localSkipIntroEnabled"
              v-model="localSkipIntroSeconds"
              :min="1"
              :max="300"
              size="small"
              class="seconds-input"
            />
            <span v-if="localSkipIntroEnabled" class="unit">秒</span>
          </div>
        </div>
        
        <div class="setting-row">
          <div class="setting-label">
            <span>跳过片尾</span>
            <div class="setting-hint">在视频结束前自动跳转到下一集</div>
          </div>
          <div class="setting-control">
            <a-switch 
              v-model="localSkipOutroEnabled" 
              size="small"
            />
            <a-input-number
              v-if="localSkipOutroEnabled"
              v-model="localSkipOutroSeconds"
              :min="1"
              :max="300"
              size="small"
              class="seconds-input"
            />
            <span v-if="localSkipOutroEnabled" class="unit">秒</span>
          </div>
        </div>
        
        <div class="setting-hint-global">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="m9 12 2 2 4-4" stroke="currentColor" stroke-width="2"/>
          </svg>
          设置将自动保存并应用到所有播放器
        </div>
      </div>
      
      <div class="dialog-footer">
        <a-button @click="$emit('close')" size="small">
          取消
        </a-button>
        <a-button type="primary" @click="handleSave" size="small">
          保存
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  skipIntroEnabled: {
    type: Boolean,
    default: false
  },
  skipOutroEnabled: {
    type: Boolean,
    default: false
  },
  skipIntroSeconds: {
    type: Number,
    default: 90
  },
  skipOutroSeconds: {
    type: Number,
    default: 90
  }
})

// Emits
const emit = defineEmits(['close', 'save'])

// Local reactive data
const localSkipIntroEnabled = ref(props.skipIntroEnabled)
const localSkipOutroEnabled = ref(props.skipOutroEnabled)
const localSkipIntroSeconds = ref(props.skipIntroSeconds)
const localSkipOutroSeconds = ref(props.skipOutroSeconds)

// Watch props changes to update local data
watch(() => props.skipIntroEnabled, (newVal) => {
  localSkipIntroEnabled.value = newVal
})

watch(() => props.skipOutroEnabled, (newVal) => {
  localSkipOutroEnabled.value = newVal
})

watch(() => props.skipIntroSeconds, (newVal) => {
  localSkipIntroSeconds.value = newVal
})

watch(() => props.skipOutroSeconds, (newVal) => {
  localSkipOutroSeconds.value = newVal
})

// Methods
const handleOverlayClick = () => {
  emit('close')
}

const handleSave = () => {
  emit('save', {
    skipIntroEnabled: localSkipIntroEnabled.value,
    skipOutroEnabled: localSkipOutroEnabled.value,
    skipIntroSeconds: localSkipIntroSeconds.value,
    skipOutroSeconds: localSkipOutroSeconds.value
  })
}
</script>

<style scoped>
.skip-settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

.skip-settings-dialog {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 480px;
  max-height: 90vh;
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: #666;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #e9ecef;
  color: #333;
}

.close-btn svg {
  width: 20px;
  height: 20px;
}

.dialog-content {
  padding: 24px;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 16px;
}

.setting-row:last-child {
  margin-bottom: 0;
}

.setting-label {
  flex: 1;
}

.setting-label span {
  font-size: 16px;
  font-weight: 500;
  color: #2c3e50;
  display: block;
  margin-bottom: 4px;
}

.setting-hint {
  font-size: 13px;
  color: #6c757d;
  line-height: 1.4;
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.seconds-input {
  width: 80px;
}

.unit {
  font-size: 14px;
  color: #6c757d;
  font-weight: 500;
}

.setting-hint-global {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #e8f5e8;
  border-radius: 8px;
  font-size: 13px;
  color: #2d5a2d;
  margin-top: 20px;
}

.setting-hint-global svg {
  width: 16px;
  height: 16px;
  color: #28a745;
  flex-shrink: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .skip-settings-dialog {
    width: 95%;
    margin: 20px;
  }
  
  .dialog-header {
    padding: 16px 20px;
  }
  
  .dialog-header h3 {
    font-size: 16px;
  }
  
  .dialog-content {
    padding: 20px;
  }
  
  .setting-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .setting-control {
    width: 100%;
    justify-content: flex-start;
  }
  
  .dialog-footer {
    padding: 12px 20px;
  }
}

@media (max-width: 480px) {
  .skip-settings-dialog {
    width: 100%;
    height: 100%;
    max-height: 100vh;
    border-radius: 0;
    margin: 0;
  }
  
  .dialog-header {
    padding: 12px 16px;
  }
  
  .dialog-content {
    padding: 16px;
  }
  
  .dialog-footer {
    padding: 12px 16px;
  }
  
  .setting-row {
    margin-bottom: 20px;
  }
}
</style>