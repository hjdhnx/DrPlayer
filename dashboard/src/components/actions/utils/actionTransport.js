import { executeAction } from '@/api/modules/module.js'

const extractExtend = (extend) => {
  if (!extend) {
    return undefined
  }

  if (typeof extend === 'object' && extend.ext !== undefined) {
    return extend.ext
  }

  return extend
}

export const createActionPayload = ({ action, value, extend, apiUrl, extra = {} }) => {
  const payload = {
    action,
    ...extra
  }

  if (value !== undefined) {
    payload.value = typeof value === 'object' ? JSON.stringify(value) : value
  }

  const normalizedExtend = extractExtend(extend)
  if (normalizedExtend !== undefined && normalizedExtend !== null && normalizedExtend !== '') {
    payload.extend = normalizedExtend
  }

  if (apiUrl) {
    payload.apiUrl = apiUrl
  }

  return payload
}

export const callActionEndpoint = async ({ module, apiUrl, extend, action, value, extra }) => {
  if (!module && !apiUrl) {
    return null
  }

  const payload = createActionPayload({ action, value, extend, apiUrl, extra })
  return executeAction(module || 'default', payload)
}
