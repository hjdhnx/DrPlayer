<template>
  <div v-if="filters" class="filter-section">
    <transition name="collapse">
      <div v-show="visible" class="filter-content">
        <!-- 重置按钮放在最左上角 -->
        <div class="filter-header-with-reset">
          <a-button 
            v-if="hasActiveFilters"
            type="text" 
            size="small"
            @click="handleResetFilters"
            class="filter-reset-btn"
            :title="'重置所有筛选条件'"
          >
            <template #icon>
              <icon-refresh />
            </template>
          </a-button>
        </div>
        
        <div 
          v-for="filterGroup in filters" 
          :key="filterGroup.key"
          class="filter-group"
        >
          <div class="filter-group-row">
            <div class="filter-group-title">{{ filterGroup.name }}</div>
            <div
              class="filter-options-container"
              :class="getScrollClass(filterGroup.key)"
            >
              <button
                v-if="scrollStates[filterGroup.key]?.canScrollLeft || scrollStates[filterGroup.key]?.canScrollRight"
                class="filter-scroll-btn filter-scroll-left"
                type="button"
                :disabled="!scrollStates[filterGroup.key]?.canScrollLeft"
                @click="scrollFilterOptions(filterGroup.key, 'left')"
                aria-label="向左滚动筛选项"
              >
                <icon-left />
              </button>
              <div
                :ref="el => setOptionsRef(filterGroup.key, el)"
                class="filter-options"
                @scroll="updateScrollState(filterGroup.key)"
                @wheel="handleOptionsWheel(filterGroup.key, $event)"
              >
                <a-tag
                  v-for="option in filterGroup.value"
                  :key="option.v"
                  :color="isSelected(filterGroup.key, option.v) ? 'green' : ''"
                  :checkable="true"
                  :checked="isSelected(filterGroup.key, option.v)"
                  @check="handleToggleFilter(filterGroup.key, option.v, option.n)"
                  class="filter-option-tag"
                >
                  {{ option.n }}
                </a-tag>
              </div>
              <button
                v-if="scrollStates[filterGroup.key]?.canScrollLeft || scrollStates[filterGroup.key]?.canScrollRight"
                class="filter-scroll-btn filter-scroll-right"
                type="button"
                :disabled="!scrollStates[filterGroup.key]?.canScrollRight"
                @click="scrollFilterOptions(filterGroup.key, 'right')"
                aria-label="向右滚动筛选项"
              >
                <icon-right />
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive } from 'vue';
import { IconRefresh, IconLeft, IconRight } from '@arco-design/web-vue/es/icon';

const props = defineProps({
  filters: {
    type: Array,
    default: null
  },
  selectedFilters: {
    type: Object,
    default: () => ({})
  },
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:visible', 'update:selectedFilters', 'toggle-filter', 'reset-filters']);

const scrollStates = reactive({});
const optionsRefs = new Map();
let resizeObserver;

const ensureScrollState = (filterKey) => {
  if (!scrollStates[filterKey]) {
    scrollStates[filterKey] = {
      canScrollLeft: false,
      canScrollRight: false
    };
  }
  return scrollStates[filterKey];
};

const updateScrollState = (filterKey) => {
  const el = optionsRefs.get(filterKey);
  const state = ensureScrollState(filterKey);
  if (!el) {
    state.canScrollLeft = false;
    state.canScrollRight = false;
    return;
  }

  const maxScrollLeft = el.scrollWidth - el.clientWidth;
  state.canScrollLeft = el.scrollLeft > 1;
  state.canScrollRight = maxScrollLeft > 1 && el.scrollLeft < maxScrollLeft - 1;
};

const updateAllScrollStates = () => {
  nextTick(() => {
    optionsRefs.forEach((_, filterKey) => updateScrollState(filterKey));
  });
};

const setOptionsRef = (filterKey, el) => {
  const oldEl = optionsRefs.get(filterKey);
  if (oldEl && resizeObserver) {
    resizeObserver.unobserve(oldEl);
  }

  if (el) {
    optionsRefs.set(filterKey, el);
    ensureScrollState(filterKey);
    resizeObserver?.observe(el);
    nextTick(() => updateScrollState(filterKey));
  } else {
    optionsRefs.delete(filterKey);
    delete scrollStates[filterKey];
  }
};

const scrollFilterOptions = (filterKey, direction) => {
  const el = optionsRefs.get(filterKey);
  if (!el) return;

  el.scrollLeft += direction === 'left' ? -320 : 320;
  updateScrollState(filterKey);
};

const handleOptionsWheel = (filterKey, event) => {
  const el = optionsRefs.get(filterKey);
  if (!el || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
  const maxScrollLeft = el.scrollWidth - el.clientWidth;
  if (maxScrollLeft <= 1) return;
  event.preventDefault();
  el.scrollLeft += event.deltaY;
};

const getScrollClass = (filterKey) => ({
  'can-scroll-left': scrollStates[filterKey]?.canScrollLeft,
  'can-scroll-right': scrollStates[filterKey]?.canScrollRight
});

const hasActiveFilters = computed(() => {
  return props.selectedFilters && Object.keys(props.selectedFilters).length > 0;
});

const isSelected = (filterKey, filterValue) => {
  return props.selectedFilters?.[filterKey] === filterValue;
};

const toggleVisible = () => {
  emit('update:visible', !props.visible);
};

const handleToggleFilter = (filterKey, filterValue, filterName) => {
  emit('toggle-filter', { filterKey, filterValue, filterName });
};

const handleResetFilters = () => {
  emit('reset-filters');
};

onMounted(() => {
  resizeObserver = new ResizeObserver(updateAllScrollStates);
  updateAllScrollStates();
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  optionsRefs.clear();
});
</script>

<style scoped>
.filter-section {
  flex-shrink: 0;
  background: var(--dp-bg-surface);
  z-index: 99;
  margin-bottom: 12px;
}

.filter-header-left {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 8px 0 8px 0;
  margin-bottom: 4px;
}

.filter-toggle-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

.filter-header-with-reset {
  position: absolute;
  left: 16px;
  top: 4px;
  z-index: 10;
  width: 28px;
}

.filter-reset-btn {
  color: white;
  font-size: 12px;
  padding: 4px;
  height: 28px;
  width: 28px;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-primary-6);
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-reset-btn:hover {
  color: white;
  background-color: var(--color-primary-7);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.filter-content {
  padding: 12px 16px 12px 52px;
  position: relative;
}

.filter-group {
  margin-bottom: 8px;
  padding: 8px 12px;
  background: var(--dp-bg-surface-muted);
  border: 1px solid var(--dp-border-subtle);
  border-radius: 10px;
}

.filter-group:last-child {
  margin-bottom: 0;
}

.filter-group-row {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 28px;
}

.filter-group-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-2);
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 70px;
  text-align: left;
  background: var(--color-fill-3);
  padding: 4px 8px 4px 20px;
  border-radius: 4px;
  position: relative;
}

.filter-group-title::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  background: var(--color-primary-light-4);
  border-radius: 2px;
}

.filter-options-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.filter-scroll-btn {
  display: none;
}

.filter-options {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 2px 0;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-3) transparent;
}

.filter-options::-webkit-scrollbar {
  height: 4px;
}

.filter-options::-webkit-scrollbar-track {
  background: transparent;
}

.filter-options::-webkit-scrollbar-thumb {
  background: var(--color-border-3);
  border-radius: 2px;
}

.filter-options::-webkit-scrollbar-thumb:hover {
  background: var(--color-border-2);
}

.filter-option-tag {
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.filter-option-tag:hover {
  transform: translateY(-1px);
}

/* 折叠动画 */
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  max-height: 500px;
  opacity: 1;
}

@media (min-width: 769px) {
  .filter-section {
    margin-bottom: 8px;
  }

  .filter-content {
    padding: 8px 10px 8px 0;
  }

  .filter-header-with-reset {
    left: auto;
    right: 8px;
    top: 8px;
    width: auto;
  }

  .filter-reset-btn {
    width: 26px;
    height: 26px;
    padding: 3px;
    border-radius: var(--dp-radius-sm);
  }

  .filter-group {
    margin-bottom: 4px;
    padding: 5px 8px 5px 0;
    border-radius: 0 var(--dp-radius-md) var(--dp-radius-md) 0;
    background: transparent;
    border-color: transparent;
    border-bottom: 1px solid var(--dp-border-subtle);
  }

  .filter-group:last-child {
    border-bottom-color: transparent;
  }

  .filter-group-row {
    gap: 8px;
    min-height: 26px;
  }

  .filter-group-title {
    min-width: 56px;
    padding: 3px 7px;
    border-radius: 0 var(--dp-radius-sm) var(--dp-radius-sm) 0;
    color: var(--dp-text-primary);
    background: color-mix(in srgb, var(--dp-primary-readable) 8%, var(--dp-bg-surface));
    font-size: 12px;
    font-weight: 800;
    text-align: center;
  }

  .filter-group-title::before {
    display: none;
  }

  .filter-options-container {
    padding: 0 28px 0 0;
  }

  .filter-options-container::before,
  .filter-options-container::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    z-index: 2;
    width: 28px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.18s ease;
  }

  .filter-options-container::before {
    left: 0;
    background: linear-gradient(90deg, var(--dp-bg-surface) 10%, transparent);
  }

  .filter-options-container::after {
    right: 28px;
    background: linear-gradient(270deg, var(--dp-bg-surface) 10%, transparent);
  }

  .filter-options-container.can-scroll-left::before,
  .filter-options-container.can-scroll-right::after {
    opacity: 1;
  }

  .filter-scroll-btn {
    position: absolute;
    top: 50%;
    z-index: 3;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border: 1px solid color-mix(in srgb, var(--dp-primary-readable) 18%, var(--dp-border));
    border-radius: var(--dp-radius-sm);
    background: color-mix(in srgb, var(--dp-primary-readable) 7%, var(--dp-bg-surface));
    color: var(--dp-primary-readable);
    cursor: pointer;
    opacity: 0;
    transform: translateY(-50%);
    transition: opacity 0.18s ease, background 0.18s ease, color 0.18s ease;
  }

  .filter-options-container:hover .filter-scroll-btn,
  .filter-scroll-btn:focus-visible {
    opacity: 1;
  }

  .filter-scroll-btn:hover:not(:disabled) {
    background: var(--dp-primary-readable);
    color: #fff;
  }

  .filter-scroll-btn:disabled {
    cursor: default;
    color: var(--dp-text-tertiary);
    background: var(--dp-bg-surface-muted);
    border-color: var(--dp-border-subtle);
    opacity: 0;
  }

  .filter-scroll-left {
    left: 2px;
  }

  .filter-scroll-right {
    right: 2px;
  }

  .filter-scroll-btn :deep(svg) {
    width: 13px;
    height: 13px;
  }

  .filter-options {
    gap: 5px;
    padding: 0;
    scrollbar-width: none;
  }
  .filter-options::-webkit-scrollbar {
    display: none;
  }

  .filter-option-tag {
    min-height: 24px;
    margin: 0;
    border-radius: var(--dp-radius-sm);
    font-size: 12px;
    line-height: 1.2;
  }
}

@media (max-width: 768px) {
  .filter-section {
    margin-bottom: 8px;
    background: transparent;
    z-index: 3;
  }

  .filter-content {
    padding: 8px;
    border-radius: 16px;
    background: var(--dp-bg-surface);
  }

  .filter-header-with-reset {
    position: static;
    width: 100%;
    display: flex;
    justify-content: flex-end;
    margin-bottom: 6px;
  }

  .filter-reset-btn {
    width: auto;
    min-width: 58px;
    height: 26px;
    padding: 0 9px;
    border-radius: 999px;
    color: #fff;
    background: var(--dp-primary-readable);
  }

  .filter-reset-btn::after {
    content: '重置';
    margin-left: 4px;
    font-size: 12px;
    font-weight: 800;
  }

  .filter-group {
    margin-bottom: 6px;
    padding: 6px 8px;
    border-radius: 12px;
    background: var(--dp-bg-surface-muted);
    border: 1px solid var(--dp-border-subtle);
  }

  .filter-group-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    min-height: 28px;
  }

  .filter-group-title {
    flex: 0 0 48px;
    width: 48px;
    min-width: 48px;
    padding: 3px 7px;
    border-radius: 999px;
    color: var(--dp-text-primary);
    background: var(--dp-bg-surface);
    font-size: 12px;
    font-weight: 800;
    text-align: center;
  }

  .filter-group-title::before {
    display: none;
  }

  .filter-options-container {
    min-width: 0;
    width: auto;
    flex: 1;
    overflow: hidden;
  }

  .filter-options {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding: 1px 0;
    scrollbar-width: none;
  }

  .filter-options::-webkit-scrollbar {
    display: none;
  }

  .filter-option-tag {
    min-height: 26px;
    padding: 3px 9px;
    border-radius: 999px;
    color: var(--dp-text-secondary);
    background: var(--dp-bg-surface);
    border-color: var(--dp-border-subtle);
    font-size: 12px;
    font-weight: 700;
  }

  .filter-option-tag :deep(.arco-tag-content) {
    white-space: nowrap;
  }

  .filter-option-tag[class*="checked"],
  .filter-option-tag :deep(.arco-tag-checked) {
    color: #fff;
  }
}
</style>