<template>
  <div class="category-nav-container">
    <div class="category-nav-wrapper" ref="navWrapperRef">
      <!-- 分类tabs -->
      <!-- 特殊分类显示 -->
      <div v-if="specialCategoryState.isActive" class="special-category-header">
        <div class="special-category-title">
          <span class="category-name">{{ specialCategoryState.categoryData?.type_name || '特殊分类' }}</span>
          <span class="category-type">（源内搜索）</span>
        </div>
      </div>
      
      <!-- 正常分类tabs -->
      <a-tabs
         v-else
         v-model:active-key="activeKey"
         class="category-tabs"
         type="line"
         position="top"
         :editable="false"
         @change="handleTabChange"
       >
        <a-tab-pane v-if="hasRecommendVideos" key="recommendTuijian404">
          <template #title>
            <span>推荐</span>
          </template>
        </a-tab-pane>
        <a-tab-pane 
           v-for="item in classList?.class || []" 
           :key="item.type_id"
         >
          <template #title>
             <div 
               class="category-tab-title"
               @click.stop="item.type_id === activeKey && hasFiltersForCategory(item.type_id) ? handleCategoryClick(item.type_id) : handleTabChange(item.type_id)"
             >
               <span class="category-name">{{ item.type_name }}</span>
               <icon-filter 
                 v-if="item.type_id === activeKey && hasFiltersForCategory(item.type_id)" 
                 class="filter-icon"
                 :class="{ 'filter-icon-active': filterVisible[item.type_id] }"
               />
             </div>
           </template>
        </a-tab-pane>
      </a-tabs>
      
      <!-- 特殊分类关闭按钮 -->
      <div v-if="specialCategoryState.isActive" class="special-category-close" @click="handleCloseSpecialCategory">
        <icon-close />
        <span>返回</span>
      </div>
      
      <!-- 分类管理按钮 -->
      <button v-else class="category-manage" type="button" @click="openCategoryModal" title="展开全部分类" aria-label="展开全部分类">
        <icon-apps />
        <span class="category-manage-label">全部</span>
      </button>
    </div>

    <!-- 筛选区域 -->
    <FilterSection
      v-if="getFiltersForCategory(activeKey) && props.filterVisible[activeKey]"
      :filters="getFiltersForCategory(activeKey)"
      :selectedFilters="selectedFilters[activeKey] || {}"
      :visible="true"
      @toggle-filter="handleToggleFilter"
      @reset-filters="handleResetFilters"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { IconApps, IconFilter, IconClose } from '@arco-design/web-vue/es/icon';
import FilterSection from './FilterSection.vue';

const props = defineProps({
  classList: {
    type: Object,
    default: () => ({})
  },
  trigger: {
    type: String,
    default: 'click'
  },
  hasRecommendVideos: {
    type: Boolean,
    default: false
  },
  activeKey: {
    type: String,
    default: ''
  },
  filters: {
    type: Object,
    default: () => ({})
  },
  selectedFilters: {
    type: Object,
    default: () => ({})
  },
  // 筛选展开状态
  filterVisible: {
    type: Object,
    default: () => ({})
  },
  // 特殊分类状态
  specialCategoryState: {
    type: Object,
    default: () => ({
      isActive: false,
      categoryData: null,
      originalClassList: null,
      originalRecommendVideos: null
    })
  }
});

const emit = defineEmits(['tab-change', 'open-category-modal', 'toggle-filter', 'reset-filters', 'close-special-category', 'filter-visible-change']);

// 计算默认的activeKey
const getDefaultActiveKey = () => {
  if (props.hasRecommendVideos) {
    return "recommendTuijian404";
  }
  if (props.classList?.class && props.classList.class.length > 0) {
    return props.classList.class[0].type_id;
  }
  return "recommendTuijian404";
};

// 响应式数据
const activeKey = ref(props.activeKey || getDefaultActiveKey());
const navWrapperRef = ref(null);
let wheelHandler = null;
const isInitialized = ref(false);

// 监听props变化，更新activeKey
watch(() => [props.hasRecommendVideos, props.classList, props.activeKey], () => {
  const newActiveKey = props.activeKey || getDefaultActiveKey();
  if (activeKey.value !== newActiveKey) {
    activeKey.value = newActiveKey;
    // 只有当activeKey不是从外部传入时才触发change事件
    if (!props.activeKey) {
      handleTabChange(newActiveKey);
    }
  }
}, { immediate: true });

// 当分类切换时，通知父组件隐藏之前分类的筛选条件
// 注意：不在初始化时触发，避免干扰状态恢复
watch(activeKey, (newKey, oldKey) => {
  if (isInitialized.value && oldKey && oldKey !== newKey && props.filterVisible[oldKey]) {
    emit('filter-visible-change', { categoryId: oldKey, visible: false });
  }
}, { flush: 'post' });

const handleTabChange = (key) => {
  activeKey.value = key;
  emit('tab-change', key);
};

// 处理分类点击（显示/隐藏筛选）
const handleCategoryClick = (categoryId) => {
  if (hasFiltersForCategory(categoryId)) {
    const newVisible = !props.filterVisible[categoryId];
    // 通知父组件筛选展开状态变化
    emit('filter-visible-change', { categoryId, visible: newVisible });
  }
};

// 检查分类是否有筛选条件
const hasFiltersForCategory = (categoryId) => {
  const filters = props.filters[categoryId];
  return filters && Object.keys(filters).length > 0;
};

// 获取分类的筛选条件
const getFiltersForCategory = (categoryId) => {
  return props.filters[categoryId] || null;
};

// 处理筛选切换
const handleToggleFilter = (data) => {
  emit('toggle-filter', data);
};

// 处理重置筛选
const handleResetFilters = () => {
  emit('reset-filters');
};

const openCategoryModal = () => {
  emit('open-category-modal');
};

// 处理关闭特殊分类
const handleCloseSpecialCategory = () => {
  console.log('关闭特殊分类');
  emit('close-special-category');
};

onMounted(() => {
  const wrapper = navWrapperRef.value;
  if (!wrapper) return;
  const list = wrapper.querySelector('.arco-tabs-nav-tab-list');
  if (!list) return;
  // 将垂直滚轮转换为水平滚动，提升可用性
  wheelHandler = (ev) => {
    // 仅当垂直滚动明显时处理
    if (Math.abs(ev.deltaY) > Math.abs(ev.deltaX)) {
      list.scrollLeft += ev.deltaY;
      ev.preventDefault();
    }
  };
  list.addEventListener('wheel', wheelHandler, { passive: false });
  
  // 设置初始化完成标志，允许后续的筛选状态重置
  setTimeout(() => {
    isInitialized.value = true;
  }, 100);
});

onBeforeUnmount(() => {
  const wrapper = navWrapperRef.value;
  const list = wrapper?.querySelector?.('.arco-tabs-nav-tab-list');
  if (list && wheelHandler) {
    list.removeEventListener('wheel', wheelHandler);
  }
});
</script>

<style scoped>
.category-nav-container {
  margin-bottom: 16px;
}

.category-nav-wrapper {
  display: flex;
  align-items: center;
  position: relative;
  background: var(--dp-bg-surface);
  border: 1px solid var(--dp-border-subtle);
  border-radius: var(--dp-radius-xl);
  padding: 10px 12px;
  box-shadow: var(--dp-shadow-sm);
  z-index: 2;
}

.category-nav-container :deep(.filter-section) {
  background: var(--dp-bg-surface);
  border-radius: var(--dp-radius-xl);
  border: 1px solid var(--dp-border-subtle);
  box-shadow: var(--dp-shadow-sm);
  margin-top: 10px;
  z-index: 1;
}

.category-tabs {
  flex: 1;
  overflow: hidden;
}

.category-tabs :deep(.arco-tabs-nav) {
  margin-bottom: 0;
  border-bottom: none;
}

.category-tabs :deep(.arco-tabs-nav-tab) {
  padding: 0;
  margin-right: 8px;
  border-radius: 999px;
  transition: all 0.2s ease;
  color: var(--dp-text-secondary);
  background: transparent;
  border: none;
  font-weight: 700;
}

.category-tabs :deep(.arco-tabs-nav-tab:hover) {
  color: #165dff;
}

/* 使用更强的选择器来覆盖Arco Design默认样式 */
.category-tabs :deep(.arco-tabs-nav-tab.arco-tabs-nav-tab-active),
.category-tabs :deep(.arco-tabs-nav-tab.arco-tabs-nav-tab-active:hover),
.category-tabs :deep(.arco-tabs-nav-tab.arco-tabs-nav-tab-active:focus),
.category-tabs :deep(.arco-tabs-nav-tab.arco-tabs-nav-tab-active.arco-tabs-tab-active),
.category-tabs :deep(.arco-tabs-nav-tab.arco-tabs-nav-tab-active.arco-tabs-tab-active:hover) {
  background-color: var(--dp-primary-readable) !important;
  background: var(--dp-primary-readable) !important;
  color: white !important;
  font-weight: 600 !important;
  border: none !important;
  border-color: transparent !important;
}

.category-tabs :deep(.arco-tabs-nav-tab.arco-tabs-nav-tab-active) .category-name,
.category-tabs :deep(.arco-tabs-nav-tab.arco-tabs-nav-tab-active:hover) .category-name,
.category-tabs :deep(.arco-tabs-nav-tab.arco-tabs-nav-tab-active:focus) .category-name,
.category-tabs :deep(.arco-tabs-nav-tab.arco-tabs-nav-tab-active.arco-tabs-tab-active) .category-name,
.category-tabs :deep(.arco-tabs-nav-tab.arco-tabs-nav-tab-active.arco-tabs-tab-active:hover) .category-name {
  color: white !important;
}

.category-tabs :deep(.arco-tabs-nav-tab.arco-tabs-nav-tab-active) .filter-icon,
.category-tabs :deep(.arco-tabs-nav-tab.arco-tabs-nav-tab-active:hover) .filter-icon,
.category-tabs :deep(.arco-tabs-nav-tab.arco-tabs-nav-tab-active:focus) .filter-icon,
.category-tabs :deep(.arco-tabs-nav-tab.arco-tabs-nav-tab-active.arco-tabs-tab-active) .filter-icon,
.category-tabs :deep(.arco-tabs-nav-tab.arco-tabs-nav-tab-active.arco-tabs-tab-active:hover) .filter-icon {
  color: white !important;
  opacity: 1 !important;
}

.category-tabs :deep(.arco-tabs-nav-tab.arco-tabs-nav-tab-active) .filter-icon:hover {
  background: rgba(255, 255, 255, 0.2);
}

.category-tabs :deep(.arco-tabs-nav-ink) {
  display: none;
}

.category-tab-title {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  transition: all 0.2s ease;
}

.category-tabs :deep(.arco-tabs-nav-tab-active) .category-tab-title {
  cursor: pointer;
}

.category-tabs :deep(.arco-tabs-nav-tab-active) .category-tab-title:hover {
  background: rgba(255, 255, 255, 0.1);
}

.category-name {
  cursor: pointer;
  flex: 1;
}

.filter-icon {
  font-size: 12px;
  transition: all 0.3s ease;
  opacity: 0.7;
  cursor: pointer;
  padding: 2px;
  border-radius: 2px;
  flex-shrink: 0;
}

/* 最终覆盖规则 - 使用最高优先级 */
.category-tabs :deep(.arco-tabs-nav-tab[class*="active"]) {
  background-color: var(--dp-primary-readable) !important;
  background: var(--dp-primary-readable) !important;
  color: white !important;
}

.category-tabs :deep(.arco-tabs-nav-tab[class*="active"] *) {
  color: white !important;
}

.filter-icon:hover {
  opacity: 1;
  background: rgba(22, 93, 255, 0.1);
}

.filter-icon-active {
  opacity: 1;
  color: #165dff;
}

.category-manage {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-width: 64px;
  height: 40px;
  padding: 0 12px;
  border: none;
  border-radius: 999px;
  background: rgba(22, 93, 255, 0.1);
  color: #165dff;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-left: 12px;
  font-size: 13px;
  font-weight: 700;
  align-self: flex-start;
  flex-shrink: 0;
}

.special-category-close {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 6px;
  background: rgba(245, 63, 63, 0.1);
  color: #f53f3f;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-left: 12px;
  font-size: 14px;
}

.special-category-close:hover {
  background: rgba(245, 63, 63, 0.2);
  transform: translateY(-1px);
}

.special-category-header {
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0 16px;
  background: rgba(22, 93, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(22, 93, 255, 0.1);
}

.special-category-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
}

.special-category-title .category-name {
  color: #165dff;
}

.special-category-title .category-type {
  color: #86909c;
  font-size: 14px;
  font-weight: 400;
}

.category-manage:hover {
  background: #165dff;
  color: white;
  transform: scale(1.05);
}

@media (min-width: 769px) {
  .category-nav-container {
    margin-bottom: 8px;
  }

  .category-nav-wrapper {
    padding: 7px 10px 7px 0;
    border-radius: 0 var(--dp-radius-lg) var(--dp-radius-lg) 0;
  }

  .category-nav-container :deep(.filter-section) {
    margin-top: 4px;
    border-left: none;
    border-radius: 0 var(--dp-radius-lg) var(--dp-radius-lg) 0;
  }

  .category-tabs :deep(.arco-tabs-nav),
  .category-tabs :deep(.arco-tabs-nav-tab),
  .category-tabs :deep(.arco-tabs-nav-tab-list) {
    height: 32px;
    min-height: 32px;
  }

  .category-tabs :deep(.arco-tabs-tab) {
    height: 32px;
    margin: 0 4px 0 0 !important;
    padding: 0 !important;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
  }

  .category-tabs :deep(.arco-tabs-tab-active),
  .category-tabs :deep(.arco-tabs-tab-active:hover),
  .category-tabs :deep(.arco-tabs-tab[class*="active"]) {
    background: var(--dp-primary-readable) !important;
    color: #fff !important;
  }

  .category-tabs :deep(.arco-tabs-tab-active *),
  .category-tabs :deep(.arco-tabs-tab[class*="active"] *) {
    color: #fff !important;
  }

  .category-tab-title {
    min-height: 30px;
    padding: 0 11px;
  }

  .category-manage {
    width: 32px;
    min-width: 32px;
    height: 32px;
    margin: 0 0 0 6px;
    padding: 0;
    border: 1px solid color-mix(in srgb, var(--dp-primary-readable) 22%, var(--dp-border));
    border-radius: var(--dp-radius-sm);
    background: color-mix(in srgb, var(--dp-primary-readable) 7%, var(--dp-bg-surface));
    color: var(--dp-primary-readable);
    box-shadow: none;
  }

  .category-manage-label {
    display: none;
  }

  .category-manage:hover {
    transform: none;
    background: var(--dp-primary-readable);
    color: #fff;
  }

  .category-manage :deep(svg) {
    width: 15px;
    height: 15px;
  }
}

@media (max-width: 768px) {
  .category-nav-container {
    margin: 0 0 10px;
  }

  .category-nav-wrapper {
    padding: 8px;
    border-radius: 18px;
    background: var(--dp-bg-surface);
    border: 1px solid var(--dp-border-subtle);
    box-shadow: var(--dp-shadow-sm);
    align-items: center;
  }

  .category-tabs {
    min-width: 0;
    flex: 1;
  }

  .category-tabs :deep(.arco-tabs-nav) {
    overflow: hidden;
  }

  .category-tabs :deep(.arco-tabs-nav-tab) {
    padding: 0;
  }

  .category-tabs :deep(.arco-tabs-nav-tab-list) {
    gap: 8px;
    overflow-x: auto;
    scrollbar-width: none;
    padding: 0;
  }

  .category-tabs :deep(.arco-tabs-nav-tab-list::-webkit-scrollbar) {
    display: none;
  }

  .category-tabs :deep(.arco-tabs-tab) {
    flex: 0 0 auto;
    height: 36px;
    margin: 0;
    padding: 0 13px;
    border-radius: 999px;
    background: var(--dp-bg-surface-muted) !important;
    border: 1px solid var(--dp-border-subtle) !important;
    color: var(--dp-text-secondary) !important;
    font-size: 13px;
    font-weight: 800;
    display: inline-flex;
    align-items: center;
  }

  .category-tabs :deep(.arco-tabs-tab-active),
  .category-tabs :deep(.arco-tabs-tab-active:hover),
  .category-tabs :deep(.arco-tabs-tab[class*="active"]) {
    background: var(--dp-primary-readable) !important;
    border-color: var(--dp-primary-readable) !important;
    color: #fff !important;
    box-shadow: 0 8px 18px rgba(22, 93, 255, 0.22);
  }

  .category-tabs :deep(.arco-tabs-tab-active *),
  .category-tabs :deep(.arco-tabs-tab[class*="active"] *) {
    color: #fff !important;
  }

  .category-tab-title {
    gap: 5px;
    padding: 0;
  }

  .category-name {
    white-space: nowrap;
  }

  .filter-icon {
    width: 16px;
    height: 16px;
    padding: 2px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.18);
    opacity: 1;
  }

  .category-manage {
    align-self: flex-start;
    height: 36px;
    min-width: 66px;
    margin: 0 0 0 8px;
    padding: 0 10px;
    border: 1px solid var(--dp-border-subtle);
    background: var(--dp-bg-hover);
    color: var(--dp-primary-readable);
    box-shadow: none;
  }

  .category-manage:hover {
    transform: none;
  }

  .category-nav-container :deep(.filter-section) {
    margin-top: 8px;
    border-radius: 18px;
    background: var(--dp-bg-surface);
    border: 1px solid var(--dp-border-subtle);
    box-shadow: var(--dp-shadow-sm);
  }

  .special-category-header {
    flex: 1;
    min-width: 0;
    height: 38px;
    padding: 0 12px;
    border-radius: 999px;
  }

  .special-category-title {
    min-width: 0;
    font-size: 14px;
  }

  .special-category-title .category-name {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .special-category-close {
    height: 36px;
    margin-left: 8px;
    border-radius: 999px;
    font-size: 13px;
  }
}
</style>