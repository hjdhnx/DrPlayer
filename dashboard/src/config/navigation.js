export const desktopMenuItems = [
  { id: 1, name: '主页', icon: 'icon-zhuye', route: '/', routeName: 'Home' },
  { id: 2, name: '点播', icon: 'icon-dianbo', route: '/video', routeName: 'Video' },
  { id: 4, name: '直播', icon: 'icon-shipinzhibo', route: '/live', routeName: 'Live' },
  { id: 5, name: '书画柜', icon: 'icon-shugui', route: '/book-gallery', routeName: 'BookGallery' },
  { id: 6, name: '解析', icon: 'icon-jiexi', route: '/parser', routeName: 'Parser' },
  { id: 7, name: '收藏', icon: 'icon-shoucang', route: '/collection', routeName: 'Collection' },
  { id: 8, name: '历史', icon: 'icon-lishi', route: '/history', routeName: 'History' },
  { id: 11, name: '下载', icon: 'icon-xiazai', route: '/download-manager', routeName: 'DownloadManager' },
  { id: 10, name: '测试', icon: 'icon-ceshi', route: '/action-test', routeName: 'ActionTest' },
  { id: 9, name: '设置', icon: 'icon-shezhi', route: '/settings', routeName: 'Settings' }
]

export const mobilePrimaryItems = [
  { id: 'mobile-home', name: '首页', icon: 'icon-zhuye', route: '/', routeName: 'Home' },
  { id: 'mobile-video', name: '点播', icon: 'icon-dianbo', route: '/video', routeName: 'Video' },
  { id: 'mobile-live', name: '直播', icon: 'icon-shipinzhibo', route: '/live', routeName: 'Live' },
  { id: 'mobile-book', name: '书柜', icon: 'icon-shugui', route: '/book-gallery', routeName: 'BookGallery' }
]

export const mobileMoreGroups = [
  {
    title: '我的内容',
    items: [
      { id: 'more-collection', name: '收藏', desc: '已收藏的影视内容', icon: 'icon-shoucang', route: '/collection', routeName: 'Collection' },
      { id: 'more-history', name: '历史', desc: '观看与浏览记录', icon: 'icon-lishi', route: '/history', routeName: 'History' },
      { id: 'more-download', name: '下载', desc: '小说与内容下载任务', icon: 'icon-xiazai', route: '/download-manager', routeName: 'DownloadManager' },
      { id: 'more-settings', name: '设置', desc: '数据、地址与应用设置', icon: 'icon-shezhi', route: '/settings', routeName: 'Settings' }
    ]
  },
  {
    title: '高级工具',
    items: [
      { id: 'more-parser', name: '解析', desc: '解析、嗅探和播放工具', icon: 'icon-jiexi', route: '/parser', routeName: 'Parser' },
      { id: 'more-action', name: 'Action 测试', desc: '动作与调试工具', icon: 'icon-ceshi', route: '/action-test', routeName: 'ActionTest' },
      { id: 'more-action-debug', name: 'Action 调试', desc: 'Action 调试面板', icon: 'icon-ceshi', route: '/action-debug-test', routeName: 'ActionDebugTest' },
      { id: 'more-video-test', name: '视频测试', desc: '视频播放测试页', icon: 'icon-ceshi', route: '/video-test', routeName: 'VideoTest' },
      { id: 'more-csp-test', name: 'CSP 测试', desc: 'CSP 与代理测试', icon: 'icon-ceshi', route: '/csp-test', routeName: 'CSPTest' }
    ]
  }
]

export const routeMeta = {
  Home: { title: '首页', icon: 'icon-zhuye', mobilePrimary: true, showBottomNav: true, showTopBar: true },
  Video: { title: '点播', icon: 'icon-dianbo', mobilePrimary: true, showBottomNav: true, showTopBar: true },
  VideoDetail: { title: '详情', icon: 'icon-dianbo', showBottomNav: false, showTopBar: true, immersive: true },
  Live: { title: '直播', icon: 'icon-shipinzhibo', mobilePrimary: true, showBottomNav: true, showTopBar: true },
  Settings: { title: '设置', icon: 'icon-shezhi', mobileMore: true, showBottomNav: true, showTopBar: true },
  Collection: { title: '收藏', icon: 'icon-shoucang', mobileMore: true, showBottomNav: true, showTopBar: true },
  BookGallery: { title: '书画柜', icon: 'icon-shugui', mobilePrimary: true, showBottomNav: true, showTopBar: true },
  LocalBookReader: { title: '阅读', icon: 'icon-shugui', showBottomNav: false, showTopBar: true, immersive: true },
  DownloadManager: { title: '下载', icon: 'icon-xiazai', mobileMore: true, showBottomNav: true, showTopBar: true },
  History: { title: '历史', icon: 'icon-lishi', mobileMore: true, showBottomNav: true, showTopBar: true },
  Parser: { title: '解析', icon: 'icon-jiexi', mobileMore: true, showBottomNav: true, showTopBar: true },
  ActionTest: { title: 'Action 测试', icon: 'icon-ceshi', mobileMore: true, showBottomNav: true, showTopBar: true },
  ActionDebugTest: { title: 'Action 调试', icon: 'icon-ceshi', mobileMore: true, showBottomNav: true, showTopBar: true },
  VideoTest: { title: '视频测试', icon: 'icon-ceshi', mobileMore: true, showBottomNav: true, showTopBar: true },
  CSPTest: { title: 'CSP 测试', icon: 'icon-ceshi', mobileMore: true, showBottomNav: true, showTopBar: true },
  SearchAggregation: { title: '搜索', icon: 'icon-sousuo', showBottomNav: false, showTopBar: true }
}

export const getRouteMetaByName = (routeName) => routeMeta[routeName] || {}
