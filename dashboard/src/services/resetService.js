/**
 * 重置服务
 * 负责应用的出厂重置功能
 */

import { Message, Modal } from '@arco-design/web-vue'
import { saveCSPConfig, setGlobalReferrerPolicy } from '@/utils/csp'
import { applyTheme } from '@/utils/theme'
import { getDefaultAddressSettings, getDefaultAppSettings } from '@/config/defaults'

const getDefaultConfigs = () => ({
  addressSettings: getDefaultAddressSettings(),
  appSettings: getDefaultAppSettings(),
  
  // CSP配置默认值
  cspConfig: {
    enabled: true,
    referrerPolicy: 'no-referrer'
  },
  
  // 跳过设置默认值
  skipSettings: {},
  
  // 解析器配置默认值
  parserConfig: {},
  
  // 页面状态默认值
  pageState: {},
  
  // 聚合搜索设置默认值
  searchAggregationSettings: {
    selectedSources: [] // 默认没有选中任何搜索源
  },

  // 侧边栏折叠状态默认值
  sidebarCollapsed: false,
  
  // 开发者调试设置默认值
  debugSettings: {
    enabled: false,
    url: 'http://localhost:5757/apps/websocket',
    resetting: false
  }
})

// 需要完全清空的数据键
const CLEAR_DATA_KEYS = [
  // 用户数据
  'drplayer-favorites',           // 收藏列表
  'drplayer_watch_history',       // 观看历史
  'drplayer_histories',           // 历史页面数据
  'drplayer_daily_stats',         // 每日统计
  'drplayer_weekly_stats',        // 周统计
  'drplayer_parsers',             // 解析器数据
  
  // 聚合搜索相关
  'searchAggregationSettings',    // 聚合搜索源选择设置
  'pageState_searchAggregation',  // 聚合搜索页面状态
  'drplayer_search_history',      // 搜索历史记录
  
  // 站点数据
  'siteStore',                    // 站点存储
  'drplayer_config_url',          // 配置地址
  'drplayer_live_config_url',     // 直播配置地址
  'drplayer_current_site',        // 当前站点
  'drplayer_sites',               // 站点列表数据
  'site-nowSite',                 // 当前站点（兼容旧系统）
  
  // 配置数据
  'drplayer_config_data',         // 配置数据缓存
  'drplayer_config_fetch_time',   // 配置获取时间
  
  // 播放器相关
  'drplayer_preferred_player_type', // 首选播放器类型
  'selectedParser',               // 选中的解析器
  'last-clicked-video',           // 最后点击的视频
  
  // 其他设置和状态
  'sidebar-collapsed',            // 侧边栏折叠状态

  // 地址配置历史记录
  'drplayer_vod_config_history',
  'drplayer_live_config_history',
  'drplayer_proxy_access_history',
  'drplayer_proxy_play_history',
  'drplayer_proxy_sniff_history',
  
  // 开发者调试设置相关
  'debugSettings',
  
  // 悬浮组件相关
  'floating-iframe-button-position',
  'floating-iframe-window-position',
  'floating-iframe-window-size'
]

/**
 * 显示重置确认对话框
 */
export const showResetConfirmation = () => {
  return new Promise((resolve) => {
    Modal.confirm({
      title: '确认重置',
      content: `此操作将执行完整的出厂重置，包括：

• 重置所有配置接口地址为默认值
• 清空收藏列表
• 清空观看历史记录
• 清空解析器数据
• 清空站点数据
• 重置所有应用设置

⚠️ 此操作不可撤销，请确认是否继续？`,
      width: 480,
      closable: true,
      okText: '确认重置',
      cancelText: '取消',
      okButtonProps: {
        status: 'danger'
      },
      onOk: () => {
        resolve(true)
      },
      onCancel: () => {
        resolve(false)
      }
    })
  })
}

/**
 * 执行完整的出厂重置
 */
export const performFactoryReset = async () => {
  try {
    // 1. 清空需要删除的数据
    CLEAR_DATA_KEYS.forEach(key => {
      localStorage.removeItem(key)
    })
    
    const defaultConfigs = getDefaultConfigs()

    // 2. 重置配置为默认值
    Object.entries(defaultConfigs).forEach(([key, defaultValue]) => {
      if (defaultValue !== null && defaultValue !== undefined) {
        localStorage.setItem(key, JSON.stringify(defaultValue))
      }
    })
    
    // 3. 重置CSP配置
    try {
      saveCSPConfig(defaultConfigs.cspConfig)
      setGlobalReferrerPolicy('no-referrer')
      applyTheme(defaultConfigs.appSettings.themeMode)
    } catch (error) {
      console.warn('CSP配置重置失败:', error)
    }
    
    // 4. 显示成功消息
    Message.success({
      content: '出厂重置完成！应用已恢复到初始状态',
      duration: 3000
    })
    
    // 5. 建议用户刷新页面
    setTimeout(() => {
      Modal.info({
        title: '重置完成',
        content: '为确保所有更改生效，建议刷新页面。是否立即刷新？',
        okText: '立即刷新',
        cancelText: '稍后刷新',
        onOk: () => {
          window.location.reload()
        }
      })
    }, 1000)
    
    return true
  } catch (error) {
    console.error('出厂重置失败:', error)
    Message.error({
      content: '出厂重置失败，请重试',
      duration: 3000
    })
    return false
  }
}

/**
 * 带确认的出厂重置函数
 */
export const factoryResetWithConfirmation = async () => {
  const confirmed = await showResetConfirmation()
  if (confirmed) {
    return await performFactoryReset()
  }
  return false
}

export default {
  showResetConfirmation,
  performFactoryReset,
  factoryResetWithConfirmation,
  getDefaultConfigs
}