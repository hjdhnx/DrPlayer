<template>
  <div
    class="app-container"
    :class="{
      'is-mobile': isMobile,
      'mobile-more-open': mobileMoreOpen,
      'is-immersive': isImmersivePage
    }"
  >
    <div class="fixed-header">
      <Header v-if="!isMobile" />
      <div v-else class="mobile-top-bar" :class="{ 'home-theme-visible': showHomeThemeToggle }">
        <button v-if="showMobileBack" class="mobile-icon-btn" type="button" title="返回" @click="goBack">
          <span class="mobile-back-icon">‹</span>
        </button>
        <button v-else class="mobile-brand" type="button" @click="goHome">
          <img class="mobile-brand-logo" :src="logoSrc" :alt="logoDesc" />
        </button>

        <div class="mobile-title-block">
          <div class="mobile-title">{{ mobileTitle }}</div>
          <div v-if="mobileSubtitle" class="mobile-subtitle">{{ mobileSubtitle }}</div>
        </div>

        <button v-if="showHomeThemeToggle" class="mobile-icon-btn mobile-theme-toggle" type="button" :title="themeToggleTitle" @click="toggleTheme">
          <span class="mobile-theme-text">{{ resolvedTheme === THEME_MODE.DARK ? '浅' : '深' }}</span>
        </button>
        <button class="mobile-search-pill" type="button" title="搜索" @click="goSearch">
          <svg class="mobile-action-icon"><use href="#icon-sousuo"></use></svg>
          <span>搜索</span>
        </button>
        <button class="mobile-icon-btn" type="button" title="更多" @click="toggleMobileMore">
          <span class="mobile-more-dots">•••</span>
        </button>
      </div>
    </div>

    <div
      v-if="isMobile && mobileMoreOpen"
      class="mobile-more-overlay"
      @click="closeMobileMore"
    ></div>

    <aside v-if="isMobile && mobileMoreOpen" class="mobile-more-panel">
      <div class="mobile-more-handle"></div>
      <div class="mobile-more-header">
        <div>
          <div class="mobile-more-title">我的 DrPlayer</div>
          <div class="mobile-more-desc">内容、设置与高级工具</div>
        </div>
        <button class="mobile-icon-btn" type="button" title="关闭" @click="closeMobileMore">×</button>
      </div>
      <div class="mobile-more-content">
        <section v-for="group in mobileMoreGroups" :key="group.title" class="mobile-more-group">
          <h3 class="mobile-more-group-title">{{ group.title }}</h3>
          <router-link
            v-for="item in group.items"
            :key="item.id"
            :to="item.route"
            class="mobile-more-item"
            :class="{ active: isRouteActive(item.routeName) }"
            @click="closeMobileMore"
          >
            <span class="mobile-more-icon-wrap">
              <svg class="mobile-more-icon"><use :href="`#${item.icon}`"></use></svg>
            </span>
            <span class="mobile-more-text">
              <span class="mobile-more-name">{{ item.name }}</span>
              <span class="mobile-more-item-desc">{{ item.desc }}</span>
            </span>
          </router-link>
        </section>
      </div>
    </aside>

    <a-layout class="layout-demo">
      <a-layout-sider
        v-if="!isMobile"
        collapsible
        breakpoint="xl"
        class="fixed-sider"
        :collapsed="siderCollapsed"
        :width="136"
        :collapsed-width="56"
        @collapse="onSiderCollapse"
      >
        <div class="logo">
          <a-popover title="道长: 您好!">
            <a-image
              width="100%"
              :src="logoSrc"
              :alt="logoDesc"
              :preview="false"
              @click="() => Message.success('欢迎使用Hipy定制版壳子')"
            />
            <template #content>
              <p>{{ logoDesc }}</p>
            </template>
          </a-popover>
        </div>

        <a-menu
          :selected-keys="selectedMenuKeys"
          :style="{ width: '100%' }"
          @menu-item-click="onClickMenuItem"
        >
          <router-link
            v-for="item in menuItems"
            :key="item.id"
            :to="item.route"
            class="menu-item"
            :title="item.name"
          >
            <a-menu-item :key="String(item.id)">
              <svg class="menu-icon">
                <use :href="`#${item.icon}`"></use>
              </svg>
              <span class="menu-text">{{ item.name }}</span>
            </a-menu-item>
          </router-link>
        </a-menu>

        <template #trigger="{ collapsed }">
          <IconCaretRight v-if="collapsed"></IconCaretRight>
          <IconCaretLeft v-else></IconCaretLeft>
        </template>
      </a-layout-sider>

      <main class="main-content" :class="{ 'sider-collapsed': siderCollapsed && !isMobile }">
        <div
          class="content-wrapper"
          :class="{
            'video-page': isVideoPage,
            'search-page': isSearchPage,
            'download-manager-page': isDownloadManagerPage,
            'mobile-content': isMobile,
            'mobile-has-bottom-nav': showMobileBottomNav,
            'mobile-immersive-content': isImmersivePage
          }"
        >
          <slot></slot>
        </div>

        <nav v-if="isMobile && showMobileBottomNav" class="mobile-bottom-nav">
          <router-link
            v-for="item in mobilePrimaryItems"
            :key="item.id"
            :to="item.route"
            class="mobile-nav-item"
            :class="{ active: isRouteActive(item.routeName) }"
          >
            <svg class="mobile-nav-icon"><use :href="`#${item.icon}`"></use></svg>
            <span>{{ item.name }}</span>
          </router-link>
          <button
            class="mobile-nav-item mobile-nav-button"
            :class="{ active: isMoreRouteActive || mobileMoreOpen }"
            type="button"
            @click="toggleMobileMore"
          >
            <span class="mobile-nav-more-icon">•••</span>
            <span>我的</span>
          </button>
        </nav>

        <div v-if="!isMobile" class="fixed-footer">
          <Footer />
        </div>
      </main>
    </a-layout>
  </div>
</template>

<script>
import { defineComponent, ref, watch, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Message } from '@arco-design/web-vue';
import {
  IconCaretRight,
  IconCaretLeft,
} from '@arco-design/web-vue/es/icon';
import Header from './Header.vue';
import Footer from './Footer.vue';
import { usePaginationStore } from '@/stores/paginationStore';
import { desktopMenuItems, mobilePrimaryItems, mobileMoreGroups } from '@/config/navigation';
import logoPc from '@/assets/logo-pc.png';
import logoMobile from '@/assets/logo-mobile.png';
import '@/assets/icon_font/iconfont.js';
import { getStoredThemeMode, resolveThemeMode, setStoredThemeMode, THEME_MODE } from '@/utils/theme';

export default defineComponent({
  components: {
    IconCaretRight,
    IconCaretLeft,
    Header,
    Footer,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const paginationStore = usePaginationStore();

    const isVideoPage = computed(() => route.path === '/video' || route.name === 'Video');
    const isSearchPage = computed(() => route.path === '/search' || route.name === 'SearchAggregation');
    const isDownloadManagerPage = computed(() => route.path === '/download-manager' || route.name === 'DownloadManager');
    const isImmersivePage = computed(() => Boolean(route.meta?.immersive));
    const showMobileBottomNav = computed(() => route.meta?.showBottomNav !== false && !isImmersivePage.value);
    const showMobileBack = computed(() => isImmersivePage.value || route.name === 'SearchAggregation');
    const showHomeThemeToggle = computed(() => route.name === 'Home');
    const mobileTitle = computed(() => route.meta?.title || 'DrPlayer');
    const mobileSubtitle = computed(() => {
      if (route.name === 'Home') return '影视、直播、阅读与工具';
      if (route.name === 'Video') return '选择片源与分类';
      if (route.name === 'Live') return '频道播放';
      if (route.name === 'BookGallery') return '书架与画廊';
      return '';
    });

    const siderCollapsed = ref(JSON.parse(localStorage.getItem('sidebar-collapsed') || 'false'));
    const mobileMoreOpen = ref(false);
    const isMobile = ref(false);
    const resolvedTheme = ref(resolveThemeMode(getStoredThemeMode()));

    const themeToggleTitle = computed(() => resolvedTheme.value === THEME_MODE.DARK ? '切换到浅色模式' : '切换到深色模式');

    const updateThemeState = (event) => {
      resolvedTheme.value = event?.detail?.resolvedTheme || resolveThemeMode(getStoredThemeMode());
    };

    const menuItems = ref(desktopMenuItems);
    const logoSrc = computed(() => isMobile.value ? logoMobile : logoPc);
    const logoDesc = ref('欢迎使用DrPlayer');

    const selectedMenuKeys = computed(() => {
      const item = menuItems.value.find(menuItem => menuItem.routeName === route.name || menuItem.route === route.path);
      return item ? [String(item.id)] : [];
    });

    const moreRouteNames = computed(() => mobileMoreGroups.flatMap(group => group.items.map(item => item.routeName)));
    const isMoreRouteActive = computed(() => moreRouteNames.value.includes(route.name));

    const updateIsMobile = () => {
      isMobile.value = window.matchMedia('(max-width: 768px)').matches;
      if (!isMobile.value) {
        mobileMoreOpen.value = false;
      }
    };

    const closeMobileMore = () => {
      mobileMoreOpen.value = false;
    };

    const toggleMobileMore = () => {
      mobileMoreOpen.value = !mobileMoreOpen.value;
    };

    const toggleTheme = () => {
      const nextMode = resolvedTheme.value === THEME_MODE.DARK ? THEME_MODE.LIGHT : THEME_MODE.DARK;
      resolvedTheme.value = setStoredThemeMode(nextMode);
    };

    const isRouteActive = (routeName) => route.name === routeName;

    const goBack = () => {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push({ name: 'Home' });
      }
    };

    const goHome = () => {
      router.push({ name: 'Home' });
    };

    const goSearch = () => {
      router.push({ name: 'SearchAggregation' });
    };

    watch(() => route.path, (newPath) => {
      paginationStore.setCurrentRoute(newPath);
      closeMobileMore();
    }, { immediate: true });

    watch(siderCollapsed, (collapsed) => {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed));
    });

    const onClickMenuItem = (key) => {
      const item = menuItems.value.find(it => String(it.id) === String(key));
      if (item) {
        console.log(`You select ${key},${item.name}`);
      }
    };

    const onSiderCollapse = (collapsed) => {
      if (!isMobile.value) {
        siderCollapsed.value = collapsed;
      }
    };

    onMounted(() => {
      updateIsMobile();
      updateThemeState();
      window.addEventListener('resize', updateIsMobile);
      window.addEventListener('themeChanged', updateThemeState);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('resize', updateIsMobile);
      window.removeEventListener('themeChanged', updateThemeState);
    });

    return {
      Message,
      siderCollapsed,
      mobileMoreOpen,
      isMobile,
      isImmersivePage,
      showMobileBottomNav,
      showMobileBack,
      showHomeThemeToggle,
      mobileTitle,
      mobileSubtitle,
      menuItems,
      mobilePrimaryItems,
      mobileMoreGroups,
      selectedMenuKeys,
      isMoreRouteActive,
      logoSrc,
      logoDesc,
      resolvedTheme,
      themeToggleTitle,
      THEME_MODE,
      toggleTheme,
      onClickMenuItem,
      onSiderCollapse,
      closeMobileMore,
      toggleMobileMore,
      isRouteActive,
      goBack,
      goHome,
      goSearch,
      isVideoPage,
      isSearchPage,
      isDownloadManagerPage
    };
  }
});
</script>

<style scoped>
.app-container {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
  color: var(--dp-text-primary);
  background: var(--dp-bg-app);
}

.fixed-header {
  position: fixed;
  inset: 0 0 auto 0;
  width: 100vw;
  height: var(--dp-header-height);
  background: var(--dp-bg-shell);
  border-bottom: 1px solid var(--dp-border);
  z-index: var(--dp-z-header);
  display: flex;
  align-items: center;
}

.layout-demo {
  height: calc(100vh - var(--dp-header-height));
  margin-top: var(--dp-header-height);
  background: var(--dp-bg-app);
  display: flex;
  overflow: hidden;
}

@media (min-width: 769px) {
  .layout-demo {
    background:
      radial-gradient(circle at top left, rgba(22, 93, 255, 0.08), transparent 32vw),
      linear-gradient(180deg, color-mix(in srgb, var(--dp-bg-app) 82%, white), var(--dp-bg-app));
  }
}

.fixed-sider {
  position: fixed !important;
  left: 0;
  top: var(--dp-header-height);
  bottom: 0;
  z-index: var(--dp-z-sidebar);
  border-right: 1px solid var(--dp-border);
  background: var(--dp-bg-shell) !important;
  box-shadow: var(--dp-shadow-sm);
  transition: width 0.2s ease;
  overflow: hidden !important;
}

.fixed-sider :deep(.arco-layout-sider-children),
.fixed-sider :deep(.arco-menu-inner),
.fixed-sider :deep(.arco-layout-sider-trigger) {
  overflow: hidden !important;
}

.main-content {
  flex: 1;
  min-width: 0;
  margin-left: var(--dp-sidebar-width);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  transition: margin-left 0.2s ease;
}

.main-content.sider-collapsed {
  margin-left: var(--dp-sidebar-collapsed-width);
}

.content-wrapper {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0;
  background: transparent;
  scroll-behavior: smooth;
}

.content-wrapper.video-page,
.content-wrapper.search-page,
.content-wrapper.download-manager-page {
  overflow: hidden;
}

.fixed-footer {
  height: var(--dp-footer-height);
  background: color-mix(in srgb, var(--dp-bg-shell) 92%, transparent);
  border-top: 1px solid var(--dp-border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--dp-text-tertiary);
  font-weight: 400;
  font-size: 12px;
  flex-shrink: 0;
}

.logo {
  height: 44px;
  margin: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--dp-radius-lg);
  background: var(--dp-bg-surface-muted);
  overflow: hidden;
}

.layout-demo :deep(.arco-layout-sider-collapsed) {
  overflow: hidden !important;
}

.layout-demo :deep(.arco-layout-sider-collapsed) .logo {
  width: calc(var(--dp-sidebar-collapsed-width) - 12px);
  margin: 8px 6px;
}

.layout-demo :deep(.arco-layout-sider-collapsed .arco-layout-sider-children),
.layout-demo :deep(.arco-layout-sider-collapsed .arco-layout-sider-trigger),
.layout-demo :deep(.arco-layout-sider-collapsed .arco-menu),
.layout-demo :deep(.arco-layout-sider-collapsed .arco-menu-inner) {
  width: var(--dp-sidebar-collapsed-width) !important;
  min-width: var(--dp-sidebar-collapsed-width) !important;
  max-width: var(--dp-sidebar-collapsed-width) !important;
  overflow: hidden !important;
}

.layout-demo :deep(.arco-layout-sider-collapsed .arco-menu-inner) {
  padding-left: 0 !important;
  padding-right: 0 !important;
}

.layout-demo :deep(.arco-layout-sider-collapsed) .menu-text {
  display: none;
}

.menu-item {
  display: block;
  color: inherit;
}

.menu-icon {
  width: 18px;
  height: 18px;
  margin-right: 8px;
  flex-shrink: 0;
  display: inline-block;
}

.menu-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.layout-demo :deep(.arco-menu) {
  border-right: none;
  background: transparent;
}

.layout-demo :deep(.arco-menu-item) {
  height: 40px;
  padding: 0 14px !important;
  color: var(--dp-text-secondary);
  font-weight: 600;
}

.layout-demo :deep(.arco-menu-item:hover) {
  color: var(--dp-primary-readable);
  background: var(--dp-bg-hover);
}

.layout-demo :deep(.arco-menu-selected) {
  color: var(--dp-primary-readable);
}

.layout-demo :deep(.arco-layout-sider-collapsed .menu-item),
.layout-demo :deep(.arco-layout-sider-collapsed .arco-menu-item) {
  width: var(--dp-sidebar-collapsed-width) !important;
  min-width: var(--dp-sidebar-collapsed-width) !important;
  max-width: var(--dp-sidebar-collapsed-width) !important;
}

.layout-demo :deep(.arco-layout-sider-collapsed .arco-menu-item) {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 !important;
}

.layout-demo :deep(.arco-layout-sider-collapsed .menu-icon) {
  margin-right: 0;
}

.layout-demo :deep(.arco-layout-sider-collapsed .menu-text) {
  display: none;
}

.mobile-top-bar {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) minmax(76px, auto) 40px;
  align-items: center;
  gap: 6px;
  padding: env(safe-area-inset-top) 10px 0;
  background: var(--dp-bg-shell);
}

.mobile-top-bar.home-theme-visible {
  grid-template-columns: 40px minmax(0, 1fr) 36px minmax(76px, auto) 40px;
}

.mobile-brand,
.mobile-icon-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 999px;
  background: var(--dp-bg-surface-muted);
  color: var(--dp-text-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  flex-shrink: 0;
}

.mobile-search-pill {
  min-width: 76px;
  height: 36px;
  border: 1px solid var(--dp-border-subtle);
  border-radius: 999px;
  background: var(--dp-bg-surface-muted);
  color: var(--dp-text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 800;
  font-family: inherit;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.45);
}

.mobile-theme-toggle {
  border: 1px solid var(--dp-border-subtle);
  color: var(--dp-primary-readable);
  font-weight: 800;
}

.mobile-theme-text {
  font-size: 13px;
  line-height: 1;
}

.mobile-brand-logo {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.mobile-back-icon {
  font-size: 32px;
  line-height: 1;
  margin-top: -2px;
}

.mobile-title-block {
  min-width: 0;
}

.mobile-title {
  font-size: 17px;
  line-height: 1.15;
  font-weight: 700;
  color: var(--dp-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-subtitle {
  margin-top: 2px;
  font-size: 11px;
  line-height: 1.2;
  color: var(--dp-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-action-icon {
  width: 18px;
  height: 18px;
}

.mobile-more-dots,
.mobile-nav-more-icon {
  font-size: 17px;
  letter-spacing: -2px;
  transform: rotate(90deg);
}

.mobile-bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--dp-z-header);
  height: calc(var(--dp-mobile-bottom-nav-height) + env(safe-area-inset-bottom));
  padding: 5px 8px calc(5px + env(safe-area-inset-bottom));
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 4px;
  background: color-mix(in srgb, var(--dp-bg-shell) 94%, transparent);
  border-top: 1px solid var(--dp-border);
  box-shadow: 0 -8px 24px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(16px);
}

.mobile-nav-item {
  min-width: 0;
  border: none;
  border-radius: 16px;
  background: transparent;
  color: var(--dp-text-secondary);
  text-decoration: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-size: 11px;
  line-height: 1.1;
  font-weight: 700;
}

.mobile-nav-button {
  font-family: inherit;
}

.mobile-nav-item.active {
  background: var(--dp-bg-hover);
  color: var(--dp-primary-readable);
}

.mobile-nav-icon {
  width: 20px;
  height: 20px;
}

.mobile-more-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--dp-z-overlay);
  background: var(--dp-overlay);
}

.mobile-more-panel {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--dp-z-modal);
  max-height: min(78vh, 680px);
  padding: 8px 14px calc(18px + env(safe-area-inset-bottom));
  overflow: hidden;
  border-radius: 24px 24px 0 0;
  background: var(--dp-bg-surface);
  box-shadow: 0 -18px 48px rgba(15, 23, 42, 0.22);
  border: 1px solid var(--dp-border);
  animation: mobile-more-in 0.2s ease-out;
}

.mobile-more-handle {
  width: 40px;
  height: 4px;
  margin: 0 auto 12px;
  border-radius: 999px;
  background: var(--dp-border);
}

.mobile-more-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.mobile-more-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--dp-text-primary);
}

.mobile-more-desc {
  margin-top: 3px;
  color: var(--dp-text-tertiary);
  font-size: 12px;
}

.mobile-more-content {
  max-height: calc(min(78vh, 680px) - 90px);
  overflow-y: auto;
  padding-bottom: 6px;
}

.mobile-more-group + .mobile-more-group {
  margin-top: 14px;
}

.mobile-more-group-title {
  margin: 0 0 8px;
  font-size: 12px;
  line-height: 1;
  color: var(--dp-text-tertiary);
  font-weight: 700;
}

.mobile-more-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  min-height: 58px;
  padding: 10px 12px;
  border-radius: 16px;
  color: inherit;
  text-decoration: none;
  background: var(--dp-bg-surface-muted);
  border: 1px solid transparent;
}

.mobile-more-item + .mobile-more-item {
  margin-top: 8px;
}

.mobile-more-item.active {
  border-color: var(--color-primary-3);
  background: var(--dp-bg-hover);
}

.mobile-more-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--dp-bg-surface);
  color: var(--color-primary-6);
  flex-shrink: 0;
}

.mobile-more-icon {
  width: 20px;
  height: 20px;
}

.mobile-more-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.mobile-more-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--dp-text-primary);
}

.mobile-more-item-desc {
  font-size: 12px;
  color: var(--dp-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@keyframes mobile-more-in {
  from {
    transform: translateY(24px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .fixed-header {
    height: calc(var(--dp-mobile-top-bar-height) + env(safe-area-inset-top));
  }

  .layout-demo {
    height: calc(100vh - var(--dp-mobile-top-bar-height) - env(safe-area-inset-top));
    margin-top: calc(var(--dp-mobile-top-bar-height) + env(safe-area-inset-top));
  }

  .main-content,
  .main-content.sider-collapsed {
    margin-left: 0;
  }

  .content-wrapper {
    padding: 12px;
    background: var(--dp-bg-app);
    scroll-behavior: auto;
  }

  .content-wrapper.mobile-has-bottom-nav {
    padding-bottom: calc(var(--dp-mobile-bottom-nav-height) + env(safe-area-inset-bottom) + 14px);
  }

  .content-wrapper.mobile-immersive-content {
    padding-bottom: 0;
  }

  .content-wrapper.search-page,
  .content-wrapper.download-manager-page {
    padding: 0;
  }

  .content-wrapper.search-page.mobile-has-bottom-nav,
  .content-wrapper.download-manager-page.mobile-has-bottom-nav {
    padding-bottom: calc(var(--dp-mobile-bottom-nav-height) + env(safe-area-inset-bottom));
  }
}

@media (max-width: 480px) {
  .content-wrapper {
    padding: 10px;
  }

  .mobile-top-bar {
    grid-template-columns: 38px minmax(0, 1fr) minmax(68px, auto) 38px;
    padding-left: 8px;
    padding-right: 8px;
  }

  .mobile-search-pill {
    min-width: 68px;
    padding: 0 10px;
  }

  .mobile-more-panel {
    padding-left: 10px;
    padding-right: 10px;
  }
}
</style>
