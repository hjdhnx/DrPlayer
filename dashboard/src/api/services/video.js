/**
 * 视频相关业务接口服务
 * 封装视频播放、详情、搜索等功能
 */

import {
  getHomeData,
  getCategoryData,
  getVideoDetail,
  getPlayData,
  parsePlayUrl,
  searchVideos,
  refreshModule,
  executeAction
} from '../modules/module'
import { parseVideo } from '../modules/parse'
import { encodeFilters, validateModule, validateVideoId } from '../utils'
import {
  createVideoInfo,
  createSearchParams,
  createPaginationInfo,
  VIDEO_TYPES,
  SORT_TYPES
} from '../types'

/**
 * 视频服务类
 */
class VideoService {
  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5分钟缓存
  }

  /**
   * 获取首页推荐视频
   * @param {string} module - 模块名称
   * @param {object} options - 选项参数
   * @param {string} options.apiUrl - API地址
   * @returns {Promise} 首页数据
   */
  async getRecommendVideos(module, options = {}) {
    if (!validateModule(module)) {
      throw new Error('无效的模块名称')
    }

    const { apiUrl, ...otherOptions } = options
    const cacheKey = `home_${module}_${JSON.stringify(options)}`
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const requestOptions = { ...otherOptions }
      if (apiUrl) {
        requestOptions.apiUrl = apiUrl
      }
      const response = await getHomeData(module, requestOptions)

      // 格式化返回数据
      const result = {
        categories: response.class || [],
        filters: response.filters || {},
        videos: (response.list || []).map(this.formatVideoInfo),
        pagination: this.createPagination(response)
      }

      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      console.error('获取首页推荐视频失败:', error)
      throw error
    }
  }

  /**
   * 获取分类视频列表
   * @param {string} module - 模块名称
   * @param {object} params - 分类参数
   * @param {string} params.typeId - 分类ID
   * @param {number} params.page - 页码
   * @param {object} params.filters - 筛选条件
   * @returns {Promise} 分类视频数据
   */
  async getCategoryVideos(module, params) {
    if (!validateModule(module)) {
      throw new Error('无效的模块名称')
    }

    const { typeId, page = 1, filters = {}, apiUrl, extend } = params

    if (!typeId) {
      throw new Error('分类ID不能为空')
    }

    const cacheKey = `category_${module}_${typeId}_${page}_${JSON.stringify(filters)}`
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const requestParams = {
        t: typeId,
        pg: page
      }

      // 编码筛选条件
      if (Object.keys(filters).length > 0) {
        requestParams.ext = encodeFilters(filters)
      }

      // 添加extend参数
      if (extend) {
        requestParams.extend = extend
      }

      // 添加apiUrl参数
      if (apiUrl) {
        requestParams.apiUrl = apiUrl
      }

      const response = await getCategoryData(module, requestParams)

      // 格式化返回数据
      const result = {
        videos: (response.list || []).map(this.formatVideoInfo),
        pagination: this.createPagination(response, page),
        filters: response.filters || {},
        total: response.total || 0
      }

      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      console.error('获取分类视频失败:', error)
      throw error
    }
  }

  /**
   * 获取视频详情
   * @param {string} module - 模块名称
   * @param {string} videoId - 视频ID
   * @param {string} apiUrl - 站点API地址
   * @param {boolean} skipCache - 是否跳过缓存
   * @param {string} extend - 扩展参数
   * @returns {Promise} 视频详情数据
   */
  async getVideoDetails(module, videoId, apiUrl, skipCache = false, extend = null) {
    if (!validateModule(module)) {
      throw new Error('无效的模块名称')
    }

    if (!validateVideoId(videoId)) {
      throw new Error('无效的视频ID')
    }

    const cacheKey = `detail_${module}_${videoId}`

    // 如果不跳过缓存，则检查缓存
    if (!skipCache) {
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        console.log('使用缓存的视频详情:', { module, videoId })
        return cached
      }
    } else {
      console.log('跳过缓存，强制获取最新视频详情:', { module, videoId })
    }

    try {
      const params = { ids: videoId }
      if (apiUrl) {
        params.apiUrl = apiUrl
      }
      if (extend) {
        params.extend = extend
      }
      const response = await getVideoDetail(module, params)

      if (!response.list || response.list.length === 0) {
        throw new Error('视频不存在')
      }

      const videoInfo = this.formatVideoInfo(response.list[0])

      // 解析播放地址
      if (videoInfo.vod_play_url) {
        videoInfo.playList = this.parsePlayUrls(videoInfo.vod_play_url, videoInfo.vod_play_from)
      }

      this.setCache(cacheKey, videoInfo)
      return videoInfo
    } catch (error) {
      console.error('获取视频详情失败:', error)
      throw error
    }
  }

  /**
   * 搜索视频
   * @param {string} module - 模块名称
   * @param {object} params - 搜索参数
   * @param {string} params.keyword - 搜索关键词
   * @param {number} params.page - 页码
   * @param {string} params.extend - 扩展参数
   * @param {string} params.apiUrl - 站点API地址
   * @returns {Promise} 搜索结果
   */
  async searchVideo(module, params) {
    if (!validateModule(module)) {
      throw new Error('无效的模块名称')
    }

    const { keyword, page = 1, extend, apiUrl } = params

    if (!keyword || keyword.trim().length === 0) {
      throw new Error('搜索关键词不能为空')
    }

    try {
      const requestParams = {
        wd: keyword.trim(),
        pg: page
      }

      // 添加extend参数
      if (extend) {
        requestParams.extend = extend
      }

      // 添加apiUrl参数
      if (apiUrl) {
        requestParams.apiUrl = apiUrl
      }

      const response = await searchVideos(module, requestParams)

      // 格式化返回数据
      const result = {
        videos: (response.list || []).map(this.formatVideoInfo),
        pagination: this.createPagination(response, page),
        keyword: keyword.trim(),
        total: response.total || 0,
        rawResponse: response // 添加原始响应数据用于调试
      }

      return result
    } catch (error) {
      console.error('搜索视频失败:', error)
      throw error
    }
  }

  /**
   * 获取播放地址
   * @param {string} module - 模块名称
   * @param {string} playUrl - 播放地址
   * @param {string} apiUrl - API地址
   * @param {string} extend - 扩展参数
   * @returns {Promise} 播放数据
   */
  async getPlayUrl(module, playUrl, apiUrl, extend = null) {
    if (!validateModule(module)) {
      throw new Error('无效的模块名称')
    }

    if (!playUrl) {
      throw new Error('播放地址不能为空')
    }

    try {
      const params = { play: playUrl }
      if (apiUrl) {
        params.apiUrl = apiUrl
      }
      if (extend) {
        params.extend = extend
      }
      const response = await getPlayData(module, params)

      return {
        url: response.url || playUrl,
        headers: response.headers || {},
        parse: response.parse || false,
        jx: response.jx || ''
      }
    } catch (error) {
      console.error('获取播放地址失败:', error)
      throw error
    }
  }

  /**
   * 解析视频地址
   * @param {string} jx - 解析器名称
   * @param {string} url - 视频地址
   * @param {object} options - 解析选项
   * @returns {Promise} 解析结果
   */
  async parseVideoUrl(jx, url, options = {}) {
    if (!jx) {
      throw new Error('解析器名称不能为空')
    }

    if (!url) {
      throw new Error('视频地址不能为空')
    }

    try {
      const response = await parseVideo(jx, { url, ...options })

      return {
        url: response.url || url,
        type: response.type || 'mp4',
        headers: response.headers || {},
        success: response.success !== false
      }
    } catch (error) {
      console.error('解析视频地址失败:', error)
      throw error
    }
  }

  /**
   * 解析选集播放地址 - T4接口专用
   * @param {string} module - 模块名称
   * @param {object} params - 播放参数
   * @param {string} params.play - 播放地址或ID（选集链接）
   * @param {string} params.flag - 源标识（线路名称）
   * @param {string} params.apiUrl - API地址
   * @param {string} params.extend - 扩展参数
   * @returns {Promise} 播放解析结果
   */
  async parseEpisodePlayUrl(module, params) {
    if (!validateModule(module)) {
      throw new Error('无效的模块名称')
    }

    const { play, flag, apiUrl, extend } = params

    if (!play) {
      throw new Error('播放地址不能为空')
    }

    try {
      console.log('VideoService: 开始解析选集播放地址', { module, params })
      
      const parseParams = { play, extend }
      
      // 添加flag参数（线路名称）
      if (flag) {
        parseParams.flag = flag
      }
      
      // 添加API地址
      if (apiUrl) {
        parseParams.apiUrl = apiUrl
      }
      
      const result = await parsePlayUrl(module, parseParams)
      console.log('VideoService: 选集播放解析结果', result)
      
      return result
    } catch (error) {
      console.error('VideoService: 解析选集播放地址失败:', error)
      throw error
    }
  }

  /**
   * 执行T4 Action动作
   * @param {string} module - 模块名称
   * @param {string} actionName - 动作名称
   * @param {object} options - 选项参数
   * @param {string} options.apiUrl - API地址
   * @param {string} options.extend - 扩展参数
   * @returns {Promise} Action执行结果
   */
  async executeT4Action(module, actionName, options = {}) {
    if (!validateModule(module)) {
      throw new Error('无效的模块名称')
    }

    if (!actionName || actionName.trim().length === 0) {
      throw new Error('动作名称不能为空')
    }

    try {
      const actionData = {
        action: actionName.trim(),
        value: options.value || '',
        extend: options.extend,
        apiUrl: options.apiUrl
      }

      console.log('执行T4 action:', { module, actionData })

      const result = await executeAction(module, actionData)
      console.log('T4 action执行结果:', result)

      return result
    } catch (error) {
      console.error('T4 action执行失败:', error)
      throw error
    }
  }

  /**
   * 刷新模块数据
   * @param {string} module - 模块名称
   * @param {string} extend - 扩展参数
   * @param {string} apiUrl - API地址
   * @returns {Promise} 刷新结果
   */
  async refreshModuleData(module, extend = null, apiUrl = null) {
    if (!validateModule(module)) {
      throw new Error('无效的模块名称')
    }

    try {
      // 清除相关缓存
      this.clearModuleCache(module)

      const response = await refreshModule(module, extend, apiUrl)

      return {
        success: true,
        message: response.msg || '刷新成功',
        lastUpdate: response.data?.lastUpdate || new Date().toISOString()
      }
    } catch (error) {
      console.error('刷新模块数据失败:', error)
      throw error
    }
  }

  /**
   * 格式化视频信息
   * @param {object} rawVideo - 原始视频数据
   * @returns {object} 格式化后的视频信息
   */
  formatVideoInfo(rawVideo) {
    const video = createVideoInfo()

    Object.keys(video).forEach(key => {
      if (rawVideo[key] !== undefined) {
        video[key] = rawVideo[key]
      }
    })

    // 处理特殊字段
    if (rawVideo.vod_hits) {
      video.vod_hits = parseInt(rawVideo.vod_hits) || 0
    }

    if (rawVideo.vod_score) {
      video.vod_score = parseFloat(rawVideo.vod_score) || 0
    }

    return video
  }

  /**
   * 解析播放地址列表
   * @param {string} playUrls - 播放地址字符串
   * @param {string} playFrom - 播放来源字符串
   * @returns {Array} 播放地址列表
   */
  parsePlayUrls(playUrls, playFrom) {
    if (!playUrls) return []

    const fromList = playFrom ? playFrom.split('$$$') : ['默认']
    const urlList = playUrls.split('$$$')

    return fromList.map((from, index) => ({
      from: from.trim(),
      urls: this.parseEpisodeUrls(urlList[index] || ''),
      index
    }))
  }

  /**
   * 解析剧集地址
   * @param {string} episodeUrls - 剧集地址字符串
   * @returns {Array} 剧集地址列表
   */
  parseEpisodeUrls(episodeUrls) {
    if (!episodeUrls) return []

    return episodeUrls.split('#').map((episode, index) => {
      const [name, url] = episode.split('$')
      return {
        name: name || `第${index + 1}集`,
        url: url || '',
        index
      }
    }).filter(episode => episode.url)
  }

  /**
   * 创建分页信息
   * @param {object} response - 响应数据
   * @param {number} currentPage - 当前页码
   * @returns {object} 分页信息
   */
  createPagination(response, currentPage = 1) {
    const pagination = createPaginationInfo()

    pagination.page = currentPage

    // 处理不同的API响应格式
    const total = response.total || response.recordcount || 0
    const pageCount = response.pagecount || response.totalPages || 0
    const pageSize = response.limit || response.pagesize || 20
    const currentList = response.list || []

    pagination.total = total
    pagination.pageSize = pageSize

    // 如果API返回了总页数，直接使用
    if (pageCount > 0) {
      pagination.totalPages = pageCount
      pagination.hasNext = currentPage < pageCount
    } else if (total > 0) {
      // 否则根据总数计算
      pagination.totalPages = Math.ceil(total / pageSize)
      pagination.hasNext = currentPage < pagination.totalPages
    } else {
      // 如果没有总数信息，根据当前返回的数据判断
      // 检查是否有"no_data"标识
      const hasNoDataFlag = currentList.some(item =>
        item.vod_id === 'no_data' ||
        item.vod_name === 'no_data' ||
        (typeof item === 'string' && item.includes('no_data'))
      )

      if (hasNoDataFlag || currentList.length === 0) {
        // 如果有no_data标识或列表为空，表示没有更多数据
        pagination.hasNext = false
        pagination.totalPages = currentPage
      } else {
        // 否则假设还有下一页，需要实际请求下一页来确认
        pagination.hasNext = true
        pagination.totalPages = currentPage + 1
      }
    }

    pagination.hasPrev = currentPage > 1

    return pagination
  }

  /**
   * 缓存操作
   */
  getFromCache(key) {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  clearModuleCache(module) {
    for (const key of this.cache.keys()) {
      if (key.includes(module)) {
        this.cache.delete(key)
      }
    }
  }

  clearAllCache() {
    this.cache.clear()
  }
}

// 创建单例实例
const videoService = new VideoService()



export default videoService