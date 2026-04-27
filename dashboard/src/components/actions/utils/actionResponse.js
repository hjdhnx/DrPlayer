import { ActionErrorType, createActionError } from '../types.js'
import { normalizeActionConfig } from './actionConfig.js'

const parseMaybeJson = (value) => {
  if (typeof value !== 'string') {
    return value
  }

  try {
    return JSON.parse(value)
  } catch (error) {
    return value
  }
}

export const resolveActionResult = (result) => {
  let resolved = parseMaybeJson(result)

  if (resolved && typeof resolved === 'object' && typeof resolved.action === 'string') {
    resolved = {
      ...resolved,
      action: parseMaybeJson(resolved.action)
    }
  }

  return resolved
}

export const handleActionResponse = async (result, callbacks = {}) => {
  const {
    onToast,
    onNextAction,
    onSpecialAction,
    onKeep,
    onClose,
    onSuccess,
    onError
  } = callbacks

  if (result == null) {
    await onSuccess?.(result)
    await onClose?.()
    return { handled: true, type: 'empty' }
  }

  const resolved = resolveActionResult(result)

  if (typeof resolved === 'string') {
    onToast?.(resolved, 'success')
    await onSuccess?.(resolved)
    await onClose?.()
    return { handled: true, type: 'string' }
  }

  if (!resolved || typeof resolved !== 'object') {
    await onSuccess?.(resolved)
    await onClose?.()
    return { handled: true, type: 'primitive' }
  }

  if (resolved.error) {
    const error = createActionError(ActionErrorType.NETWORK_ERROR, resolved.error)
    onError?.(error)
    throw error
  }

  if (resolved.toast) {
    onToast?.(resolved.toast, 'success')
  }

  if (resolved.message || resolved.msg) {
    onToast?.(resolved.message || resolved.msg, 'success')
  }

  if (resolved.action) {
    const nextAction = normalizeActionConfig(resolved.action, { ensureActionId: true, actionIdPrefix: 'next' })
    await onNextAction?.(nextAction)
    return { handled: true, type: 'next-action', action: nextAction }
  }

  if (resolved.actionId) {
    if (resolved.actionId === '__keep__') {
      await onKeep?.(resolved)
    } else {
      await onSpecialAction?.(resolved)
    }
    return { handled: true, type: 'special-action', action: resolved }
  }

  if (resolved.code !== undefined) {
    if (resolved.code === 0 || resolved.code === 200) {
      const data = resolveActionResult(resolved.data)

      if (data && typeof data === 'object') {
        if (data.action) {
          const nextAction = normalizeActionConfig(data.action, { ensureActionId: true, actionIdPrefix: 'data' })
          await onNextAction?.(nextAction)
          return { handled: true, type: 'data-action', action: nextAction }
        }

        if (data.actionId) {
          if (data.actionId === '__keep__') {
            await onKeep?.(data)
          } else {
            await onSpecialAction?.(data)
          }
          return { handled: true, type: 'data-special-action', action: data }
        }
      }

      onToast?.(resolved.message || resolved.msg || '操作成功', 'success')
      await onSuccess?.(resolved)
      await onClose?.()
      return { handled: true, type: 'code-success' }
    }

    const error = createActionError(
      ActionErrorType.NETWORK_ERROR,
      resolved.message || resolved.msg || `操作失败，错误码: ${resolved.code}`
    )
    onError?.(error)
    throw error
  }

  await onSuccess?.(resolved)
  await onClose?.()
  return { handled: true, type: 'object-success' }
}
