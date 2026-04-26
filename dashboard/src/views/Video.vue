<template>
  <div class="desktop-video-breadcrumb">
    <Breadcrumb
      ref="breadcrumbRef"
      @handleOpenForm="handleOpenForm"
      @refreshPage="refreshPage"
      @minimize="minimize"
      @maximize="maximize"
      @closeWindow="closeWindow"
      @onSearch="onSearch"
      @handlePush="handlePush"
      @actionExecuted="handleActionExecuted"
      :now_site_title="form.now_site_title"
      :sites="form.sites"
    >
      <!-- 默认插槽的内容放这里 -->
      <div class="current-time">
        <span>{{ currentDateTime }}</span>
      </div>
    </Breadcrumb>
  </div>

  <div class="mobile-video-hub">
    <div class="mobile-video-source-row">
      <button class="mobile-source-chip" type="button" @click="handleOpenForm">
        <span class="mobile-chip-label">当前片源</span>
        <strong>{{ form.now_site_title || '选择片源' }}</strong>
      </button>
      <div class="mobile-video-actions">
        <button class="mobile-tool-btn" type="button" @click="refreshPage">刷新</button>
        <button class="mobile-tool-btn" type="button" @click="router.push({ name: 'SearchAggregation' })">聚合</button>
        <button class="mobile-tool-btn" type="button" @click="openMobilePush">推送</button>
        <button class="mobile-tool-btn" type="button" @click="openMobileGlobalAction">动作</button>
      </div>
    </div>
    <form class="mobile-video-search" @submit.prevent="runMobileSearch">
      <input v-model="mobileSearchKeyword" type="search" placeholder="搜索当前片源的影片" />
      <button type="submit">搜索</button>
    </form>
    <div v-if="searchState.isSearching" class="mobile-search-state">
      <span>正在查看“{{ searchState.searchKeyword }}”的结果</span>
      <button type="button" @click="clearMobileSearch">返回分类</button>
    </div>
  </div>

  <!-- 内容区域 -->
  <div class="main-container">
    <!-- 全局loading指示器 -->
    <div v-if="globalLoading" class="global-loading-overlay">
      <div class="global-loading-content">
        <a-spin :size="32" />
        <div class="loading-text">正在切换数据源...</div>
        <!-- 手动关闭按钮 -->
        <a-button 
          type="outline" 
          size="small" 
          @click="handleCloseGlobalLoading"
          class="close-loading-btn"
        >
          手动关闭
        </a-button>
      </div>
    </div>
    
    <a-layout-content class="content">
      <!-- 搜索结果展示 -->
      <SearchResults 
        v-if="searchState.isSearching"
        :keyword="searchState.searchKeyword"
        :videos="searchState.searchResults"
        :loading="searchState.searchLoading"
        :error="searchState.searchError"
        :currentPage="searchState.currentPage"
        :totalPages="searchState.totalPages"
        :hasMore="searchState.hasMore"
        :scrollPosition="searchState.scrollPosition"
        :sourceRoute="{ name: route.name, params: route.params, query: route.query }"
        :module="form.now_site?.key || nowSite?.key"
        :extend="form.now_site?.ext"
        :api-url="form.now_site?.api"
        @load-more="onSearchLoadMore"
        @exit-search="exitSearch"
        @video-click="handleVideoClick"
        @refresh-list="handleRefreshList"
      />
      
      <!-- 默认视频列表 -->
      <VideoList 
        v-else
        ref="videoListRef"
        :classList="form.classList" 
        :recommendVideos="form.recommendVideos"
        :sourceRoute="{ 
          name: route.name, 
          params: route.params, 
          query: { 
            ...route.query, 
            activeKey: currentActiveKey,
            // 添加folder状态信息
            folderState: folderNavigationState.value?.isActive ? JSON.stringify({
              isActive: folderNavigationState.value.isActive,
              breadcrumbs: folderNavigationState.value.breadcrumbs,
              currentBreadcrumb: folderNavigationState.value.currentBreadcrumb
            }) : undefined
          } 
        }"
        :returnToActiveKey="route.query._returnToActiveKey"
        :module="form.now_site?.key || nowSite?.key"
        :extend="form.now_site?.ext"
        :api-url="form.now_site?.api"
        :specialCategoryState="specialCategoryState"
        :folderNavigationState="folderNavigationState"
        @activeKeyChange="handleActiveKeyChange"
        @special-action="handleSpecialAction"
        @close-special-category="closeSpecialCategory"
        @folder-navigate="handleFolderNavigate"
      />
    </a-layout-content>
  </div>

  <SourceDialog
    :visible="form.visible"
    :title="form.form_title"
    :sites="form.sites"
    :currentSiteKey="form.now_site.key"
    @update:visible="(val) => (form.visible = val)"
    @confirm-clear="handleConfirmClear"
    @confirm-change="handleConfirmChange"
    @change-rule="handleChangeRule"
  />
</template>

<script setup>
import { ref, reactive, shallowRef, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import SourceDialog from "../components/SourceDialog.vue";
import Breadcrumb from "../components/Breadcrumb.vue";
import VideoList from "../components/VideoList.vue";
import SearchResults from "../components/SearchResults.vue";
import { videoService, siteService } from "@/api/services";
import { getCategoryData } from '@/api/modules/module';
import { useSiteStore } from "@/stores/siteStore";
import { usePaginationStore } from "@/stores/paginationStore";
import { usePageStateStore } from "@/stores/pageStateStore";
import { useRoute, useRouter } from "vue-router";
import { Message } from "@arco-design/web-vue";

const { nowSite, setCurrentSite } = useSiteStore();
const paginationStore = usePaginationStore();
const pageStateStore = usePageStateStore();
const route = useRoute();
const router = useRouter();

// 时间格式化函数
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const currentDateTime = ref(formatDate(new Date())); // 初始化时就设置当前时间
const mobileSearchKeyword = ref('');
const currentActiveKey = ref(route.query.activeKey || ""); // 当前选中的分类key，优先使用URL参数
const videoListRef = ref(null); // VideoList组件引用
const breadcrumbRef = ref(null);
const form = reactive({
  sites: [],
  now_site_title: "hipy影视",
  now_site: {},
  visible: false,
  form_title: "",
  recommendVideos: [],
  classList: {},
  videoList: {},
});

const currentSiteKey = () => form.now_site?.key || nowSite?.key || '';

// 搜索相关状态
const searchState = reactive({
  isSearching: false,
  searchKeyword: "",
  searchResults: [],
  searchLoading: false,
  searchError: null,
  currentPage: 1,
  totalPages: 1,
  hasMore: false,
  scrollPosition: 0
});

// 特殊分类状态
const specialCategoryState = reactive({
  isActive: false,
  categoryData: null,
  originalClassList: null,
  originalRecommendVideos: null
});

// Folder导航状态 - 使用shallowRef避免深度响应式更新
const folderNavigationState = shallowRef({
  isActive: false,
  breadcrumbs: [],
  currentData: [],
  currentBreadcrumb: null,
  loading: false
});

// 全局loading状态（用于换源等操作）
const globalLoading = ref(false);

// 保存进入folder模式前的状态
const previousState = reactive({
  activeKey: null,
  scrollPosition: 0,
  savedAt: null
});

const timer = ref(null);
const getData = async (forceRefresh = false) => {
  try {
    // 首先尝试从配置服务获取站点数据
    const configStatus = siteService.getConfigStatus();
    
    if (configStatus.hasConfigUrl) {
      try {
        // 如果有配置地址，从配置地址加载站点数据
        await siteService.loadSitesFromConfig(forceRefresh);
      } catch (configError) {
        console.error("从配置地址加载站点数据失败:", configError);
        // 配置加载失败时，使用本地存储的站点数据
      }
    }
    
    // 获取所有站点配置
    form.sites = siteService.getAllSites();
    
    // 如果仍然没有站点配置，提示用户设置配置地址
    if (form.sites.length === 0) {
      // 暂无站点配置，请在设置中配置数据源地址
    }
  } catch (error) {
    console.error("获取站点配置失败:", error);
  }
};

const getNowSite = () => {
  // 优先使用siteService中的当前站点
  const currentSite = siteService.getCurrentSite();
  if (currentSite) {
    form.now_site = currentSite;
    form.now_site_title = currentSite.name;
    // 同步到 siteStore
    setCurrentSite(currentSite);
  } else if (nowSite && nowSite.name) {
    form.now_site = nowSite;
    form.now_site_title = nowSite.name;
    // 同步到siteService
    siteService.setCurrentSite(nowSite.key);
  } else {
    // 如果都没有，清空当前源
    form.now_site = {};
    form.now_site_title = "hipy影视";
  }
};

const checkNowSite = () => {
  // 确保 form.now_site 有值，如果没有则从 siteService 获取
  if (!form.now_site || !form.now_site.key) {
    const currentSite = siteService.getCurrentSite();
    if (currentSite) {
      form.now_site = currentSite;
      form.now_site_title = currentSite.name;
    } else if (form.sites.length > 0) {
      // 如果没有当前源，设置第一个可用源
      const firstSite = form.sites.find(site => site.type === 4) || form.sites[0];
      if (firstSite) {
        form.now_site = firstSite;
        form.now_site_title = firstSite.name;
        siteService.setCurrentSite(firstSite.key);
      }
    }
  } else {
    // 检查当前源是否在站点列表中
    const siteExists = form.sites.some(site => site.key === form.now_site.key);
    if (!siteExists && form.sites.length > 0) {
      // 如果当前源不在列表中，设置第一个可用源
      const firstSite = form.sites.find(site => site.type === 4) || form.sites[0];
      if (firstSite) {
        form.now_site = firstSite;
        form.now_site_title = firstSite.name;
        siteService.setCurrentSite(firstSite.key);
      }
    }
  }
  
  // 设置 new_site 用于换源对话框
  form.new_site = form.now_site;
};

// 启动定时器
const startClock = () => {
  timer.value = setInterval(() => {
    currentDateTime.value = formatDate(new Date());
  }, 1000); // 每秒更新时间
};

const refreshPage = () => {
  window.location.reload();
};

// 处理重载源事件
const handleReloadSource = (event) => {
  console.log('收到重载源事件:', event.detail);
  // 执行重载源功能（相当于点击重载源按钮）
  refreshPage();
};

const minimize = () => {};
const maximize = () => {};
const closeWindow = () => {};

const handleChangeRule = (site) => (form.new_site = site);

const handleConfirmClear = () => {
  form.now_site = form.new_site;
  setCurrentSite(form.now_site);
  form.visible = false;
  getData(true); // 传递 forceRefresh=true 强制刷新配置数据
  checkNowSite();
};

const handleConfirmChange = (site) => {
  form.now_site = site;
  pageStateStore.clearPageState('video');
  // 使用 siteStore 统一管理站点切换
  setCurrentSite(site);
  form.now_site_title = site.name;
  form.visible = false;
  
  // 1. 如果当前在目录模式，自动退出目录模式
  if (folderNavigationState.value?.isActive) {
    folderNavigationState.value = {
      isActive: false,
      breadcrumbs: [],
      currentData: [],
      currentBreadcrumb: null,
      loading: false
    };
    
    // 清空保存的状态
    previousState.activeKey = null;
    previousState.scrollPosition = 0;
    previousState.savedAt = null;
  }
  
  getClassList(site); //获取分类列表
};
//获取分类列表
const getClassList = async (site) => {
  if (!site || !site.key) {
    return;
  }
  
  // 2. 显示loading状态
  globalLoading.value = true;

  // 先清除之前的数据，防止数据残留
  form.classList = {
    class: [],
    filters: {}
  };
  form.recommendVideos = [];

  try {
    const isFirstSite = form.sites.findIndex(s => s.key === site.key) === 0;
    
    console.log('[Video.vue] 开始获取首页数据:', {
      siteKey: site.key,
      siteName: site.name,
      extend: site.ext,
      apiUrl: site.api,
      isFirstSite: isFirstSite
    });
    
    // 如果是第一个源，强制清除该模块的缓存
    if (isFirstSite) {
      console.log('[Video.vue] 检测到第一个源，清除缓存');
      videoService.clearModuleCache(site.key);
    }
    
    // 使用videoService获取首页数据，包含分类信息
    const homeData = await videoService.getRecommendVideos(site.key, {
      extend: site.ext,
      apiUrl: site.api
    });
    
    console.log('[Video.vue] 首页数据获取成功:', {
      siteKey: site.key,
      categoriesCount: homeData.categories?.length || 0,
      videosCount: homeData.videos?.length || 0,
      hasVideos: !!(homeData.videos && homeData.videos.length > 0),
      firstVideo: homeData.videos?.[0]
    });
    
    form.classList = {
      class: homeData.categories,
      filters: homeData.filters
    };
    
    // 保存推荐视频数据，如果没有推荐数据则保持为空数组
    form.recommendVideos = homeData.videos || [];
    
    console.log('[Video.vue] 推荐数据已设置:', {
      siteKey: site.key,
      recommendVideosLength: form.recommendVideos.length,
      isFirstSite: form.sites.findIndex(s => s.key === site.key) === 0
    });
  } catch (error) {
    console.error("获取分类列表失败:", error);
    // 降级处理：使用空的分类列表
    form.classList = {
      class: [],
      filters: {}
    };
    form.recommendVideos = [];
  } finally {
    // 3. 隐藏loading状态
    globalLoading.value = false;
  }
};
const onSearch = async (value) => {
  if (!value || !value.trim()) {
    // 如果搜索内容为空，退出搜索模式
    searchState.isSearching = false;
    searchState.searchKeyword = "";
    searchState.searchResults = [];
    return;
  }

  const keyword = value.trim();
  searchState.searchKeyword = keyword;
  searchState.isSearching = true;
  searchState.searchLoading = true;
  searchState.searchError = null;
  searchState.currentPage = 1;

  try {
    if (!form.now_site || !form.now_site.key) {
      throw new Error("请先选择数据源");
    }

    // 调用搜索API
    const searchData = await videoService.searchVideo(form.now_site.key, {
      keyword: keyword,
      page: 1,
      extend: form.now_site.ext,
      apiUrl: form.now_site.api
    });

    searchState.searchResults = searchData.videos || [];
    searchState.totalPages = searchData.pagination?.totalPages || 1;
    searchState.hasMore = searchData.pagination?.hasNext || false;
  } catch (error) {
    console.error("搜索失败:", error);
    searchState.searchError = error.message || "搜索失败，请重试";
    searchState.searchResults = [];
  } finally {
    searchState.searchLoading = false;
  }
};

const runMobileSearch = () => {
  onSearch(mobileSearchKeyword.value);
};

const openMobilePush = () => {
  breadcrumbRef.value?.openPushModal?.();
};

const openMobileGlobalAction = () => {
  breadcrumbRef.value?.openGlobalActionDialog?.();
};

const clearMobileSearch = () => {
  mobileSearchKeyword.value = '';
  exitSearch();
};

// 搜索加载更多
const onSearchLoadMore = async () => {
  if (searchState.searchLoading || !searchState.searchKeyword || !searchState.hasMore) return;

  searchState.searchLoading = true;
  const nextPage = searchState.currentPage + 1;

  try {
    const searchData = await videoService.searchVideo(form.now_site.key, {
      keyword: searchState.searchKeyword,
      page: nextPage,
      extend: form.now_site.ext,
      apiUrl: form.now_site.api
    });



    // 追加新的搜索结果到现有结果中
    const newVideos = searchData.videos || [];
    
    // 检查是否有重复数据或no_data标识
    const existingIds = new Set(searchState.searchResults.map(v => v.vod_id));
    const uniqueNewVideos = newVideos.filter(video => {
      // 过滤掉重复的视频和no_data标识
      return !existingIds.has(video.vod_id) && 
             video.vod_id !== 'no_data' && 
             video.vod_name !== 'no_data';
    });
    
    // 如果新数据为空或全部重复，表示没有更多数据
     if (uniqueNewVideos.length === 0) {
       searchState.hasMore = false;
     } else {
      searchState.searchResults = [...searchState.searchResults, ...uniqueNewVideos];
      searchState.hasMore = searchData.pagination?.hasNext !== false; // 只有明确返回false才停止
    }
    
    searchState.currentPage = nextPage;
    searchState.totalPages = searchData.pagination?.totalPages || searchState.totalPages;
  } catch (error) {
    console.error("搜索加载更多失败:", error);
    searchState.searchError = error.message || "加载失败，请重试";
  } finally {
    searchState.searchLoading = false;
  }
};

// 退出搜索模式
const exitSearch = () => {
  searchState.isSearching = false;
  searchState.searchKeyword = "";
  searchState.searchResults = [];
  searchState.searchError = null;
  searchState.currentPage = 1;
};

// 处理分类变化事件
const handleActiveKeyChange = (activeKey) => {
  currentActiveKey.value = activeKey;
  
  // 同步更新地址栏的activeKey参数
  const newQuery = { ...route.query };
  if (activeKey) {
    newQuery.activeKey = activeKey;
  } else {
    delete newQuery.activeKey;
  }
  
  // 使用replace避免产生新的历史记录
  router.replace({ 
    name: route.name,
    params: route.params,
    query: newQuery 
  });
  
  console.log('[DEBUG] 地址栏activeKey已更新:', activeKey);
};

// 处理视频点击事件
const handleVideoClick = (video) => {
  if (video && video.vod_id) {
    let fromSearch = 'false';
    
    // 判断当前是否在搜索状态
    if (searchState.isSearching) {
      // 搜索状态的保存由SearchResults组件处理
      fromSearch = 'true';
    } else {
      // 保存分类状态
      if (currentActiveKey.value) {
        pageStateStore.saveVideoState(
          currentSiteKey(),
          currentActiveKey.value,
          1, // 当前页码
          [], // 视频列表
          true, // hasMore状态
          false, // loading状态
          window.scrollY // 当前滚动位置
        );
      }
    }
    
    // 构建目标路由的query参数
    const targetQuery = {
      name: video.vod_name,
      pic: video.vod_pic,
      year: video.vod_year,
      area: video.vod_area,
      type: video.vod_type,
      remarks: video.vod_remarks,
      content: video.vod_content,
      actor: video.vod_actor,
      director: video.vod_director,
      // 传递来源页面信息
      sourceRouteName: route.name,
      sourceRouteParams: JSON.stringify(route.params),
      sourceRouteQuery: JSON.stringify({ ...route.query, activeKey: currentActiveKey.value }),
      fromSearch: fromSearch, // 标识是否来自搜索
      // 添加来源图片信息，用于详情页图片备用
      sourcePic: video.vod_pic
    };
    
    // 如果当前在folder模式，添加folder状态信息
    if (folderNavigationState.value?.isActive) {
      targetQuery.folderState = JSON.stringify({
        isActive: folderNavigationState.value.isActive,
        breadcrumbs: folderNavigationState.value.breadcrumbs,
        currentBreadcrumb: folderNavigationState.value.currentBreadcrumb
      });
    }
    
    router.push({
      name: 'VideoDetail',
      params: { id: video.vod_id },
      query: targetQuery
    });
  }
};

// 处理刷新列表事件
const handleRefreshList = () => {
  if (searchState.isSearching) {
    // 如果在搜索状态，重新执行搜索
    // 可以重新调用搜索方法
    // searchVideos(searchState.searchKeyword);
  } else {
    // 如果在分类列表状态，刷新当前分类
    if (videoListRef.value) {
      videoListRef.value.refreshCurrentCategory();
    }
  }
};

// 处理特殊动作事件
const handleSpecialAction = async (actionType, actionData) => {
  switch (actionType) {
    case '__self_search__':
      await handleSelfSearchAction(actionData);
      break;
    default:
      console.warn('🎯 [WARN] 未知的特殊动作类型:', actionType);
      break;
  }
};

// 处理源内搜索动作
const handleSelfSearchAction = async (categoryData) => {
  try {
    // 保存当前状态
    if (!specialCategoryState.isActive) {
      specialCategoryState.originalClassList = form.classList;
      specialCategoryState.originalRecommendVideos = form.recommendVideos;
    }
    
    // 解析T4返回的参数
    const tid = categoryData.tid || categoryData.type_id || categoryData.actionData?.tid;
    const typeName = categoryData.name || categoryData.type_name || `搜索: ${tid}`;
    
    if (!tid) {
      console.error('🔍 [ERROR] 源内搜索参数不完整：缺少tid');
      Message.error('源内搜索参数不完整：缺少tid');
      return;
    }
    
    // 使用tid调用T4分类接口获取视频数据
    const categoryResult = await videoService.getCategoryVideos(
      form.now_site?.key || nowSite?.key,
      {
        typeId: tid,
        page: 1,
        filters: {},
        apiUrl: form.now_site?.api,
        extend: form.now_site?.ext
      }
    );
    
    // 构造特殊分类数据结构
    const specialClassList = {
      class: [{
        type_id: tid,
        type_name: typeName
      }],
      filters: {}
    };
    
    // 设置特殊分类状态
    specialCategoryState.isActive = true;
    specialCategoryState.categoryData = {
      type_id: tid,
      type_name: typeName,
      originalData: categoryData,
      videos: categoryResult.videos || [],
      pagination: categoryResult.pagination || {}
    };
    
    // 更新分类列表和推荐视频
    form.classList = specialClassList;
    form.recommendVideos = []; // 隐藏推荐视频
    
    // 切换到特殊分类
    currentActiveKey.value = tid;
    
    // 等待下一个tick，确保VideoList组件已经接收到新的props
    await nextTick();
    
    // 直接设置VideoList组件的数据，而不是触发刷新
    if (videoListRef.value && categoryResult.videos) {
      // 通过VideoList的暴露方法直接设置数据
      videoListRef.value.setSpecialCategoryData(tid, categoryResult.videos, categoryResult.pagination);
    }
    
  } catch (error) {
    console.error('处理源内搜索失败:', error);
    Message.error(`源内搜索失败: ${error.message}`);
  }
};

// 关闭特殊分类，返回正常显示
const closeSpecialCategory = () => {
  if (!specialCategoryState.isActive) {
    return;
  }
  
  // 恢复原始状态
  form.classList = specialCategoryState.originalClassList;
  form.recommendVideos = specialCategoryState.originalRecommendVideos;
  
  // 重置特殊分类状态
  specialCategoryState.isActive = false;
  specialCategoryState.categoryData = null;
  specialCategoryState.originalClassList = null;
  specialCategoryState.originalRecommendVideos = null;
  
  // 切换回推荐分类
  currentActiveKey.value = 'recommendTuijian404';
};

// 防止递归更新的标志
let isUpdatingFolderState = false;
let updateTimeout = null;
let lastNavigationData = null;
let lastNavigationTime = 0;

// 处理folder导航事件
const handleFolderNavigate = async (navigationData) => {
  // 参数验证
  if (!navigationData || typeof navigationData !== 'object') {
    console.error('navigationData 无效:', navigationData);
    return;
  }
  
  // 防止重复更新
  if (isUpdatingFolderState) {
    console.log('folder状态正在更新中，跳过重复调用');
    return;
  }
  
  // 防止过于频繁的更新（最小间隔200ms）
  const now = Date.now();
  if (now - lastNavigationTime < 200) {
    console.log('folder导航更新过于频繁，跳过');
    // return;
  }
  
  // 检查是否是相同的导航数据
  const navigationDataStr = JSON.stringify(navigationData);
  if (lastNavigationData === navigationDataStr) {
    console.log('相同的folder导航数据，跳过重复处理');
    return;
  }
  
  // 清除之前的超时
  if (updateTimeout) {
    clearTimeout(updateTimeout);
    updateTimeout = null;
  }
  
  isUpdatingFolderState = true;
  lastNavigationData = navigationDataStr;
  lastNavigationTime = now;
  
  try {
    // 保存当前状态（进入folder模式时）
    if (navigationData.isActive && !folderNavigationState.value?.isActive) {
      previousState.activeKey = currentActiveKey.value;
      previousState.scrollPosition = window.scrollY || 0;
      previousState.savedAt = Date.now();
    }
    
    // 恢复之前的状态（退出folder模式时）
    if (!navigationData.isActive && folderNavigationState.value?.isActive) {
      if (previousState.activeKey) {
        currentActiveKey.value = previousState.activeKey;
      }
      
      // 恢复滚动位置
      if (previousState.scrollPosition) {
        nextTick(() => {
          window.scrollTo(0, previousState.scrollPosition);
        });
      }
      
      // 清除保存的状态
      previousState.activeKey = null;
      previousState.scrollPosition = 0;
      previousState.savedAt = null;
    }
    
    // 使用 nextTick 确保在下一个 tick 中更新，避免响应式循环
    await nextTick();
    
    // 深度克隆数据，完全断开响应式连接
    const deepClone = (obj) => {
      if (obj === null || typeof obj !== 'object') return obj;
      if (obj instanceof Date) return new Date(obj.getTime());
      if (obj instanceof Array) return obj.map(item => deepClone(item));
      if (typeof obj === 'object') {
        const cloned = {};
        Object.keys(obj).forEach(key => {
          cloned[key] = deepClone(obj[key]);
        });
        return cloned;
      }
      return obj;
    };
    
    // 创建完全独立的新状态对象
    const newState = {
      isActive: Boolean(navigationData.isActive),
      breadcrumbs: deepClone(navigationData.breadcrumbs || []),
      currentData: deepClone(navigationData.currentData || []),
      currentBreadcrumb: deepClone(navigationData.currentBreadcrumb || null),
      loading: Boolean(navigationData.loading || false)
    };
    
    // 使用 shallowRef 的 .value 完全替换对象，避免响应式循环
    folderNavigationState.value = newState;
    
  } catch (error) {
    console.error('更新folder状态时出错:', error);
  } finally {
    // 重置更新标志
    isUpdatingFolderState = false;
    updateTimeout = null;
  }
};



const handleOpenForm = () => {
  form.visible = true;
  // 过滤出 type 为 4 的数据源
  const type4Sites = form.sites.filter(site => site.type === 4);
  form.form_title = `请选择数据源(${type4Sites.length})`;
  checkNowSite();
};

// 手动关闭全局loading
const handleCloseGlobalLoading = () => {
  globalLoading.value = false;
};

// 处理推送功能
const handlePush = async (vodId) => {
  if (!vodId || !vodId.trim()) {
    Message.error("推送内容不能为空");
    return;
  }

  // 检查是否存在push_agent源
  const pushAgentSite = form.sites.find(site => site.key === 'push_agent');
  
  if (!pushAgentSite) {
    Message.error("没有找到push_agent服务，请检查源配置");
    return;
  }

  try {
    // 参考收藏和历史功能，使用临时源跳转到详情页
    router.push({
      name: 'VideoDetail',
      params: { id: vodId.trim() },
      query: {
        // 基本视频信息（推送时可能没有完整信息）
        name: `推送内容-${vodId.trim()}`,
        pic: '',
        year: '',
        area: '',
        type: '',
        type_name: '',
        remarks: '',
        content: '',
        actor: '',
        director: '',
        // 标识从推送进入，使用临时站源
        fromPush: 'true',
        // 传递push_agent站源信息，不影响全局状态
        tempSiteName: pushAgentSite.name,
        tempSiteApi: pushAgentSite.api,
        tempSiteKey: pushAgentSite.key,
        // 传递来源页面信息
        sourceRouteName: route.name,
        sourceRouteParams: JSON.stringify(route.params),
        sourceRouteQuery: JSON.stringify(route.query),
        // 添加来源图片信息，用于详情页图片备用（推送时通常没有图片）
        sourcePic: ''
      }
    });
    
    Message.success(`正在推送内容: ${vodId.trim()}`);
  } catch (error) {
    console.error("推送失败:", error);
    Message.error("推送失败，请重试");
  }
};

// 处理全局动作执行完成事件
const handleActionExecuted = (event) => {
  console.log('全局动作执行完成:', event);
  
  // 添加安全检查，防止null引用错误
  if (!event || typeof event !== 'object') {
    console.warn('Invalid event object received in handleActionExecuted');
    return;
  }
  
  const actionName = event.action?.name || '未知动作';
  
  if (event.success) {
    // 动作执行成功，可以根据需要进行后续处理
    console.log('动作执行成功:', actionName, event.result);
    
    // 如果动作返回了特殊结果，可以在这里处理
    if (event.result && event.result.refresh) {
      // 如果动作要求刷新页面
      refreshPage();
    }
    
    if (event.result && event.result.navigate) {
      // 如果动作要求导航到其他页面
      router.push(event.result.navigate);
    }
  } else {
    // 动作执行失败
    console.error('动作执行失败:', actionName, event.error);
  }
};

// 监听路由查询参数变化，确保activeKey与URL同步
watch(() => route.query.activeKey, (newActiveKey) => {
  if (newActiveKey && newActiveKey !== currentActiveKey.value) {
    console.log('[DEBUG] URL activeKey changed:', newActiveKey, 'current:', currentActiveKey.value);
    currentActiveKey.value = newActiveKey;
  }
}, { immediate: true });

// 页面加载时获取数据
onMounted(async () => {
  await getData(); // 页面加载时获取数据，等待完成
  getNowSite(); // 获取储存的当前源
  checkNowSite(); // 确保当前源设置正确
  
  // 监听重载源事件
  window.addEventListener('reloadSource', handleReloadSource);
  
  // 检查是否需要恢复搜索状态
    const restoreSearch = route.query._restoreSearch;
    const returnToActiveKey = route.query._returnToActiveKey;
    const restoreFolderState = route.query.folderState;
    
    if (restoreSearch === 'true') {
      // 恢复搜索状态
      const savedSearchState = pageStateStore.getPageState('search');
      if (savedSearchState && savedSearchState.keyword && !pageStateStore.isStateExpired('search')) {
        // 恢复搜索相关状态
        searchState.isSearching = true;
        searchState.searchKeyword = savedSearchState.keyword;
        searchState.searchResults = savedSearchState.videos || [];
        searchState.currentPage = savedSearchState.currentPage || 1;
        searchState.hasMore = savedSearchState.hasMore || false;
        searchState.searchLoading = false;
        searchState.searchError = null;
        searchState.scrollPosition = savedSearchState.scrollPosition || 0;
        
        // 清除URL中的恢复参数
        const newQuery = { ...route.query };
        delete newQuery._restoreSearch;
        router.replace({ query: newQuery });
        
        await getClassList(form.now_site);
        startClock(); // 启动时钟
        
        return; // 搜索状态恢复完成，不再执行分类恢复逻辑
      }
    }
  
  // 尝试恢复页面状态
  const savedState = pageStateStore.getPageState('video');
  const isStateExpired = pageStateStore.isStateExpired('video');
  
  let shouldRestoreState = false;
  let hasFolderStateToRestore = false;
  
  if (returnToActiveKey) {
    // 如果有返回参数，优先使用返回参数
    currentActiveKey.value = returnToActiveKey;
    
    // 检查是否需要恢复folder状态
    if (restoreFolderState) {
      try {
        const folderState = JSON.parse(restoreFolderState);
        // 恢复folder导航状态
        const newFolderState = {
          isActive: folderState.isActive,
          breadcrumbs: folderState.breadcrumbs || [],
          currentBreadcrumb: folderState.currentBreadcrumb,
          currentData: [], // 数据需要重新获取
          loading: false
        };
        
        folderNavigationState.value = newFolderState;
        
        // 如果有当前面包屑，重新获取folder数据
        if (folderState.currentBreadcrumb && folderState.currentBreadcrumb.vod_id) {
          // 设置加载状态
          folderNavigationState.value = {
            ...folderNavigationState.value,
            loading: true
          };
          
          // 调用T4分类接口获取folder内容
          try {
            const requestParams = {
              t: folderState.currentBreadcrumb.vod_id,
              apiUrl: form.now_site?.api,
              extend: form.now_site?.ext
            };
            
            const response = await getCategoryData(form.now_site?.key || nowSite?.key, requestParams);
            
            if (response && response.list) {
              const updatedState = {
                ...folderNavigationState.value,
                currentData: response.list,
                loading: false
              };
              folderNavigationState.value = updatedState;
            } else {
              folderNavigationState.value = {
                ...folderNavigationState.value,
                loading: false
              };
            }
          } catch (error) {
            console.error('获取folder数据失败:', error);
            folderNavigationState.value = {
              ...folderNavigationState.value,
              loading: false
            };
          }
        }
        
        hasFolderStateToRestore = true;
      } catch (error) {
        console.error('解析folder状态失败:', error);
      }
    }
    
    // 只有在没有folder状态需要恢复且保存状态属于当前数据源时，才恢复列表数据
    if (!hasFolderStateToRestore) {
      const canRestoreSavedState = savedState?.siteKey && savedState.siteKey === currentSiteKey();
      if (canRestoreSavedState) {
        shouldRestoreState = true;
      } else {
        pageStateStore.clearPageState('video');
      }
    }
    
    // 清除URL中的返回参数
    const newQuery = { ...route.query };
    delete newQuery._returnToActiveKey;
    delete newQuery.folderState; // 同时清除folder状态参数
    router.replace({ query: newQuery });
  } else if (savedState && savedState.activeKey && !isStateExpired) {
    // 如果有保存的状态且未过期，只恢复同一数据源的状态
    const canRestoreSavedState = savedState.siteKey && savedState.siteKey === currentSiteKey();
    if (canRestoreSavedState) {
      currentActiveKey.value = savedState.activeKey;
      shouldRestoreState = true;
    } else {
      pageStateStore.clearPageState('video');
    }
  }
  
  // 确保分类列表已加载
  
  await getClassList(form.now_site);
  
  startClock(); // 启动时钟
  
  // 如果需要恢复状态且没有folder状态需要恢复，等待VideoList组件挂载后再恢复
  if (shouldRestoreState && !hasFolderStateToRestore) {
    setTimeout(() => {
      if (videoListRef.value) {
        videoListRef.value.restoreFullState({
          activeKey: currentActiveKey.value,
          currentPage: savedState?.currentPage || 1,
          videos: savedState?.videos || [],
          hasMore: savedState?.hasMore || true,
          scrollPosition: savedState?.scrollPosition || 0
        });
      }
    }, 100);
  }
});

// 清理定时器
onBeforeUnmount(() => {
  if (timer.value) {
    clearInterval(timer.value); // 销毁时清除定时器
  }
  
  // 移除重载源事件监听器
  window.removeEventListener('reloadSource', handleReloadSource);
  
  // 保存当前页面状态
  if (currentActiveKey.value && videoListRef.value) {
    const currentState = videoListRef.value.getCurrentState();
    pageStateStore.saveVideoState(
      currentSiteKey(),
      currentActiveKey.value,
      currentState.currentPage, // 从VideoList组件获取当前页码
      currentState.videos, // 从VideoList组件获取视频列表
      currentState.hasMore, // 从VideoList组件获取hasMore状态
      false, // loading状态
      currentState.scrollPosition // 从VideoList组件获取滚动位置
    );
  }
});
</script>

<style scoped>
/* 样式代码 */
.desktop-video-breadcrumb {
  display: block;
  max-width: var(--dp-page-max-width);
  margin: 0 auto 16px;
}

.mobile-video-hub {
  display: none;
}

.main-container {
  width: 100%;
  max-width: var(--dp-page-max-width);
  height: calc(100% - 58px);
  min-height: 0;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--dp-border-subtle);
  border-radius: var(--dp-radius-xl);
  background: var(--dp-bg-surface);
  box-shadow: var(--dp-shadow-sm);
}

.content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 16px;
  background: transparent;
}

/* 时间显示样式 */
.current-time {
  font-size: 14px;
  color: var(--color-text-2);
  white-space: nowrap;
  padding: 8px 12px;
  background: var(--color-bg-2);
  border-radius: 6px;
  border: 1px solid var(--color-border-2);
}

.current-time span {
  font-weight: 500;
}

/* 全局loading样式 */
.global-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(2px);
}

.global-loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px;
  background: var(--color-bg-1);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--color-border-2);
}

.loading-text {
  font-size: 16px;
  color: var(--color-text-1);
  font-weight: 500;
  text-align: center;
}

.close-loading-btn {
  margin-top: 8px;
  font-size: 12px;
  padding: 4px 12px;
  height: auto;
  min-height: 28px;
}

@media (min-width: 769px) {
  .desktop-video-breadcrumb {
    margin-bottom: 8px;
  }

  .main-container {
    border-left: none;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }

  .content {
    padding: 0;
  }
}

@media (max-width: 768px) {
  .desktop-video-breadcrumb {
    display: none;
  }

  .mobile-video-hub {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px 0 12px;
    background: var(--dp-bg-app);
  }

  .mobile-video-source-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px;
    align-items: stretch;
  }

  .mobile-video-actions {
    display: grid;
    grid-template-columns: repeat(2, 52px);
    gap: 6px;
  }

  .mobile-source-chip,
  .mobile-tool-btn,
  .mobile-video-search button,
  .mobile-search-state button {
    border: none;
    font-family: inherit;
  }

  .mobile-source-chip {
    min-width: 0;
    padding: 10px 12px;
    border-radius: 16px;
    background: var(--dp-bg-surface);
    border: 1px solid var(--dp-border-subtle);
    box-shadow: var(--dp-shadow-sm);
    color: var(--dp-text-primary);
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .mobile-chip-label {
    font-size: 10px;
    color: var(--dp-text-tertiary);
  }

  .mobile-source-chip strong {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
  }

  .mobile-tool-btn {
    min-width: 52px;
    min-height: 30px;
    padding: 0 8px;
    border-radius: 16px;
    background: var(--dp-bg-surface);
    border: 1px solid var(--dp-border-subtle);
    color: var(--dp-text-secondary);
    font-size: 12px;
    font-weight: 700;
  }

  .mobile-video-search {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 62px;
    gap: 8px;
  }

  .mobile-video-search input {
    min-width: 0;
    height: 42px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid var(--dp-border-subtle);
    background: var(--dp-bg-surface);
    color: var(--dp-text-primary);
    outline: none;
  }

  .mobile-video-search button {
    border-radius: 999px;
    background: var(--dp-primary-readable);
    color: #fff;
    font-weight: 800;
    box-shadow: 0 6px 16px color-mix(in srgb, var(--dp-primary-readable) 24%, transparent);
  }

  .mobile-search-state {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 14px;
    background: var(--dp-bg-hover);
    color: var(--dp-text-secondary);
    font-size: 12px;
  }

  .mobile-search-state span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mobile-search-state button {
    flex-shrink: 0;
    padding: 6px 10px;
    border-radius: 999px;
    background: var(--dp-bg-surface);
    color: var(--color-primary-6);
    font-size: 12px;
    font-weight: 700;
  }

  .main-container {
    height: calc(100% - 116px);
    border: none;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }

  .content {
    padding: 0;
  }
}
</style>
