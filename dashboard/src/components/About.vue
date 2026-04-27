<template>
  <!-- About组件 -->
  <a-modal
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    title="关于 DrPlayer"
    :width="600"
    :mask-closable="true"
    :footer="false"
    :body-style="{ 
      padding: '0', 
      maxHeight: '60vh', 
      overflow: 'hidden',
      borderRadius: '12px'
    }"
    :modal-style="{ borderRadius: '12px' }"
  >
    <div class="about-content">
      <!-- 项目标题和Logo -->
      <div class="about-header">
        <div class="about-logo">
          <icon-play-circle class="logo-icon" />
        </div>
        <div class="about-title-section">
          <h1 class="about-title">DrPlayer</h1>
          <p class="about-subtitle">新一代智能视频播放器</p>
          <div class="about-version">
            <span class="version-badge">{{ displayVersion }}</span>
          </div>
        </div>
      </div>
      
      <!-- 滚动内容区域 -->
      <div class="about-scroll-content">
        <!-- 项目描述 -->
        <div class="about-section">
          <h3 class="section-title">
            <icon-info-circle class="section-icon" />
            项目简介
          </h3>
          <p class="section-content">
            DrPlayer 是一款功能强大、智能化的现代视频播放器，支持多格式播放、智能跳过、直播功能等特色功能。
            基于 Vue 3 + Vite 的现代化架构，提供流畅的用户体验和丰富的功能特性。
          </p>
        </div>
        
        <!-- 核心特色 -->
        <div class="about-section">
          <h3 class="section-title">
            <icon-star class="section-icon" />
            核心特色
          </h3>
          <div class="features-grid">
            <div class="feature-item">
              <icon-play-arrow class="feature-icon" />
              <div class="feature-text">
                <h4>双播放器引擎</h4>
                <p>原生HTML5播放器 + ArtPlayer高级播放器</p>
              </div>
            </div>
            <div class="feature-item">
              <icon-safe class="feature-icon" />
              <div class="feature-text">
                <h4>CSP绕过技术</h4>
                <p>智能绕过内容安全策略限制</p>
              </div>
            </div>
            <div class="feature-item">
              <icon-live-broadcast class="feature-icon" />
              <div class="feature-text">
                <h4>丰富直播功能</h4>
                <p>内置海量直播源，支持多种格式</p>
              </div>
            </div>
            <div class="feature-item">
              <icon-settings class="feature-icon" />
              <div class="feature-text">
                <h4>高度可配置</h4>
                <p>丰富的设置选项，满足不同需求</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 技术栈 -->
        <div class="about-section">
          <h3 class="section-title">
            <icon-bug class="section-icon" />
            技术栈
          </h3>
          <div class="tech-stack">
            <div class="tech-category">
              <h4>前端框架</h4>
              <div class="tech-tags">
                <span class="tech-tag">Vue 3</span>
                <span class="tech-tag">Vite</span>
                <span class="tech-tag">Pinia</span>
                <span class="tech-tag">Vue Router</span>
              </div>
            </div>
            <div class="tech-category">
              <h4>UI组件库</h4>
              <div class="tech-tags">
                <span class="tech-tag">Arco Design Vue</span>
                <span class="tech-tag">ECharts</span>
              </div>
            </div>
            <div class="tech-category">
              <h4>播放器技术</h4>
              <div class="tech-tags">
                <span class="tech-tag">ArtPlayer</span>
                <span class="tech-tag">HLS.js</span>
                <span class="tech-tag">FLV.js</span>
                <span class="tech-tag">Shaka Player</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 许可证和致谢 -->
        <div class="about-section">
          <h3 class="section-title">
            <icon-question-circle class="section-icon" />
            许可证与致谢
          </h3>
          <p class="section-content">
            本项目基于 MIT 许可证开源。感谢 Vue.js、ArtPlayer、Arco Design、Vite 等优秀开源项目的支持。
          </p>
          <div class="links-section">
            <a href="https://drplayer.playdreamer.cn/" target="_blank" class="about-link">
              <icon-home class="link-icon" />
              项目主页
            </a>
            <a href="https://hipy.playdreamer.cn/" target="_blank" class="about-link">
              <icon-link class="link-icon" />
              文档站点
            </a>
            <a href="https://github.com/hjdhnx/DrPlayer/issues" target="_blank" class="about-link">
              <icon-bug class="link-icon" />
              问题反馈
            </a>
          </div>
        </div>
        
        <!-- 版权信息 -->
        <div class="about-footer">
          <p>Made with ❤️ by DrPlayer Team</p>
          <p>© 2024 DrPlayer. All rights reserved.</p>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { computed } from 'vue'
import { 
  IconPlayCircle,
  IconInfoCircle,
  IconStar,
  IconPlayArrow,
  IconSafe,
  IconLiveBroadcast,
  IconSettings,
  IconBug,
  IconQuestionCircle,
  IconHome,
  IconLink
} from '@arco-design/web-vue/es/icon'

// 定义props
defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

// 定义emits
defineEmits(['update:visible'])

// 获取应用版本号
const appVersion = computed(() => __APP_VERSION__ || '1.0.5 20260427')

const displayVersion = computed(() => {
  const version = appVersion.value || '1.0.5 20260427'
  return version.startsWith('v') ? version : `v${version}`
})
</script>

<style scoped>
/* 关于弹窗样式 */
.about-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.about-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border-radius: 12px 12px 0 0;
}

.about-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.logo-icon {
  font-size: 32px;
  color: white;
}

.about-title-section {
  flex: 1;
}

.about-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: white;
}

.about-subtitle {
  font-size: 16px;
  margin: 0 0 12px 0;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 400;
}

.about-version {
  display: flex;
  align-items: center;
  gap: 8px;
}

.version-badge {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  backdrop-filter: blur(10px);
}

.about-scroll-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  max-height: calc(60vh - 140px);
}

.about-section {
  margin-bottom: 32px;
}

.about-section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 16px 0;
}

.section-icon {
  font-size: 20px;
  color: #6366f1;
}

.section-content {
  font-size: 14px;
  line-height: 1.6;
  color: #64748b;
  margin: 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: rgba(99, 102, 241, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(99, 102, 241, 0.1);
}

.feature-icon {
  font-size: 20px;
  color: #6366f1;
  margin-top: 2px;
  flex-shrink: 0;
}

.feature-text h4 {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.feature-text p {
  font-size: 13px;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

.tech-stack {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 16px;
}

.tech-category h4 {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tech-tag {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  color: #475569;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.links-section {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
}

.about-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
  text-decoration: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.about-link:hover {
  background: rgba(99, 102, 241, 0.15);
  transform: translateY(-1px);
}

.link-icon {
  font-size: 16px;
}

.about-footer {
  text-align: center;
  padding: 20px 0;
  border-top: 1px solid #e2e8f0;
  margin-top: 24px;
}

.about-footer p {
  font-size: 13px;
  color: #64748b;
  margin: 4px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .about-header {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .links-section {
    flex-direction: column;
  }
  
  .about-link {
    justify-content: center;
  }
}
</style>