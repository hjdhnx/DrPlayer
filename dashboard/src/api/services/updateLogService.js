/**
 * 更新日志服务
 * 管理系统更新日志和版本信息
 */

// 更新日志数据
const UPDATE_LOGS = [
  {
    id: 'v1.0.5-20260427-mobile-video',
    version: 'v1.0.5 20260427',
    date: '2026-04-28',
    title: '移动端点播操作区整理',
    type: 'improvement',
    description: '根据移动端点播页的实际使用反馈，调整顶部操作入口并压缩当前片源区域高度',
    changes: [
      '将移动端点播刷新入口移动到顶部 header，放在搜索按钮左侧',
      '移除当前片源区域里与 header 搜索重复的聚合按钮',
      '当前片源区域仅保留推送和动作入口，减少移动端首屏高度占用',
      '验证移动端 390px 宽度下无横向溢出，刷新按钮可触发原有重载逻辑'
    ],
    author: 'Claude Code',
    importance: 'major'
  },
  {
    id: 'v1.0.5-20260427-downloader',
    version: 'v1.0.5 20260427',
    date: '2026-04-28',
    title: '下载器弹窗与章节选择优化',
    type: 'improvement',
    description: '修复下载器新建任务弹窗在移动端和长章节列表下的滚动体验问题',
    changes: [
      '调整新建下载任务弹窗结构，避免最外层 modal 出现滚动条',
      '将弹窗主滚动收敛到内容区域，减少多层滚动条干扰',
      '章节列表默认折叠，章节很多时可以更快滚动到下载设置',
      '保留章节全选、全不选、反选、范围选择和单章勾选能力',
      '小说简介较长时支持展开与收起，避免详情区域撑高弹窗'
    ],
    author: 'Claude Code',
    importance: 'major'
  },
  {
    id: 'v1.0.5-20260427-about-version',
    version: 'v1.0.5 20260427',
    date: '2026-04-28',
    title: '关于弹窗版本号修正',
    type: 'bugfix',
    description: '修正设置页关于弹窗里的版本展示，避免继续显示旧的占位版本',
    changes: [
      '关于弹窗版本号显示为 v1.0.5 20260427',
      '版本来源继续读取应用构建版本，缺省值同步为当前版本',
      '兼容版本字符串已带 v 前缀的情况，避免显示重复前缀'
    ],
    author: 'Claude Code',
    importance: 'minor'
  },
  {
    id: 'v1.0.5-20260427-reader',
    version: 'v1.0.5 20260427',
    date: '2026-04-27',
    title: '小说阅读器移动端与章节体验改造',
    type: 'feature',
    description: '围绕小说阅读器的章节切换、设置弹窗和移动端布局做了一轮连续体验修复',
    changes: [
      '章节目录从弹窗式交互改为更接近阅读网站的左侧贴边导航',
      '移动端章节入口改为阅读器内侧滑目录，选章后可立即回到正文预览',
      '修复阅读器头部关闭、章节、设置等按钮在小屏幕下溢出或间距过近的问题',
      '阅读设置弹窗高度控制在半屏以内，并修复内部滚动无法到底导致保存按钮不可见的问题',
      '手动上一章、下一章按钮改为滚动到正文底部后出现，不再固定占用阅读区域'
    ],
    author: 'Claude Code',
    importance: 'major'
  },
  {
    id: 'v1.0.5-20260427-settings',
    version: 'v1.0.5 20260427',
    date: '2026-04-27',
    title: '设置页表单样式整理',
    type: 'improvement',
    description: '根据设置页输入框观感反馈，调整链接输入和移动端表单呈现',
    changes: [
      '设置页输入框内部圆角改为更简洁的满宽样式',
      '移除输入框前置链接图标，减少视觉噪音',
      '收紧输入框内部 padding，使内容区域更贴近满宽展示',
      '继续保留原有设置项、保存逻辑和校验行为'
    ],
    author: 'Claude Code',
    importance: 'minor'
  },
  {
    id: 'v1.0.5-20260427-mobile-ui',
    version: 'v1.0.5 20260427',
    date: '2026-04-26',
    title: '移动端页面响应式问题修复',
    type: 'bugfix',
    description: '集中处理多个页面在手机尺寸下的布局溢出、按钮拥挤和弹窗滚动问题',
    changes: [
      '修复部分移动端弹窗内容过高时底部操作不可达的问题',
      '调整多个移动端 header 和操作按钮的间距，降低误触概率',
      '优化阅读、下载、点播等页面的小屏布局，避免横向溢出',
      '使用 Playwright 在移动端视口进行实际页面验证'
    ],
    author: 'Claude Code',
    importance: 'major'
  },
  {
    id: 'v1.0.5-20260426-danmaku',
    version: 'v1.0.5 20260427',
    date: '2026-04-26',
    title: '弹幕与本地服务能力补充',
    type: 'feature',
    description: '补充近期真实提交中的弹幕插件和本地 WebSocket 相关能力说明',
    changes: [
      '支持弹幕插件能力，并继续完善 web:// 弹幕接入',
      '将百度相关 WebSocket 能力调整为本地服务链路',
      '已知 web:// 弹幕关闭后再开启仍有待继续优化'
    ],
    author: 'DrPlayer Maintainers',
    importance: 'major'
  }
]

/**
 * 获取更新日志类型配置
 */
export const getUpdateTypeConfig = () => {
  return {
    feature: {
      label: '新功能',
      color: '#00b42a',
      icon: '🚀'
    },
    improvement: {
      label: '功能优化',
      color: '#165dff',
      icon: '⚡'
    },
    optimization: {
      label: '性能优化',
      color: '#ff7d00',
      icon: '🔧'
    },
    security: {
      label: '安全更新',
      color: '#f53f3f',
      icon: '🔒'
    },
    bugfix: {
      label: 'Bug修复',
      color: '#722ed1',
      icon: '🐛'
    },
    release: {
      label: '版本发布',
      color: '#f7ba1e',
      icon: '🎉'
    }
  }
}

/**
 * 获取重要性配置
 */
export const getImportanceConfig = () => {
  return {
    critical: {
      label: '紧急',
      color: '#f53f3f',
      priority: 4
    },
    major: {
      label: '重要',
      color: '#ff7d00',
      priority: 3
    },
    minor: {
      label: '一般',
      color: '#165dff',
      priority: 2
    },
    trivial: {
      label: '轻微',
      color: '#86909c',
      priority: 1
    }
  }
}

/**
 * 获取所有更新日志
 */
export const getAllUpdateLogs = () => {
  return UPDATE_LOGS.sort((a, b) => new Date(b.date) - new Date(a.date))
}

/**
 * 根据类型筛选更新日志
 */
export const getUpdateLogsByType = (type) => {
  return UPDATE_LOGS
    .filter(log => log.type === type)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

/**
 * 根据重要性筛选更新日志
 */
export const getUpdateLogsByImportance = (importance) => {
  return UPDATE_LOGS
    .filter(log => log.importance === importance)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

/**
 * 获取最近的更新日志
 */
export const getRecentUpdateLogs = (limit = 5) => {
  return UPDATE_LOGS
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit)
}

/**
 * 根据日期范围获取更新日志
 */
export const getUpdateLogsByDateRange = (startDate, endDate) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  return UPDATE_LOGS
    .filter(log => {
      const logDate = new Date(log.date)
      return logDate >= start && logDate <= end
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

/**
 * 搜索更新日志
 */
export const searchUpdateLogs = (keyword) => {
  const lowerKeyword = keyword.toLowerCase()
  
  return UPDATE_LOGS
    .filter(log => {
      return (
        log.title.toLowerCase().includes(lowerKeyword) ||
        log.description.toLowerCase().includes(lowerKeyword) ||
        log.version.toLowerCase().includes(lowerKeyword) ||
        log.changes.some(change => change.toLowerCase().includes(lowerKeyword))
      )
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

/**
 * 获取更新统计信息
 */
export const getUpdateStats = () => {
  const typeConfig = getUpdateTypeConfig()
  const importanceConfig = getImportanceConfig()
  
  // 按类型统计
  const typeStats = {}
  Object.keys(typeConfig).forEach(type => {
    typeStats[type] = UPDATE_LOGS.filter(log => log.type === type).length
  })
  
  // 按重要性统计
  const importanceStats = {}
  Object.keys(importanceConfig).forEach(importance => {
    importanceStats[importance] = UPDATE_LOGS.filter(log => log.importance === importance).length
  })
  
  // 按月份统计
  const monthlyStats = {}
  UPDATE_LOGS.forEach(log => {
    const month = log.date.substring(0, 7) // YYYY-MM
    monthlyStats[month] = (monthlyStats[month] || 0) + 1
  })
  
  return {
    total: UPDATE_LOGS.length,
    byType: typeStats,
    byImportance: importanceStats,
    byMonth: monthlyStats,
    latestVersion: UPDATE_LOGS[0]?.version || 'v1.0.0',
    latestDate: UPDATE_LOGS[0]?.date || new Date().toISOString().split('T')[0]
  }
}

/**
 * 格式化日期显示
 */
export const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) {
    return '昨天'
  } else if (diffDays <= 7) {
    return `${diffDays}天前`
  } else if (diffDays <= 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks}周前`
  } else {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}

/**
 * 获取版本比较结果
 */
export const compareVersions = (version1, version2) => {
  const v1Parts = version1.replace('v', '').split('.').map(Number)
  const v2Parts = version2.replace('v', '').split('.').map(Number)
  
  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0
    const v2Part = v2Parts[i] || 0
    
    if (v1Part > v2Part) return 1
    if (v1Part < v2Part) return -1
  }
  
  return 0
}

// 默认导出服务对象
export default {
  getAllUpdateLogs,
  getUpdateLogsByType,
  getUpdateLogsByImportance,
  getRecentUpdateLogs,
  getUpdateLogsByDateRange,
  searchUpdateLogs,
  getUpdateStats,
  getUpdateTypeConfig,
  getImportanceConfig,
  formatDate,
  compareVersions
}