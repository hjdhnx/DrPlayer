/**
 * 嗅探服务 API
 * 用于调用代理嗅探接口进行视频链接嗅探
 */

/**
 * 调用嗅探接口
 * @param {string|Object} urlOrParseData - 要嗅探的页面URL或T4解析数据
 * @param {Object} options - 嗅探选项
 * @param {string} options.snifferUrl - 嗅探器接口地址
 * @param {number} options.timeout - 嗅探器服务端超时时间（秒），来自设置页面的"嗅探超时"配置
 * @param {string} options.mode - 嗅探模式：0=单个链接，1=多个链接
 * @param {string} options.is_pc - 设备模拟：0=移动设备，1=PC
 * @returns {Promise<Object>} 嗅探结果
 */
export const sniffVideo = async (urlOrParseData, options = {}) => {
  const {
    snifferUrl = 'http://localhost:57573/sniffer',
    timeout = 10,
    mode = '0',
    is_pc = '0'
  } = options

  if (!urlOrParseData) {
    throw new Error('URL或解析数据参数不能为空')
  }

  if (!snifferUrl) {
    throw new Error('嗅探器接口地址不能为空')
  }

  try {
    let requestUrl
    
    // 检查是否是T4解析数据格式
    if (typeof urlOrParseData === 'object' && urlOrParseData.parse === 1) {
      // T4解析数据格式：{ parse: 1, url: string, js: string, parse_extra: string }
      const { url, js, parse_extra } = urlOrParseData
      
      if (!url) {
        throw new Error('T4解析数据中缺少URL')
      }
      
      // 确保URL是字符串格式
      const urlString = typeof url === 'string' ? url : (url.toString ? url.toString() : String(url))
      
      console.log('处理T4解析数据:', urlOrParseData)
      console.log('提取的URL:', urlString)
      console.log('=== 调试结束 ===')
      
      // 构建基础参数
      const params = new URLSearchParams({
        url: urlString,
        mode: mode,
        is_pc: is_pc,
        timeout: (timeout * 1000).toString() // 嗅探器服务端超时时间（毫秒）
      })
      
      // 添加脚本参数
      if (js) {
        params.set('script', js)
      }
      
      // 构建请求URL
      requestUrl = `${snifferUrl}?${params.toString()}`
      
      // 添加额外参数（parse_extra）
      if (parse_extra) {
        // parse_extra 通常以 & 开头，直接拼接
        requestUrl += parse_extra
      }
      
    } else {
      // 普通URL格式
      const url = typeof urlOrParseData === 'string' ? urlOrParseData : urlOrParseData.toString()
      
      // 构建请求参数
      const params = new URLSearchParams({
        url: url,
        mode: mode,
        is_pc: is_pc,
        timeout: (timeout * 1000).toString() // 嗅探器服务端超时时间（毫秒）
      })

      requestUrl = `${snifferUrl}?${params.toString()}`
    }
    
    console.log('嗅探请求URL:', requestUrl)

    // 发起嗅探请求，设置客户端超时
    const controller = new AbortController()
    // 客户端超时 = 嗅探器超时 + 5秒网络缓冲时间，确保嗅探器有足够时间完成工作
    const timeoutId = setTimeout(() => controller.abort(), timeout * 1000 + 5000)

    const response = await fetch(requestUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`嗅探请求失败: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    console.log('嗅探响应结果:', result)

    // 检查响应格式
    if (result.code !== 200) {
      throw new Error(result.msg || '嗅探失败')
    }

    // 返回标准化的结果
    return {
      success: true,
      data: result.data,
      message: result.msg || '嗅探成功',
      timestamp: result.timestamp
    }

  } catch (error) {
    console.error('嗅探请求失败:', error)
    
    // 处理不同类型的错误
    if (error.name === 'AbortError') {
      throw new Error(`嗅探超时（${timeout}秒）`)
    } else if (error.message.includes('Failed to fetch')) {
      throw new Error('无法连接到嗅探器服务，请检查嗅探器是否正常运行')
    } else {
      throw error
    }
  }
}

/**
 * 从本地存储获取嗅探器配置
 * @returns {Object} 嗅探器配置
 */
export const getSnifferConfig = () => {
  try {
    const savedAddresses = localStorage.getItem('addressSettings')
    if (savedAddresses) {
      const parsed = JSON.parse(savedAddresses)
      return {
        enabled: parsed.proxySniffEnabled || false,
        url: parsed.proxySniff || 'http://localhost:57573/sniffer',
        timeout: parsed.snifferTimeout || 10
      }
    }
  } catch (error) {
    console.error('获取嗅探器配置失败:', error)
  }
  
  // 返回默认配置
  return {
    enabled: false,
    url: 'http://localhost:57573/sniffer',
    timeout: 10
  }
}

/**
 * 检查嗅探器是否启用
 * @returns {boolean} 是否启用
 */
export const isSnifferEnabled = () => {
  const config = getSnifferConfig()
  
  // 检查URL是否有效
  const hasValidUrl = config.url && config.url.trim() !== '' && config.url !== 'undefined'
  
  if (!hasValidUrl) {
    return false
  }
  
  // 检查是否有保存的设置
  try {
    const savedAddresses = localStorage.getItem('addressSettings')
    if (savedAddresses) {
      const parsed = JSON.parse(savedAddresses)
      // 如果用户明确保存了设置，使用保存的enabled状态
      return parsed.proxySniffEnabled === true
    }
  } catch (error) {
    console.error('检查嗅探器配置失败:', error)
  }
  
  // 如果没有保存的设置，但有有效的URL（包括默认URL），认为嗅探可用
  // 这样可以处理用户打开开关但未保存设置的情况
  return true
}

/**
 * 嗅探视频链接（带配置检查）
 * @param {string} url - 要嗅探的页面URL
 * @param {Object} customOptions - 自定义选项（可选）
 * @returns {Promise<Object>} 嗅探结果
 */
export const sniffVideoWithConfig = async (url, customOptions = {}) => {
  // 获取配置
  const config = getSnifferConfig()
  
  if (!config.enabled) {
    throw new Error('嗅探功能未启用')
  }

  if (!config.url) {
    throw new Error('嗅探器接口地址未配置')
  }

  // 合并配置和自定义选项
  const options = {
    snifferUrl: config.url,
    timeout: config.timeout,
    ...customOptions
  }

  return await sniffVideo(url, options)
}

export default {
  sniffVideo,
  sniffVideoWithConfig,
  getSnifferConfig,
  isSnifferEnabled
}