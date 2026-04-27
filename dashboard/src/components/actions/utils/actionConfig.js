import {
  ActionErrorType,
  ActionType,
  createActionError
} from '../types.js'

const TYPE_ALIASES = {
  input: ActionType.INPUT,
  edit: ActionType.EDIT,
  multiinput: ActionType.MULTI_INPUT,
  multiInput: ActionType.MULTI_INPUT,
  multiInputX: ActionType.MULTI_INPUT_X,
  multiinputx: ActionType.MULTI_INPUT_X,
  menu: ActionType.MENU,
  select: ActionType.SELECT,
  msgbox: ActionType.MSGBOX,
  message: ActionType.MSGBOX,
  webview: ActionType.WEBVIEW,
  webView: ActionType.WEBVIEW,
  browser: ActionType.BROWSER,
  help: ActionType.HELP
}

let fallbackId = 0

export const normalizeActionType = (type) => {
  if (!type || typeof type !== 'string') {
    return type
  }

  return TYPE_ALIASES[type] || TYPE_ALIASES[type.trim()] || TYPE_ALIASES[type.trim().toLowerCase()] || type
}

export const isSpecialActionConfig = (config) => {
  return Boolean(
    config &&
    typeof config === 'object' &&
    typeof config.actionId === 'string' &&
    config.actionId.startsWith('__') &&
    config.actionId.endsWith('__')
  )
}

export const ensureActionId = (config, prefix = 'action') => {
  if (!config || typeof config !== 'object') {
    return config
  }

  if (config.actionId) {
    return config
  }

  fallbackId += 1
  return {
    ...config,
    actionId: `${prefix}_${Date.now()}_${fallbackId}`
  }
}

export const parseActionPayload = (data) => {
  if (data == null) {
    return data
  }

  try {
    if (typeof data === 'string') {
      return JSON.parse(data.replace(/^﻿/, ''))
    }

    if (typeof data === 'object' && data.config) {
      return parseActionPayload(data.config)
    }

    return data
  } catch (error) {
    throw createActionError(
      ActionErrorType.PARSE_ERROR,
      '无法解析Action配置',
      error
    )
  }
}

export const extractActionConfig = (data, fallback = {}) => {
  const parsed = parseActionPayload(data)

  if (!parsed || typeof parsed !== 'object') {
    return parsed
  }

  const candidate = parsed.action !== undefined ? parseActionPayload(parsed.action) : parsed

  if (!candidate || typeof candidate !== 'object') {
    return candidate
  }

  const normalized = {
    ...candidate,
    type: normalizeActionType(candidate.type)
  }

  if (!normalized.actionId && fallback.actionIdPrefix) {
    return ensureActionId(normalized, fallback.actionIdPrefix)
  }

  return normalized
}

export const normalizeActionConfig = (data, options = {}) => {
  const config = extractActionConfig(data, options)

  if (!config || typeof config !== 'object') {
    return config
  }

  const normalized = {
    ...config,
    type: normalizeActionType(config.type)
  }

  if (!normalized.actionId && (options.ensureActionId || normalized.type === ActionType.MSGBOX)) {
    return ensureActionId(normalized, options.actionIdPrefix || normalized.type || 'action')
  }

  return normalized
}

export const validateActionConfig = (config) => {
  if (!config || typeof config !== 'object') {
    throw createActionError(
      ActionErrorType.VALIDATION_ERROR,
      'Action配置必须是一个对象'
    )
  }

  if (!config.actionId) {
    throw createActionError(
      ActionErrorType.VALIDATION_ERROR,
      'actionId是必需的'
    )
  }

  if (isSpecialActionConfig(config)) {
    if (config.actionId === '__copy__' && !config.content) {
      throw createActionError(
        ActionErrorType.VALIDATION_ERROR,
        '剪贴板操作必须包含content字段'
      )
    }
    return true
  }

  if (!config.type) {
    throw createActionError(
      ActionErrorType.VALIDATION_ERROR,
      'type字段是必需的（除非是专项动作）'
    )
  }

  if (!Object.values(ActionType).includes(config.type)) {
    throw createActionError(
      ActionErrorType.VALIDATION_ERROR,
      `不支持的Action类型: ${config.type}`
    )
  }

  return true
}

export const createMessageAction = ({ title = '动作结果', msg = '', actionIdPrefix = 'msgbox' } = {}) => {
  return ensureActionId({
    type: ActionType.MSGBOX,
    title,
    msg
  }, actionIdPrefix)
}
