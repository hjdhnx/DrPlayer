const getLocationHost = () => {
  if (typeof location === 'undefined') {
    return ''
  }

  return location.href.substring(0, location.href.indexOf('/', 10))
}

const getEnvValue = (key, fallback = '') => {
  const value = import.meta.env[key]
  return value === undefined || value === null || value === '' ? fallback : value
}

const getEnvBoolean = (key, fallback = false) => {
  const value = import.meta.env[key]
  if (value === undefined || value === null || value === '') {
    return fallback
  }

  return value === 'true' || value === '1'
}

const getEnvNumber = (key, fallback) => {
  const value = Number(import.meta.env[key])
  return Number.isFinite(value) ? value : fallback
}

const withLocationHost = (value) => value.replaceAll('${locationHost}', getLocationHost())

export const getDefaultAddressSettings = () => ({
  vodConfig: withLocationHost(getEnvValue('VITE_DEFAULT_VOD_CONFIG', 'http://127.0.0.1:5757/config/1?healthy=1&pwd=dzyyds')),
  liveConfig: withLocationHost(getEnvValue('VITE_DEFAULT_LIVE_CONFIG', '')),
  proxyAccess: withLocationHost(getEnvValue('VITE_DEFAULT_PROXY_ACCESS', 'http://127.0.0.1:5757/req/${url}')),
  proxyAccessEnabled: getEnvBoolean('VITE_DEFAULT_PROXY_ACCESS_ENABLED', true),
  proxyPlay: withLocationHost(getEnvValue('VITE_DEFAULT_PROXY_PLAY', 'http://localhost:5757/unified-proxy/proxy?form=base64&auth=drpys&url=${url}&headers=${headers}&type=${type}#DS')),
  proxyPlayEnabled: getEnvBoolean('VITE_DEFAULT_PROXY_PLAY_ENABLED', false),
  proxySniff: withLocationHost(getEnvValue('VITE_DEFAULT_PROXY_SNIFF', 'http://localhost:57573/sniffer')),
  proxySniffEnabled: getEnvBoolean('VITE_DEFAULT_PROXY_SNIFF_ENABLED', false),
  snifferTimeout: getEnvNumber('VITE_DEFAULT_SNIFFER_TIMEOUT', 10),
  apiTimeout: getEnvNumber('VITE_DEFAULT_API_TIMEOUT', 30)
})

export const getDefaultAppSettings = () => ({
  datasourceDisplay: getEnvBoolean('VITE_DEFAULT_DATASOURCE_DISPLAY', true),
  windowPreview: getEnvBoolean('VITE_DEFAULT_WINDOW_PREVIEW', true),
  playerType: getEnvValue('VITE_DEFAULT_PLAYER_TYPE', 'ijk'),
  adFilter: getEnvBoolean('VITE_DEFAULT_AD_FILTER', true),
  ijkCache: getEnvBoolean('VITE_DEFAULT_IJK_CACHE', false),
  autoLive: getEnvBoolean('VITE_DEFAULT_AUTO_LIVE', false),
  secureDns: getEnvBoolean('VITE_DEFAULT_SECURE_DNS', false),
  cspBypass: getEnvBoolean('VITE_DEFAULT_CSP_BYPASS', true),
  referrerPolicy: getEnvValue('VITE_DEFAULT_REFERRER_POLICY', 'no-referrer'),
  searchAggregation: getEnvBoolean('VITE_DEFAULT_SEARCH_AGGREGATION', false),
  themeMode: getEnvValue('VITE_DEFAULT_THEME_MODE', 'light')
})

export const initDefaultLocalStorage = () => {
  const addressSettings = getDefaultAddressSettings()
  const appSettings = getDefaultAppSettings()

  if (!localStorage.getItem('drplayer_config_url') && addressSettings.vodConfig) {
    localStorage.setItem('drplayer_config_url', addressSettings.vodConfig)
  }

  if (!localStorage.getItem('addressSettings')) {
    localStorage.setItem('addressSettings', JSON.stringify(addressSettings, null, 4))
  }

  if (!localStorage.getItem('appSettings')) {
    localStorage.setItem('appSettings', JSON.stringify(appSettings))
  }

  if (!localStorage.getItem('address-history-vod-config') && addressSettings.vodConfig) {
    localStorage.setItem('address-history-vod-config', JSON.stringify([{ timestamp: Date.now(), url: addressSettings.vodConfig }]))
  }

  if (!localStorage.getItem('address-history-live-config') && addressSettings.liveConfig) {
    localStorage.setItem('address-history-live-config', JSON.stringify([{ timestamp: Date.now(), url: addressSettings.liveConfig }]))
  }

  if (!localStorage.getItem('address-history-proxy-access') && addressSettings.proxyAccess) {
    localStorage.setItem('address-history-proxy-access', JSON.stringify([{ timestamp: Date.now(), url: addressSettings.proxyAccess }]))
  }

  if (!localStorage.getItem('address-history-proxy-play') && addressSettings.proxyPlay) {
    localStorage.setItem('address-history-proxy-play', JSON.stringify([{ timestamp: Date.now(), url: addressSettings.proxyPlay }]))
  }

  if (!localStorage.getItem('address-history-proxy-sniff') && addressSettings.proxySniff) {
    localStorage.setItem('address-history-proxy-sniff', JSON.stringify([{ timestamp: Date.now(), url: addressSettings.proxySniff }]))
  }

  if (!localStorage.getItem('drplayer_preferred_player_type')) {
    localStorage.setItem('drplayer_preferred_player_type', getEnvValue('VITE_DEFAULT_PREFERRED_PLAYER_TYPE', 'artplayer'))
  }

  if (!localStorage.getItem('autoNextEnabled')) {
    localStorage.setItem('autoNextEnabled', JSON.stringify(getEnvBoolean('VITE_DEFAULT_AUTO_NEXT_ENABLED', true)))
  }

  if (!localStorage.getItem('loopEnabled')) {
    localStorage.setItem('loopEnabled', JSON.stringify(getEnvBoolean('VITE_DEFAULT_LOOP_ENABLED', false)))
  }

  if (!localStorage.getItem('danmakuEnabled')) {
    localStorage.setItem('danmakuEnabled', JSON.stringify(getEnvBoolean('VITE_DEFAULT_DANMAKU_ENABLED', false)))
  }
}
