<template>
  <div class="footer-content">
    <!-- 翻页统计信息 -->
    <div v-if="paginationStore.shouldShow" class="pagination-stats">
      <span class="stats-text">{{ paginationStore.statsText }}</span>
    </div>
    <!-- 默认底部工具条内容 -->
    <div v-else class="default-footer">
      <div class="footer-info">
        <!-- 版权信息 -->
        <div class="copyright-section">
          <icon-copyright class="footer-icon" />
          <span class="copyright-text">{{ currentYear }} DrPlayer</span>
        </div>
        
        <!-- 分隔符 -->
        <div class="separator">|</div>
        
        <!-- 项目地址 -->
        <div class="project-section">
          <icon-github class="footer-icon" />
          <a 
            href="https://github.com/hjdhnx/DrPlayer" 
            target="_blank" 
            class="project-link"
            @click="handleProjectClick"
          >
            GitHub
          </a>
        </div>
        
        <!-- 分隔符 -->
        <div class="separator">|</div>
        
        <!-- 备案号 -->
        <div class="license-section">
          <icon-safe class="footer-icon" />
          <span class="license-text">hjdhnx</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Message } from '@arco-design/web-vue';
import { 
  IconCopyright, 
  IconGithub, 
  IconSafe 
} from '@arco-design/web-vue/es/icon';
import { usePaginationStore } from '@/stores/paginationStore';

// 使用翻页统计store
const paginationStore = usePaginationStore();

// 获取当前年份
const currentYear = computed(() => new Date().getFullYear());

// 处理项目链接点击
const handleProjectClick = () => {
  Message.success('正在跳转到项目主页...');
};
</script>

<style scoped>
.footer-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.stats-text {
  font-size: 12px;
  color: var(--dp-text-tertiary);
  font-weight: 600;
}

.default-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  color: var(--dp-text-tertiary);
  font-size: 12px;
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  border-radius: 999px;
  color: var(--dp-text-tertiary);
  transition: color 0.2s ease, background 0.2s ease;
}

.footer-info:hover {
  color: var(--dp-text-secondary);
  background: var(--dp-bg-hover);
}

.copyright-section,
.project-section,
.license-section {
  display: flex;
  align-items: center;
  gap: 4px;
}

.footer-icon {
  font-size: 13px;
  color: currentColor;
}

.copyright-text,
.license-text {
  font-size: 12px;
  color: currentColor;
  font-weight: 500;
}

.project-link {
  font-size: 12px;
  color: var(--dp-primary-readable);
  text-decoration: none;
  font-weight: 600;
}

.project-link:hover {
  color: var(--color-primary-7);
}

.separator {
  color: var(--dp-border);
  font-size: 12px;
}

@media (max-width: 768px) {
  .footer-info {
    gap: 8px;
    padding: 0 12px;
    font-size: 12px;
  }

  .footer-icon {
    font-size: 12px;
  }

  .copyright-text,
  .license-text,
  .project-link {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .footer-info {
    flex-direction: column;
    gap: 4px;
    padding: 8px 12px;
  }

  .separator {
    display: none;
  }

  .copyright-section,
  .project-section,
  .license-section {
    gap: 3px;
  }
}
</style>
