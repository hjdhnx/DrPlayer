<template>
  <!-- TAG选择弹窗 -->
  <a-modal
      :visible="showTagDialog"
      :title="`TAG [${tagList.length}]`"
      :width="dialogWidth"
      class="tag_dialog"
      append-to-body
      @cancel="showTagDialog = false"
  >
    <div class="tag-container">
      <a-button 
          type="secondary"
          class="tag-item" 
          @click="handleTagClick('全部')"
      >
        全部
      </a-button>
      <a-button 
          v-for="(tag, index) in tagList" 
          :key="index"
          type="secondary" 
          class="tag-item" 
          @click="handleTagClick(tag)"
      >
        {{ tag }}
      </a-button>
    </div>
  </a-modal>

  <a-modal
      :visible="visible"
      :title="title"
      :width="dialogWidth"
      class="change_rule_dialog"
      append-to-body
      :on-before-cancel="handleConfirmClear"
  >
    <!-- 搜索框区域 -->
    <div class="search-section">
      <div class="search-row">
        <a-input
            v-model="siteFilter"
            placeholder="搜索数据源名称..."
            class="site_filter_input"
            allow-clear
        >
          <template #prefix>
            <icon-search />
          </template>
        </a-input>
        <a-button 
            type="primary" 
            status="success" 
            class="tag-button"
            @click="showTagDialog = true"
        >
          TAG
        </a-button>
      </div>
      <div class="source-count">
        共 {{ filteredSites.length }} 个可用数据源
      </div>
    </div>

    <!-- 数据源列表区域 -->
    <div class="sources-section">
      <div v-if="filteredSites.length === 0" class="empty-state">
        <icon-empty />
        <p>未找到匹配的数据源</p>
      </div>
      <div v-else class="button-container">
        <div
            v-for="(site, index) in filteredSites"
            :key="site.key || index"
            :ref="site.key === currentSiteKey ? 'currentSourceRef' : null"
            class="btn-item"
            :class="{ 
              'selected': form.new_site.key === site.key,
              'current-source': site.key === currentSiteKey 
            }"
        >
          <a-button
              type="primary"
              :status="form.new_site.key === site.key ? 'success' : 'primary'"
              size="medium"
              @click="handleChangeRule(site)"
              class="source-button"
              :class="{ 'current-source-button': site.key === currentSiteKey }"
          >
            <div class="source-info">
              <div class="source-name">{{ site.name }}</div>
              <div v-if="site.key === currentSiteKey" class="current-icon">
                <icon-check-circle-fill />
              </div>
            </div>
          </a-button>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-left">
          <a-button type="outline" status="danger" @click="handleConfirmClear">
            <icon-refresh />
            清除缓存
          </a-button>
        </div>
        <div class="footer-right">
          <a-button @click="handleCancel">取消</a-button>
          <a-button 
            type="primary" 
            @click="handleConfirmChange"
            :disabled="!form.new_site.key"
          >
            确认换源
          </a-button>
        </div>
      </div>
    </template>
  </a-modal>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue';
import { IconSearch, IconEmpty, IconRefresh, IconCheckCircleFill } from '@arco-design/web-vue/es/icon';

const props = defineProps({
  visible: Boolean,
  title: String,
  sites: Array,
  currentSiteKey: String,
});
const emit = defineEmits(['update:visible', 'confirm-clear', 'confirm-change', 'change-rule']);

const siteFilter = ref('');
const form = ref({ new_site: {} });
const currentSourceRef = ref(null);
const showTagDialog = ref(false);

// 从源名称中提取TAG
const extractTag = (name) => {
  const match = name.match(/\[(.*?)\]/);
  return match ? match[1] : null;
};

// 特殊TAG映射
const specialTags = {
  'ds': '(DS)',
  'hipy': '(hipy)',
  'cat': '(cat)'
};

// 获取所有唯一的TAG
const tagList = computed(() => {
  // 从源名称中提取的TAG
  const tags = props.sites
    .filter(site => site.type === 4)
    .map(site => extractTag(site.name))
    .filter(tag => tag !== null);
  
  // 去重后的提取TAG
  const uniqueTags = [...new Set(tags)];
  
  // 添加特殊固定TAG
  return [...uniqueTags, 'ds', 'hipy', 'cat'];
});

// 处理TAG点击
const handleTagClick = (tag) => {
  if (tag === '全部') {
    siteFilter.value = '';
  } else if (specialTags[tag]) {
    // 特殊TAG使用对应的格式
    siteFilter.value = specialTags[tag];
  } else {
    // 普通TAG使用方括号格式
    siteFilter.value = `[${tag}]`;
  }
  showTagDialog.value = false;
};

const filteredSites = computed(() => {
  const inputLower = siteFilter.value.toLowerCase();
  return props.sites
    .filter(site => site.type === 4) // 只显示 type 为 4 的数据源
    .filter(site => site.name.toLowerCase().includes(inputLower));
});

const dialogWidth = computed(() => (window.innerWidth < 768 ? '95%' : '700px'));

const handleChangeRule = (site) => {
  form.value.new_site = site;
  emit('change-rule', site);
};

const handleConfirmClear = () => {
  emit('confirm-clear');
  emit('update:visible', false);
};

const handleConfirmChange = () => {
  if (form.value.new_site.key) {
    emit('confirm-change', form.value.new_site);
    emit('update:visible', false);
  }
};

const handleCancel = () => {
  emit('update:visible', false);
};

// 自动滚动到当前源
const scrollToCurrentSource = () => {
  nextTick(() => {
    if (currentSourceRef.value && currentSourceRef.value.length > 0) {
      const currentElement = currentSourceRef.value[0];
      if (currentElement) {
        currentElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
    }
  });
};

// 监听弹窗显示状态，当弹窗打开时自动滚动到当前源
watch(() => props.visible, (newVisible) => {
  if (newVisible && props.currentSiteKey) {
    // 延迟执行，确保DOM已渲染
    setTimeout(() => {
      scrollToCurrentSource();
    }, 100);
  }
});

// 监听搜索结果变化，只在搜索时自动滚动到当前源（不在手动切换源时触发）
watch(filteredSites, () => {
  // 只有在搜索过滤时才自动滚动，通过检查搜索框内容来判断
  if (props.visible && props.currentSiteKey && siteFilter.value.trim() !== '') {
    const hasCurrentSource = filteredSites.value.some(site => site.key === props.currentSiteKey);
    if (hasCurrentSource) {
      setTimeout(() => {
        scrollToCurrentSource();
      }, 50);
    }
  }
});
</script>

<style>
.change_rule_dialog .arco-modal-body {
  padding: 20px !important;
}

.change_rule_dialog .arco-modal-header {
  border-bottom: 1px solid var(--color-border-2);
  padding: 16px 20px;
}

.change_rule_dialog .arco-modal-footer {
  border-top: 1px solid var(--color-border-2);
  padding: 16px 20px;
}
</style>

<style scoped>
/* 搜索区域样式 */
.search-section {
  margin-bottom: 16px;
}

.search-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.site_filter_input {
  flex: 1;
}

.tag-button {
  min-width: 60px;
}

.source-count {
  font-size: 13px;
  color: var(--color-text-3);
  text-align: center;
}

/* 数据源列表区域样式 */
.sources-section {
  min-height: 180px;
  max-height: 400px;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 180px;
  color: var(--color-text-3);
}

.empty-state p {
  margin-top: 8px;
  font-size: 13px;
}

.button-container {
  display: grid;
  gap: 8px;
  padding: 4px 0;
  /* 桌面端：4列 */
  grid-template-columns: repeat(4, 1fr);
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.btn-item {
  position: relative;
}

.btn-item.selected {
  transform: scale(1.02);
  transition: transform 0.2s ease;
}

.source-button {
  width: 100%;
  min-height: 44px;
  max-height: 60px;
  border-radius: 6px;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  padding: 6px 8px;
  box-sizing: border-box;
  min-width: 0;
}

.source-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.source-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  position: relative;
  padding: 2px;
}

.source-name {
  font-weight: 500;
  font-size: 12px;
  text-align: center;
  line-height: 1.3;
  max-width: 100%;
  /* 支持最多两行文本 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
  hyphens: auto;
}

/* 当前源按钮特殊样式 */
.current-source-button {
  background: #52c41a !important;
  border-color: #52c41a !important;
  color: #ffffff !important;
  box-shadow: 0 2px 8px rgba(82, 196, 26, 0.3) !important;
}

.current-source-button:hover {
  background: #389e0d !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.4) !important;
}

.current-icon {
  position: absolute;
  top: -6px;
  left: -6px;
  background: #52c41a;
  color: white;
  font-size: 12px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

/* 底部按钮区域样式 */
.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.footer-left {
  display: flex;
}

.footer-right {
  display: flex;
  gap: 8px;
}

/* 移动端响应式设计 */
@media (max-width: 1200px) {
  .button-container {
    /* 中等屏幕：3列 */
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .button-container {
    /* 平板：3列，间距更小 */
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
  
  .source-button {
    min-height: 40px;
    max-height: 56px;
    padding: 4px 6px;
  }
  
  .source-name {
    font-size: 11px;
    line-height: 1.2;
  }
  
  .current-icon {
    font-size: 10px;
    width: 16px;
    height: 16px;
    top: -4px;
    left: -4px;
  }
  
  .dialog-footer {
    flex-direction: column;
    gap: 8px;
    margin-top: 12px;
  }
  
  .footer-right {
    width: 100%;
    justify-content: flex-end;
  }
  
  .search-section {
    margin-bottom: 12px;
  }
  
  .sources-section {
    min-height: 160px;
    max-height: 350px;
  }
}

@media (max-width: 480px) {
  .button-container {
    /* 手机端：4列，最大化利用空间 */
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
  }
  
  .source-button {
    min-height: 36px;
    max-height: 50px;
    padding: 3px 4px;
    border-radius: 4px;
  }
  
  .source-name {
    font-size: 10px;
    line-height: 1.1;
  }
  
  .current-icon {
    font-size: 8px;
    width: 14px;
    height: 14px;
    top: -3px;
    left: -3px;
  }
  
  .sources-section {
    min-height: 140px;
    max-height: 300px;
  }
  
  .empty-state {
    height: 140px;
  }
  
  .empty-state p {
    font-size: 12px;
  }
}

@media (max-width: 360px) {
  .button-container {
    /* 小屏手机：5列，最紧凑布局 */
    grid-template-columns: repeat(5, 1fr);
    gap: 3px;
  }
  
  .source-button {
    min-height: 32px;
    max-height: 44px;
    padding: 2px 3px;
  }
  
  .source-name {
    font-size: 9px;
  }
  
  .current-icon {
    font-size: 6px;
    width: 12px;
    height: 12px;
    top: -2px;
    left: -2px;
  }
}

/* TAG弹窗样式 */
.tag_dialog .arco-modal-body {
  padding: 16px !important;
}

.tag-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.tag-item {
  margin: 4px;
  border-radius: 4px;
}

/* 滚动条样式 */
.sources-section::-webkit-scrollbar,
.tag-container::-webkit-scrollbar {
  width: 4px;
}

.sources-section::-webkit-scrollbar-track,
.tag-container::-webkit-scrollbar-track {
  background: var(--color-bg-2);
  border-radius: 2px;
}

.sources-section::-webkit-scrollbar-thumb,
.tag-container::-webkit-scrollbar-thumb {
  background: var(--color-border-3);
  border-radius: 2px;
}

.sources-section::-webkit-scrollbar-thumb:hover,
.tag-container::-webkit-scrollbar-thumb:hover {
  background: var(--color-border-4);
}
</style>
