/**
 * 数据备份还原服务
 * 负责应用数据的备份和还原功能
 */

import { Message } from '@arco-design/web-vue'
import siteService from '@/api/services/site'

// 备份数据版本号，用于兼容性检查
const BACKUP_VERSION = '1.0.0'

// 需要备份的localStorage键名
const BACKUP_KEYS = {
  // 设置相关
  ADDRESS_SETTINGS: 'addressSettings',
  APP_SETTINGS: 'appSettings',
  CSP_CONFIG: 'csp_config',
  
  // 用户数据
  FAVORITES: 'drplayer-favorites',
  WATCH_HISTORY: 'drplayer_watch_history',
  DAILY_STATS: 'drplayer_daily_stats',
  WEEKLY_STATS: 'drplayer_weekly_stats',
  HISTORIES: 'drplayer_histories', // 历史页面数据
  
  // 站点数据
  SITE_STORE: 'siteStore',
  CONFIG_URL: 'drplayer_config_url',
  LIVE_CONFIG_URL: 'drplayer_live_config_url',
  CURRENT_SITE: 'drplayer_current_site',
  
  // 聚合搜索相关
  SEARCH_AGGREGATION_SETTINGS: 'searchAggregationSettings', // 聚合搜索源选择设置
  SEARCH_AGGREGATION_PAGE_STATE: 'pageState_searchAggregation', // 聚合搜索页面状态
  SEARCH_HISTORY: 'drplayer_search_history', // 搜索历史记录
  
  // 其他功能设置
  SKIP_SETTINGS: 'skipSettings',
  PARSER_CONFIG: 'parserConfig',
  PARSERS: 'drplayer_parsers', // 解析器数据
  SIDEBAR_COLLAPSED: 'sidebarCollapsed',
  PAGE_STATE: 'pageState',
  
  // 开发者调试设置
  DEBUG_SETTINGS: 'debugSettings',
  
  // 悬浮组件相关
  FLOATING_BUTTON_POSITION: 'floating-iframe-button-position',
  FLOATING_WINDOW_POSITION: 'floating-iframe-window-position',
  FLOATING_WINDOW_SIZE: 'floating-iframe-window-size'
}

// 存储为字符串的键（不需要JSON解析）
const STRING_KEYS = new Set([
  BACKUP_KEYS.CONFIG_URL,
  BACKUP_KEYS.LIVE_CONFIG_URL,
  BACKUP_KEYS.CURRENT_SITE,
  BACKUP_KEYS.SIDEBAR_COLLAPSED
])

/**
 * 获取当前时间戳字符串
 */
const getTimestamp = () => {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
}

/**
 * 从localStorage获取数据
 */
const getLocalStorageData = (key, defaultValue = null) => {
  try {
    const data = localStorage.getItem(key)
    if (!data) return defaultValue
    
    // 如果是字符串类型的键，直接返回字符串
    if (STRING_KEYS.has(key)) {
      return data
    }
    
    // 其他键尝试JSON解析
    return JSON.parse(data)
  } catch (error) {
    console.warn(`获取 ${key} 数据失败:`, error)
    return defaultValue
  }
}

/**
 * 设置localStorage数据
 */
const setLocalStorageData = (key, data) => {
  try {
    if (data === null || data === undefined) {
      localStorage.removeItem(key)
    } else {
      // 如果是字符串类型的键，直接存储字符串
      if (STRING_KEYS.has(key)) {
        localStorage.setItem(key, data || '')
      } else {
        // 其他键使用JSON序列化
        localStorage.setItem(key, JSON.stringify(data))
      }
    }
    return true
  } catch (error) {
    console.error(`保存 ${key} 数据失败:`, error)
    return false
  }
}

/**
 * 收集所有地址配置历史数据
 */
const collectAddressHistories = () => {
  const addressHistories = {}
  const addressHistoryKeys = [
    'address-history-vod-config',
    'address-history-live-config', 
    'address-history-proxy-access',
    'address-history-proxy-play',
    'address-history-proxy-sniff'
  ]
  
  addressHistoryKeys.forEach(key => {
    const data = getLocalStorageData(key, [])
    if (data && data.length > 0) {
      addressHistories[key] = data
    }
  })
  
  return addressHistories
}

/**
 * 收集所有需要备份的数据
 */
export const collectBackupData = () => {
  const backupData = {
    // 备份元信息
    meta: {
      version: BACKUP_VERSION,
      timestamp: new Date().toISOString(),
      appName: 'DrPlayer',
      description: '应用数据备份文件'
    },
    
    // 设置数据
    settings: {
      // 地址设置
      addressSettings: getLocalStorageData(BACKUP_KEYS.ADDRESS_SETTINGS, {}),
      // 应用设置
      appSettings: getLocalStorageData(BACKUP_KEYS.APP_SETTINGS, {}),
      // CSP配置
      cspConfig: getLocalStorageData(BACKUP_KEYS.CSP_CONFIG, {}),
      // 跳过设置
      skipSettings: getLocalStorageData(BACKUP_KEYS.SKIP_SETTINGS, {}),
      // 解析器配置
      parserConfig: getLocalStorageData(BACKUP_KEYS.PARSER_CONFIG, {}),
      // 解析器数据
      parsers: getLocalStorageData(BACKUP_KEYS.PARSERS, []),
      // 聚合搜索设置
      searchAggregationSettings: getLocalStorageData(BACKUP_KEYS.SEARCH_AGGREGATION_SETTINGS, {}),
      // 侧边栏状态
      sidebarCollapsed: getLocalStorageData(BACKUP_KEYS.SIDEBAR_COLLAPSED, false),
      // 页面状态
      pageState: getLocalStorageData(BACKUP_KEYS.PAGE_STATE, {})
    },
    
    // 用户数据
    userData: {
      // 收藏列表
      favorites: getLocalStorageData(BACKUP_KEYS.FAVORITES, []),
      // 观看历史（watchStatsService使用）
      watchHistory: getLocalStorageData(BACKUP_KEYS.WATCH_HISTORY, []),
      // 历史页面数据（historyStore使用）
      histories: getLocalStorageData(BACKUP_KEYS.HISTORIES, []),
      // 搜索历史记录
      searchHistory: getLocalStorageData(BACKUP_KEYS.SEARCH_HISTORY, []),
      // 聚合搜索页面状态
      searchAggregationPageState: getLocalStorageData(BACKUP_KEYS.SEARCH_AGGREGATION_PAGE_STATE, {}),
      // 每日统计
      dailyStats: getLocalStorageData(BACKUP_KEYS.DAILY_STATS, {}),
      // 周统计
      weeklyStats: getLocalStorageData(BACKUP_KEYS.WEEKLY_STATS, {}),
      // 地址配置历史
      addressHistories: collectAddressHistories()
    },
    
    // 站点和配置数据
    siteData: {
      // 站点存储
      siteStore: getLocalStorageData(BACKUP_KEYS.SITE_STORE, {}),
      // 配置地址
      configUrl: getLocalStorageData(BACKUP_KEYS.CONFIG_URL, ''),
      // 直播配置地址
      liveConfigUrl: getLocalStorageData(BACKUP_KEYS.LIVE_CONFIG_URL, ''),
      // 当前站点
      currentSite: getLocalStorageData(BACKUP_KEYS.CURRENT_SITE, null)
    },
    
    // 开发者调试设置
    debugSettings: getLocalStorageData(BACKUP_KEYS.DEBUG_SETTINGS, {}),
    
    // 悬浮组件数据
    floatingData: {
      // 悬浮按钮位置
      buttonPosition: getLocalStorageData(BACKUP_KEYS.FLOATING_BUTTON_POSITION, null),
      // 悬浮窗口位置
      windowPosition: getLocalStorageData(BACKUP_KEYS.FLOATING_WINDOW_POSITION, null),
      // 悬浮窗口尺寸
      windowSize: getLocalStorageData(BACKUP_KEYS.FLOATING_WINDOW_SIZE, null)
    }
  }
  
  return backupData
}

/**
 * 验证备份数据格式
 */
export const validateBackupData = (data) => {
  try {
    // 检查基本结构
    if (!data || typeof data !== 'object') {
      return { valid: false, error: '备份数据格式无效' }
    }
    
    // 检查元信息
    if (!data.meta || !data.meta.version || !data.meta.timestamp) {
      return { valid: false, error: '备份文件缺少必要的元信息' }
    }
    
    // 检查版本兼容性
    if (data.meta.version !== BACKUP_VERSION) {
      console.warn(`备份文件版本 ${data.meta.version} 与当前版本 ${BACKUP_VERSION} 不匹配`)
      // 暂时允许不同版本，但给出警告
    }
    
    // 检查必要的数据结构
    const requiredSections = ['settings', 'userData', 'siteData']
    for (const section of requiredSections) {
      if (!data[section] || typeof data[section] !== 'object') {
        return { valid: false, error: `备份数据缺少 ${section} 部分` }
      }
    }
    
    return { valid: true }
  } catch (error) {
    return { valid: false, error: '备份数据解析失败: ' + error.message }
  }
}

/**
 * 导出备份数据到JSON文件
 */
export const exportBackupData = () => {
  try {
    const backupData = collectBackupData()
    const timestamp = getTimestamp()
    const filename = `DrPlayer_backup_${timestamp}.json`
    
    // 创建下载链接
    const dataStr = JSON.stringify(backupData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    // 创建下载元素
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    
    // 触发下载
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // 清理URL对象
    URL.revokeObjectURL(url)
    
    Message.success(`备份文件已导出: ${filename}`)
    return { success: true, filename }
  } catch (error) {
    console.error('导出备份数据失败:', error)
    Message.error('导出备份失败: ' + error.message)
    return { success: false, error: error.message }
  }
}

/**
 * 还原备份数据
 */
export const restoreBackupData = (backupData) => {
  try {
    // 验证备份数据
    const validation = validateBackupData(backupData)
    if (!validation.valid) {
      Message.error(validation.error)
      return { success: false, error: validation.error }
    }
    
    let restoredCount = 0
    let failedCount = 0
    const errors = []
    
    // 还原设置数据
    if (backupData.settings) {
      for (const [key, value] of Object.entries(backupData.settings)) {
        if (key === 'parsers') {
          // 特殊处理解析器数据
          if (setLocalStorageData(BACKUP_KEYS.PARSERS, value)) {
            restoredCount++
          } else {
            failedCount++
            errors.push(`解析器数据`)
          }
        } else if (key === 'searchAggregationSettings') {
          // 特殊处理聚合搜索设置
          if (setLocalStorageData(BACKUP_KEYS.SEARCH_AGGREGATION_SETTINGS, value)) {
            restoredCount++
          } else {
            failedCount++
            errors.push(`聚合搜索设置`)
          }
        } else {
          const storageKey = Object.values(BACKUP_KEYS).find(k => k.includes(key) || key.includes(k.split('_').pop()))
          if (storageKey) {
            if (setLocalStorageData(storageKey, value)) {
              restoredCount++
            } else {
              failedCount++
              errors.push(`设置数据 ${key}`)
            }
          } else {
            // 直接使用key名称
            if (setLocalStorageData(key, value)) {
              restoredCount++
            } else {
              failedCount++
              errors.push(`设置数据 ${key}`)
            }
          }
        }
      }
    }
    
    // 还原用户数据
    if (backupData.userData) {
      const userDataMapping = {
        favorites: BACKUP_KEYS.FAVORITES,
        watchHistory: BACKUP_KEYS.WATCH_HISTORY,
        dailyStats: BACKUP_KEYS.DAILY_STATS,
        weeklyStats: BACKUP_KEYS.WEEKLY_STATS,
        histories: BACKUP_KEYS.HISTORIES, // 历史页面数据
        searchHistory: BACKUP_KEYS.SEARCH_HISTORY, // 搜索历史记录
        searchAggregationPageState: BACKUP_KEYS.SEARCH_AGGREGATION_PAGE_STATE // 聚合搜索页面状态
      }
      
      for (const [key, value] of Object.entries(backupData.userData)) {
        const storageKey = userDataMapping[key]
        if (storageKey && setLocalStorageData(storageKey, value)) {
          restoredCount++
        } else if (key === 'addressHistories' && value) {
          // 还原地址配置历史
          for (const [historyKey, historyValue] of Object.entries(value)) {
            if (setLocalStorageData(historyKey, historyValue)) {
              restoredCount++
            } else {
              failedCount++
              errors.push(`地址配置历史 ${historyKey}`)
            }
          }
        } else {
          failedCount++
          errors.push(`用户数据 ${key}`)
        }
      }
    }
    
    // 还原站点数据
    if (backupData.siteData) {
      const siteDataMapping = {
        siteStore: BACKUP_KEYS.SITE_STORE,
        configUrl: BACKUP_KEYS.CONFIG_URL,
        liveConfigUrl: BACKUP_KEYS.LIVE_CONFIG_URL,
        currentSite: BACKUP_KEYS.CURRENT_SITE
      }
      
      let restoredCurrentSite = null
      
      for (const [key, value] of Object.entries(backupData.siteData)) {
        const storageKey = siteDataMapping[key]
        if (storageKey && setLocalStorageData(storageKey, value)) {
          restoredCount++
          
          // 记录还原的当前站点信息
          if (key === 'currentSite' && value) {
            restoredCurrentSite = value
          }
        } else {
          failedCount++
          errors.push(`站点数据 ${key}`)
        }
      }
      
      // 如果还原了当前站点，需要同步到siteService
      if (restoredCurrentSite) {
        try {
          const currentSiteData = typeof restoredCurrentSite === 'string' && restoredCurrentSite.trim().startsWith('{')
            ? JSON.parse(restoredCurrentSite)
            : restoredCurrentSite
          const currentSiteKey = typeof currentSiteData === 'string' ? currentSiteData : currentSiteData?.key

          if (currentSiteKey) {
            // 同步到siteService（如果站点存在）
            const success = siteService.setCurrentSite(currentSiteKey)
            if (success) {
              console.log('已同步还原的当前站点到siteService:', typeof currentSiteData === 'string' ? currentSiteKey : currentSiteData.name)
            } else {
              console.warn('还原的当前站点在站点列表中不存在，可能需要重新配置:', currentSiteKey)
            }
          }
        } catch (error) {
          console.error('同步还原的当前站点到siteService失败:', error)
        }
      }
    }
    
    // 还原开发者调试设置
    if (backupData.debugSettings) {
      if (setLocalStorageData(BACKUP_KEYS.DEBUG_SETTINGS, backupData.debugSettings)) {
        restoredCount++
      } else {
        failedCount++
        errors.push('开发者调试设置')
      }
    }
    
    // 还原悬浮组件数据
    if (backupData.floatingData) {
      const floatingDataMapping = {
        buttonPosition: BACKUP_KEYS.FLOATING_BUTTON_POSITION,
        windowPosition: BACKUP_KEYS.FLOATING_WINDOW_POSITION,
        windowSize: BACKUP_KEYS.FLOATING_WINDOW_SIZE
      }
      
      for (const [key, value] of Object.entries(backupData.floatingData)) {
        const storageKey = floatingDataMapping[key]
        if (storageKey && value !== null) {
          if (setLocalStorageData(storageKey, value)) {
            restoredCount++
          } else {
            failedCount++
            errors.push(`悬浮组件数据 ${key}`)
          }
        }
      }
    }
    
    // 显示还原结果
    if (failedCount === 0) {
      Message.success(`数据还原成功！共还原 ${restoredCount} 项数据`)
    } else {
      Message.warning(`数据还原完成！成功 ${restoredCount} 项，失败 ${failedCount} 项`)
      if (errors.length > 0) {
        console.warn('还原失败的项目:', errors)
      }
    }
    
    return { 
      success: true, 
      restoredCount, 
      failedCount, 
      errors,
      needsReload: true // 提示需要刷新页面
    }
  } catch (error) {
    console.error('还原备份数据失败:', error)
    Message.error('还原备份失败: ' + error.message)
    return { success: false, error: error.message }
  }
}

/**
 * 从文件导入备份数据
 */
export const importBackupFromFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('请选择备份文件'))
      return
    }
    
    // 检查文件类型
    if (!file.name.endsWith('.json')) {
      reject(new Error('请选择JSON格式的备份文件'))
      return
    }
    
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target.result)
        const result = restoreBackupData(backupData)
        resolve(result)
      } catch (error) {
        reject(new Error('备份文件格式错误: ' + error.message))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
    
    reader.readAsText(file)
  })
}

/**
 * 获取备份数据统计信息
 */
export const getBackupStats = () => {
  const backupData = collectBackupData()
  
  const stats = {
    settings: Object.keys(backupData.settings).length,
    favorites: backupData.userData.favorites?.length || 0,
    watchHistory: backupData.userData.histories?.length || 0, // 使用历史页面数据
    parsers: backupData.settings.parsers?.length || 0, // 解析器数量
    sites: Object.keys(backupData.siteData.siteStore || {}).length,
    totalSize: JSON.stringify(backupData).length
  }
  
  return stats
}

export default {
  collectBackupData,
  validateBackupData,
  exportBackupData,
  restoreBackupData,
  importBackupFromFile,
  getBackupStats
}