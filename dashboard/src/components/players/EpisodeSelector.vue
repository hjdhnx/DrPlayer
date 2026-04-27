<template>
  <a-card v-if="playRoutes.length > 0" class="play-section">
    <h3>播放线路</h3>
    
    <!-- 线路选择 -->
    <div class="route-tabs">
      <a-button
        v-for="(route, index) in playRoutes"
        :key="index"
        :type="currentRoute === index ? 'primary' : 'outline'"
        @click="switchRoute(index)"
        class="route-btn"
      >
        <span class="route-name">{{ route.name }}</span>
        <a-badge :count="route.episodes.length" class="route-badge" />
      </a-button>
    </div>

    <!-- 选集列表 -->
    <div v-if="currentRouteEpisodes.length > 0" class="episodes-section">
      <div class="episodes-header">
        <h4>选集列表 ({{ currentRouteEpisodes.length }}集)</h4>
        <div class="episodes-controls">
          <!-- 排序按钮 -->
          <a-button 
            type="text" 
            size="small" 
            @click="toggleEpisodeSort"
            :title="episodeSortOrder === 'asc' ? '切换为倒序' : '切换为正序'"
            class="sort-btn"
          >
            <template #icon>
              <icon-sort-ascending v-if="episodeSortOrder === 'asc'" />
              <icon-sort-descending v-else />
            </template>
            {{ episodeSortOrder === 'asc' ? '正序' : '倒序' }}
          </a-button>
          
          <!-- 显示策略选择 -->
          <a-select 
            v-model="episodeDisplayStrategy" 
            @change="changeDisplayStrategy"
            size="small"
            class="strategy-select"
            :style="{ width: '150px' }"
            position="bl"
            :popup-container="'body'"
          >
            <template #prefix>
              <icon-settings />
            </template>
            <a-option value="full">完整显示</a-option>
            <a-option value="smart">智能去重</a-option>
            <a-option value="simple">精简显示</a-option>
          </a-select>
          
          <!-- 布局选项 -->
          <a-select 
            v-model="episodeLayoutColumns" 
            @change="changeLayoutColumns"
            size="small"
            class="layout-select"
            :style="{ width: '120px' }"
            position="bl"
            :popup-container="'body'"
          >
            <template #prefix>
              <icon-menu />
            </template>
            <a-option value="smart">智能</a-option>
            <a-option value="12">12列</a-option>
            <a-option value="9">9列</a-option>
            <a-option value="6">6列</a-option>
            <a-option value="3">3列</a-option>
          </a-select>
        </div>
      </div>
      <div class="episodes-grid" :style="{ '--episodes-columns': actualLayoutColumns }">
        <a-button
          v-for="(episode, index) in currentRouteEpisodes"
          :key="index"
          :type="currentEpisode === index ? 'primary' : 'outline'"
          @click="selectEpisode(index)"
          class="episode-btn"
          size="small"
          :title="episode.name"
        >
          <span class="episode-text">{{ episode.displayName || episode.name }}</span>
        </a-button>
      </div>
    </div>
  </a-card>

  <!-- 无播放资源提示 -->
  <a-card v-else class="no-play-section">
    <a-empty description="暂无播放资源" />
  </a-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { 
  IconSortAscending,
  IconSortDescending,
  IconSettings,
  IconMenu
} from '@arco-design/web-vue/es/icon'

// Props
const props = defineProps({
  videoDetail: {
    type: Object,
    default: () => ({})
  },
  currentRoute: {
    type: Number,
    default: 0
  },
  currentEpisode: {
    type: Number,
    default: 0
  }
})

// Emits
const emit = defineEmits(['route-change', 'episode-change'])

// 响应式数据
const episodeSortOrder = ref('asc') // 'asc' 正序, 'desc' 倒序
const episodeDisplayStrategy = ref(localStorage.getItem('episodeDisplayStrategy') || 'full') // 'full' 完整显示, 'smart' 智能去重, 'simple' 精简显示
const episodeLayoutColumns = ref(localStorage.getItem('episodeLayoutColumns') || 'smart') // 每行显示的按钮数量，支持智能布局

// 解析选集数据
const parseEpisodes = (urlString) => {
  if (!urlString) return []
  
  return urlString.split('#').map(item => {
    const [name, url] = item.split('$')
    return {
      name: name?.trim() || '未知集数',
      url: url?.trim() || ''
    }
  }).filter(item => item.url)
}

// 处理选集名称显示
const processEpisodeName = (name) => {
  if (!name) return '未知'
  
  switch (episodeDisplayStrategy.value) {
    case 'simple':
      // 精简显示：只保留数字部分
      const match = name.match(/\d+/)
      return match ? match[0] : name
    case 'smart':
      // 智能去重：移除常见前缀
      return name.replace(/^(第|集|话|期|EP|Episode)\s*/i, '').replace(/\s*(集|话|期)$/i, '')
    case 'full':
    default:
      // 完整显示
      return name
  }
}

// 计算属性
const playRoutes = computed(() => {
  if (!props.videoDetail?.vod_play_from || !props.videoDetail?.vod_play_url) {
    return []
  }
  
  const fromList = props.videoDetail.vod_play_from.split('$$$')
  const urlList = props.videoDetail.vod_play_url.split('$$$')
  
  return fromList.map((name, index) => ({
    name: name.trim(),
    episodes: parseEpisodes(urlList[index] || '')
  }))
})

const currentRouteEpisodes = computed(() => {
  let episodes = playRoutes.value[props.currentRoute]?.episodes || []
  
  // 应用显示策略
  episodes = episodes.map(episode => ({
    ...episode,
    displayName: processEpisodeName(episode.name)
  }))
  
  // 应用排序
  if (episodeSortOrder.value === 'desc') {
    episodes = [...episodes].reverse()
  }
  
  return episodes
})

// 智能布局计算属性
const smartLayoutColumns = computed(() => {
  if (!currentRouteEpisodes.value.length) return 12
  
  // 计算最长的选集名称长度
  const maxNameLength = Math.max(...currentRouteEpisodes.value.map(episode => 
    (episode.displayName || episode.name || '').length
  ))
  
  // 以总宽度60为基础，每个字符大约占用1个单位宽度
  // 考虑按钮的padding、margin等额外空间，每个按钮需要额外2-3个单位
  const buttonWidth = maxNameLength + 1 // 文字宽度 + 按钮内边距等
  
  // 计算能容纳的列数，范围在1-12之间
  let columns = Math.floor(60 / buttonWidth)
  
  // 确保列数在1-12范围内
  columns = Math.max(1, Math.min(12, columns))
  
  console.log('智能布局计算:', { maxNameLength, buttonWidth, columns })
  
  return columns
})

// 实际使用的列数
const actualLayoutColumns = computed(() => {
  if (episodeLayoutColumns.value === 'smart') {
    return smartLayoutColumns.value
  }
  return parseInt(episodeLayoutColumns.value) || 12
})

// 方法
const switchRoute = (index) => {
  emit('route-change', index)
}

const selectEpisode = (index) => {
  emit('episode-change', index)
}

const toggleEpisodeSort = () => {
  episodeSortOrder.value = episodeSortOrder.value === 'asc' ? 'desc' : 'asc'
}

const changeDisplayStrategy = (value) => {
  episodeDisplayStrategy.value = value
  localStorage.setItem('episodeDisplayStrategy', value)
}

const changeLayoutColumns = (value) => {
  episodeLayoutColumns.value = value
  localStorage.setItem('episodeLayoutColumns', value)
}

// 监听显示策略变化
watch(episodeDisplayStrategy, () => {
  // 触发重新计算
})
</script>

<style scoped>
.play-section {
  margin-bottom: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.play-section h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-1);
  margin-bottom: 20px;
}

.route-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.route-btn {
  position: relative;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
  min-width: 120px;
  height: 40px;
}

.route-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.route-name {
  margin-right: 8px;
}

.route-badge {
  font-size: 12px;
}

.episodes-section {
  margin-top: 20px;
}

.episodes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.episodes-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-1);
  margin: 0;
}

.episodes-controls {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.sort-btn {
  border-radius: 6px;
  transition: all 0.2s ease;
}

.strategy-select,
.layout-select {
  border-radius: 6px;
}

.episodes-grid {
  display: grid;
  grid-template-columns: repeat(var(--episodes-columns, 12), minmax(0, 1fr));
  gap: 8px;
  margin-top: 16px;
  width: 100%;
  box-sizing: border-box;
}

.episode-btn {
  border-radius: 6px;
  transition: all 0.2s ease;
  min-height: 36px;
  font-size: 13px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.episode-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.episode-text {
  display: block;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  padding: 0 8px;
}

.no-play-section {
  text-align: center;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .episodes-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .episodes-controls {
    width: 100%;
    justify-content: space-between;
  }
  
  .strategy-select,
  .layout-select {
    width: 120px !important;
  }
  
  .route-tabs {
    gap: 8px;
  }
  
  .route-btn {
    min-width: 100px;
    height: 36px;
    font-size: 12px;
  }
  
  .episodes-grid {
    gap: 6px;
  }
  
  .episode-btn {
    min-height: 32px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .route-btn {
    min-width: 80px;
    height: 32px;
    font-size: 11px;
  }
  
  .episode-btn {
    min-height: 28px;
    font-size: 11px;
  }
}
</style>