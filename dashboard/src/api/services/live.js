/**
 * 直播数据解析服务
 * 负责解析M3U和TXT格式的直播文件
 */

import axios from 'axios'
import configService from './config.js'

/**
 * 直播服务类
 */
class LiveService {
  constructor() {
    this.liveData = null
    this.lastFetchTime = null
    this.cacheExpiry = 10 * 60 * 1000 // 10分钟缓存
  }

  /**
   * 获取直播配置信息
   * @returns {Promise<object|null>} 直播配置信息
   */
  async getLiveConfig() {
    try {
      // 优先使用独立的直播配置地址
      const liveConfigUrl = configService.getLiveConfigUrl()
      if (liveConfigUrl) {
        return {
          name: '直播配置',
          url: liveConfigUrl,
          type: 'live'
        }
      }

      // 如果没有独立的直播配置地址，尝试从点播配置中获取（向后兼容）
      const configData = await configService.getConfigData()
      if (configData && configData.lives && Array.isArray(configData.lives) && configData.lives.length > 0) {
        return configData.lives[0] // 通常只有一个直播配置
      }
      
      return null
    } catch (error) {
      console.error('获取直播配置失败:', error)
      return null
    }
  }

  /**
   * 获取直播数据
   * @param {boolean} forceRefresh - 是否强制刷新
   * @returns {Promise<object>} 解析后的直播数据
   */
  async getLiveData(forceRefresh = false) {
    try {
      // 检查缓存是否有效
      const now = Date.now()
      const isCacheValid = this.liveData && 
                          this.lastFetchTime && 
                          (now - this.lastFetchTime) < this.cacheExpiry

      if (!forceRefresh && isCacheValid) {
        console.log('使用缓存的直播数据')
        return this.liveData
      }

      // 获取直播配置
      const liveConfig = await this.getLiveConfig()
      if (!liveConfig || !liveConfig.url) {
        throw new Error('未找到直播配置或直播地址')
      }

      console.log('从直播地址获取数据:', liveConfig.url)
      
      // 获取直播文件内容
      const response = await axios.get(liveConfig.url, {
        timeout: 15000
        // 注意：浏览器环境下不能设置 User-Agent 头，浏览器会自动处理
      })

      if (!response.data) {
        throw new Error('直播数据为空')
      }

      // 根据URL判断文件类型并解析
      const fileContent = response.data
      let parsedData

      if (liveConfig.url.toLowerCase().includes('.m3u')) {
        parsedData = this.parseM3U(fileContent, liveConfig)
      } else if (liveConfig.url.toLowerCase().includes('.txt')) {
        parsedData = this.parseTXT(fileContent, liveConfig)
      } else {
        // 尝试根据内容判断格式
        if (fileContent.includes('#EXTM3U') || fileContent.includes('#EXTINF')) {
          parsedData = this.parseM3U(fileContent, liveConfig)
        } else if (fileContent.includes('#genre#')) {
          parsedData = this.parseTXT(fileContent, liveConfig)
        } else {
          throw new Error('不支持的直播文件格式')
        }
      }

      this.liveData = parsedData
      this.lastFetchTime = now

      console.log('直播数据解析成功，分组数量:', parsedData.groups.length)
      return this.liveData
    } catch (error) {
      console.error('获取直播数据失败:', error)
      throw error
    }
  }

  /**
   * 解析M3U格式的直播文件
   * @param {string} content - 文件内容
   * @param {object} config - 直播配置
   * @returns {object} 解析后的数据
   */
  parseM3U(content, config) {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line)
    const groups = new Map()
    const channels = []

    let currentChannel = null

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (line.startsWith('#EXTINF:')) {
        // 解析频道信息 - 修复正则表达式来正确处理属性和频道名称
        const match = line.match(/#EXTINF:(-?\d+),(.*)$/)
        if (match) {
          const duration = match[1]
          const fullStr = match[2].trim()
          
          // 查找最后一个逗号，分离属性和频道名称
          const lastCommaIndex = fullStr.lastIndexOf(',')
          let attributesStr = ''
          let displayName = fullStr
          
          if (lastCommaIndex > 0) {
            // 检查逗号前是否有属性（包含=号）
            const beforeComma = fullStr.substring(0, lastCommaIndex)
            if (beforeComma.includes('=')) {
              attributesStr = beforeComma
              displayName = fullStr.substring(lastCommaIndex + 1).trim()
            }
          }

          // 解析属性
          const attributes = {}
          if (attributesStr) {
            // 匹配所有属性，包括 tvg-id、tvg-name、tvg-logo、group-title 等
            const attrMatches = attributesStr.matchAll(/(\w+(?:-\w+)*)="([^"]*)"/g)
            for (const attrMatch of attrMatches) {
              attributes[attrMatch[1]] = attrMatch[2]
            }
          }

          // 频道名称优先使用 tvg-name，其次使用显示名称
          const channelName = attributes['tvg-name'] || displayName
          const groupName = attributes['group-title'] || '未分组'
          const logoUrl = attributes['tvg-logo'] || this.generateLogoUrl(channelName, config)

          // 解析清晰度信息（从显示名称中提取）
          const qualityInfo = this.extractQualityInfo(displayName)

          currentChannel = {
            name: channelName,
            displayName: displayName, // 保留原始显示名称
            group: groupName,
            logo: logoUrl,
            tvgId: attributes['tvg-id'] || '',
            tvgName: attributes['tvg-name'] || channelName,
            quality: qualityInfo.quality,
            resolution: qualityInfo.resolution,
            codec: qualityInfo.codec,
            url: null
          }
        }
      } else if (line.startsWith('http') && currentChannel) {
        // 设置频道URL
        currentChannel.url = line
        channels.push(currentChannel)

        // 添加到分组，并处理同名频道的线路归类
        const groupName = currentChannel.group
        if (!groups.has(groupName)) {
          groups.set(groupName, {
            name: groupName,
            channels: []
          })
        }

        const group = groups.get(groupName)
        
        // 查找是否已存在同名频道
        const existingChannel = group.channels.find(ch => ch.name === currentChannel.name)
        
        if (existingChannel) {
          // 如果已存在同名频道，添加为新线路
          if (!existingChannel.routes) {
            // 将原有频道转换为线路1
            existingChannel.routes = [
              {
                id: 1,
                name: '线路1',
                url: existingChannel.url,
                quality: existingChannel.quality,
                resolution: existingChannel.resolution,
                codec: existingChannel.codec
              }
            ]
          }
          
          // 添加新线路
          existingChannel.routes.push({
            id: existingChannel.routes.length + 1,
            name: `线路${existingChannel.routes.length + 1}`,
            url: currentChannel.url,
            quality: currentChannel.quality,
            resolution: currentChannel.resolution,
            codec: currentChannel.codec
          })
          
          // 更新频道的当前线路为第一个线路
          existingChannel.currentRoute = existingChannel.routes[0]
        } else {
          // 新频道，直接添加
          group.channels.push(currentChannel)
        }

        currentChannel = null
      }
    }

    return {
      config: config,
      groups: Array.from(groups.values()),
      channels: channels,
      totalChannels: channels.length
    }
  }

  /**
   * 从显示名称中提取清晰度信息
   * @param {string} displayName - 显示名称
   * @returns {object} 清晰度信息
   */
  extractQualityInfo(displayName) {
    const result = {
      quality: '',
      resolution: '',
      codec: ''
    }

    // 提取清晰度标识
    const qualityPatterns = [
      /高码/,
      /超清/,
      /高清/,
      /标清/,
      /流畅/
    ]

    // 提取分辨率信息
    const resolutionPatterns = [
      /4K/i,
      /1080[pP]/,
      /720[pP]/,
      /576[pP]/,
      /480[pP]/,
      /(\d+)[pP]/
    ]

    // 提取编码格式
    const codecPatterns = [
      /HEVC/i,
      /H\.?264/i,
      /H\.?265/i,
      /AVC/i
    ]

    // 提取帧率信息
    const fpsPatterns = [
      /(\d+)[-\s]?FPS/i,
      /(\d+)帧/
    ]

    // 匹配清晰度
    for (const pattern of qualityPatterns) {
      const match = displayName.match(pattern)
      if (match) {
        result.quality = match[0]
        break
      }
    }

    // 匹配分辨率
    for (const pattern of resolutionPatterns) {
      const match = displayName.match(pattern)
      if (match) {
        result.resolution = match[0]
        break
      }
    }

    // 匹配编码格式
    for (const pattern of codecPatterns) {
      const match = displayName.match(pattern)
      if (match) {
        result.codec = match[0]
        break
      }
    }

    // 匹配帧率
    for (const pattern of fpsPatterns) {
      const match = displayName.match(pattern)
      if (match) {
        result.fps = match[1] || match[0]
        break
      }
    }

    return result
  }

  /**
   * 解析TXT格式的直播文件
   * @param {string} content - 文件内容
   * @param {object} config - 直播配置
   * @returns {object} 解析后的数据
   */
  parseTXT(content, config) {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line)
    const groups = new Map()
    const channels = []
    let currentGroupName = '未分组'

    for (const line of lines) {
      if (line.includes('#genre#')) {
        // 分组标记 - 格式为 "分组名称,#genre#"
        const genreIndex = line.indexOf('#genre#')
        if (genreIndex > 0) {
          // 提取逗号前的分组名称
          currentGroupName = line.substring(0, genreIndex).replace(/,$/, '').trim()
        } else {
          // 兼容其他可能的格式
          currentGroupName = line.replace('#genre#', '').trim()
        }
        
        if (!groups.has(currentGroupName)) {
          groups.set(currentGroupName, {
            name: currentGroupName,
            channels: []
          })
        }
      } else if (line.includes(',http')) {
        // 频道信息
        const parts = line.split(',')
        if (parts.length >= 2) {
          const name = parts[0].trim()
          const url = parts.slice(1).join(',').trim()

          const channel = {
            name: name,
            group: currentGroupName,
            logo: this.generateLogoUrl(name, config),
            tvgName: name,
            url: url
          }

          channels.push(channel)

          // 添加到分组
          if (!groups.has(currentGroupName)) {
            groups.set(currentGroupName, {
              name: currentGroupName,
              channels: []
            })
          }
          groups.get(currentGroupName).channels.push(channel)
        }
      }
    }

    return {
      config: config,
      groups: Array.from(groups.values()),
      channels: channels,
      totalChannels: channels.length
    }
  }

  /**
   * 生成频道Logo URL
   * @param {string} channelName - 频道名称
   * @param {object} config - 直播配置
   * @returns {string} Logo URL
   */
  generateLogoUrl(channelName, config) {
    if (config.logo && config.logo.includes('{name}')) {
      return config.logo.replace('{name}', encodeURIComponent(channelName))
    }
    return ''
  }

  /**
   * 获取EPG信息
   * @param {string} channelName - 频道名称
   * @param {string} date - 日期 (YYYY-MM-DD)
   * @param {object} config - 直播配置
   * @returns {string} EPG URL
   */
  getEPGUrl(channelName, date, config) {
    if (config.epg && config.epg.includes('{name}') && config.epg.includes('{date}')) {
      return config.epg
        .replace('{name}', encodeURIComponent(channelName))
        .replace('{date}', date)
    }
    return ''
  }

  /**
   * 搜索频道
   * @param {string} keyword - 搜索关键词
   * @returns {Array} 匹配的频道列表
   */
  searchChannels(keyword) {
    if (!this.liveData || !keyword) {
      return []
    }

    const lowerKeyword = keyword.toLowerCase()
    return this.liveData.channels.filter(channel => 
      channel.name.toLowerCase().includes(lowerKeyword) ||
      channel.group.toLowerCase().includes(lowerKeyword)
    )
  }

  /**
   * 根据分组获取频道
   * @param {string} groupName - 分组名称
   * @returns {Array} 频道列表
   */
  getChannelsByGroup(groupName) {
    if (!this.liveData) {
      return []
    }

    const group = this.liveData.groups.find(g => g.name === groupName)
    return group ? group.channels : []
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.liveData = null
    this.lastFetchTime = null
    console.log('直播数据缓存已清除')
  }

  /**
   * 获取直播数据状态
   * @returns {object} 状态信息
   */
  getStatus() {
    return {
      hasData: !!this.liveData,
      lastFetchTime: this.lastFetchTime,
      cacheAge: this.lastFetchTime ? Date.now() - this.lastFetchTime : null,
      isCacheValid: this.liveData && this.lastFetchTime && 
                   (Date.now() - this.lastFetchTime) < this.cacheExpiry,
      groupsCount: this.liveData ? this.liveData.groups.length : 0,
      channelsCount: this.liveData ? this.liveData.totalChannels : 0
    }
  }
}

// 创建单例实例
const liveService = new LiveService()

export default liveService