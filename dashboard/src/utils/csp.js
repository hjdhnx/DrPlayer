/**
 * CSP (Content Security Policy) 工具函数
 * 用于处理视频播放时的CSP策略和防盗链绕过
 */

/**
 * Referrer 策略选项
 */
export const REFERRER_POLICIES = {
  NO_REFERRER: 'no-referrer',
  NO_REFERRER_WHEN_DOWNGRADE: 'no-referrer-when-downgrade',
  ORIGIN: 'origin',
  ORIGIN_WHEN_CROSS_ORIGIN: 'origin-when-cross-origin',
  SAME_ORIGIN: 'same-origin',
  STRICT_ORIGIN: 'strict-origin',
  STRICT_ORIGIN_WHEN_CROSS_ORIGIN: 'strict-origin-when-cross-origin',
  UNSAFE_URL: 'unsafe-url'
}

/**
 * Referrer 策略选项列表（用于UI选择）
 */
export const REFERRER_POLICIES_LIST = [
  { value: 'no-referrer', label: '不发送Referrer' },
  { value: 'no-referrer-when-downgrade', label: 'HTTPS到HTTP时不发送' },
  { value: 'origin', label: '只发送源域名' },
  { value: 'origin-when-cross-origin', label: '跨域时只发送源域名' },
  { value: 'same-origin', label: '同源时发送完整Referrer' },
  { value: 'strict-origin', label: '严格源域名策略' },
  { value: 'strict-origin-when-cross-origin', label: '跨域时严格控制' },
  { value: 'unsafe-url', label: '总是发送完整Referrer（不安全）' }
]

/**
 * 获取当前的referrer策略
 * @returns {string} 当前的referrer策略
 */
export function getCurrentReferrerPolicy() {
  const metaTag = document.querySelector('meta[name="referrer"]')
  return metaTag ? metaTag.getAttribute('content') : 'default'
}

/**
 * 设置全局referrer策略
 * @param {string} policy - referrer策略
 */
export function setGlobalReferrerPolicy(policy) {
  let metaTag = document.querySelector('meta[name="referrer"]')
  
  if (!metaTag) {
    metaTag = document.createElement('meta')
    metaTag.setAttribute('name', 'referrer')
    document.head.appendChild(metaTag)
  }
  
  metaTag.setAttribute('content', policy)
  console.log(`已设置全局referrer策略为: ${policy}`)
}

/**
 * 为特定的视频元素设置referrer策略
 * @param {HTMLVideoElement} videoElement - 视频元素
 * @param {string} policy - referrer策略
 */
export function setVideoReferrerPolicy(videoElement, policy) {
  if (videoElement && videoElement.tagName === 'VIDEO') {
    videoElement.setAttribute('referrerpolicy', policy)
    console.log(`已为视频元素设置referrer策略: ${policy}`)
  }
}

/**
 * 创建带有特定referrer策略的视频元素
 * @param {string} policy - referrer策略
 * @returns {HTMLVideoElement} 配置好的视频元素
 */
export function createVideoWithReferrerPolicy(policy = REFERRER_POLICIES.NO_REFERRER) {
  const video = document.createElement('video')
  video.setAttribute('referrerpolicy', policy)
  video.setAttribute('crossorigin', 'anonymous')
  return video
}

/**
 * 为fetch请求设置no-referrer策略
 * @param {string} url - 请求URL
 * @param {object} options - fetch选项
 * @returns {Promise} fetch请求
 */
export function fetchWithNoReferrer(url, options = {}) {
  return fetch(url, {
    ...options,
    referrerPolicy: REFERRER_POLICIES.NO_REFERRER
  })
}

/**
 * 检查URL是否可能需要特殊的referrer策略
 * @param {string} url - 视频URL
 * @returns {boolean} 是否需要特殊处理
 */
export function needsSpecialReferrerPolicy(url) {
  if (!url) return false
  
  // 常见的需要no-referrer的域名模式
  const specialDomains = [
    'qq.com',
    'iqiyi.com',
    'youku.com',
    'bilibili.com',
    'douyin.com',
    'tiktok.com',
    'youtube.com',
    'vimeo.com'
  ]
  
  return specialDomains.some(domain => url.includes(domain))
}

/**
 * 智能设置referrer策略
 * 根据URL自动判断是否需要设置no-referrer
 * @param {string} videoUrl - 视频URL
 * @param {HTMLVideoElement} videoElement - 视频元素（可选）
 */
export function smartSetReferrerPolicy(videoUrl, videoElement = null) {
  const policy = needsSpecialReferrerPolicy(videoUrl) 
    ? REFERRER_POLICIES.NO_REFERRER 
    : REFERRER_POLICIES.STRICT_ORIGIN_WHEN_CROSS_ORIGIN
  
  // 设置全局策略
  setGlobalReferrerPolicy(policy)
  
  // 如果提供了视频元素，也为其设置策略
  if (videoElement) {
    setVideoReferrerPolicy(videoElement, policy)
  }
  
  console.log(`智能设置referrer策略: ${policy} (URL: ${videoUrl})`)
  return policy
}

/**
 * 重置referrer策略为默认值
 */
export function resetReferrerPolicy() {
  setGlobalReferrerPolicy(REFERRER_POLICIES.STRICT_ORIGIN_WHEN_CROSS_ORIGIN)
}

/**
 * CSP绕过配置对象
 */
export const CSP_BYPASS_CONFIG = {
  // 是否启用CSP绕过功能
  enabled: true,
  
  // 默认referrer策略
  referrerPolicy: REFERRER_POLICIES.NO_REFERRER,
  
  // 是否启用自动CSP绕过
  autoBypass: true,
  
  // 是否在播放失败时自动重试不同的策略
  autoRetry: true,
  
  // 重试策略列表
  retryPolicies: [
    REFERRER_POLICIES.NO_REFERRER,
    REFERRER_POLICIES.ORIGIN,
    REFERRER_POLICIES.SAME_ORIGIN,
    REFERRER_POLICIES.UNSAFE_URL
  ]
}

/**
 * 获取CSP绕过配置
 * @returns {object} CSP配置对象
 */
export function getCSPConfig() {
  const stored = localStorage.getItem('csp_bypass_config')
  return stored ? { ...CSP_BYPASS_CONFIG, ...JSON.parse(stored) } : CSP_BYPASS_CONFIG
}

/**
 * 保存CSP绕过配置
 * @param {object} config - 配置对象
 */
export function saveCSPConfig(config) {
  localStorage.setItem('csp_bypass_config', JSON.stringify(config))
}

/**
 * 应用CSP绕过策略到视频播放
 * @param {string} videoUrl - 视频URL
 * @param {HTMLVideoElement} videoElement - 视频元素
 * @returns {string} 应用的策略
 */
export function applyCSPBypass(videoUrl, videoElement) {
  const config = getCSPConfig()
  
  if (!config.autoBypass) {
    return getCurrentReferrerPolicy()
  }
  
  return smartSetReferrerPolicy(videoUrl, videoElement)
}