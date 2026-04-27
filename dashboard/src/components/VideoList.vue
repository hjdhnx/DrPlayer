<template>
  <div class="video-list-container">
    <!-- 分类导航（集成筛选功能） - 始终显示，目录模式下切换分类会自动退出目录模式 -->
    <CategoryNavigation
      :classList="classList"
      :trigger="trigger"
      :hasRecommendVideos="hasRecommendVideos"
      :activeKey="activeKey"
      :filters="props.classList?.filters || {}"
      :selectedFilters="selectedFilters"
      :filterVisible="filterVisible"
      :specialCategoryState="props.specialCategoryState"
      @tab-change="handleTabChange"
      @open-category-modal="openCategoryModal"
      @toggle-filter="handleToggleFilter"
      @reset-filters="handleResetFilters"
      @filter-visible-change="handleFilterVisibleChange"
      @close-special-category="() => emit('close-special-category')"
    />

    <!-- Folder导航面包屑 -->
    <FolderBreadcrumb
      v-if="folderIsActive"
      :breadcrumbs="folderBreadcrumbs"
      @navigate="handleFolderNavigate"
      @go-back="handleFolderGoBack"
      @go-home="handleFolderGoHome"
      @exit-folder="handleExitFolder"
    />

    <!-- 内容区域 -->
    <div class="content-area">
      <!-- Folder导航内容 -->
      <div v-if="folderIsActive" class="tab-content">
        <VideoGrid
          :videos="folderCurrentData"
          :loading="folderLoading"
          :hasMore="folderHasMore"
          :statsText="folderStatsText"
          :sourceRoute="props.sourceRoute"
          :module="props.module"
          :extend="props.extend"
          :api-url="props.apiUrl"
          :folderState="folderNavigationState"
          @load-more="loadMoreFolderData(folderCurrentBreadcrumb?.vod_id)"
          @scroll-bottom="loadMoreFolderData(folderCurrentBreadcrumb?.vod_id)"
          @refresh-list="handleRefreshList"
          @special-action="(actionType, actionData) => emit('special-action', actionType, actionData)"
          @folder-navigate="handleFolderNavigateFromGrid"
        />
      </div>
      
      <!-- 特殊分类内容 -->
      <div v-else-if="specialCategoryState.isActive" class="tab-content">
        <!-- 分类数据获取loading -->
        <div v-if="loadingCategory[specialCategoryState.categoryData?.type_id]" class="category-loading-container">
          <a-spin :size="24" />
          <div class="loading-text">正在加载分类数据...</div>
        </div>
        <VideoGrid
          v-else
          :videos="listData[specialCategoryState.categoryData?.type_id] || []"
          :loading="loadingMore[specialCategoryState.categoryData?.type_id] || false"
          :hasMore="pageData[specialCategoryState.categoryData?.type_id]?.hasNext || false"
          :statsText="`${specialCategoryState.categoryData?.type_name || '特殊分类'}：共 ${listData[specialCategoryState.categoryData?.type_id]?.length || 0} 条`"
          :sourceRoute="props.sourceRoute"
          :module="props.module"
          :extend="props.extend"
          :api-url="props.apiUrl"
          @load-more="loadMoreData(specialCategoryState.categoryData?.type_id)"
          @scroll-bottom="loadMoreData(specialCategoryState.categoryData?.type_id)"
          @refresh-list="handleRefreshList"
          @special-action="(actionType, actionData) => emit('special-action', actionType, actionData)"
          @folder-navigate="handleFolderNavigateFromGrid"
        />
      </div>
      
      <!-- 推荐分类内容 -->
      <div v-else-if="activeKey === 'recommendTuijian404'" class="tab-content">

        <!-- 分类数据获取loading -->
        <div v-if="loadingCategory[activeKey]" class="category-loading-container">
          <a-spin :size="24" />
          <div class="loading-text">正在加载分类数据...</div>
        </div>

        <VideoGrid
          v-if="!loadingCategory[activeKey]"
          :videos="listData[activeKey] || []"
          :loading="loadingMore[activeKey] || false"
          :hasMore="false"
          :statsText="`推荐视频：共 ${listData[activeKey]?.length || 0} 条`"
          :sourceRoute="props.sourceRoute"
          :module="props.module"
          :extend="props.extend"
          :api-url="props.apiUrl"
          @refresh-list="handleRefreshList"
          @special-action="(actionType, actionData) => emit('special-action', actionType, actionData)"
        />
      </div>

      <!-- 其他分类内容 -->
      <div v-else class="tab-content">
        <!-- 分类数据获取loading -->
        <div v-if="loadingCategory[activeKey]" class="category-loading-container">
          <a-spin :size="24" />
          <div class="loading-text">正在加载分类数据...</div>
        </div>
        <!-- 视频网格 -->
        <VideoGrid
          v-else
          ref="videoGridRef"
          :videos="listData[activeKey] || []"
          :loading="loadingMore[activeKey] || false"
          :hasMore="pageData[activeKey]?.hasNext || false"
          :sourceRoute="props.sourceRoute"
          :module="props.module"
          :extend="props.extend"
          :api-url="props.apiUrl"
          @load-more="loadMoreData(activeKey)"
          @scroll-bottom="loadMoreData(activeKey)"
          @refresh-list="handleRefreshList"
          @special-action="(actionType, actionData) => emit('special-action', actionType, actionData)"
          @folder-navigate="handleFolderNavigateFromGrid"
        />
      </div>
    </div>

    <!-- 分类弹窗 -->
    <CategoryModal
      :visible="categoryModalVisible"
      @update:visible="(val) => categoryModalVisible = val"
      :classList="classList"
      :hasRecommendVideos="hasRecommendVideos"
      :activeKey="activeKey"
      @select-category="selectCategory"
    />
  </div>
</template>

<script setup>
import { videoService, siteService } from "@/api/services";
import { ref, reactive, onMounted, watch, computed, nextTick, onBeforeUnmount } from "vue";
import { usePaginationStore } from '@/stores/paginationStore';
import { getCategoryData } from '@/api/modules/module';
import { processExtendParam } from '@/utils/apiUtils';
import { encodeFilters } from '@/api/utils';
import { useRouter } from 'vue-router';
import CategoryNavigation from './CategoryNavigation.vue';
import FilterSection from './FilterSection.vue';
import VideoGrid from './VideoGrid.vue';
import CategoryModal from './CategoryModal.vue';
import FolderBreadcrumb from './FolderBreadcrumb.vue';

const props = defineProps({
  classList: Object,
  recommendVideos: {
    type: Array,
    default: () => []
  },
  trigger: {
    type: String,
    default: "click",
  },
  // 新增：来源页面信息
  sourceRoute: {
    type: Object,
    default: () => ({})
  },
  // 新增：返回时指定的activeKey
  returnToActiveKey: {
    type: String,
    default: ""
  },
  // T4接口调用相关参数
  module: {
    type: String,
    default: ''
  },
  extend: {
    type: [Object, String],
    default: () => ({})
  },
  apiUrl: {
    type: String,
    default: ''
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
  },
  // Folder导航状态
  folderNavigationState: {
    type: Object,
    default: () => ({
      isActive: false,
      breadcrumbs: [],
      currentData: [],
      currentBreadcrumb: null,
      loading: false
    })
  }
});

const emit = defineEmits(['activeKeyChange', 'special-action', 'close-special-category', 'folder-navigate']);

const router = useRouter();

// 使用翻页统计store
const paginationStore = usePaginationStore();

// 添加防抖函数和状态管理
let updateStatsTimer = null;
const isUpdatingStats = ref(false);
let lastStatsText = '';
let lastStatsUpdate = 0;

// 防抖更新统计信息函数
const debouncedUpdateStats = (statsText, delay = 100) => {
  // 防止重复更新相同的统计信息
  if (statsText === lastStatsText) {
    return;
  }
  
  // 防止过于频繁的更新（最小间隔200ms）
  const now = Date.now();
  if (now - lastStatsUpdate < 200) {
    return;
  }
  
  if (updateStatsTimer) {
    clearTimeout(updateStatsTimer);
  }
  
  updateStatsTimer = setTimeout(() => {
    if (!isUpdatingStats.value) {
      isUpdatingStats.value = true;
      lastStatsText = statsText;
      lastStatsUpdate = Date.now();
      
      try {
        paginationStore.updateStats(statsText);
      } catch (error) {
        console.error('更新统计信息失败:', error);
      } finally {
        isUpdatingStats.value = false;
      }
    }
  }, delay);
};

// 响应式数据
const activeKey = ref("");
const listData = reactive({});
const pageData = reactive({});
const loadingMore = reactive({});
const loadingCategory = reactive({}); // 新增：分类数据获取loading状态
const filterVisible = reactive({});
const selectedFilters = reactive({});
const categoryModalVisible = ref(false);
const videoGridRef = ref(null);

// 筛选条件和展开状态持久化函数
const saveFiltersToUrl = () => {
  const currentQuery = { ...router.currentRoute.value.query };
  
  if (Object.keys(selectedFilters).length > 0) {
    // 将筛选条件编码为JSON字符串保存到URL
    currentQuery.filters = JSON.stringify(selectedFilters);
  } else {
    // 如果没有筛选条件，删除URL中的filters参数
    delete currentQuery.filters;
  }
  
  // 保存筛选展开状态
  if (Object.keys(filterVisible).length > 0) {
    currentQuery.filterVisible = JSON.stringify(filterVisible);
  } else {
    delete currentQuery.filterVisible;
  }
  
  // 更新URL，但不触发页面刷新
  router.replace({
    query: currentQuery
  }).catch(() => {
    // 忽略导航重复错误
  });
};

// 从URL恢复筛选条件和展开状态
const restoreFiltersFromUrl = () => {
  const urlFilters = router.currentRoute.value.query.filters;
  const urlFilterVisible = router.currentRoute.value.query.filterVisible;
  
  // 恢复筛选条件
  if (urlFilters) {
    try {
      const parsedFilters = JSON.parse(urlFilters);
      // 清空现有筛选条件
      Object.keys(selectedFilters).forEach(key => {
        delete selectedFilters[key];
      });
      // 恢复筛选条件
      Object.assign(selectedFilters, parsedFilters);
    } catch (error) {
      console.error('解析URL中的筛选条件失败:', error);
    }
  }
  
  // 恢复筛选展开状态
  if (urlFilterVisible) {
    try {
      const parsedFilterVisible = JSON.parse(urlFilterVisible);
      // 清空现有展开状态
      Object.keys(filterVisible).forEach(key => {
        delete filterVisible[key];
      });
      // 恢复展开状态
      Object.assign(filterVisible, parsedFilterVisible);
    } catch (error) {
      console.error('解析URL中的筛选展开状态失败:', error);
    }
  }
};

// 目录模式翻页状态管理
const folderPageData = reactive({});
const folderLoadingMore = reactive({});

// 防抖机制：防止快速连续的导航操作
let navigationDebounceTimer = null;
const NAVIGATION_DEBOUNCE_DELAY = 300; // 300ms防抖延迟

const debounceNavigation = (callback) => {
  if (navigationDebounceTimer) {
    clearTimeout(navigationDebounceTimer);
  }
  navigationDebounceTimer = setTimeout(callback, NAVIGATION_DEBOUNCE_DELAY);
};

// 计算属性
const hasRecommendVideos = computed(() => {
  return props.recommendVideos && props.recommendVideos.length > 0;
});

// Folder导航相关计算属性，避免模板中直接访问响应式props
const folderIsActive = computed(() => {
  return props.folderNavigationState?.isActive || false;
});

const folderBreadcrumbs = computed(() => {
  return props.folderNavigationState?.breadcrumbs || [];
});

const folderCurrentData = computed(() => {
  return props.folderNavigationState?.currentData || [];
});

const folderCurrentBreadcrumb = computed(() => {
  return props.folderNavigationState?.currentBreadcrumb || null;
});

const folderLoading = computed(() => {
  const currentBreadcrumbId = folderCurrentBreadcrumb.value?.vod_id;
  return props.folderNavigationState?.loading || folderLoadingMore[currentBreadcrumbId] || false;
});

const folderHasMore = computed(() => {
  const currentBreadcrumbId = folderCurrentBreadcrumb.value?.vod_id;
  return folderPageData[currentBreadcrumbId]?.hasNext || false;
});

const folderStatsText = computed(() => {
  return getStatsText({
    isActive: folderIsActive.value,
    currentBreadcrumb: folderCurrentBreadcrumb.value,
    currentData: folderCurrentData.value
  });
});

// 计算默认的activeKey
const getDefaultActiveKey = () => {
  // 优先使用返回时指定的activeKey
  if (props.returnToActiveKey) {
    return props.returnToActiveKey;
  }
  
  if (hasRecommendVideos.value) {
    return "recommendTuijian404";
  }
  if (props.classList?.class && props.classList.class.length > 0) {
    const firstClassId = props.classList.class[0].type_id;
    return firstClassId;
  }
  return "recommendTuijian404";
};

// 筛选相关方法
const getFiltersForCategory = (categoryId) => {
  if (!props.classList?.filters || !props.classList.filters[categoryId]) {
    return null;
  }
  return props.classList.filters[categoryId];
};

const toggleFilter = (filterKey, filterValue, filterName) => {
  if (!selectedFilters[activeKey.value]) {
    selectedFilters[activeKey.value] = {};
  }
  
  // 如果已选中，则取消选择
  if (selectedFilters[activeKey.value][filterKey] === filterValue) {
    delete selectedFilters[activeKey.value][filterKey];
    // 如果没有任何筛选条件了，删除整个分类的筛选对象
    if (Object.keys(selectedFilters[activeKey.value]).length === 0) {
      delete selectedFilters[activeKey.value];
    }
  } else {
    // 否则选择该筛选条件
    selectedFilters[activeKey.value][filterKey] = filterValue;
  }
  
  // 保存筛选条件到URL
  saveFiltersToUrl();
  
  // 如果在目录模式下，重新获取目录数据
  if (folderIsActive.value && folderCurrentBreadcrumb.value) {
    handleFolderNavigate(folderCurrentBreadcrumb.value);
  } else {
    // 重新获取分类数据
    refreshCategoryData(activeKey.value);
  }
};

const resetFilters = (categoryId) => {
  delete selectedFilters[categoryId];
  
  // 保存筛选条件到URL
  saveFiltersToUrl();
  
  // 如果在目录模式下，重新获取目录数据
  if (folderIsActive.value && folderCurrentBreadcrumb.value) {
    handleFolderNavigate(folderCurrentBreadcrumb.value);
  } else {
    // 重新获取分类数据
    refreshCategoryData(categoryId);
  }
};

const refreshCategoryData = (categoryId) => {
  // 清除当前分类的所有数据，强制重新加载
  delete listData[categoryId];
  delete pageData[categoryId];
  
  // 重置加载状态
  loadingMore[categoryId] = false;
  
  // 如果是当前激活的分类，立即重新获取数据（强制重新加载）
  if (activeKey.value === categoryId) {
    getListData(categoryId, true);
  }
};

// 获取统计文本
const getStatsText = (categoryId, folderInfo = null) => {
  const categoryName = props.classList?.class?.find(item => item.type_id === categoryId)?.type_name || '';
  const currentPage = pageData[categoryId]?.page || 1;
  const loadedCount = listData[categoryId]?.length || 0;
  const totalCount = pageData[categoryId]?.total;
  
  let text = `${categoryName}：当前第 ${currentPage} 页，已加载 ${loadedCount} 条`;
  if (totalCount) {
    text += ` / 共 ${totalCount} 条`;
  }
  
  // 如果传入了folder信息，添加folder统计信息
  if (folderInfo && folderInfo.isActive && folderInfo.currentBreadcrumb) {
    const folderName = folderInfo.currentBreadcrumb.vod_name || '未知目录';
    const folderItemCount = folderInfo.currentData?.length || 0;
    text += `，当前目录：${folderName}，项目数：${folderItemCount}`;
  }
  
  return text;
};

// 数据获取方法
const getListData = async (key, forceReload = false) => {
  console.log(key, "选中分类id");
  
  // 防止重复请求
  if (loadingCategory[key] && !forceReload) {
    console.log(`分类 ${key} 正在加载中，跳过重复请求`);
    return;
  }

  console.log('listData.hasOwnProperty(key):', listData.hasOwnProperty(key));
  console.log('forceReload:', forceReload);
  console.log('listData keys:', Object.keys(listData));
  console.log('listData[key]:', listData[key]);
  console.log('listData[key] length:', listData[key]?.length);

  if (!listData.hasOwnProperty(key) || forceReload) {
    // 设置分类数据获取loading状态
    loadingCategory[key] = true;
    
    try {
      const currentSite = await siteService.getCurrentSite();
      
      let videoList, pagination;
      if (key === "recommendTuijian404") {
        // 使用传入的推荐视频数据 - 首页推荐数据不允许翻页
        console.log('recommendTuijian404 recommendVideos:',props.recommendVideos);
        videoList = props.recommendVideos || [];
        // 推荐视频数据不允许翻页
        pagination = { page: 1, hasNext: false };

      } else {
        // 获取分类视频，包含筛选参数
        const filters = selectedFilters[key] || {};
        const categoryData = await videoService.getCategoryVideos(currentSite.key, {
          typeId: key,
          page: 1,
          filters: filters,
          extend: currentSite.ext,
          apiUrl: currentSite.api
        });
        videoList = categoryData.videos || [];
        pagination = categoryData.pagination || { page: 1, hasNext: false };
        
        // 对于大数据集，添加额外的处理
        if (videoList.length > 100) {
          console.log(`检测到大数据集，分类 ${key} 包含 ${videoList.length} 条数据`);
          
          // 对于超大数据集，可以考虑分批处理
          if (videoList.length > 200) {
            console.warn(`超大数据集警告：分类 ${key} 包含 ${videoList.length} 条数据，可能影响性能`);
          }
        }
      }
      
      // 使用直接赋值确保响应式更新
      listData[key] = [...videoList];
      pageData[key] = pagination;
      loadingMore[key] = false;
      

      
      // 更新全局翻页统计信息
      if (key === activeKey.value) {
        const folderInfo = folderIsActive.value ? {
          isActive: folderIsActive.value,
          currentBreadcrumb: folderCurrentBreadcrumb.value,
          currentData: folderCurrentData.value
        } : null;
        debouncedUpdateStats(getStatsText(key, folderInfo));
      }
    } catch (error) {
      console.error("获取视频列表失败:", error);
      listData[key] = [];
      pageData[key] = { page: 1, hasNext: false };
      loadingMore[key] = false;
    } finally {
      // 清除分类数据获取loading状态
      loadingCategory[key] = false;
    }
  }
};

// 检查是否为无效数据（防无限翻页）
const isInvalidData = (videos) => {
  if (!videos || videos.length === 0) return true;
  return videos.some(video => video.vod_id === 'no_data');
};

// 检查数据是否与上一页重复
const isDuplicateData = (currentList, newVideos) => {
  if (!newVideos || newVideos.length === 0) return true;
  if (!currentList || currentList.length === 0) return false;
  
  const currentIds = currentList.slice(-newVideos.length).map(v => v.vod_id);
  const newIds = newVideos.map(v => v.vod_id);
  
  return JSON.stringify(currentIds) === JSON.stringify(newIds);
};

// 加载更多数据
const loadMoreData = async (key) => {
  if (loadingMore[key] || !pageData[key]?.hasNext) {
    return;
  }
  
  loadingMore[key] = true;
  
  try {
    const currentSite = await siteService.getCurrentSite();
    const nextPage = pageData[key].page + 1;
    
    let newVideos = [];
    let newPagination = { page: nextPage, hasNext: false };
    
    if (key === "recommendTuijian404") {
      // 推荐视频不允许翻页，直接返回
      return;
    } else {
      // 分类视频翻页
      const filters = selectedFilters[key] || {};
      const categoryData = await videoService.getCategoryVideos(currentSite.key, {
        typeId: key,
        page: nextPage,
        filters: filters,
        extend: currentSite.ext,
        apiUrl: currentSite.api
      });
      newVideos = categoryData.videos || [];
      newPagination = categoryData.pagination || { page: nextPage, hasNext: false };
    }
    
    if (isInvalidData(newVideos) || isDuplicateData(listData[key], newVideos)) {
      console.log("检测到无效数据或重复数据，停止翻页");
      pageData[key] = { 
        ...pageData[key], 
        hasNext: false 
      };
      return;
    }
    
    listData[key] = [...listData[key], ...newVideos];
    pageData[key] = newPagination;
    
    // 更新全局翻页统计信息
    if (key === activeKey.value) {
      const folderInfo = folderIsActive.value ? {
        isActive: folderIsActive.value,
        currentBreadcrumb: folderCurrentBreadcrumb.value,
        currentData: folderCurrentData.value
      } : null;
      debouncedUpdateStats(getStatsText(key, folderInfo));
    }
  } catch (error) {
    console.error("加载更多数据失败:", error);
    pageData[key] = { 
      ...pageData[key], 
      hasNext: false 
    };
  } finally {
    loadingMore[key] = false;
  }
};

// 目录模式加载更多数据
const loadMoreFolderData = async (folderId) => {
  if (folderLoadingMore[folderId] || !folderPageData[folderId]?.hasNext) {
    return;
  }
  
  folderLoadingMore[folderId] = true;
  
  try {
    const nextPage = folderPageData[folderId].page + 1;
    
    // 调用T4分类接口获取下一页数据
    const response = await getCategoryData(props.module, {
      t: folderId,
      pg: nextPage,
      extend: processExtendParam(props.extend),
      apiUrl: props.apiUrl
    });
    
    if (response && response.list && response.list.length > 0) {
      const newVideos = response.list;
      
      // 检查是否为无效数据或重复数据
      if (isInvalidData(newVideos) || isDuplicateData(folderCurrentData.value, newVideos)) {
        console.log("目录翻页检测到无效数据或重复数据，停止翻页");
        folderPageData[folderId] = { 
          ...folderPageData[folderId], 
          hasNext: false 
        };
        return;
      }
      
      // 合并新数据到当前目录数据
      const updatedData = [...folderCurrentData.value, ...newVideos];
      
      // 更新目录状态
      const updatedState = {
        isActive: folderIsActive.value,
        breadcrumbs: folderBreadcrumbs.value,
        currentBreadcrumb: folderCurrentBreadcrumb.value,
        currentData: updatedData,
        loading: false,
        hasMore: true
      };
      
      // 更新翻页状态
      folderPageData[folderId] = {
        page: nextPage,
        hasNext: response.page < response.pagecount || false,
        total: response.total || 0
      };
      
      emit('folder-navigate', updatedState);
      
      // 更新统计信息
      if (activeKey.value) {
        const statsText = getStatsText(activeKey.value);
        debouncedUpdateStats(statsText);
      }
    } else {
      // 没有更多数据
      folderPageData[folderId] = { 
        ...folderPageData[folderId], 
        hasNext: false 
      };
    }
  } catch (error) {
    console.error("目录加载更多数据失败:", error);
    folderPageData[folderId] = { 
      ...folderPageData[folderId], 
      hasNext: false 
    };
  } finally {
    folderLoadingMore[folderId] = false;
  }
};

// 事件处理方法
const handleTabChange = (key) => {
  // 如果当前在目录模式下，切换分类时自动退出目录模式
  if (folderIsActive.value) {
    handleExitFolder();
  }
  
  activeKey.value = key;
  getListData(key);
  emit('activeKeyChange', key);
};

const handleToggleFilter = (data) => {
  const { filterKey, filterValue, filterName } = data;
  toggleFilter(filterKey, filterValue, filterName);
};

const handleFilterVisibleChange = (data) => {
  const { categoryId, visible } = data;
  filterVisible[categoryId] = visible;
  // 保存筛选展开状态到URL
  saveFiltersToUrl();
};

const handleResetFilters = () => {
  resetFilters(activeKey.value);
};

const openCategoryModal = () => {
  categoryModalVisible.value = true;
};

const selectCategory = (categoryId) => {
  activeKey.value = categoryId;
  getListData(categoryId);
  emit('activeKeyChange', categoryId);
  // 更新全局翻页统计信息
  const folderInfo = folderIsActive.value ? {
    isActive: folderIsActive.value,
    currentBreadcrumb: folderCurrentBreadcrumb.value,
    currentData: folderCurrentData.value
  } : null;
  debouncedUpdateStats(getStatsText(categoryId, folderInfo), 100);
};

// 监听器
watch(() => props.recommendVideos, (newVideos) => {
  console.log('[VideoList] recommendVideos watch triggered:', newVideos?.length);
  
  if (newVideos && newVideos.length > 0) {
    // 直接赋值，确保响应式更新
    listData["recommendTuijian404"] = [...newVideos];
    pageData["recommendTuijian404"] = { page: 1, hasNext: false };
    loadingMore["recommendTuijian404"] = false;
    loadingCategory["recommendTuijian404"] = false;
    console.log("推荐数据已更新:", newVideos.length, "条");
  } else {
    listData["recommendTuijian404"] = [];
    pageData["recommendTuijian404"] = { page: 1, hasNext: false };
    loadingMore["recommendTuijian404"] = false;
    loadingCategory["recommendTuijian404"] = false;
  }
  
  // 如果当前activeKey是推荐分类，确保界面更新
  if (activeKey.value === "recommendTuijian404") {
    console.log('[VideoList] 当前是推荐分类，强制更新界面');
    // 触发响应式更新
    activeKey.value = "recommendTuijian404";
  }
}, { immediate: true });

// 添加classList watch的防护变量
// 防止递归更新的标志
let isClassListUpdating = false;
let lastClassListHash = '';

// 计算classList的简单hash
const getClassListHash = (classList) => {
  if (!classList || !classList.class) return '';
  return JSON.stringify(classList.class.map(c => c.type_id || c.id || ''));
};

const isValidActiveKey = (key, classList = props.classList) => {
  if (!key) return false;
  if (key === "recommendTuijian404") return hasRecommendVideos.value;
  return classList?.class?.some(item => String(item.type_id) === String(key));
};

watch(() => props.classList, (newClassList, oldClassList) => {
  // 防止递归更新
  if (isClassListUpdating) {
    return;
  }
  
  const newHash = getClassListHash(newClassList);
  
  // 如果hash相同，说明数据没有实质性变化
  if (newHash === lastClassListHash) {
    return;
  }
  
  console.log('🗂️ [DEBUG] ========== VideoList classList watch 触发 ==========');
  console.log('🗂️ [DEBUG] oldClassList:', oldClassList);
  console.log('🗂️ [DEBUG] newClassList:', newClassList);
  console.log('🗂️ [DEBUG] classList是否发生变化:', newClassList !== oldClassList);
  console.log('🗂️ [DEBUG] 当前activeKey.value:', activeKey.value);
  console.log('🗂️ [DEBUG] 当前folderIsActive.value:', folderIsActive.value);
  console.log('🗂️ [DEBUG] 当前folderNavigationState:', JSON.stringify(props.folderNavigationState, null, 2));
  
  isClassListUpdating = true;
  lastClassListHash = newHash;
  
  try {
    // 检查URL中是否有筛选参数需要恢复
    const currentQuery = router.currentRoute.value.query;
    const hasFiltersInUrl = currentQuery.filters || currentQuery.filterVisible;
    
    // 只有在classList真正发生变化且URL中没有筛选参数时才清除筛选状态
    if (newClassList !== oldClassList && !hasFiltersInUrl) {
      console.log('🗂️ [DEBUG] classList发生变化且URL中无筛选参数，清除筛选状态');
      // 清除筛选状态
      Object.keys(selectedFilters).forEach(key => {
        delete selectedFilters[key];
      });
      Object.keys(filterVisible).forEach(key => {
        delete filterVisible[key];
      });
      console.log('🗂️ [DEBUG] 筛选状态已清除');
    } else if (hasFiltersInUrl) {
      console.log('🗂️ [DEBUG] URL中有筛选参数，跳过筛选状态清除');
    }
    
    // 如果当前处于folder模式，不要重置activeKey，避免覆盖folder状态
    if (folderIsActive.value) {
      console.log('🗂️ [DEBUG] 当前处于folder模式，跳过activeKey重置');
      return;
    }
    
    const requestedActiveKey = props.sourceRoute?.query?.activeKey || props.returnToActiveKey;
    const newActiveKey = isValidActiveKey(requestedActiveKey, newClassList)
      ? requestedActiveKey
      : getDefaultActiveKey();

    if (activeKey.value !== newActiveKey) {
      activeKey.value = newActiveKey;
      getListData(newActiveKey);
      if (!requestedActiveKey) {
        emit('activeKeyChange', newActiveKey);
      }
    }
  } catch (error) {
    console.error('classList watch处理失败:', error);
  } finally {
    // 使用nextTick确保在下一个tick重置标志
    nextTick(() => {
      isClassListUpdating = false;
    });
  }
}, { immediate: true });

// 监听folderNavigationState的变化
watch(() => props.folderNavigationState, (newState, oldState) => {
  // 监听状态变化，无需调试日志
}, { deep: true, immediate: true });

// 监听sourceRoute中activeKey的变化（用于退出folder模式时同步activeKey）
watch(() => props.sourceRoute?.query?.activeKey, (newActiveKey) => {
  if (newActiveKey && newActiveKey !== activeKey.value) {
    console.log('[DEBUG] sourceRoute activeKey changed:', newActiveKey, 'current:', activeKey.value);
    activeKey.value = newActiveKey;

    // 如果当前分类没有数据，则重新加载
    if (!listData[newActiveKey] || listData[newActiveKey].length === 0) {
      console.log('[DEBUG] 重新加载分类数据:', newActiveKey);
      getListData(newActiveKey);
    }
  }
}, { immediate: true });

onMounted(async () => {
  // 从URL恢复筛选条件
  restoreFiltersFromUrl();
  
  // 优先使用父组件传递的activeKey，如果没有则使用默认值
  const parentActiveKey = props.sourceRoute?.query?.activeKey;
  const targetActiveKey = parentActiveKey || getDefaultActiveKey();
  
  // 使用nextTick确保筛选状态已经传递给子组件
  await nextTick();
  activeKey.value = targetActiveKey;
  
  // 再次使用nextTick确保classList watcher执行完毕后，重新恢复筛选状态
  await nextTick();
  restoreFiltersFromUrl();
  
  // 对于推荐分类，确保loading状态正确
  if (targetActiveKey === "recommendTuijian404") {
    loadingCategory[targetActiveKey] = false;
    // 如果已有推荐数据，直接使用，不需要再调用getListData
    if (props.recommendVideos && props.recommendVideos.length > 0) {
      listData[targetActiveKey] = [...props.recommendVideos];
      pageData[targetActiveKey] = { page: 1, hasNext: false };
      loadingMore[targetActiveKey] = false;
    } else {
      // 如果没有推荐数据，才调用getListData
      getListData(activeKey.value);
    }
  } else {
    // 非推荐分类，始终加载数据
    getListData(activeKey.value);
  }
  
  // 只有当使用默认值时才emit，避免覆盖父组件的activeKey
  if (!parentActiveKey) {
    emit('activeKeyChange', activeKey.value);
  }
});

onBeforeUnmount(() => {
  if (updateStatsTimer) {
    clearTimeout(updateStatsTimer);
  }
});

// 暴露方法给父组件
defineExpose({
  getCurrentState: () => ({
    activeKey: activeKey.value,
    currentPage: pageData[activeKey.value]?.page || 1,
    videos: listData[activeKey.value] || [],
    hasMore: pageData[activeKey.value]?.hasNext || false,
    hasData: listData[activeKey.value] && listData[activeKey.value].length > 0,
    scrollPosition: videoGridRef.value ? videoGridRef.value.getCurrentScrollPosition() : 0
  }),
  restoreState: (state) => {
    if (state.activeKey && state.activeKey !== activeKey.value) {
      activeKey.value = state.activeKey;
      emit('activeKeyChange', state.activeKey);
      
      // 如果该分类已有数据，不需要重新加载
      if (!listData[state.activeKey] || listData[state.activeKey].length === 0) {
        getListData(state.activeKey);
      }
    }
  },
  restoreFullState: (state) => {
    if (state.activeKey) {
      // 恢复完整状态，包括数据
      activeKey.value = state.activeKey;
      
      // 只有在有有效的保存数据时才恢复数据，否则重新加载
      if (state.videos && state.videos.length > 0) {
        listData[state.activeKey] = [...state.videos];
        pageData[state.activeKey] = {
          page: state.currentPage || 1,
          hasNext: state.hasMore || false
        };
        console.log(`恢复分类 ${state.activeKey} 的完整状态:`, {
          videos: state.videos.length,
          page: state.currentPage,
          hasMore: state.hasMore,
          scrollPosition: state.scrollPosition
        });
        
        // 恢复滚动位置
        if (state.scrollPosition && videoGridRef.value) {
          setTimeout(() => {
            videoGridRef.value.restoreScrollPosition(state.scrollPosition);
          }, 200);
        }
      } else {
        // 如果没有保存的数据，重新加载
        console.log(`分类 ${state.activeKey} 没有保存的数据，重新加载`);
        getListData(state.activeKey);
      }
      
      emit('activeKeyChange', state.activeKey);
      
      // 更新全局翻页统计信息
      const folderInfo = folderIsActive.value ? {
        isActive: folderIsActive.value,
        currentBreadcrumb: folderCurrentBreadcrumb.value,
        currentData: folderCurrentData.value
      } : null;
      debouncedUpdateStats(getStatsText(state.activeKey, folderInfo), 100);
    }
  },
  refreshCurrentCategory: () => {
    if (activeKey.value) {
      console.log('刷新当前分类:', activeKey.value);
      // 重置当前分类的数据
      listData[activeKey.value] = [];
      pageData[activeKey.value] = { page: 1, hasNext: true };
      loadingMore[activeKey.value] = false;
      // 重新加载数据
      getListData(activeKey.value);
    }
  },
  setSpecialCategoryData: (categoryId, videos, pagination) => {
    console.log('设置特殊分类数据:', { categoryId, videosCount: videos?.length, pagination });
    
    // 直接设置特殊分类的数据
    listData[categoryId] = videos || [];
    pageData[categoryId] = {
      page: pagination?.page || 1,
      hasNext: pagination?.hasNext || false,
      total: pagination?.total || 0
    };
    loadingMore[categoryId] = false;
    
    // 更新全局翻页统计信息
    const folderInfo = folderIsActive.value ? {
      isActive: folderIsActive.value,
      currentBreadcrumb: folderCurrentBreadcrumb.value,
      currentData: folderCurrentData.value
    } : null;
    debouncedUpdateStats(getStatsText(categoryId, folderInfo), 100);
  }
});

// Folder导航相关方法
const handleFolderNavigateFromGrid = async (video) => {
  
  // 使用防抖机制防止快速连续点击
  debounceNavigation(async () => {
    await performFolderNavigation(video);
  });
};

const performFolderNavigation = async (video) => {
  
  // 声明newBreadcrumbs变量，确保在catch块中也能访问
  let newBreadcrumbs = [];
  
  try {
    // 获取当前面包屑，如果已经在目录模式下，则在现有面包屑基础上添加新层级
    const currentBreadcrumbs = folderIsActive.value 
      ? folderBreadcrumbs.value 
      : [];
    
    // 检查是否已经存在相同的目录，避免重复添加
    const existingIndex = currentBreadcrumbs.findIndex(b => b.vod_id === video.vod_id);
    
    if (existingIndex >= 0) {
      // 如果目录已存在，截取到该目录位置
      newBreadcrumbs = currentBreadcrumbs.slice(0, existingIndex + 1);
    } else {
      // 添加新目录到面包屑末尾
      newBreadcrumbs = [...currentBreadcrumbs, { vod_id: video.vod_id, vod_name: video.vod_name }];
    }
    
    // 设置加载状态
    const loadingState = {
      isActive: true,
      breadcrumbs: newBreadcrumbs,
      currentData: [],
      currentBreadcrumb: { vod_id: video.vod_id, vod_name: video.vod_name },
      loading: true
    };
    
    emit('folder-navigate', loadingState);
    console.log('props.extend:',props.extend)
    console.log('processExtendParam(props.extend):',processExtendParam(props.extend))
    
    // 获取当前分类的筛选条件
    const filters = selectedFilters[activeKey.value] || {};
    console.log('🗂️ [DEBUG] 目录模式应用筛选条件:', filters);
    
    // 调用T4分类接口，包含筛选条件
    const requestParams = {
      t: video.vod_id, // 使用vod_id作为type_id
      pg: 1,
      extend: processExtendParam(props.extend),
      apiUrl: props.apiUrl
    };
    
    // 如果有筛选条件，添加ext参数
    if (Object.keys(filters).length > 0) {
      // requestParams.ext = encodeFilters(filters);
      console.log('🗂️ [DEBUG] 目录模式编码后的筛选条件:', requestParams.ext);
    }
    
    const response = await getCategoryData(props.module, requestParams);
    
    if (response && response.list && response.list.length > 0) {
      // 解析返回的分类数据
      const folderData = response.list;
      
      // 初始化翻页状态
      folderPageData[video.vod_id] = {
        page: response.page || 1,
        hasNext: response.page < response.pagecount || false,
        total: response.total || 0
      };
      folderLoadingMore[video.vod_id] = false;
      
      // 更新folder导航状态
      const updatedState = {
        isActive: true,
        breadcrumbs: newBreadcrumbs,
        currentData: folderData,
        currentBreadcrumb: { vod_id: video.vod_id, vod_name: video.vod_name },
        loading: false
      };
      
      emit('folder-navigate', updatedState);
      
      // 使用防抖更新统计信息
      if (activeKey.value) {
        const folderInfo = {
          isActive: true,
          currentBreadcrumb: { vod_id: video.vod_id, vod_name: video.vod_name },
          currentData: folderData
        };
        const statsText = getStatsText(activeKey.value, folderInfo);
        debouncedUpdateStats(statsText);
      }
    } else {
      console.warn('T4分类接口返回数据为空');
      // 返回空数据状态
      const emptyState = {
        isActive: true,
        breadcrumbs: newBreadcrumbs,
        currentData: [],
        currentBreadcrumb: { vod_id: video.vod_id, vod_name: video.vod_name },
        loading: false
      };
      
      emit('folder-navigate', emptyState);
      
      // 使用防抖更新统计信息
      if (activeKey.value) {
        const folderInfo = {
          isActive: true,
          currentBreadcrumb: { vod_id: video.vod_id, vod_name: video.vod_name },
          currentData: []
        };
        const statsText = getStatsText(activeKey.value, folderInfo);
        debouncedUpdateStats(statsText);
      }
    }
  } catch (error) {
    console.error('Folder导航失败:', error);
    
    // 返回错误状态
    const errorState = {
      isActive: true,
      breadcrumbs: newBreadcrumbs,
      currentData: [],
      currentBreadcrumb: { vod_id: video.vod_id, vod_name: video.vod_name },
      loading: false
    };
    
    emit('folder-navigate', errorState);
    
    // 使用防抖更新统计信息
    if (activeKey.value) {
      const folderInfo = {
        isActive: true,
        currentBreadcrumb: { vod_id: video.vod_id, vod_name: video.vod_name },
        currentData: []
      };
      const statsText = getStatsText(activeKey.value, folderInfo);
      debouncedUpdateStats(statsText);
    }
  }
};

// 防止重复导航的标志
let isFolderNavigating = false;
let lastFolderNavigationId = null;
let lastFolderNavigationTime = 0;

const handleFolderNavigate = async (breadcrumb, index) => {
  // 如果传入了index参数，说明是从面包屑点击来的，breadcrumb就是目标项
  // 如果没有index参数，说明是从其他地方调用的，breadcrumb就是目标项
  const targetBreadcrumb = breadcrumb;
  
  // 参数验证
  if (!targetBreadcrumb || !targetBreadcrumb.vod_id) {
    console.error('handleFolderNavigate: 无效的breadcrumb参数', targetBreadcrumb);
    return;
  }
  
  console.log('🗂️ [DEBUG] handleFolderNavigate 接收参数:', { breadcrumb: targetBreadcrumb, index });
  
  // 防止重复导航
  if (isFolderNavigating) {
    console.log('folder导航正在进行中，跳过重复调用');
    return;
  }
  
  // 防止过于频繁的导航（最小间隔300ms）
  const now = Date.now();
  if (now - lastFolderNavigationTime < 300) {
    console.log('folder导航过于频繁，跳过');
    // return;
  }
  
  // 只在短时间内（1秒）阻止相同目标的重复导航，避免误点击
  if (lastFolderNavigationId === targetBreadcrumb.vod_id && (now - lastFolderNavigationTime < 1000)) {
    console.log('短时间内相同的folder导航目标，跳过重复处理');
    return;
  }
  
  isFolderNavigating = true;
  lastFolderNavigationId = targetBreadcrumb.vod_id;
  lastFolderNavigationTime = now;
  
  try {
    // 设置加载状态
    const currentBreadcrumbs = folderBreadcrumbs.value;
    const targetIndex = currentBreadcrumbs.findIndex(b => b.vod_id === targetBreadcrumb.vod_id);
    const newBreadcrumbs = targetIndex >= 0 ? currentBreadcrumbs.slice(0, targetIndex + 1) : currentBreadcrumbs;
    
    const loadingState = {
      isActive: folderIsActive.value,
      breadcrumbs: newBreadcrumbs,
      currentBreadcrumb: targetBreadcrumb,
      currentData: folderCurrentData.value,
      loading: true,
      hasMore: folderHasMore.value
    };
    
    emit('folder-navigate', loadingState);
    
    // 获取当前分类的筛选条件
    const filters = selectedFilters[activeKey.value] || {};
    
    // 调用T4分类接口，包含筛选条件
    const requestParams = {
      t: targetBreadcrumb.vod_id,
      pg: 1,
      extend: processExtendParam(props.extend),
      apiUrl: props.apiUrl
    };
    
    // 如果有筛选条件，添加ext参数
    if (Object.keys(filters).length > 0) {
      // requestParams.ext = encodeFilters(filters);
    }
    
    const response = await getCategoryData(props.module, requestParams);
    
    if (response && response.list && response.list.length > 0) {
      const folderData = response.list;
      
      // 更新翻页状态
      folderPageData[targetBreadcrumb.vod_id] = {
        page: response.page || 1,
        hasNext: response.page < response.pagecount || false,
        total: response.total || 0
      };
      folderLoadingMore[targetBreadcrumb.vod_id] = false;
      
      const updatedState = {
        isActive: true,
        breadcrumbs: newBreadcrumbs,
        currentData: folderData,
        currentBreadcrumb: targetBreadcrumb,
        loading: false,
        hasMore: true
      };
      
      emit('folder-navigate', updatedState);
      
      // 使用防抖更新统计信息
      if (activeKey.value) {
        const folderInfo = {
          isActive: true,
          currentBreadcrumb: targetBreadcrumb,
          currentData: folderData
        };
        const statsText = getStatsText(activeKey.value, folderInfo);
        debouncedUpdateStats(statsText);
        console.log('🗂️ [DEBUG] 面包屑导航更新统计信息:', statsText);
      }
    }
  } catch (error) {
    console.error('🗂️ [ERROR] 面包屑导航失败:', error);
  } finally {
    // 重置导航标志
    isFolderNavigating = false;
  }
};

const handleFolderGoBack = (parentItem, parentIndex) => {
  console.log('🗂️ [DEBUG] 返回上一级folder', { parentItem, parentIndex });
  
  // 如果从FolderBreadcrumb传来了参数，直接使用
  if (parentItem && parentItem.vod_id) {
    handleFolderNavigate(parentItem, parentIndex);
    return;
  }
  
  // 否则使用原来的逻辑（兼容其他调用方式）
  const currentBreadcrumbs = folderBreadcrumbs.value;
  if (currentBreadcrumbs.length > 1) {
    const newBreadcrumbs = currentBreadcrumbs.slice(0, -1);
    const targetBreadcrumb = newBreadcrumbs[newBreadcrumbs.length - 1];
    handleFolderNavigate(targetBreadcrumb);
  } else {
    // 如果只有一级，返回到正常列表模式
    handleFolderGoHome();
  }
};

const handleFolderGoHome = async (rootItem, rootIndex) => {
  console.log('🗂️ [DEBUG] 返回folder根目录', { rootItem, rootIndex });
  
  // 如果从FolderBreadcrumb传来了参数，直接使用
  if (rootItem && rootItem.vod_id) {
    handleFolderNavigate(rootItem, rootIndex);
    return;
  }
  
  // 否则使用原来的逻辑（兼容其他调用方式）
  // 获取第一级目录（根目录）
  const currentBreadcrumbs = folderBreadcrumbs.value;
  if (currentBreadcrumbs.length > 0) {
    const rootBreadcrumb = currentBreadcrumbs[0];
    
    // 设置加载状态
    const loadingState = {
      isActive: true,
      breadcrumbs: [rootBreadcrumb],
      currentData: [],
      currentBreadcrumb: rootBreadcrumb,
      loading: true
    };
    
    emit('folder-navigate', loadingState);
    
    try {
      // 重新获取根目录数据
      const filters = selectedFilters[activeKey.value] || {};
      console.log('🗂️ [DEBUG] 返回根目录，应用筛选条件:', filters);
      
      const requestParams = {
        t: rootBreadcrumb.vod_id,
        pg: 1,
        extend: processExtendParam(props.extend),
        apiUrl: props.apiUrl
      };
      
      // 如果有筛选条件，添加ext参数
      if (Object.keys(filters).length > 0) {
        // requestParams.ext = encodeFilters(filters);
      }
      
      const response = await getCategoryData(props.module, requestParams);
      
      if (response && response.list && response.list.length > 0) {
        const folderData = response.list;
        
        // 更新翻页状态
        folderPageData[rootBreadcrumb.vod_id] = {
          page: response.page || 1,
          hasNext: response.page < response.pagecount || false,
          total: response.total || 0
        };
        folderLoadingMore[rootBreadcrumb.vod_id] = false;
        
        // 返回到第一级目录，包含最新数据
        const homeState = {
          isActive: true,
          breadcrumbs: [rootBreadcrumb],
          currentData: folderData,
          currentBreadcrumb: rootBreadcrumb,
          loading: false
        };
        
        emit('folder-navigate', homeState);
        
        // 使用防抖更新统计信息
        const statsText = `共 ${folderData.length} 个项目`;
        debouncedUpdateStats(statsText);
      } else {
        // 如果没有数据，显示空状态
        const homeState = {
          isActive: true,
          breadcrumbs: [rootBreadcrumb],
          currentData: [],
          currentBreadcrumb: rootBreadcrumb,
          loading: false
        };
        
        emit('folder-navigate', homeState);
        
        // 使用防抖更新统计信息
        const statsText = '共 0 个项目';
        debouncedUpdateStats(statsText);
      }
    } catch (error) {
      console.error('返回根目录时获取数据失败:', error);
      
      // 错误状态
      const errorState = {
        isActive: true,
        breadcrumbs: [rootBreadcrumb],
        currentData: [],
        currentBreadcrumb: rootBreadcrumb,
        loading: false
      };
      
      emit('folder-navigate', errorState);
      
      // 使用防抖更新统计信息
      const statsText = '数据加载失败';
      debouncedUpdateStats(statsText);
    }
  } else {
    // 如果没有面包屑数据，则退出目录模式
    const homeState = {
      isActive: false,
      breadcrumbs: [],
      currentData: [],
      currentBreadcrumb: null,
      loading: false
    };
    
    emit('folder-navigate', homeState);
    
    // 使用防抖更新统计信息
    if (activeKey.value && listData[activeKey.value]) {
      const statsText = getStatsText(activeKey.value, null);
      debouncedUpdateStats(statsText);
    }
  }
};

const handleExitFolder = () => {
  
  const exitState = {
    isActive: false,
    breadcrumbs: [],
    currentData: [],
    currentBreadcrumb: null,
    loading: false
  };
  
  emit('folder-navigate', exitState);
  
  // 使用防抖更新统计信息
  if (activeKey.value && listData[activeKey.value]) {
    const statsText = getStatsText(activeKey.value, null);
    debouncedUpdateStats(statsText);
  }
};

// 处理刷新列表事件
const handleRefreshList = () => {
  if (activeKey.value) {
    // 重置当前分类的数据
    listData[activeKey.value] = [];
    pageData[activeKey.value] = { page: 1, hasNext: true };
    loadingMore[activeKey.value] = false;
    // 重新加载数据
    getListData(activeKey.value);
  }
};
</script>

<style scoped>
.video-list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.category-loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 16px;
}

.loading-text {
  color: #666;
  font-size: 14px;
}
</style>
