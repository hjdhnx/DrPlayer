<template>
  <div class="player-header">
    <h3>正在播放: {{ episodeName }}</h3>
    <div class="player-controls">
      <div class="compact-button-group">
        <!-- 自动连播按钮 -->
        <div 
          v-if="showAutoNext && episodes.length > 1"
          class="compact-btn" 
          @click="$emit('toggle-auto-next')" 
          :class="{ active: autoNextEnabled }"
        >
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5v14l11-7z" fill="currentColor"/>
          </svg>
          <span class="btn-text">自动连播</span>
        </div>
        
        <!-- 倒计时按钮 -->
        <div 
          v-if="showCountdown && episodes.length > 1"
          class="compact-btn" 
          @click="$emit('toggle-countdown')" 
          :class="{ active: countdownEnabled }"
        >
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <polyline points="12,6 12,12 16,14" stroke="currentColor" stroke-width="2"/>
          </svg>
          <span class="btn-text">倒计时</span>
        </div>
        
        <!-- 播放器切换选择器 -->
        <div class="compact-btn selector-btn">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" stroke="currentColor" stroke-width="2"/>
          </svg>
          <a-select
            :model-value="playerType"
            @change="$emit('player-change', $event)"
            class="compact-select"
            size="small"
          >
            <a-option value="default">默认播放器</a-option>
            <a-option value="artplayer">ArtPlayer</a-option>
          </a-select>
        </div>
        
        <!-- 片头片尾设置按钮 -->
        <div 
          class="compact-btn" 
          :class="{ active: skipEnabled }" 
          @click="$emit('open-skip-settings')"
        >
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 4l10 8-10 8V4z" fill="currentColor"/>
            <path d="M19 5v14" stroke="currentColor" stroke-width="2"/>
            <path d="M3 12h2" stroke="currentColor" stroke-width="2"/>
            <path d="M19 12h2" stroke="currentColor" stroke-width="2"/>
          </svg>
          <span class="btn-text">片头片尾</span>
        </div>
        
        <!-- 关闭按钮 -->
        <div class="compact-btn close-btn" @click="$emit('close')">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2"/>
          </svg>
          <span class="btn-text">关闭</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Props
const props = defineProps({
  episodeName: {
    type: String,
    default: '未知选集'
  },
  playerType: {
    type: String,
    default: 'default'
  },
  episodes: {
    type: Array,
    default: () => []
  },
  autoNextEnabled: {
    type: Boolean,
    default: false
  },
  countdownEnabled: {
    type: Boolean,
    default: false
  },
  skipEnabled: {
    type: Boolean,
    default: false
  },
  showAutoNext: {
    type: Boolean,
    default: true
  },
  showCountdown: {
    type: Boolean,
    default: true
  }
})

// Emits
defineEmits([
  'toggle-auto-next',
  'toggle-countdown', 
  'player-change',
  'open-skip-settings',
  'close'
])
</script>

<style scoped>
.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding: 0 4px;
}

.player-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 12px;
}

.player-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.compact-button-group {
  display: flex;
  align-items: center;
  gap: 2px;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 2px;
  border: 1px solid #e9ecef;
}

.compact-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
  border: none;
  font-size: 12px;
  font-weight: 500;
  color: #495057;
  min-height: 28px;
  position: relative;
}

.compact-btn:hover {
  background: #e9ecef;
  color: #212529;
  transform: translateY(-1px);
}

.compact-btn.active {
  background: #23ade5;
  color: white;
  box-shadow: 0 2px 8px rgba(35, 173, 229, 0.3);
}

.compact-btn.active:hover {
  background: #1e90ff;
}

.compact-btn.close-btn {
  color: #dc3545;
}

.compact-btn.close-btn:hover {
  background: #f8d7da;
  color: #721c24;
}

.btn-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.btn-text {
  font-size: 11px;
  white-space: nowrap;
}

.selector-btn {
  position: relative;
  padding: 0;
  overflow: hidden;
}

.compact-select {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  min-width: 120px;
}

.compact-select :deep(.arco-select-view) {
  border: none !important;
  background: transparent !important;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 500;
}

.compact-select :deep(.arco-select-view-suffix) {
  color: currentColor;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .player-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .player-header h3 {
    margin-right: 0;
    font-size: 15px;
  }
  
  .compact-button-group {
    flex-wrap: wrap;
    width: 100%;
    justify-content: center;
  }
  
  .compact-btn {
    flex: 1;
    min-width: 80px;
    justify-content: center;
  }
  
  .btn-text {
    display: none;
  }
  
  .selector-btn {
    flex: 2;
  }
  
  .compact-select {
    min-width: 100px;
  }
}

@media (max-width: 480px) {
  .compact-btn {
    padding: 4px 6px;
    min-height: 26px;
  }
  
  .btn-icon {
    width: 12px;
    height: 12px;
  }
}
</style>