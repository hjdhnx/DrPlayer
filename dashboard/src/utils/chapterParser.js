/**
 * 智能断章工具
 * 用于将txt内容解析为章节列表
 */

/**
 * 章节标题的正则表达式模式
 */
const CHAPTER_PATTERNS = [
  // 中文章节模式
  /^第[零一二三四五六七八九十百千万\d]+[章回节部分]/,
  /^第[零一二三四五六七八九十百千万\d]+[章回节部分][\s\S]*$/,
  /^[第]?[零一二三四五六七八九十百千万\d]+[、\s]*[章回节部分]/,
  
  // 数字章节模式
  /^第\d+章/,
  /^第\d+回/,
  /^第\d+节/,
  /^第\d+部分/,
  /^\d+[、\.\s]*[章回节部分]/,
  /^Chapter\s*\d+/i,
  /^Ch\.\s*\d+/i,
  
  // 特殊格式
  /^序章/,
  /^楔子/,
  /^引子/,
  /^前言/,
  /^后记/,
  /^尾声/,
  /^终章/,
  /^番外/,
  /^外传/,
  /^附录/,
  
  // 英文章节模式
  /^Chapter\s+[IVX]+/i,
  /^Part\s+\d+/i,
  /^Section\s+\d+/i,
  
  // 其他常见模式
  /^【.*】$/,
  /^〖.*〗$/,
  /^《.*》$/,
  /^「.*」$/,
  /^『.*』$/,

  // 卷/篇/集 模式
  /^第[零一二三四五六七八九十百千万\d]+[卷篇集幕]/,
  /^卷[零一二三四五六七八九十百千万\d]+/,
]

/**
 * 检查一行文本是否可能是章节标题
 * @param {string} line - 要检查的文本行
 * @returns {boolean} 是否是章节标题
 */
function isChapterTitle(line) {
  const trimmedLine = line.trim()
  
  // 空行不是章节标题
  if (!trimmedLine) return false
  
  // 太长的行通常不是章节标题（超过50个字符）
  if (trimmedLine.length > 50) return false
  
  // 检查是否匹配章节模式
  for (const pattern of CHAPTER_PATTERNS) {
    if (pattern.test(trimmedLine)) {
      return true
    }
  }
  
  // 检查是否是纯数字标题
  if (/^\d+$/.test(trimmedLine) && trimmedLine.length <= 3) {
    return true
  }
  
  // 检查是否是短标题（可能是章节名）
  if (trimmedLine.length <= 20 && !trimmedLine.includes('。') && !trimmedLine.includes('，')) {
    // 如果包含常见的章节关键词
    const chapterKeywords = ['章', '回', '节', '部', '篇', 'Chapter', 'Part']
    for (const keyword of chapterKeywords) {
      if (trimmedLine.includes(keyword)) {
        return true
      }
    }
  }
  
  return false
}

/**
 * 解析txt内容为章节列表
 * @param {string} content - txt文件内容
 * @param {Object} options - 解析选项
 * @returns {Array} 章节列表
 */
export function parseChapters(content, options = {}) {
  const {
    minChapterLength = 200, // 最小章节长度（降低阈值以支持短章节）
    maxChapters = 1000,     // 最大章节数
    autoDetect = true       // 是否自动检测章节
  } = options

  if (!content || typeof content !== 'string') {
    return []
  }

  // 预处理：清理下载内容中的分隔线
  let cleanContent = content.replace(/\n-{3,}\n/g, '\n')

  const lines = cleanContent.split(/\r?\n/)
  const chapters = []
  let currentChapter = null
  let chapterIndex = 0

  // 如果没有检测到章节标题，创建一个默认章节
  let hasChapterTitles = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // 跳过纯分隔线（--- 或 ***）
    if (/^[-=_*~#]{3,}$/.test(line)) continue

    if (autoDetect && isChapterTitle(line)) {
      hasChapterTitles = true

      // 保存上一章节（即使内容较短也保存，避免丢失内容）
      if (currentChapter && currentChapter.content.trim().length > 0) {
        chapters.push(currentChapter)
        chapterIndex++
      }

      // 创建新章节
      currentChapter = {
        id: chapterIndex,
        title: line || `第${chapterIndex + 1}章`,
        content: '',
        startLine: i,
        endLine: i
      }
    } else if (line) {
      // 添加内容到当前章节
      if (!currentChapter) {
        // 如果还没有章节，创建第一个章节
        currentChapter = {
          id: chapterIndex,
          title: `第${chapterIndex + 1}章`,
          content: '',
          startLine: i,
          endLine: i
        }
      }

      if (currentChapter.content) {
        currentChapter.content += '\n'
      }
      currentChapter.content += line
      currentChapter.endLine = i
    }

    // 限制章节数量
    if (chapters.length >= maxChapters) {
      break
    }
  }

  // 添加最后一个章节
  if (currentChapter && currentChapter.content.trim().length > 0) {
    chapters.push(currentChapter)
  }

  // 如果明确检测到章节标题，保留所有有内容的章节（不过滤短章节）
  // 仅在没有标题时才按长度过滤
  let filteredChapters
  if (hasChapterTitles) {
    filteredChapters = chapters.filter(ch => ch.content.trim().length > 0)
  } else {
    filteredChapters = chapters.filter(ch => ch.content.trim().length >= minChapterLength)
  }
  if (filteredChapters.length === 0 && chapters.length > 0) {
    filteredChapters = chapters
  }

  // 如果第一章节内容很短（<100字符，通常是小说标题），合并到下一章节
  if (filteredChapters.length >= 2 && filteredChapters[0].content.trim().length < 100 && hasChapterTitles) {
    filteredChapters[1] = {
      ...filteredChapters[1],
      content: filteredChapters[0].content + '\n\n' + filteredChapters[1].content
    }
    filteredChapters = filteredChapters.slice(1)
  }

  // 如果没有检测到章节标题，按长度自动分章
  if (!hasChapterTitles && cleanContent.length > minChapterLength) {
    return autoSplitChapters(cleanContent, options)
  }

  // 如果章节太少，尝试更宽松的检测
  if (filteredChapters.length < 2 && cleanContent.length > minChapterLength * 2) {
    return autoSplitChapters(cleanContent, options)
  }

  // 重新编号章节ID
  return filteredChapters.map((ch, idx) => ({ ...ch, id: idx }))
}

/**
 * 自动按长度分章
 * @param {string} content - 文本内容
 * @param {Object} options - 选项
 * @returns {Array} 章节列表
 */
function autoSplitChapters(content, options = {}) {
  const {
    chapterLength = 3000,  // 每章大约长度
    minChapterLength = 200 // 最小章节长度
  } = options
  
  const chapters = []
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim())
  
  let currentChapter = {
    id: 0,
    title: '第1章',
    content: '',
    startLine: 0,
    endLine: 0
  }
  
  let chapterIndex = 0
  
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i].trim()
    
    if (currentChapter.content.length + paragraph.length > chapterLength && 
        currentChapter.content.length >= minChapterLength) {
      // 当前章节已经足够长，开始新章节
      chapters.push(currentChapter)
      chapterIndex++
      
      currentChapter = {
        id: chapterIndex,
        title: `第${chapterIndex + 1}章`,
        content: paragraph,
        startLine: i,
        endLine: i
      }
    } else {
      // 添加到当前章节
      if (currentChapter.content) {
        currentChapter.content += '\n\n'
      }
      currentChapter.content += paragraph
      currentChapter.endLine = i
    }
  }
  
  // 添加最后一个章节
  if (currentChapter.content.trim()) {
    chapters.push(currentChapter)
  }
  
  return chapters
}

/**
 * 获取章节摘要
 * @param {string} content - 章节内容
 * @param {number} maxLength - 最大长度
 * @returns {string} 摘要
 */
export function getChapterSummary(content, maxLength = 100) {
  if (!content) return ''
  
  const cleanContent = content.replace(/\s+/g, ' ').trim()
  if (cleanContent.length <= maxLength) {
    return cleanContent
  }
  
  return cleanContent.substring(0, maxLength) + '...'
}

/**
 * 验证章节数据
 * @param {Array} chapters - 章节列表
 * @returns {boolean} 是否有效
 */
export function validateChapters(chapters) {
  if (!Array.isArray(chapters) || chapters.length === 0) {
    return false
  }
  
  for (const chapter of chapters) {
    if (!chapter.title || !chapter.content || typeof chapter.id !== 'number') {
      return false
    }
  }
  
  return true
}

export default {
  parseChapters,
  getChapterSummary,
  validateChapters,
  isChapterTitle
}