<template>
  <a-layout-header class="header">
    <div class="header-left">
      <a-button
        v-if="showMobileMenuButton"
        class="mobile-menu-btn"
        shape="circle"
        title="打开菜单"
        @click="$emit('toggle-mobile-menu')"
      >
        <template #icon>
          <icon-menu />
        </template>
      </a-button>

      <template v-if="isSearchAggregationPage">
        <a-button shape="circle" @click="goBackFromSearch">
          <template #icon>
            <icon-left />
          </template>
        </a-button>
        <span class="search-page-title">聚合搜索</span>
      </template>
      <template v-else>
        <a-button shape="circle" @click="goBack">
          <template #icon>
            <icon-left />
          </template>
        </a-button>
        <a-button shape="circle" @click="goForward">
          <template #icon>
            <icon-right />
          </template>
        </a-button>
        <a-button shape="circle" @click="refreshPage">
          <template #icon>
            <icon-refresh />
          </template>
        </a-button>
      </template>
    </div>

    <div class="header-center" :class="{ 'search-page-mode': isSearchAggregationPage }" v-if="searchAggregationEnabled">
      <div class="search-container">
        <a-input-search
          v-model="searchValue"
          placeholder="搜索内容..."
          enter-button="搜索"
          allow-clear
          @search="onSearch"
          @keyup.enter="onSearch(searchValue)"
          @click="handleSearchClick"
          @input="handleSearchInput"
          @clear="handleSearchClear"
        />
        <a-button
          class="search-settings-btn"
          shape="circle"
          @click="openSearchSettings"
          :title="'搜索设置'"
        >
          <template #icon>
            <icon-settings />
          </template>
        </a-button>
        <a-button
          v-if="hasSearchResults"
          class="close-search-btn"
          shape="circle"
          @click="closeSearchResults"
          :title="'关闭搜索结果'"
        >
          <template #icon>
            <icon-close />
          </template>
        </a-button>
      </div>
    </div>

    <div class="header-right">
      <a-button class="theme-toggle-btn" shape="circle" @click="toggleTheme" :title="themeToggleTitle">
        <template #icon>
          <span class="theme-toggle-icon">{{ resolvedTheme === THEME_MODE.DARK ? '浅' : '深' }}</span>
        </template>
      </a-button>
      <a-button shape="circle" @click="minimize" title="退出全屏">
        <template #icon>
          <icon-shrink />
        </template>
      </a-button>
      <a-button shape="circle" @click="maximize" title="进入全屏">
        <template #icon>
          <icon-expand />
        </template>
      </a-button>
      <a-button shape="circle" @click="showCloseConfirm" title="关闭应用">
        <template #icon>
          <icon-close />
        </template>
      </a-button>
    </div>

    <div v-if="showConfirmModal" class="confirm-modal-overlay" @click="hideCloseConfirm">
      <div class="confirm-modal" @click.stop>
        <div class="modal-header">
          <icon-exclamation-circle-fill class="warning-icon" />
          <h3 class="modal-title">确认关闭</h3>
        </div>
        <div class="modal-content">
          <p class="modal-message">你确认要关闭当前应用吗？</p>
          <p class="modal-submessage">关闭后将退出应用程序</p>
        </div>
        <div class="modal-footer">
          <a-button class="cancel-btn" @click="hideCloseConfirm">取消</a-button>
          <a-button type="primary" status="warning" class="clear-cache-btn" @click="clearSessionStorage">仅清缓存</a-button>
          <a-button type="primary" status="danger" class="confirm-btn" @click="confirmClose">确认关闭</a-button>
        </div>
      </div>
    </div>

    <SearchSettingsModal
      v-model:visible="showSearchSettings"
      @confirm="onSearchSettingsConfirm"
    />
  </a-layout-header>
</template>

<script>
import { defineComponent, ref, computed, watch, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Message } from '@arco-design/web-vue';
import SearchSettingsModal from './SearchSettingsModal.vue';
import { getStoredThemeMode, resolveThemeMode, setStoredThemeMode, THEME_MODE } from '@/utils/theme';

export default defineComponent({
  components: {
    SearchSettingsModal
  },
  props: {
    showMobileMenuButton: {
      type: Boolean,
      default: false
    }
  },
  emits: ['toggle-mobile-menu'],
  setup() {
    const route = useRoute();
    const router = useRouter();
    const showConfirmModal = ref(false);
    const searchValue = ref('');
    const showSearchSettings = ref(false);
    const forceUpdate = ref(0);
    const resolvedTheme = ref(resolveThemeMode(getStoredThemeMode()));

    const themeToggleTitle = computed(() => resolvedTheme.value === THEME_MODE.DARK ? '切换到浅色模式' : '切换到深色模式');

    const updateThemeState = (event) => {
      resolvedTheme.value = event?.detail?.resolvedTheme || resolveThemeMode(getStoredThemeMode());
    };

    const isSearchAggregationPage = computed(() => route.name === 'SearchAggregation');

    const hasSearchResults = computed(() => {
      forceUpdate.value;
      if (!isSearchAggregationPage.value) {
        return false;
      }

      if (route.query.keyword) {
        return true;
      }

      try {
        const savedState = localStorage.getItem('pageState_searchAggregation');
        if (savedState) {
          const state = JSON.parse(savedState);
          return state.hasSearched && state.searchKeyword;
        }
      } catch (error) {
        console.error('检查搜索状态失败:', error);
      }

      return false;
    });

    const getSearchAggregationStatus = () => {
      try {
        const appSettings = localStorage.getItem('appSettings');
        if (appSettings) {
          const settings = JSON.parse(appSettings);
          return settings.searchAggregation || false;
        }
      } catch (error) {
        console.error('获取聚搜状态失败:', error);
      }
      return false;
    };

    const searchAggregationEnabled = ref(getSearchAggregationStatus());

    const updateSearchAggregationStatus = () => {
      searchAggregationEnabled.value = getSearchAggregationStatus();
      forceUpdate.value++;
    };

    window.addEventListener('storage', updateSearchAggregationStatus);
    window.addEventListener('themeChanged', updateThemeState);
    const checkInterval = setInterval(updateSearchAggregationStatus, 1000);

    watch(() => route.query.keyword, (keyword) => {
      if (keyword && isSearchAggregationPage.value) {
        searchValue.value = keyword;
      }
    }, { immediate: true });

    watch(() => route.name, (routeName) => {
      if (routeName !== 'SearchAggregation') {
        searchValue.value = '';
      }
    });

    onBeforeUnmount(() => {
      window.removeEventListener('storage', updateSearchAggregationStatus);
      window.removeEventListener('themeChanged', updateThemeState);
      clearInterval(checkInterval);
    });

    return {
      showConfirmModal,
      searchAggregationEnabled,
      searchValue,
      showSearchSettings,
      isSearchAggregationPage,
      hasSearchResults,
      resolvedTheme,
      themeToggleTitle,
      THEME_MODE,
      router
    };
  },
  methods: {
    toggleTheme() {
      const nextMode = this.resolvedTheme === THEME_MODE.DARK ? THEME_MODE.LIGHT : THEME_MODE.DARK;
      this.resolvedTheme = setStoredThemeMode(nextMode);
    },
    goBack() {
      Message.info('后退按钮');
    },
    goBackFromSearch() {
      if (window.history.length > 1) {
        this.$router.back();
      } else {
        this.$router.push({ name: 'Home' });
      }
    },
    goForward() {
      Message.info('前进按钮');
    },
    refreshPage() {
      Message.info('刷新页面');
      window.location.reload();
    },
    onSearch(value) {
      console.log('🔍 [Header] onSearch被触发:', { value, isSearchPage: this.isSearchAggregationPage });

      if (!value || !value.trim()) {
        Message.warning('请输入搜索内容');
        return;
      }

      const keyword = value.trim();
      console.log('🔍 [Header] 准备执行搜索:', { keyword, currentRoute: this.$route.name });

      if (this.isSearchAggregationPage) {
        console.log('🔍 [Header] 在搜索页面，更新查询参数');
        this.$router.push({
          name: 'SearchAggregation',
          query: {
            keyword,
            _t: Date.now()
          }
        });
      } else {
        console.log('🔍 [Header] 不在搜索页面，跳转到搜索页面');
        this.$router.push({
          name: 'SearchAggregation',
          query: { keyword }
        });
      }
    },
    handleSearchClick() {
      if (!this.isSearchAggregationPage) {
        this.$router.push({ name: 'SearchAggregation' });
      }
    },
    handleSearchInput(value) {
      if (this.isSearchAggregationPage) {
        const query = { ...this.$route.query, keywordDraft: value };
        this.$router.push({ name: 'SearchAggregation', query });
      }
    },
    handleSearchClear() {
      if (this.isSearchAggregationPage) {
        const query = { ...this.$route.query };
        delete query.keywordDraft;
        this.$router.push({ name: 'SearchAggregation', query });
      }
    },
    openSearchSettings() {
      this.showSearchSettings = true;
    },
    onSearchSettingsConfirm(settings) {
      const selectedCount = settings.selectedSources ? settings.selectedSources.length : 0;
      Message.success(`已选择 ${selectedCount} 个搜索源`);
      this.showSearchSettings = false;

      window.dispatchEvent(new CustomEvent('searchSettingsChanged', {
        detail: settings
      }));
    },
    closeSearchResults() {
      this.searchValue = '';

      try {
        localStorage.removeItem('pageState_searchAggregation');
        console.log('🔄 [状态清理] 已清除聚合搜索页面保存的状态');
      } catch (error) {
        console.error('清除页面状态失败:', error);
      }

      this.$router.push({ name: 'SearchAggregation' });
    },
    minimize() {
      Message.info('最小化窗口');
      this.exitFullScreen();
    },
    maximize() {
      Message.info('最大化窗口');
      this.enterFullScreen();
    },
    showCloseConfirm() {
      this.showConfirmModal = true;
    },
    hideCloseConfirm() {
      this.showConfirmModal = false;
    },
    clearSessionStorage() {
      try {
        sessionStorage.clear();
        this.showConfirmModal = false;
        Message.success('缓存已清除');
      } catch (error) {
        console.error('清除缓存失败:', error);
        Message.error('清除缓存失败');
      }
    },
    confirmClose() {
      this.showConfirmModal = false;
      Message.info('正在关闭应用...');

      try {
        if (window.opener) {
          window.close();
        } else {
          window.open('about:blank', '_self');
          window.close();
        }

        setTimeout(() => {
          if (!window.closed) {
            Message.warning('无法自动关闭窗口，请手动关闭浏览器标签页');
            window.location.href = 'about:blank';
          }
        }, 500);
      } catch (error) {
        console.error('关闭窗口失败:', error);
        Message.error('关闭失败，请手动关闭浏览器标签页');
      }
    },
    enterFullScreen() {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
    },
    exitFullScreen() {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }
});
</script>

<style scoped>
.header {
  display: grid;
  grid-template-columns: minmax(120px, auto) minmax(0, 1fr) minmax(96px, auto);
  align-items: center;
  width: 100%;
  height: var(--dp-header-height);
  padding: 0 var(--dp-space-4);
  gap: var(--dp-space-3);
  background: var(--dp-bg-shell);
  border-bottom: 1px solid var(--dp-border);
  box-shadow: var(--dp-shadow-sm);
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: var(--dp-space-2);
}

.header-right {
  justify-content: flex-end;
}

.search-page-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--dp-text-primary);
  white-space: nowrap;
  user-select: none;
}

.header-center {
  min-width: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.header-left :deep(.arco-btn),
.header-right :deep(.arco-btn) {
  width: 32px;
  height: 32px;
  border-radius: var(--dp-radius-md);
  border: 1px solid var(--dp-border);
  background: var(--dp-bg-surface);
  color: var(--dp-text-primary);
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.header-left :deep(.arco-btn:hover),
.header-right :deep(.arco-btn:hover) {
  background: var(--dp-bg-hover);
  border-color: var(--color-primary-4);
  color: var(--color-primary-6);
}

.header-right :deep(.arco-btn:last-child) {
  background: var(--color-danger-6);
  border-color: var(--color-danger-6);
  color: #fff;
}

.header-right :deep(.arco-btn:last-child:hover) {
  background: var(--color-danger-7);
  border-color: var(--color-danger-7);
  color: #fff;
}

.theme-toggle-icon {
  font-size: 13px;
  line-height: 1;
  font-weight: 800;
}

.search-container {
  display: flex;
  align-items: center;
  width: min(100%, 520px);
  min-width: 0;
  border: 1px solid var(--dp-border);
  border-radius: var(--dp-radius-lg);
  background: var(--dp-bg-surface);
  padding: 3px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-container:hover,
.search-container:focus-within {
  border-color: var(--color-primary-5);
  box-shadow: 0 0 0 2px var(--color-primary-1);
}

.search-container :deep(.arco-input-search) {
  flex: 1;
  min-width: 0;
  border-radius: var(--dp-radius-md);
  background: transparent;
  border: none;
  box-shadow: none;
}

.search-container :deep(.arco-input-wrapper) {
  border-radius: var(--dp-radius-md);
  background: transparent;
  border: none;
}

.search-container :deep(.arco-input) {
  min-width: 0;
  background: transparent;
  border: none;
  color: var(--dp-text-primary);
  font-size: 14px;
}

.search-container :deep(.arco-input::placeholder) {
  color: var(--dp-text-tertiary);
}

.search-container :deep(.arco-input-search-btn) {
  border-radius: var(--dp-radius-md);
  background: var(--color-primary-6);
  border: none;
  color: white;
}

.search-settings-btn,
.close-search-btn {
  width: 30px !important;
  height: 30px !important;
  border-radius: var(--dp-radius-md) !important;
  border: none !important;
  background: transparent !important;
  color: var(--dp-text-secondary) !important;
  flex-shrink: 0;
  margin-left: 2px;
}

.search-settings-btn:hover,
.close-search-btn:hover {
  background: var(--dp-bg-hover) !important;
  color: var(--dp-text-primary) !important;
  box-shadow: none !important;
}

.close-search-btn:hover {
  color: var(--color-danger-6) !important;
}

.confirm-modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--dp-overlay);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--dp-z-modal);
  padding: var(--dp-space-4);
}

.confirm-modal {
  width: min(420px, calc(100vw - 32px));
  background: var(--dp-bg-surface);
  border-radius: var(--dp-radius-xl);
  box-shadow: var(--dp-shadow-md);
  border: 1px solid var(--dp-border);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  padding: var(--dp-space-4) var(--dp-space-5);
  border-bottom: 1px solid var(--dp-border-subtle);
}

.warning-icon {
  font-size: 22px;
  color: #ff6b35;
  margin-right: var(--dp-space-3);
}

.modal-title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: var(--dp-text-primary);
}

.modal-content {
  padding: var(--dp-space-4) var(--dp-space-5);
}

.modal-message {
  margin: 0 0 var(--dp-space-2) 0;
  font-size: 15px;
  color: var(--dp-text-primary);
  line-height: 1.5;
}

.modal-submessage {
  margin: 0;
  font-size: 13px;
  color: var(--dp-text-tertiary);
  line-height: 1.4;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--dp-space-2);
  padding: var(--dp-space-4) var(--dp-space-5);
  border-top: 1px solid var(--dp-border-subtle);
}

.cancel-btn,
.clear-cache-btn,
.confirm-btn {
  min-width: 80px;
  height: 34px;
  border-radius: var(--dp-radius-md);
  font-weight: 500;
}

@media (max-width: 768px) {
  .header {
    grid-template-columns: minmax(84px, auto) minmax(0, 1fr) auto;
    padding: 0 var(--dp-space-3);
    gap: var(--dp-space-2);
  }

  .header-left,
  .header-right {
    gap: var(--dp-space-1);
  }

  .header-left :deep(.arco-btn),
  .header-right :deep(.arco-btn) {
    width: 30px;
    height: 30px;
  }

  .search-page-title {
    font-size: 14px;
  }

  .search-container {
    width: 100%;
  }
}

@media (max-width: 560px) {
  .header {
    grid-template-columns: auto minmax(0, 1fr) auto;
  }

  .header-left :deep(.arco-btn:not(.mobile-menu-btn):nth-of-type(2)) {
    display: none;
  }

  .header-right :deep(.arco-btn:first-child) {
    display: none;
  }

  .search-container :deep(.arco-input-search-btn) {
    padding: 0 8px;
  }
}

@media (max-width: 430px) {
  .header {
    padding: 0 var(--dp-space-2);
  }

  .header-left :deep(.arco-btn:not(.mobile-menu-btn):nth-of-type(3)),
  .header-right :deep(.arco-btn:nth-child(2)) {
    display: none;
  }

  .search-page-title {
    max-width: 64px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .search-settings-btn,
  .close-search-btn {
    width: 28px !important;
    height: 28px !important;
  }

  .modal-footer {
    flex-direction: column;
  }

  .cancel-btn,
  .clear-cache-btn,
  .confirm-btn {
    width: 100%;
  }
}
</style>
