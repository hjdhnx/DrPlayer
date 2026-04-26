<template>
  <a-modal
    :visible="visible"
    title="全部分类"
    :footer="false"
    width="80%"
    class="category-modal"
    modal-class="category-modal-panel"
    @cancel="handleClose"
  >
    <div class="category-modal-content">
      <div
        v-if="hasRecommendVideos"
        class="category-item"
        :class="{ active: activeKey === 'recommendTuijian404' }"
        @click="handleSelectCategory('recommendTuijian404')"
      >
        推荐
      </div>

      <div
        v-for="item in classList.class"
        :key="item.type_id"
        class="category-item"
        :class="{ active: activeKey === item.type_id }"
        @click="handleSelectCategory(item.type_id)"
      >
        {{ item.type_name }}
      </div>
    </div>
  </a-modal>
</template>

<script setup>
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  classList: {
    type: Object,
    required: true
  },
  hasRecommendVideos: {
    type: Boolean,
    default: false
  },
  activeKey: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['update:visible', 'select-category']);

const handleClose = () => {
  emit('update:visible', false);
};

const handleSelectCategory = (categoryId) => {
  emit('select-category', categoryId);
  handleClose();
};
</script>

<style scoped>
.category-modal-content {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
  gap: 10px;
  max-height: min(68vh, 620px);
  overflow-y: auto;
  padding: 4px 0 8px;
}

.category-item {
  padding: 11px 14px;
  background: var(--dp-bg-surface-muted);
  border: 1px solid var(--dp-border-subtle);
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 700;
  color: var(--dp-text-secondary);
}

.category-item:hover {
  background: var(--dp-bg-hover);
  border-color: color-mix(in srgb, var(--dp-primary-readable) 45%, var(--dp-border));
  color: var(--dp-primary-readable);
  transform: translateY(-1px);
  box-shadow: var(--dp-shadow-sm);
}

.category-item.active {
  background: var(--dp-primary-readable) !important;
  border-color: var(--dp-primary-readable) !important;
  color: #fff !important;
  font-weight: 800;
}

.category-item.active:hover {
  background: var(--color-primary-6) !important;
  border-color: var(--color-primary-6) !important;
  color: #fff !important;
}

.category-modal-content::-webkit-scrollbar {
  width: 6px;
}

.category-modal-content::-webkit-scrollbar-track {
  background: var(--dp-bg-surface-muted);
  border-radius: 3px;
}

.category-modal-content::-webkit-scrollbar-thumb {
  background: var(--dp-border);
  border-radius: 3px;
}

.category-modal-content::-webkit-scrollbar-thumb:hover {
  background: var(--dp-text-tertiary);
}

@media (prefers-color-scheme: dark) {
  .category-item {
    background: #2a2a2b;
    border-color: #3a3a3c;
    color: #ffffff;
  }

  .category-item:hover {
    background: #1a3a5c;
    border-color: #4080ff;
    color: #7bc4ff;
  }

  .category-modal-content::-webkit-scrollbar-track {
    background: #2a2a2b;
  }

  .category-modal-content::-webkit-scrollbar-thumb {
    background: #4a4a4c;
  }

  .category-modal-content::-webkit-scrollbar-thumb:hover {
    background: #5a5a5c;
  }
}

@media (min-width: 769px) {
  :global(.category-modal-panel) {
    width: min(680px, calc(100vw - 112px)) !important;
    border-radius: var(--dp-radius-lg) !important;
  }

  :global(.category-modal-panel .arco-modal-header) {
    padding: 12px 16px 8px;
    border-bottom: 1px solid var(--dp-border-subtle);
  }

  :global(.category-modal-panel .arco-modal-title) {
    color: var(--dp-text-primary);
    font-size: 15px;
    font-weight: 800;
  }

  :global(.category-modal-panel .arco-modal-close-btn) {
    top: 10px;
    right: 12px;
  }

  :global(.category-modal-panel .arco-modal-body) {
    padding: 12px 16px 16px !important;
  }

  .category-modal-content {
    grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
    gap: 6px;
    max-height: min(58vh, 420px);
    padding: 0 2px 2px 0;
  }

  .category-item {
    min-width: 0;
    height: 30px;
    padding: 0 9px;
    border-radius: var(--dp-radius-sm);
    font-size: 12px;
    font-weight: 800;
    line-height: 30px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .category-item:hover {
    transform: none;
    box-shadow: none;
  }
}

@media (max-width: 768px) {
  :deep(.category-modal-panel) {
    width: calc(100vw - 20px) !important;
    max-width: 520px;
    margin: 0 auto;
    border-radius: 22px !important;
  }

  :deep(.category-modal-panel .arco-modal-header) {
    padding: 16px 18px 10px;
    border-bottom: none;
  }

  :deep(.category-modal-panel .arco-modal-title) {
    font-size: 18px;
    font-weight: 800;
    color: var(--dp-text-primary);
  }

  :deep(.category-modal-panel .arco-modal-body) {
    padding: 6px 14px 16px !important;
    max-height: min(70vh, 560px);
  }

  .category-modal-content {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    max-height: min(58vh, 460px);
    padding: 4px 0 2px;
  }

  .category-item {
    min-width: 0;
    min-height: 40px;
    padding: 9px 8px;
    border-radius: 999px;
    color: var(--dp-text-secondary);
    background: var(--dp-bg-surface-muted);
    border-color: var(--dp-border-subtle);
    font-size: 13px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .category-item:hover {
    transform: none;
    box-shadow: none;
  }
}
</style>
