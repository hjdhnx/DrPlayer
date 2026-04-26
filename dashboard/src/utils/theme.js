const THEME_STORAGE_KEY = 'appSettings'
const THEME_MEDIA_QUERY = '(prefers-color-scheme: dark)'

export const THEME_MODE = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
}

export const themeOptions = [
  { value: THEME_MODE.LIGHT, label: '浅色' },
  { value: THEME_MODE.DARK, label: '深色' },
  { value: THEME_MODE.SYSTEM, label: '跟随系统' }
]

const validThemeModes = new Set(themeOptions.map((option) => option.value))
let mediaQueryList = null
let currentMode = THEME_MODE.LIGHT

const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined'

export const normalizeThemeMode = (mode) => (
  validThemeModes.has(mode) ? mode : THEME_MODE.LIGHT
)

export const getStoredThemeMode = () => {
  if (!isBrowser()) return THEME_MODE.LIGHT

  try {
    const appSettings = JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) || '{}')
    return normalizeThemeMode(appSettings.themeMode)
  } catch (error) {
    console.error('读取主题设置失败:', error)
    return THEME_MODE.LIGHT
  }
}

export const resolveThemeMode = (mode = getStoredThemeMode()) => {
  const normalizedMode = normalizeThemeMode(mode)
  if (normalizedMode !== THEME_MODE.SYSTEM || !isBrowser()) {
    return normalizedMode
  }

  return window.matchMedia?.(THEME_MEDIA_QUERY).matches ? THEME_MODE.DARK : THEME_MODE.LIGHT
}

export const applyTheme = (mode = getStoredThemeMode()) => {
  if (!isBrowser()) return THEME_MODE.LIGHT

  currentMode = normalizeThemeMode(mode)
  const resolvedTheme = resolveThemeMode(currentMode)
  const isDark = resolvedTheme === THEME_MODE.DARK

  if (isDark) {
    document.body.setAttribute('arco-theme', 'dark')
  } else {
    document.body.removeAttribute('arco-theme')
  }

  document.documentElement.dataset.theme = resolvedTheme
  document.body.dataset.theme = resolvedTheme
  document.documentElement.dataset.themeMode = currentMode
  document.body.dataset.themeMode = currentMode
  document.documentElement.style.colorScheme = resolvedTheme

  window.dispatchEvent(new CustomEvent('themeChanged', {
    detail: {
      mode: currentMode,
      resolvedTheme
    }
  }))

  return resolvedTheme
}

export const setStoredThemeMode = (mode) => {
  if (!isBrowser()) return THEME_MODE.LIGHT

  const themeMode = normalizeThemeMode(mode)
  let appSettings = {}

  try {
    appSettings = JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) || '{}')
  } catch (error) {
    console.error('读取主题设置失败:', error)
  }

  appSettings.themeMode = themeMode
  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(appSettings))
  applyTheme(themeMode)
  return themeMode
}

const handleSystemThemeChange = () => {
  if (currentMode === THEME_MODE.SYSTEM) {
    applyTheme(currentMode)
  }
}

const handleStorageChange = (event) => {
  if (event.key !== THEME_STORAGE_KEY) return
  applyTheme(getStoredThemeMode())
}

const refreshSystemTheme = () => {
  if (currentMode === THEME_MODE.SYSTEM) {
    applyTheme(currentMode)
  }
}

export const initTheme = () => {
  if (!isBrowser()) return THEME_MODE.LIGHT

  currentMode = getStoredThemeMode()
  applyTheme(currentMode)

  if (!mediaQueryList && window.matchMedia) {
    mediaQueryList = window.matchMedia(THEME_MEDIA_QUERY)
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleSystemThemeChange)
    } else if (mediaQueryList.addListener) {
      mediaQueryList.addListener(handleSystemThemeChange)
    }
  }

  window.removeEventListener('storage', handleStorageChange)
  window.addEventListener('storage', handleStorageChange)
  window.removeEventListener('focus', refreshSystemTheme)
  window.addEventListener('focus', refreshSystemTheme)
  document.removeEventListener('visibilitychange', refreshSystemTheme)
  document.addEventListener('visibilitychange', refreshSystemTheme)

  return currentMode
}
