<template>
  <div class="video-grid-container" ref="containerRef">
    <a-scrollbar
      @scroll="handleScroll"
      class="video-scroll-container"
      ref="scrollbarRef"
      :style="containerStyle"
    >
      <a-grid class="video-grid" :cols="{ xs: 3, sm: 3, md: 3, lg: 7, xl: 9, xxl: 10 }" :rowGap="12" :colGap="12">
        <a-grid-item
          v-for="(video, index) in videos"
          :key="`${video.vod_id}_${index}_${video.vod_name || ''}`"
          class="video_list_hover"
        >
          <div class="video_list_item" @click="handleVideoClick(video)">
            <div class="video_list_item_img">
              <!-- 优先显示vod_pic图片，如果有值的话 -->
              <a-image
                v-if="video.vod_pic && video.vod_pic.trim() !== ''"
                :preview="false"
                class="video_list_item_img_cover"
                fit="cover"
                :src="video.vod_pic"
              />
              <!-- 文件夹图标 (当vod_pic为空且是文件夹时) -->
              <div v-else-if="video.vod_tag && video.vod_tag.includes('folder')" class="folder-icon-container">
                <i class="iconfont icon-wenjianjia folder-icon"></i>
<!--                <svg style="width:30%">-->
<!--                  <use :href="`#icon-wenjianjia`"></use>-->
<!--                </svg>-->
              </div>
              <!-- 文件类型图标 (当vod_pic为空且是目录模式下的非文件夹项目时) -->
              <div v-else-if="video.vod_tag && !video.vod_tag.includes('folder')" class="file-icon-container">
<!--                <i class="iconfont file-type-icon" :class="getFileTypeIcon(video.vod_name)"></i>-->
                <svg style="width:30%">
                  <use :href="`#${getFileTypeIcon(video.vod_name)}`"></use>
                </svg>
              </div>
              <!-- 默认图片 (当vod_pic为空且没有vod_tag时) -->
              <a-image
                v-else
                :preview="false"
                class="video_list_item_img_cover"
                fit="cover"
                :src="video.vod_pic || '/default-poster.svg'"
              />
              <!-- vod_remarks 浮层 -->
              <div v-if="video.vod_remarks" class="video_remarks_overlay" v-html="video.vod_remarks">
              </div>
            </div>
            <div class="video_list_item_title">
              <span class="title-text">{{ video.vod_name }}</span>
            </div>
          </div>
        </a-grid-item>
      </a-grid>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <a-spin />
        <div class="loading-text">加载更多...</div>
      </div>
      
      <!-- 没有更多数据提示 -->
      <div v-else-if="!hasMore && videos.length > 0" class="no-more-data">
        没有更多数据了
      </div>
      
      <!-- 空状态 -->
      <div v-else-if="videos.length === 0 && !loading" class="empty-state">
        暂无视频数据
      </div>
      
      <div class="bottom-spacer"></div>
    </a-scrollbar>
    
    <!-- ActionRenderer组件 -->
    <ActionRenderer
      v-if="showActionRenderer"
      ref="actionRendererRef"
      :action-data="currentActionData"
      :module="props.module"
      :extend="props.extend"
      :api-url="props.apiUrl"
      @close="handleActionClose"
      @special-action="handleSpecialAction"
    />
  </div>
</template>

<script setup>
import { onMounted, nextTick, ref, onBeforeUnmount, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Message } from '@arco-design/web-vue';
import { useVisitedStore } from '@/stores/visitedStore';
import ActionRenderer from '@/components/actions/ActionRenderer.vue';
import videoService from '@/api/services/video';
import { showToast } from '@/stores/toast.js'
import { getFileTypeIcon } from '@/utils/fileTypeUtils'

const props = defineProps({
  videos: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  hasMore: {
    type: Boolean,
    default: false
  },
  statsText: {
    type: String,
    default: ''
  },
  showStats: {
    type: Boolean,
    default: false
  },
  // 新增：来源页面信息
  sourceRoute: {
    type: Object,
    default: () => ({})
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
  // 新增：folder状态信息，用于详情页返回时恢复
  folderState: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['load-more', 'scroll-bottom', 'refresh-list', 'special-action', 'folder-navigate']);

const router = useRouter();
const visitedStore = useVisitedStore();





const containerRef = ref(null);
const scrollbarRef = ref(null);
// 使用非响应式变量避免递归更新
let containerHeight = 600; // 默认高度
const containerHeightTrigger = ref(0); // 仅用于触发重新计算

// 添加内容高度检测相关变量
let contentHeight = 0;
let isContentHeightChecking = false;
let autoLoadTimer = null;

// 计算属性：容器样式
const containerStyle = computed(() => {
  return {
    height: '100%',
    overflow: 'auto'
  };
});

// 检测内容高度并智能调整容器高度
const checkContentHeight = () => {
  if (isContentHeightChecking || isProcessing) return;
  
  isContentHeightChecking = true;
  
  nextTick(() => {
    try {
      const container = containerRef.value;
      if (!container) return;
      
      // 获取实际内容高度
      const scrollContainer = container.querySelector('.arco-scrollbar-container');
      if (!scrollContainer) return;
      
      contentHeight = scrollContainer.scrollHeight;
      const clientHeight = scrollContainer.clientHeight;
      
      // 计算理想的容器高度（基于窗口大小）
      const windowHeight = window.innerHeight || document.documentElement.clientHeight || 600;
      const idealHeight = Math.max(windowHeight - 200, 400);
      
      // 如果内容高度小于等于容器高度，说明无法产生滚动
      if (contentHeight <= clientHeight && props.videos && props.videos.length > 0) {
        // 检查是否还有更多数据可以加载
        const hasMoreData = props.hasMore !== false;
        
        if (hasMoreData) {
          // 减小容器高度以强制产生滚动条，但降低幅度要小，只需要能产生滚动即可
          // 减少200px的降低量，只降低必要的最小高度
          const minHeight = Math.min(670, contentHeight - 10); // 从contentHeight-50改为contentHeight-10，减少降低幅度
          if (minHeight > 470 && containerHeight > minHeight) { // 从200改为400，减少过度降低
            containerHeight = minHeight;
            containerHeightTrigger.value++;
            
            console.log('[DEBUG] 调整容器高度以产生滚动条:', {
              contentHeight,
              clientHeight,
              newContainerHeight: containerHeight
            });
            
            // 延迟检查是否需要自动加载更多
            if (autoLoadTimer) clearTimeout(autoLoadTimer);
            autoLoadTimer = setTimeout(() => {
              checkAutoLoadMore();
            }, 100); // 减少延迟时间
          } else {
            // 如果容器已经很小了，直接触发加载更多
            console.log('[DEBUG] 容器已达最小高度，直接触发加载更多');
            checkAutoLoadMore();
          }
        } else {
          console.log('[DEBUG] 没有更多数据可加载，保持当前状态');
        }
      } else if (contentHeight > clientHeight) {
        // 内容高度大于容器高度，说明可以产生滚动
        // 检查是否需要恢复到理想高度
        if (containerHeight < idealHeight && contentHeight >= idealHeight * 0.8) {
          // 如果当前容器高度小于理想高度，且内容足够多，则恢复到理想高度
          containerHeight = idealHeight;
          containerHeightTrigger.value++;
          
          console.log('[DEBUG] 恢复容器高度到理想高度:', {
            contentHeight,
            clientHeight,
            idealHeight,
            newContainerHeight: containerHeight
          });
        }
      }
    } catch (error) {
      console.error('checkContentHeight error:', error);
    } finally {
      isContentHeightChecking = false;
    }
  });
};

// 检查是否需要自动加载更多数据
const checkAutoLoadMore = () => {
  if (isProcessing || updateCount >= MAX_UPDATES_PER_SECOND) return;
  
  try {
    const container = containerRef.value;
    if (!container) return;
    
    const scrollContainer = container.querySelector('.arco-scrollbar-container');
    if (!scrollContainer) return;
    
    const scrollHeight = scrollContainer.scrollHeight;
    const clientHeight = scrollContainer.clientHeight;
    
    // 如果内容高度仍然小于等于容器高度，且有更多数据，自动触发加载
    if (scrollHeight <= clientHeight && props.videos && props.videos.length > 0) {
      console.log('[DEBUG] 自动触发加载更多数据 - 内容高度不足');
      emit('load-more');
    }
  } catch (error) {
    console.error('checkAutoLoadMore error:', error);
  }
};

// 添加防止递归更新的变量
let lastHeightRestoreTime = 0;
let heightRestoreCount = 0;
const HEIGHT_RESTORE_COOLDOWN = 1000; // 1秒冷却时间
const MAX_HEIGHT_RESTORE_PER_MINUTE = 5; // 每分钟最多5次

// 检查并恢复容器高度到理想状态
const checkHeightRestore = () => {
  if (isProcessing) return;
  
  // 防止递归更新的严格检查
  const now = Date.now();
  if (now - lastHeightRestoreTime < HEIGHT_RESTORE_COOLDOWN) {
    return; // 冷却时间内不执行
  }
  
  // 重置计数器（每分钟）
  if (now - lastHeightRestoreTime > 60000) {
    heightRestoreCount = 0;
  }
  
  if (heightRestoreCount >= MAX_HEIGHT_RESTORE_PER_MINUTE) {
    console.warn('[VideoGrid] 高度恢复操作过于频繁，已暂停');
    return;
  }
  
  try {
    const container = containerRef.value;
    if (!container) return;
    
    const scrollContainer = container.querySelector('.arco-scrollbar-container');
    if (!scrollContainer) return;
    
    const contentHeight = scrollContainer.scrollHeight;
    const clientHeight = scrollContainer.clientHeight;
    
    // 计算理想的容器高度
    const windowHeight = window.innerHeight || document.documentElement.clientHeight || 600;
    const idealHeight = Math.max(windowHeight - 200, 400);
    
    // 如果内容足够多且当前容器高度小于理想高度，则恢复
    if (contentHeight > idealHeight * 0.8 && containerHeight < idealHeight) {
      const oldHeight = containerHeight;
      containerHeight = idealHeight;
      
      // 使用nextTick延迟触发更新，避免同步递归
      nextTick(() => {
        if (!isProcessing) { // 再次检查处理状态
          containerHeightTrigger.value++;
          heightRestoreCount++;
          lastHeightRestoreTime = now;
          
          console.log('[DEBUG] 主动恢复容器高度:', {
            contentHeight,
            clientHeight,
            idealHeight,
            oldContainerHeight: oldHeight,
            newContainerHeight: idealHeight,
            restoreCount: heightRestoreCount
          });
        }
      });
    }
  } catch (error) {
    console.error('checkHeightRestore error:', error);
  }
};

// ActionRenderer相关
const actionRendererRef = ref(null);
const showActionRenderer = ref(false);
const currentActionData = ref(null);


// 视频点击处理
const handleVideoClick = async (video) => {
  if (video && video.vod_id) {
    // 检查是否为folder类型
    if (video.vod_tag && video.vod_tag.includes('folder')) {
      // 触发folder导航事件，传递当前点击的视频信息
      emit('folder-navigate', {
        vod_id: video.vod_id,
        vod_name: video.vod_name,
        vod_tag: video.vod_tag
      });
      return;
    }
    
    // 检查是否为action类型
    if (video.vod_tag === 'action') {
      try {
        // 尝试解析vod_id中的JSON字符串获取action配置
        const actionConfig = JSON.parse(video.vod_id);
        
        // 传递解析后的action配置给ActionRenderer
        currentActionData.value = actionConfig;
        showActionRenderer.value = true;
        return;
      } catch (error) {
        
        // 如果解析失败，说明vod_id是普通文本，需要调用T4 action接口获取真正的action配置
        await handleT4ActionCall(video.vod_id);
        return;
      }
    }
    
    // 记录最后点击的视频
    visitedStore.setLastClicked(video.vod_id, video.vod_name)
    
    const routeQuery = {
      name: video.vod_name,
      pic: video.vod_pic,
      year: video.vod_year,
      area: video.vod_area,
      type: video.vod_type,
      remarks: video.vod_remarks,
      content: video.vod_content,
      actor: video.vod_actor,
      director: video.vod_director,
      // 添加来源页面信息
      sourceRouteName: props.sourceRoute?.name || '',
      sourceRouteParams: JSON.stringify(props.sourceRoute?.params || {}),
      sourceRouteQuery: JSON.stringify(props.sourceRoute?.query || {}),
      // 添加来源图片信息，用于详情页图片备用
      sourcePic: video.vod_pic
    }
    
    // 如果当前在folder模式下，传递folderState用于返回时恢复
    if (props.folderState && props.folderState.isActive) {
      routeQuery.folderState = JSON.stringify(props.folderState);
    }
    
    router.push({
        name: 'VideoDetail',
        params: { id: video.vod_id },
        query: routeQuery
      });
  }
};

// T4 Action接口调用处理
const handleT4ActionCall = async (actionName) => {
  try {
    // 使用 videoService 执行 T4 action
    const result = await videoService.executeT4Action(
      props.module || 'default', 
      actionName,
      {
        apiUrl: props.apiUrl,
        extend: props.extend.ext
      }
    );
    
    // 检查返回结果是否包含action配置
    if (result && result.action) {
      // 传递解析后的action配置给ActionRenderer
      currentActionData.value = result.action;
      showActionRenderer.value = true;
    } else if(result){
      showToast(result, 'success')
    }else {
      // 如果没有返回action配置，显示错误提示
      Message.error({
        content: `无法获取动作配置: ${actionName}`,
        duration: 3000,
        closable: true
      });
    }
  } catch (error) {
    console.error('T4 action执行失败:', error);
    Message.error({
      content: `动作执行失败: ${error.message}`,
      duration: 3000,
      closable: true
    });
  }
};

// 采用更智能的防护策略，确保浏览器兼容性
const ENABLE_BASIC_UPDATES = true;
const DISABLE_COMPLEX_UPDATES = true;

// 浏览器检测
const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
const isFirefox = /Firefox/.test(navigator.userAgent);
const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

// 防护机制
let isProcessing = false;
let updateCount = 0;
const MAX_UPDATES_PER_SECOND = isChrome ? 3 : 5; // Chrome更严格的限制

// 定时器管理
let updateTimer = null;
let overflowCheckTimer = null;
let heightUpdateTimer = null;

// 缓存变量
let lastVideosLength = 0;
let lastShowStats = false;
let lastVideosHash = '';
let lastContainerHeight = 0;
let lastWatchUpdate = 0;

// 重置更新计数器
setInterval(() => {
  updateCount = 0;
}, 1000);

const updateScrollAreaHeight = () => {
  // 基本的防护检查
  if (isProcessing || updateCount >= MAX_UPDATES_PER_SECOND) {
    return;
  }
  
  updateCount++;
  isProcessing = true;
  
  try {
    const container = containerRef.value;
    if (!container) {
      return;
    }

    // 计算合适的高度
    const windowHeight = window.innerHeight || document.documentElement.clientHeight || 600;
    const fixedHeight = Math.max(windowHeight - 200, 400);
    
    // 只在高度变化较大时才更新
    if (Math.abs(containerHeight - fixedHeight) > 50) {
      containerHeight = fixedHeight;
      // 触发重新计算样式
      containerHeightTrigger.value++;
    }
  } catch (error) {
    console.error('updateScrollAreaHeight error:', error);
  } finally {
    setTimeout(() => {
      isProcessing = false;
    }, 100);
  }
};

const handleScroll = (e) => {
  // 获取真正的滚动容器（arco-scrollbar内部容器）
  const rawTarget = e?.target || e?.srcElement;
  const container = rawTarget?.closest ? rawTarget.closest('.arco-scrollbar-container') : rawTarget;
  if (!container) return;

  const scrollHeight = container.scrollHeight - container.clientHeight;
  const scrollTop = container.scrollTop;
  
  // 当滚动到距离底部50px以内时触发加载
  if (scrollHeight - scrollTop < 50) {
    emit('scroll-bottom');
    emit('load-more');
    
    // 延迟检查高度恢复，因为加载更多内容后可能需要恢复高度
    setTimeout(() => {
      checkHeightRestore();
    }, 200); // 减少延迟时间，让高度恢复更快
  }
};

const checkTextOverflow = () => {
  // 简化的文本溢出检查，确保浏览器兼容性
  if (isProcessing || updateCount >= MAX_UPDATES_PER_SECOND) {
    return;
  }
  
  try {
    const titleElements = document.querySelectorAll('.title-text');
    if (titleElements && titleElements.length > 0) {
      titleElements.forEach(element => {
        if (element && element.scrollWidth && element.clientWidth) {
          // 只检查，不修改DOM，避免触发重排
          const hasOverflow = element.scrollWidth > element.clientWidth;
          if (hasOverflow) {
            // 可以在这里添加一些简单的样式类，但不修改内容
            element.setAttribute('title', element.textContent || '');
          }
        }
      });
    }
  } catch (error) {
    console.error('checkTextOverflow error:', error);
  }
};

onMounted(() => {
  // 使用更安全的初始化方式，避免nextTick可能导致的递归更新
  if (containerRef.value) {
    // 立即设置初始高度
    const windowHeight = window.innerHeight || document.documentElement.clientHeight || 600;
    const fixedHeight = Math.max(windowHeight - 200, 400);
    containerHeight = fixedHeight;
    containerHeightTrigger.value++;
    
    // 针对不同浏览器使用不同的延迟策略
    const initDelay = isChrome ? 500 : 300; // Chrome需要更长的延迟
    
    // 延迟执行更新，确保DOM完全渲染，但避免递归调用
    setTimeout(() => {
      try {
        // 只进行基本的高度设置，不调用可能导致递归的函数
        if (containerRef.value) {
          const currentHeight = Math.max(window.innerHeight - 200, 400);
          if (Math.abs(containerHeight - currentHeight) > 50) {
            containerHeight = currentHeight;
            containerHeightTrigger.value++;
          }
          
          // 延迟检查内容高度，确保数据已经渲染
          setTimeout(() => {
            checkContentHeight();
          }, 1000);
        }
      } catch (error) {
        console.warn('Initial update failed:', error);
      }
    }, initDelay);
  }
});

// 启用基本的resize监听，但限制频率
if (ENABLE_BASIC_UPDATES) {
  let resizeTimer = null;
  let lastResizeTime = 0;
  const handleResize = () => {
    const now = Date.now();
    // 防止过于频繁的resize调用
    if (now - lastResizeTime < 1000) {
      return;
    }
    lastResizeTime = now;
    
    if (resizeTimer) {
      clearTimeout(resizeTimer);
    }
    resizeTimer = setTimeout(() => {
      if (!isProcessing && containerRef.value) {
        updateScrollAreaHeight();
      }
    }, 800); // 增加延迟，减少频率
  };
  
  window.addEventListener('resize', handleResize);
  
  // 清理函数
  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize);
    if (resizeTimer) {
      clearTimeout(resizeTimer);
    }
  });
}

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScrollAreaHeight);
  
  // 清理定时器
  if (autoLoadTimer) {
    clearTimeout(autoLoadTimer);
  }
  
  // 清理MutationObserver
  if (containerRef.value?._filterObserver) {
    containerRef.value._filterObserver.disconnect();
  }
});

// 计算videos数组的简单hash
const getVideosHash = (videos) => {
  if (!videos || videos.length === 0) return '';
  return videos.map(v => v.vod_id || '').join(',');
};

watch([() => props.videos, () => props.showStats], ([newVideos, newShowStats]) => {
  // 强化的递归防护机制
  if (DISABLE_COMPLEX_UPDATES || isProcessing || updateCount >= MAX_UPDATES_PER_SECOND) {
    return;
  }
  
  // 防止过于频繁的更新
  const now = Date.now();
  if (lastWatchUpdate && (now - lastWatchUpdate) < 200) {
    return;
  }
  lastWatchUpdate = now;
  
  const newVideosHash = getVideosHash(newVideos);
  
  // 更严格的条件检查
  if (newVideos.length === lastVideosLength && 
      newShowStats === lastShowStats && 
      newVideosHash === lastVideosHash) {
    return;
  }
  
  lastVideosLength = newVideos.length;
  lastShowStats = newShowStats;
  lastVideosHash = newVideosHash;
  
  // 清除之前的定时器
  if (updateTimer) {
    clearTimeout(updateTimer);
  }
  
  // 简化的更新逻辑 - 移除可能触发递归的操作
  updateTimer = setTimeout(() => {
    if (!isProcessing && containerRef.value && !DISABLE_COMPLEX_UPDATES) {
      // 只记录日志，不进行DOM操作
      console.log('Videos updated:', newVideos.length);
      // 检查内容高度
      checkContentHeight();
      // 延迟检查高度恢复，确保内容已经渲染完成
      setTimeout(() => {
        checkHeightRestore();
      }, 50); // 减少延迟时间，让用户无感知
    }
  }, 50); // 大幅减少延迟时间，让高度调整更快响应
  
  updateTimer._lastUpdate = Date.now();
}, { deep: false, flush: 'post' }); // 使用post flush避免同步更新

// 滚动位置恢复方法
const restoreScrollPosition = (scrollPosition) => {
  if (scrollPosition && scrollbarRef.value) {
    // 使用requestAnimationFrame确保DOM已渲染
    requestAnimationFrame(() => {
      const scrollContainer = scrollbarRef.value?.$el?.querySelector('.arco-scrollbar-container');
      if (scrollContainer) {
        // 使用平滑滚动
        scrollContainer.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        });
      }
    });
  }
};

// 获取当前滚动位置
const getCurrentScrollPosition = () => {
  if (scrollbarRef.value) {
    const scrollContainer = scrollbarRef.value?.$el?.querySelector('.arco-scrollbar-container');
    return scrollContainer?.scrollTop || 0;
  }
  return 0;
};

// ActionRenderer事件处理
const handleActionClose = () => {
  showActionRenderer.value = false;
  currentActionData.value = null;
};

const handleActionSubmit = (result) => {
  // 这里可以根据需要处理action的提交结果
  // 比如刷新列表、显示消息等
};

const handleSpecialAction = (actionType, actionData) => {
  // 将special-action事件传递给父组件处理
  emit('special-action', actionType, actionData);
  
  // 关闭ActionRenderer
  showActionRenderer.value = false;
  currentActionData.value = null;
};



// 暴露方法给父组件
defineExpose({
  checkTextOverflow,
  restoreScrollPosition,
  getCurrentScrollPosition,
  checkContentHeight,
  checkAutoLoadMore
});
</script>

<style scoped>
.video-grid-container {
  flex: 1;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  height: 100%;
  min-height: 0; /* 确保flex子元素可以收缩 */
}

.video-scroll-container {
  width: 100%;
  flex: 1; /* 使用flex让scrollbar占满剩余空间 */
  padding: 2px 20px 2px 16px; /* 大幅减少上下padding，让scrollbar占用更多空间 */
}

.video_list_hover {
  transition: transform 0.2s ease;
}

.video_list_hover:hover {
  transform: translateY(-2px);
}

.video_list_item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: white;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: auto;
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.video_list_item:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.video_list_item_img {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: #f5f5f5;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.folder-icon-container {
  width: 100%;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.folder-icon {
  font-size: 60px;
  color: #ffa940;
  transition: all 0.3s ease;
}

.video_list_item:hover .folder-icon {
  color: #ff7a00;
  transform: scale(1.1);
}

.file-icon-container {
  width: 100%;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.file-type-icon {
  font-size: 60px;
  color: #6c757d;
  transition: all 0.3s ease;
}

.video_list_item:hover .file-type-icon {
  color: #495057;
  transform: scale(1.1);
}

.video_list_item_img_cover {
  width: 100%;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  overflow: hidden;
  vertical-align: top;
  display: block;
}

.video_list_item::v-deep(.arco-image-img) {
  width: 100%;
  height: 300px;
  object-fit: cover;
}

.video_list_item:hover .video_list_item_img_cover {
  transform: scale(1.05);
}

.video_remarks_overlay {
  position: absolute;
  top: 4px;
  right: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
}

.video_list_item_title {
  padding: 6px 8px;
  background: white;
  flex-shrink: 0;
  height: auto;
  min-height: 16px;
  display: flex;
  align-items: center;
  overflow: hidden;
  position: relative;
}

.title-text {
  font-size: 12px;
  font-weight: 500;
  color: #2c2c2c;
  line-height: 1;
  white-space: nowrap;
  transition: color 0.2s ease;
  margin: 0;
  width: 100%;
  display: block;
}

/* 普通状态下隐藏溢出文本 */
.title-text:not([data-overflow="true"]) {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 跑马灯效果 - 电子公告屏幕样式 */
.title-text[data-overflow="true"] {
  animation: marquee 10s linear infinite;
  animation-delay: 1s;
  width: max-content;
  min-width: 100%;
}

.title-text[data-overflow="true"]:hover {
  animation-play-state: paused;
}

@keyframes marquee {
  0% {
    transform: translateX(0);
  }
  15% {
    transform: translateX(0);
  }
  85% {
    transform: translateX(calc(-100% + 100px));
  }
  100% {
    transform: translateX(calc(-100% + 100px));
  }
}

.video_list_item:hover .title-text {
  color: #1890ff;
}

.loading-container {
  text-align: center;
  padding: 20px;
}

.loading-text {
  margin-top: 8px;
  color: var(--color-text-3);
  font-size: 14px;
}

.no-more-data {
  text-align: center;
  padding: 20px;
  color: var(--color-text-3);
  font-size: 14px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--color-text-3);
  font-size: 16px;
}

.bottom-spacer {
  height: 8px;
}

.video-grid-container :deep(.arco-scrollbar),
.video-grid-container :deep(.arco-scrollbar-container) {
  height: 100%;
}

.video-scroll-container {
  min-height: 0;
  padding: 4px 10px 8px 4px;
}

.video-grid {
  width: 100%;
}

.video_list_item {
  background: var(--dp-bg-surface);
  border: 1px solid var(--dp-border-subtle);
  border-radius: 12px;
  box-shadow: var(--dp-shadow-sm);
}

.video_list_item:hover {
  border-color: color-mix(in srgb, var(--dp-primary-readable) 30%, var(--dp-border-subtle));
  box-shadow: var(--dp-shadow-md);
}

.video_list_item_img,
.folder-icon-container,
.file-icon-container,
.video_list_item::v-deep(.arco-image),
.video_list_item::v-deep(.arco-image-img) {
  height: auto;
  aspect-ratio: 2 / 3;
  border-radius: 12px 12px 0 0;
}

.video_list_item_img_cover {
  height: 100%;
}

.video_list_item_title {
  min-height: 34px;
  padding: 9px 10px;
  background: var(--dp-bg-surface);
}

.title-text {
  color: var(--dp-text-primary);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.25;
}

@media (min-width: 769px) {
  .video-grid :deep(.arco-grid) {
    row-gap: 14px !important;
    column-gap: 12px !important;
  }

  .video_list_item_title {
    min-height: 28px;
    padding: 7px 8px;
  }

  .title-text {
    font-size: 12px;
    line-height: 1.2;
  }
}

@media (max-width: 768px) {
  .video-scroll-container {
    padding: 2px 10px 2px 8px;
  }

  .video-grid :deep(.arco-grid) {
    row-gap: 8px !important;
    column-gap: 6px !important;
  }

  .folder-icon,
  .file-type-icon {
    font-size: 42px;
  }
}
</style>