<template>
  <div class="settings-container">
    <!-- 简化的标题显示 -->
    <div class="simple-header">
      <div class="settings-page-heading">
        <span class="navigation-title">设置</span>
        <span class="navigation-subtitle">配置数据源、播放器与应用偏好</span>
      </div>
    </div>

    <!-- 设置内容 -->
    <div class="settings-content" ref="settingsContainer">
      <!-- 地址设置卡片 -->
      <a-card class="settings-card config-card" title="地址设置" :bordered="false">
        <template #extra>
          <icon-link class="card-icon"/>
        </template>

        <div class="address-settings-section">
          <!-- 点播配置 -->
          <div class="address-config-item">
            <div class="address-config-row">
              <div class="address-config-info">
                <icon-play-circle class="address-config-icon"/>
                <div class="address-config-text">
                  <div class="address-config-title">点播配置</div>
                  <div class="address-config-desc">配置点播视频数据源地址</div>
                </div>
              </div>
              <div class="address-config-input-group">
                <a-input
                    v-model="addressSettings.vodConfig"
                    placeholder="请输入点播配置地址"
                    size="medium"
                    class="address-config-input"
                >
                  <template #prefix>
                    <icon-link/>
                  </template>
                </a-input>
                <div class="address-config-actions">
                  <AddressHistory
                      ref="vodConfigHistory"
                      config-key="vod-config"
                      :current-value="addressSettings.vodConfig"
                      @select="(value) => addressSettings.vodConfig = value"
                  />
                  <a-button
                      type="outline"
                      @click="testAddress('vodConfig')"
                      :loading="addressTesting.vodConfig"
                      size="medium"
                  >
                    <template #icon>
                      <icon-check-circle/>
                    </template>
                    测试
                  </a-button>
                  <a-button
                      type="primary"
                      @click="saveAddress('vodConfig')"
                      :loading="addressSaving.vodConfig"
                      size="medium"
                  >
                    <template #icon>
                      <icon-save/>
                    </template>
                    保存
                  </a-button>
                </div>
              </div>
            </div>
            <div v-if="addressStatus.vodConfig && addressStatus.vodConfig.message" class="address-config-status">
              <div
                  class="config-message"
                  :class="{
                  'config-message-success': addressStatus.vodConfig.type === 'success',
                  'config-message-error': addressStatus.vodConfig.type === 'error',
                  'config-message-warning': addressStatus.vodConfig.type === 'warning'
                }"
              >
                <icon-check-circle v-if="addressStatus.vodConfig.type === 'success'" class="config-icon"/>
                <icon-exclamation-circle v-else-if="addressStatus.vodConfig.type === 'error'" class="config-icon"/>
                <icon-info-circle v-else class="config-icon"/>
                <span class="config-text">{{ addressStatus.vodConfig.message }}</span>
              </div>
            </div>
          </div>

          <!-- 直播配置 -->
          <div class="address-config-item">
            <div class="address-config-row">
              <div class="address-config-info">
                <icon-live-broadcast class="address-config-icon"/>
                <div class="address-config-text">
                  <div class="address-config-title">直播配置</div>
                  <div class="address-config-desc">配置直播频道数据源地址</div>
                </div>
              </div>
              <div class="address-config-input-group">
                <a-input
                    v-model="addressSettings.liveConfig"
                    placeholder="请输入直播配置地址"
                    size="medium"
                    class="address-config-input"
                >
                  <template #prefix>
                    <icon-link/>
                  </template>
                </a-input>
                <div class="address-config-actions">
                  <AddressHistory
                      ref="liveConfigHistory"
                      config-key="live-config"
                      :current-value="addressSettings.liveConfig"
                      @select="(value) => addressSettings.liveConfig = value"
                  />
                  <a-button
                      type="outline"
                      @click="resetLiveConfig"
                      :loading="addressSaving.liveConfigReset"
                      size="medium"
                  >
                    <template #icon>
                      <icon-refresh/>
                    </template>
                    重置
                  </a-button>
                  <a-button
                      type="primary"
                      @click="saveAddress('liveConfig')"
                      :loading="addressSaving.liveConfig"
                      size="medium"
                  >
                    <template #icon>
                      <icon-save/>
                    </template>
                    保存
                  </a-button>
                </div>
              </div>
            </div>
            <div v-if="addressStatus.liveConfig && addressStatus.liveConfig.message" class="address-config-status">
              <div
                  class="config-message"
                  :class="{
                  'config-message-success': addressStatus.liveConfig.type === 'success',
                  'config-message-error': addressStatus.liveConfig.type === 'error',
                  'config-message-warning': addressStatus.liveConfig.type === 'warning'
                }"
              >
                <icon-check-circle v-if="addressStatus.liveConfig.type === 'success'" class="config-icon"/>
                <icon-exclamation-circle v-else-if="addressStatus.liveConfig.type === 'error'" class="config-icon"/>
                <icon-info-circle v-else class="config-icon"/>
                <span class="config-text">{{ addressStatus.liveConfig.message }}</span>
              </div>
            </div>
          </div>

          <!-- 代理访问接口 -->
          <div class="address-config-item">
            <div class="address-config-row">
              <div class="address-config-info">
                <icon-swap class="address-config-icon"/>
                <div class="address-config-text">
                  <div class="address-config-title">代理访问接口</div>
                  <div class="address-config-desc">配置代理访问服务接口地址</div>
                </div>
              </div>
              <div class="address-config-input-group">
                <a-switch v-model="addressSettings.proxyAccessEnabled" class="address-config-switch"/>
                <a-input
                    v-model="addressSettings.proxyAccess"
                    placeholder="请输入代理访问接口地址"
                    size="medium"
                    class="address-config-input"
                    :disabled="!addressSettings.proxyAccessEnabled"
                >
                  <template #prefix>
                    <icon-link/>
                  </template>
                </a-input>
                <div class="address-config-actions">
                  <AddressHistory
                      ref="proxyAccessHistory"
                      config-key="proxy-access"
                      :current-value="addressSettings.proxyAccess"
                      @select="(value) => addressSettings.proxyAccess = value"
                  />
                  <a-button
                      type="primary"
                      @click="saveAddress('proxyAccess')"
                      :loading="addressSaving.proxyAccess"
                      :disabled="!addressSettings.proxyAccessEnabled"
                      size="medium"
                  >
                    <template #icon>
                      <icon-save/>
                    </template>
                    保存
                  </a-button>
                </div>
              </div>
            </div>
            <div v-if="addressStatus.proxyAccess && addressStatus.proxyAccess.message" class="address-config-status">
              <div
                  class="config-message"
                  :class="{
                  'config-message-success': addressStatus.proxyAccess.type === 'success',
                  'config-message-error': addressStatus.proxyAccess.type === 'error',
                  'config-message-warning': addressStatus.proxyAccess.type === 'warning'
                }"
              >
                <icon-check-circle v-if="addressStatus.proxyAccess.type === 'success'" class="config-icon"/>
                <icon-exclamation-circle v-else-if="addressStatus.proxyAccess.type === 'error'" class="config-icon"/>
                <icon-info-circle v-else class="config-icon"/>
                <span class="config-text">{{ addressStatus.proxyAccess.message }}</span>
              </div>
            </div>
          </div>

          <!-- 代理播放接口 -->
          <div class="address-config-item">
            <div class="address-config-row">
              <div class="address-config-info">
                <icon-play-arrow class="address-config-icon"/>
                <div class="address-config-text">
                  <div class="address-config-title">代理播放接口</div>
                  <div class="address-config-desc">配置代理播放服务接口地址</div>
                </div>
              </div>
              <div class="address-config-input-group">
                <a-switch v-model="addressSettings.proxyPlayEnabled" class="address-config-switch"
                          @change="handleProxyPlayEnabledChange"/>
                <a-input
                    v-model="addressSettings.proxyPlay"
                    placeholder="请输入代理播放接口地址"
                    size="medium"
                    class="address-config-input"
                    :disabled="!addressSettings.proxyPlayEnabled"
                >
                  <template #prefix>
                    <icon-link/>
                  </template>
                </a-input>
                <div class="address-config-actions">
                  <a-button
                      type="text"
                      @click="downloadProxyPlayer"
                      size="medium"
                      class="download-btn"
                      title="下载代理播放器"
                  >
                    <template #icon>
                      <icon-download/>
                    </template>
                  </a-button>
                  <AddressHistory
                      ref="proxyPlayHistory"
                      config-key="proxy-play"
                      :current-value="addressSettings.proxyPlay"
                      @select="(value) => addressSettings.proxyPlay = value"
                  />
                  <a-button
                      type="outline"
                      @click="resetProxyPlay"
                      :loading="addressSaving.proxyPlayReset"
                      size="medium"
                  >
                    <template #icon>
                      <icon-refresh/>
                    </template>
                    重置
                  </a-button>
                  <a-button
                      type="primary"
                      @click="saveAddress('proxyPlay')"
                      :loading="addressSaving.proxyPlay"
                      :disabled="!addressSettings.proxyPlayEnabled"
                      size="medium"
                  >
                    <template #icon>
                      <icon-save/>
                    </template>
                    保存
                  </a-button>
                </div>
              </div>
            </div>
            <div v-if="addressStatus.proxyPlay && addressStatus.proxyPlay.message" class="address-config-status">
              <div
                  class="config-message"
                  :class="{
                  'config-message-success': addressStatus.proxyPlay.type === 'success',
                  'config-message-error': addressStatus.proxyPlay.type === 'error',
                  'config-message-warning': addressStatus.proxyPlay.type === 'warning'
                }"
              >
                <icon-check-circle v-if="addressStatus.proxyPlay.type === 'success'" class="config-icon"/>
                <icon-exclamation-circle v-else-if="addressStatus.proxyPlay.type === 'error'" class="config-icon"/>
                <icon-info-circle v-else class="config-icon"/>
                <span class="config-text">{{ addressStatus.proxyPlay.message }}</span>
              </div>
            </div>
          </div>

          <!-- 代理嗅探接口 -->
          <div class="address-config-item">
            <div class="address-config-row">
              <div class="address-config-info">
                <icon-search class="address-config-icon"/>
                <div class="address-config-text">
                  <div class="address-config-title">代理嗅探接口</div>
                  <div class="address-config-desc">配置代理嗅探服务接口地址</div>
                </div>
              </div>
              <div class="address-config-input-group">
                <a-switch v-model="addressSettings.proxySniffEnabled" class="address-config-switch"/>
                <a-input
                    v-model="addressSettings.proxySniff"
                    placeholder="请输入代理嗅探接口地址"
                    size="medium"
                    class="address-config-input"
                    :disabled="!addressSettings.proxySniffEnabled"
                >
                  <template #prefix>
                    <icon-link/>
                  </template>
                </a-input>
                <div class="address-config-actions">
                  <a-button
                      type="text"
                      @click="downloadProxySniffer"
                      size="medium"
                      class="download-btn"
                      title="下载代理嗅探器"
                  >
                    <template #icon>
                      <icon-download/>
                    </template>
                  </a-button>
                  <AddressHistory
                      ref="proxySniffHistory"
                      config-key="proxy-sniff"
                      :current-value="addressSettings.proxySniff"
                      @select="(value) => addressSettings.proxySniff = value"
                  />
                  <a-button
                      type="outline"
                      @click="resetProxySniff"
                      :loading="addressSaving.proxySniffReset"
                      size="medium"
                  >
                    <template #icon>
                      <icon-refresh/>
                    </template>
                    重置
                  </a-button>
                  <a-button
                      type="primary"
                      @click="saveAddress('proxySniff')"
                      :loading="addressSaving.proxySniff"
                      :disabled="!addressSettings.proxySniffEnabled"
                      size="medium"
                  >
                    <template #icon>
                      <icon-save/>
                    </template>
                    保存
                  </a-button>
                </div>
              </div>
            </div>
            <div v-if="addressStatus.proxySniff && addressStatus.proxySniff.message" class="address-config-status">
              <div
                  class="config-message"
                  :class="{
                  'config-message-success': addressStatus.proxySniff.type === 'success',
                  'config-message-error': addressStatus.proxySniff.type === 'error',
                  'config-message-warning': addressStatus.proxySniff.type === 'warning'
                }"
              >
                <icon-check-circle v-if="addressStatus.proxySniff.type === 'success'" class="config-icon"/>
                <icon-exclamation-circle v-else-if="addressStatus.proxySniff.type === 'error'" class="config-icon"/>
                <icon-info-circle v-else class="config-icon"/>
                <span class="config-text">{{ addressStatus.proxySniff.message }}</span>
              </div>
            </div>
          </div>

          <!-- 嗅探超时设置 -->
          <div class="address-config-item">
            <div class="address-config-row">
              <div class="address-config-info">
                <icon-clock-circle class="address-config-icon"/>
                <div class="address-config-text">
                  <div class="address-config-title">嗅探超时时间</div>
                  <div class="address-config-desc">设置代理嗅探接口的超时时间（秒）</div>
                </div>
              </div>
              <div class="address-config-input-group">
                <a-input-number
                    v-model="addressSettings.snifferTimeout"
                    placeholder="15"
                    size="medium"
                    class="address-config-input"
                    :min="5"
                    :max="60"
                    :step="1"
                    :disabled="!addressSettings.proxySniffEnabled"
                >
                  <template #suffix>
                    <span class="input-suffix">秒</span>
                  </template>
                </a-input-number>
                <div class="address-config-actions">
                  <a-button
                      type="primary"
                      @click="saveAddress('snifferTimeout')"
                      :loading="addressSaving.snifferTimeout"
                      :disabled="!addressSettings.proxySniffEnabled"
                      size="medium"
                  >
                    <template #icon>
                      <icon-save/>
                    </template>
                    保存
                  </a-button>
                </div>
              </div>
            </div>
            <div v-if="addressStatus.snifferTimeout && addressStatus.snifferTimeout.message"
                 class="address-config-status">
              <div
                  class="config-message"
                  :class="{
                  'config-message-success': addressStatus.snifferTimeout.type === 'success',
                  'config-message-error': addressStatus.snifferTimeout.type === 'error',
                  'config-message-warning': addressStatus.snifferTimeout.type === 'warning'
                }"
              >
                <icon-check-circle v-if="addressStatus.snifferTimeout.type === 'success'" class="config-icon"/>
                <icon-exclamation-circle v-else-if="addressStatus.snifferTimeout.type === 'error'" class="config-icon"/>
                <icon-info-circle v-else class="config-icon"/>
                <span class="config-text">{{ addressStatus.snifferTimeout.message }}</span>
              </div>
            </div>
          </div>

          <!-- 访问超时设置 -->
          <div class="address-config-item">
            <div class="address-config-row">
              <div class="address-config-info">
                <icon-clock-circle class="address-config-icon"/>
                <div class="address-config-text">
                  <div class="address-config-title">访问超时时间</div>
                  <div class="address-config-desc">设置T4接口访问的超时时间（秒）</div>
                </div>
              </div>
              <div class="address-config-input-group">
                <a-input-number
                    v-model="addressSettings.apiTimeout"
                    placeholder="30"
                    size="medium"
                    class="address-config-input"
                    :min="5"
                    :max="120"
                    :step="1"
                >
                  <template #suffix>
                    <span class="input-suffix">秒</span>
                  </template>
                </a-input-number>
                <div class="address-config-actions">
                  <a-button
                      type="primary"
                      @click="saveAddress('apiTimeout')"
                      :loading="addressSaving.apiTimeout"
                      size="medium"
                  >
                    <template #icon>
                      <icon-save/>
                    </template>
                    保存
                  </a-button>
                </div>
              </div>
            </div>
            <div v-if="addressStatus.apiTimeout && addressStatus.apiTimeout.message" class="address-config-status">
              <div
                  class="config-message"
                  :class="{
                  'config-message-success': addressStatus.apiTimeout.type === 'success',
                  'config-message-error': addressStatus.apiTimeout.type === 'error',
                  'config-message-warning': addressStatus.apiTimeout.type === 'warning'
                }"
              >
                <icon-check-circle v-if="addressStatus.apiTimeout.type === 'success'" class="config-icon"/>
                <icon-exclamation-circle v-else-if="addressStatus.apiTimeout.type === 'error'" class="config-icon"/>
                <icon-info-circle v-else class="config-icon"/>
                <span class="config-text">{{ addressStatus.apiTimeout.message }}</span>
              </div>
            </div>
          </div>
        </div>
      </a-card>

      <!-- 首页设置卡片 -->
      <a-card class="settings-card" title="首页设置" :bordered="false">
        <template #extra>
          <icon-home class="card-icon"/>
        </template>

        <div class="settings-grid">
          <div class="setting-item" @click="handleSettingClick('datasource')">
            <div class="setting-info">
              <icon-storage class="setting-icon"/>
              <div class="setting-text">
                <div class="setting-title">数据源</div>
                <div class="setting-desc">管理视频数据来源</div>
              </div>
            </div>
            <div class="setting-value">
              <span class="value-text">配置中</span>
              <icon-right class="arrow-icon"/>
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('datasource-display')">
            <div class="setting-info">
              <icon-eye class="setting-icon"/>
              <div class="setting-text">
                <div class="setting-title">数据源显示</div>
                <div class="setting-desc">控制数据源的显示状态</div>
              </div>
            </div>
            <div class="setting-value">
              <a-switch v-model="settings.datasourceDisplay"/>
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('recommendation')">
            <div class="setting-info">
              <icon-star class="setting-icon"/>
              <div class="setting-text">
                <div class="setting-title">推荐</div>
                <div class="setting-desc">推荐内容设置</div>
              </div>
            </div>
            <div class="setting-value">
              <span class="value-text">站点推荐</span>
              <icon-right class="arrow-icon"/>
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('history-count')">
            <div class="setting-info">
              <icon-history class="setting-icon"/>
              <div class="setting-text">
                <div class="setting-title">历史条数</div>
                <div class="setting-desc">设置历史记录保存数量</div>
              </div>
            </div>
            <div class="setting-value">
              <span class="value-text">100条</span>
              <icon-right class="arrow-icon"/>
            </div>
          </div>
        </div>
      </a-card>

      <!-- 播放器设置卡片 -->
      <a-card class="settings-card" title="播放器设置" :bordered="false">
        <template #extra>
          <icon-play-circle class="card-icon"/>
        </template>

        <div class="settings-grid">
          <div class="setting-item" @click="handleSettingClick('window-preview')">
            <div class="setting-info">
              <icon-computer class="setting-icon"/>
              <div class="setting-text">
                <div class="setting-title">窗口预览</div>
                <div class="setting-desc">启用播放器窗口预览</div>
              </div>
            </div>
            <div class="setting-value">
              <a-switch v-model="settings.windowPreview"/>
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('player-type')">
            <div class="setting-info">
              <icon-play-arrow class="setting-icon"/>
              <div class="setting-text">
                <div class="setting-title">播放器</div>
                <div class="setting-desc">选择播放器类型</div>
              </div>
            </div>
            <div class="setting-value">
              <span class="value-text">{{ getCurrentPlayerName() }}</span>
              <icon-right class="arrow-icon"/>
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('ijk-decode')">
            <div class="setting-info">
              <icon-code class="setting-icon"/>
              <div class="setting-text">
                <div class="setting-title">IJK解码</div>
                <div class="setting-desc">设置解码方式</div>
              </div>
            </div>
            <div class="setting-value">
              <span class="value-text">硬解码</span>
              <icon-right class="arrow-icon"/>
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('ad-filter')">
            <div class="setting-info">
              <icon-safe class="setting-icon"/>
              <div class="setting-text">
                <div class="setting-title">广告过滤</div>
                <div class="setting-desc">自动过滤广告内容</div>
              </div>
            </div>
            <div class="setting-value">
              <a-switch v-model="settings.adFilter"/>
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('ijk-cache')">
            <div class="setting-info">
              <icon-storage class="setting-icon"/>
              <div class="setting-text">
                <div class="setting-title">IJK缓存</div>
                <div class="setting-desc">启用播放器缓存</div>
              </div>
            </div>
            <div class="setting-value">
              <a-switch v-model="settings.ijkCache"/>
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('auto-live')">
            <div class="setting-info">
              <icon-live-broadcast class="setting-icon"/>
              <div class="setting-text">
                <div class="setting-title">启动时进直播</div>
                <div class="setting-desc">应用启动时自动进入直播</div>
              </div>
            </div>
            <div class="setting-value">
              <a-switch v-model="settings.autoLive"/>
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('csp-bypass')">
            <div class="setting-info">
              <icon-safe class="setting-icon"/>
              <div class="setting-text">
                <div class="setting-title">CSP绕过</div>
                <div class="setting-desc">自动绕过防盗链检测</div>
              </div>
            </div>
            <div class="setting-value">
              <a-switch v-model="settings.cspBypass"/>
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('referrer-policy')">
            <div class="setting-info">
              <icon-link class="setting-icon"/>
              <div class="setting-text">
                <div class="setting-title">Referrer策略</div>
                <div class="setting-desc">设置HTTP Referrer策略</div>
              </div>
            </div>
            <div class="setting-value">
              <span class="value-text">{{ getCurrentReferrerPolicyName() }}</span>
              <icon-right class="arrow-icon"/>
            </div>
          </div>
        </div>
      </a-card>

      <!-- 系统设置卡片 -->
      <a-card class="settings-card" title="系统设置" :bordered="false">
        <template #extra>
          <icon-desktop class="card-icon"/>
        </template>

        <div class="settings-grid">
          <div class="setting-item" @click="handleSettingClick('language')">
            <div class="setting-info">
              <icon-language class="setting-icon"/>
              <div class="setting-text">
                <div class="setting-title">语言</div>
                <div class="setting-desc">选择界面语言</div>
              </div>
            </div>
            <div class="setting-value">
              <span class="value-text">中文</span>
              <icon-right class="arrow-icon"/>
            </div>
          </div>

          <div class="setting-item theme-setting-item">
            <div class="setting-info">
              <icon-palette class="setting-icon"/>
              <div class="setting-text">
                <div class="setting-title">主题</div>
                <div class="setting-desc">选择应用浅色或深色模式</div>
              </div>
            </div>
            <div class="setting-value theme-setting-value" @click.stop>
              <a-radio-group v-model="settings.themeMode" type="button" size="small" class="theme-mode-group">
                <a-radio
                  v-for="option in themeOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </a-radio>
              </a-radio-group>
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('wallpaper')">
            <div class="setting-info">
              <icon-image class="setting-icon"/>
              <div class="setting-text">
                <div class="setting-title">换张壁纸</div>
                <div class="setting-desc">更换应用背景壁纸</div>
              </div>
            </div>
            <div class="setting-value">
              <icon-right class="arrow-icon"/>
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('reset-wallpaper')">
            <div class="setting-info">
              <icon-refresh class="setting-icon"/>
              <div class="setting-text">
                <div class="setting-title">重置壁纸</div>
                <div class="setting-desc">恢复默认背景壁纸</div>
              </div>
            </div>
            <div class="setting-value">
              <icon-right class="arrow-icon"/>
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('render-mode')">
            <div class="setting-info">
              <icon-desktop class="setting-icon"/>
              <div class="setting-text">
                <div class="setting-title">渲染方式</div>
                <div class="setting-desc">选择渲染模式</div>
              </div>
            </div>
            <div class="setting-value">
              <span class="value-text">TextureView</span>
              <icon-right class="arrow-icon"/>
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('search-display')">
            <div class="setting-info">
              <icon-search class="setting-icon"/>
              <div class="setting-text">
                <div class="setting-title">搜索展示</div>
                <div class="setting-desc">搜索结果展示方式</div>
              </div>
            </div>
            <div class="setting-value">
              <span class="value-text">缩略图</span>
              <icon-right class="arrow-icon"/>
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('webview')">
            <div class="setting-info">
              <icon-code class="setting-icon"/>
              <div class="setting-text">
                <div class="setting-title">嗅探Webview</div>
                <div class="setting-desc">选择Webview类型</div>
              </div>
            </div>
            <div class="setting-value">
              <span class="value-text">系统自带</span>
              <icon-right class="arrow-icon"/>
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('secure-dns')">
            <div class="setting-info">
              <icon-safe class="setting-icon"/>
              <div class="setting-text">
                <div class="setting-title">安全DNS</div>
                <div class="setting-desc">启用安全DNS解析</div>
              </div>
            </div>
            <div class="setting-value">
              <a-switch v-model="settings.secureDns"/>
            </div>
          </div>
        </div>
      </a-card>

      <!-- 开发者调试卡片 -->
      <a-card class="settings-card config-card" title="开发者调试" :bordered="false">
        <template #extra>
          <icon-bug class="card-icon"/>
        </template>

        <div class="address-settings-section">
          <!-- 允许调试开关 -->
          <div class="setting-item">
            <div class="setting-info">
              <icon-bug class="setting-icon"/>
              <div class="setting-text">
                <div class="setting-title">允许调试</div>
                <div class="setting-desc">开启开发者调试功能</div>
              </div>
            </div>
            <div class="setting-value">
              <a-switch 
                v-model="debugSettings.enabled" 
                @change="saveDebugSettings"
                size="medium"
              />
            </div>
          </div>

          <!-- 调试地址配置 -->
          <div class="address-config-item" v-if="debugSettings.enabled">
            <div class="address-config-row">
              <div class="address-config-info">
                <icon-link class="address-config-icon"/>
                <div class="address-config-text">
                  <div class="address-config-title">调试地址</div>
                  <div class="address-config-desc">配置悬浮iframe的调试地址</div>
                </div>
              </div>
              <div class="address-config-input-group">
                <a-input
                    v-model="debugSettings.url"
                    placeholder="请输入调试地址"
                    size="medium"
                    class="address-config-input"
                    @blur="saveDebugSettings"
                >
                  <template #prefix>
                    <icon-link/>
                  </template>
                </a-input>
                <div class="address-config-actions">
                  <a-button
                      type="outline"
                      @click="resetFloatingState"
                      :loading="debugSettings.resetting"
                      size="medium"
                  >
                    <template #icon>
                      <icon-refresh/>
                    </template>
                    重置状态
                  </a-button>
                  <a-button
                      type="primary"
                      @click="saveDebugSettings"
                      size="medium"
                  >
                    <template #icon>
                      <icon-save/>
                    </template>
                    保存
                  </a-button>

                </div>
              </div>
            </div>
          </div>
        </div>
      </a-card>

      <!-- 数据管理卡片 -->
      <a-card class="settings-card" title="数据管理" :bordered="false">
        <template #extra>
          <icon-folder class="card-icon"/>
        </template>

        <div class="settings-grid">
          <div class="setting-item" @click="handleSettingClick('backup')">
            <div class="setting-info">
              <icon-download class="setting-icon"/>
              <div class="setting-text">
                <div class="setting-title">数据备份还原</div>
                <div class="setting-desc">备份或还原应用数据</div>
              </div>
            </div>
            <div class="setting-value">
              <icon-right class="arrow-icon"/>
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('reset')">
            <div class="setting-info">
              <icon-delete class="setting-icon"/>
              <div class="setting-text">
                <div class="setting-title">重置</div>
                <div class="setting-desc">重置所有设置到默认状态</div>
              </div>
            </div>
            <div class="setting-value">
              <icon-right class="arrow-icon"/>
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('search-aggregation')">
            <div class="setting-info">
              <icon-find-replace class="setting-icon"/>
              <div class="setting-text">
                <div class="setting-title">聚搜</div>
                <div class="setting-desc">聚合搜索功能</div>
              </div>
            </div>
            <div class="setting-value">
              <span class="value-text">{{ settings.searchAggregation ? '已开启' : '已关闭' }}</span>
              <icon-right class="arrow-icon"/>
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('about')">
            <div class="setting-info">
              <icon-info-circle class="setting-icon"/>
              <div class="setting-text">
                <div class="setting-title">关于</div>
                <div class="setting-desc">查看应用信息和版本</div>
              </div>
            </div>
            <div class="setting-value">
              <icon-right class="arrow-icon"/>
            </div>
          </div>
        </div>
      </a-card>
    </div>

    <!-- 播放器选择对话框 -->
    <PlayerSelector
        v-model:visible="playerSelectVisible"
        :player-types="playerTypes"
        :current-player="settings.playerType"
        @confirm="handlePlayerSelect"
    />

    <!-- 备份还原对话框 -->
    <BackupRestoreDialog
        v-model:visible="backupRestoreVisible"
    />

    <!-- 关于弹窗 -->
    <About v-model:visible="aboutModalVisible"/>

    <!-- 直达底部按钮 -->
    <ScrollToBottom :target="settingsContainer"/>
  </div>
</template>

<script setup>
import {ref, reactive, watch, onMounted} from 'vue'
import {Message} from '@arco-design/web-vue'
import {
  IconLink,
  IconCheckCircle,
  IconSave,
  IconHome,
  IconStorage,
  IconEye,
  IconRight,
  IconStar,
  IconHistory,
  IconSettings,
  IconDesktop,
  IconFilter,
  IconWifi,
  IconSafe,
  IconBug,
  IconQuestionCircle,
  IconInfoCircle,
  IconPlayCircle,
  IconLiveBroadcast,
  IconSwap,
  IconPlayArrow,
  IconSearch,
  IconExclamationCircle,
  IconRefresh,
  IconPalette,
  IconLanguage,
  IconImage,
  IconClockCircle,
  IconComputer,
  IconDownload,
  IconCode,
  IconFolder
} from '@arco-design/web-vue/es/icon'
import AddressHistory from '@/components/AddressHistory.vue'
import PlayerSelector from '@/components/PlayerSelector.vue'
import BackupRestoreDialog from '@/components/BackupRestoreDialog.vue'
import About from '@/components/About.vue'
import ScrollToBottom from '@/components/ScrollToBottom.vue'
import configService from '@/api/services/config'
import siteService from '@/api/services/site'
import {factoryResetWithConfirmation} from '@/services/resetService'
import { applyTheme, normalizeThemeMode, themeOptions } from '@/utils/theme'
import {
  getCSPConfig,
  saveCSPConfig,
  REFERRER_POLICIES_LIST,
  getCurrentReferrerPolicy,
  setGlobalReferrerPolicy
} from '@/utils/csp'

// AddressHistory 组件的 ref 引用
const vodConfigHistory = ref(null)
const liveConfigHistory = ref(null)
const proxyAccessHistory = ref(null)
const proxyPlayHistory = ref(null)
const proxySniffHistory = ref(null)

// 地址设置相关
const addressSettings = reactive({
  vodConfig: '',
  liveConfig: '',
  proxyAccess: '',
  proxyAccessEnabled: false,
  // proxyPlay: 'http://localhost:57572/proxy?form=base64&url=${url}&headers=${headers}&type=${type}#嗷呜',
  // proxyPlay: 'http://localhost:57574/?form=base64&url=${url}&headers=${headers}&type=${type}#GO',
  // proxyPlay: 'http://localhost:5757/file-proxy/proxy?form=base64&auth=drpys&url=${url}&headers=${headers}&type=${type}#DS',
  // proxyPlay: 'http://localhost:5757/m3u8-proxy/proxy?form=base64&auth=drpys&url=${url}&headers=${headers}&type=${type}#MDS',
  proxyPlay: 'http://localhost:5757/unified-proxy/proxy?form=base64&auth=drpys&url=${url}&headers=${headers}&type=${type}#DS',
  proxyPlayEnabled: false,
  proxySniff: 'http://localhost:57573/sniffer',
  proxySniffEnabled: false,
  snifferTimeout: 10,
  apiTimeout: 30
})

const addressSaving = reactive({
  vodConfig: false,
  liveConfig: false,
  liveConfigReset: false,
  proxyAccess: false,
  proxyPlay: false,
  proxyPlayReset: false,
  proxySniff: false,
  proxySniffReset: false,
  snifferTimeout: false,
  apiTimeout: false
})

const addressTesting = reactive({
  vodConfig: false
})

const addressStatus = reactive({
  vodConfig: null,
  liveConfig: null,
  proxyAccess: null,
  proxyPlay: null,
  proxySniff: null,
  snifferTimeout: null,
  apiTimeout: null
})

// 播放器类型选项
const playerTypes = [
  {value: 'art', label: 'Art Player', description: '现代化的HTML5播放器'},
  {value: 'ijk', label: 'IJK Player', description: '基于FFmpeg的播放器'},
  {value: 'exo', label: 'Exo Player', description: 'Google开发的Android播放器'},
  {value: 'mpv', label: 'MPV Player', description: '轻量级的媒体播放器'},
  {value: 'vlc', label: 'VLC Player', description: '功能强大的多媒体播放器'}
]

// 设置项状态
const settings = reactive({
  datasourceDisplay: true,
  windowPreview: true,
  playerType: 'ijk', // 默认播放器类型
  adFilter: true,
  ijkCache: false,
  autoLive: false,
  secureDns: false,
  cspBypass: true, // CSP绕过开关
  referrerPolicy: 'no-referrer', // 默认referrer策略
  searchAggregation: false, // 聚搜功能开关，默认关闭
  themeMode: 'light' // 应用主题模式
})

// 开发者调试设置
const debugSettings = reactive({
  enabled: false, // 是否启用调试功能
  url: 'http://localhost:5757/apps/websocket', // 默认调试地址
  resetting: false // 重置状态loading
})

// 播放器选择对话框状态
const playerSelectVisible = ref(false)

// 备份还原对话框状态
const backupRestoreVisible = ref(false)

// 关于弹窗状态
const aboutModalVisible = ref(false)

const settingsContainer = ref(null)

// 保存地址配置
const saveAddress = async (configType) => {
  const addressValue = addressSettings[configType]

  // 对于字符串类型，检查是否为空或只包含空白字符
  // 对于数字类型，检查是否为有效数字
  if (typeof addressValue === 'string') {
    if (!addressValue || !addressValue.trim()) {
      Message.warning('请输入地址')
      return
    }
  } else if (typeof addressValue === 'number') {
    if (isNaN(addressValue) || addressValue <= 0) {
      Message.warning('请输入有效的数值')
      return
    }
  } else {
    Message.warning('请输入有效的配置值')
    return
  }

  addressSaving[configType] = true
  try {
    // 保存到本地存储
    const savedAddresses = JSON.parse(localStorage.getItem('addressSettings') || '{}')
    savedAddresses[configType] = addressValue

    // 如果是代理相关配置，也保存开关状态
    if (configType.startsWith('proxy')) {
      const enabledKey = configType + 'Enabled'
      savedAddresses[enabledKey] = addressSettings[enabledKey]
    }

    localStorage.setItem('addressSettings', JSON.stringify(savedAddresses))

    // 如果是代理播放地址相关配置，触发自定义事件通知播放器组件
    if (configType === 'proxyPlay' || configType === 'proxyPlayEnabled') {
      // 触发自定义事件，通知播放器组件地址设置已更改
      window.dispatchEvent(new CustomEvent('addressSettingsChanged', {
        detail: {
          type: configType,
          value: addressValue,
          enabled: configType === 'proxyPlay' ? addressSettings.proxyPlayEnabled : addressValue
        }
      }))
    }

    // 如果是点播配置，尝试使用配置服务设置地址并自动设置直播配置地址
    if (configType === 'vodConfig') {
      try {
        await configService.setConfigUrl(addressValue)

        // 清除缓存并刷新点播数据，确保下次换源时列表是最新的
        try {
          await siteService.loadSitesFromConfig(true) // 强制刷新配置数据
          console.log('点播配置保存后已刷新缓存数据')
        } catch (refreshError) {
          console.error('刷新点播数据失败:', refreshError)
          // 即使刷新失败也不影响保存成功的提示
        }

        // 检查是否自动设置了直播配置地址
        const liveConfigUrl = configService.getLiveConfigUrl()
        if (liveConfigUrl && liveConfigUrl !== addressSettings.liveConfig) {
          // 更新界面显示的直播配置地址
          addressSettings.liveConfig = liveConfigUrl

          // 同步保存到本地存储
          savedAddresses.liveConfig = liveConfigUrl
          localStorage.setItem('addressSettings', JSON.stringify(savedAddresses))

          Message.success('点播配置保存成功，已自动设置直播配置地址并刷新数据')
        } else {
          Message.success('点播配置保存成功，已刷新点播数据')
        }
      } catch (error) {
        console.error('设置配置服务失败:', error)
        Message.success('地址保存成功，但配置服务设置失败')
      }
    } else if (configType === 'liveConfig') {
      // 如果是直播配置，使用配置服务设置直播配置地址
      try {
        await configService.setLiveConfigUrl(addressValue)
        Message.success('直播配置地址保存成功')
      } catch (error) {
        console.error('设置直播配置服务失败:', error)
        Message.success('地址保存成功，但配置服务设置失败')
      }
    } else {
      Message.success('地址保存成功')
    }

    addressStatus[configType] = {
      type: 'success',
      message: '地址保存成功'
    }

    // 添加到历史记录
    const historyRefMap = {
      'vodConfig': vodConfigHistory,
      'liveConfig': liveConfigHistory,
      'proxyAccess': proxyAccessHistory,
      'proxyPlay': proxyPlayHistory,
      'proxySniff': proxySniffHistory
    }

    const historyRef = historyRefMap[configType]
    if (historyRef && historyRef.value) {
      historyRef.value.addHistory(addressValue)
    }

  } catch (error) {
    console.error('保存地址失败:', error)
    addressStatus[configType] = {
      type: 'error',
      message: '保存失败：' + (error.message || '未知错误')
    }
    Message.error('保存失败：' + (error.message || '未知错误'))
  } finally {
    addressSaving[configType] = false
    // 8秒后清除状态消息
    setTimeout(() => {
      addressStatus[configType] = null
    }, 8000)
  }
}

// 测试地址配置（仅点播配置支持测试）
const testAddress = async (configType) => {
  if (configType !== 'vodConfig') {
    return
  }

  const addressValue = addressSettings[configType]

  if (!addressValue || !addressValue.trim()) {
    Message.warning('请输入配置地址')
    return
  }

  addressTesting[configType] = true
  try {
    // 使用配置服务验证配置地址
    const isValid = await configService.validateConfigUrl(addressValue)

    if (isValid) {
      addressStatus[configType] = {
        type: 'success',
        message: '配置地址测试成功，连接正常'
      }
      Message.success('配置地址测试成功')
    } else {
      addressStatus[configType] = {
        type: 'error',
        message: '测试失败：配置地址无法访问或数据格式不正确'
      }
      Message.error('测试失败：配置地址无法访问或数据格式不正确')
    }
  } catch (error) {
    console.error('测试配置地址失败:', error)
    addressStatus[configType] = {
      type: 'error',
      message: '测试失败：' + (error.message || '网络连接错误')
    }
    Message.error('测试失败：' + (error.message || '网络连接错误'))
  } finally {
    addressTesting[configType] = false
    // 8秒后清除状态消息
    setTimeout(() => {
      addressStatus[configType] = null
    }, 8000)
  }
}

// 重置直播配置地址
const resetLiveConfig = async () => {
  addressSaving.liveConfigReset = true
  try {
    // 使用配置服务重置直播配置地址
    const success = await configService.resetLiveConfigUrl()

    if (success) {
      // 更新界面显示的地址
      const newLiveConfigUrl = configService.getLiveConfigUrl()
      addressSettings.liveConfig = newLiveConfigUrl || ''

      // 同步保存到本地存储
      const savedAddresses = JSON.parse(localStorage.getItem('addressSettings') || '{}')
      savedAddresses.liveConfig = newLiveConfigUrl || ''
      localStorage.setItem('addressSettings', JSON.stringify(savedAddresses))

      addressStatus.liveConfig = {
        type: 'success',
        message: '直播配置地址已重置为当前点播配置中的默认地址'
      }
      Message.success('直播配置地址重置成功')
    } else {
      addressStatus.liveConfig = {
        type: 'error',
        message: '重置失败：当前点播配置中未找到直播地址'
      }
      Message.error('重置失败：当前点播配置中未找到直播地址')
    }
  } catch (error) {
    console.error('重置直播配置地址失败:', error)
    addressStatus.liveConfig = {
      type: 'error',
      message: '重置失败：' + (error.message || '未知错误')
    }
    Message.error('重置失败：' + (error.message || '未知错误'))
  } finally {
    addressSaving.liveConfigReset = false
    // 8秒后清除状态消息
    setTimeout(() => {
      addressStatus.liveConfig = null
    }, 8000)
  }
}

// 重置代理播放接口
const resetProxyPlay = async () => {
  addressSaving.proxyPlayReset = true
  try {
    // 重置为默认值
    // addressSettings.proxyPlay = 'http://localhost:57572/proxy?form=base64&url=${url}&headers=${headers}&type=${type}#嗷呜'
    // addressSettings.proxyPlay = 'http://localhost:57574/?form=base64&url=${url}&headers=${headers}&type=${type}#GO'
    // addressSettings.proxyPlay = 'http://localhost:5757/file-proxy/proxy?form=base64&auth=drpys&url=${url}&headers=${headers}&type=${type}#DS'
    // addressSettings.proxyPlay = 'http://localhost:5757/m3u8-proxy/proxy?form=base64&auth=drpys&url=${url}&headers=${headers}&type=${type}#MDS'
    addressSettings.proxyPlay = 'http://localhost:5757/unified-proxy/proxy?form=base64&auth=drpys&url=${url}&headers=${headers}&type=${type}#DS'
    addressSettings.proxyPlayEnabled = false

    // 保存到本地存储
    const savedAddresses = JSON.parse(localStorage.getItem('addressSettings') || '{}')
    savedAddresses.proxyPlay = addressSettings.proxyPlay
    savedAddresses.proxyPlayEnabled = addressSettings.proxyPlayEnabled
    localStorage.setItem('addressSettings', JSON.stringify(savedAddresses))

    // 触发自定义事件，通知播放器组件代理播放设置已重置
    window.dispatchEvent(new CustomEvent('addressSettingsChanged', {
      detail: {
        type: 'proxyPlayReset',
        value: addressSettings.proxyPlay,
        enabled: addressSettings.proxyPlayEnabled
      }
    }))

    addressStatus.proxyPlay = {
      type: 'success',
      message: '代理播放接口已重置为默认地址'
    }
    Message.success('代理播放接口重置成功')
  } catch (error) {
    console.error('重置代理播放接口失败:', error)
    addressStatus.proxyPlay = {
      type: 'error',
      message: '重置失败：' + (error.message || '未知错误')
    }
    Message.error('重置失败：' + (error.message || '未知错误'))
  } finally {
    addressSaving.proxyPlayReset = false
    // 8秒后清除状态消息
    setTimeout(() => {
      addressStatus.proxyPlay = null
    }, 8000)
  }
}

// 重置代理嗅探接口
const resetProxySniff = async () => {
  addressSaving.proxySniffReset = true
  try {
    // 重置为默认值
    addressSettings.proxySniff = 'http://localhost:57573/sniffer'
    addressSettings.proxySniffEnabled = false

    // 保存到本地存储
    const savedAddresses = JSON.parse(localStorage.getItem('addressSettings') || '{}')
    savedAddresses.proxySniff = addressSettings.proxySniff
    savedAddresses.proxySniffEnabled = addressSettings.proxySniffEnabled
    localStorage.setItem('addressSettings', JSON.stringify(savedAddresses))

    addressStatus.proxySniff = {
      type: 'success',
      message: '代理嗅探接口已重置为默认地址'
    }
    Message.success('代理嗅探接口重置成功')
  } catch (error) {
    console.error('重置代理嗅探接口失败:', error)
    addressStatus.proxySniff = {
      type: 'error',
      message: '重置失败：' + (error.message || '未知错误')
    }
    Message.error('重置失败：' + (error.message || '未知错误'))
  } finally {
    addressSaving.proxySniffReset = false
    // 8秒后清除状态消息
    setTimeout(() => {
      addressStatus.proxySniff = null
    }, 8000)
  }
}

// 保存嗅探超时设置
const saveSnifferTimeout = async () => {
  if (!addressSettings.snifferTimeout || addressSettings.snifferTimeout < 5 || addressSettings.snifferTimeout > 60) {
    Message.warning('请输入有效的超时时间（5-60秒）')
    return
  }

  addressSaving.snifferTimeout = true
  try {
    // 保存到本地存储
    const savedAddresses = JSON.parse(localStorage.getItem('addressSettings') || '{}')
    savedAddresses.snifferTimeout = addressSettings.snifferTimeout
    localStorage.setItem('addressSettings', JSON.stringify(savedAddresses))

    Message.success('嗅探超时设置保存成功')
    addressStatus.snifferTimeout = {
      type: 'success',
      message: '设置保存成功'
    }
  } catch (error) {
    console.error('保存嗅探超时设置失败:', error)
    addressStatus.snifferTimeout = {
      type: 'error',
      message: '保存失败：' + (error.message || '未知错误')
    }
    Message.error('保存失败：' + (error.message || '未知错误'))
  } finally {
    addressSaving.snifferTimeout = false
    // 3秒后清除状态消息
    setTimeout(() => {
      addressStatus.snifferTimeout = null
    }, 3000)
  }
}

// 处理代理播放开关变化
const handleProxyPlayEnabledChange = (enabled) => {
  // 保存开关状态到本地存储
  const savedAddresses = JSON.parse(localStorage.getItem('addressSettings') || '{}')
  savedAddresses.proxyPlayEnabled = enabled
  localStorage.setItem('addressSettings', JSON.stringify(savedAddresses))

  // 触发自定义事件，通知播放器组件代理播放开关状态已更改
  window.dispatchEvent(new CustomEvent('addressSettingsChanged', {
    detail: {
      type: 'proxyPlayEnabled',
      value: enabled,
      enabled: enabled
    }
  }))

  console.log('代理播放开关状态已更改:', enabled)
}

// 下载代理播放器
const downloadProxyPlayer = () => {
  const url = 'https://pan.quark.cn/s/7eb53b20db95'
  window.open(url, '_blank')
  Message.success('正在打开代理播放器下载页面')
}

// 下载代理嗅探器
const downloadProxySniffer = () => {
  const url = 'https://github.com/hjdhnx/pup-sniffer/releases'
  window.open(url, '_blank')
  Message.success('正在打开代理嗅探器下载页面')
}

// 注释：已删除 getConfigKey 函数，改为直接使用 ref 引用

// 获取当前播放器名称
const getCurrentPlayerName = () => {
  const currentPlayer = playerTypes.find(player => player.value === settings.playerType)
  return currentPlayer ? currentPlayer.label : 'IJK Player'
}

// 获取当前Referrer策略名称
const getCurrentReferrerPolicyName = () => {
  const policyNames = {
    'no-referrer': '无引用',
    'no-referrer-when-downgrade': '降级时无引用',
    'origin': '仅域名',
    'origin-when-cross-origin': '跨域时仅域名',
    'same-origin': '同源',
    'strict-origin': '严格域名',
    'strict-origin-when-cross-origin': '跨域时严格域名',
    'unsafe-url': '完整URL'
  }
  return policyNames[settings.referrerPolicy] || '无引用'
}

// 处理CSP绕过开关
const handleCSPBypassToggle = () => {
  const config = getCSPConfig()
  config.autoBypass = settings.cspBypass
  saveCSPConfig(config)

  if (settings.cspBypass) {
    setGlobalReferrerPolicy(settings.referrerPolicy)
    Message.success('已启用CSP绕过功能')
  } else {
    Message.info('已禁用CSP绕过功能')
  }
}

// 处理聚搜功能开关
const handleSearchAggregationToggle = () => {
  settings.searchAggregation = !settings.searchAggregation

  if (settings.searchAggregation) {
    Message.success('已开启聚搜功能')
  } else {
    Message.info('已关闭聚搜功能')
  }
}

// 处理Referrer策略选择
const handleReferrerPolicySelect = () => {
  // 使用导入的策略列表
  const policyOptions = REFERRER_POLICIES_LIST.map(policy => ({
    label: policy.label,
    value: policy.value
  }))

  // 显示选择对话框
  const currentIndex = policyOptions.findIndex(p => p.value === settings.referrerPolicy)

  // 使用简单的循环切换策略
  const nextIndex = (currentIndex + 1) % policyOptions.length
  const nextPolicy = policyOptions[nextIndex]

  settings.referrerPolicy = nextPolicy.value
  Message.success(`已切换Referrer策略为: ${nextPolicy.label}`)
}

// 处理播放器选择
const handlePlayerSelect = (playerType) => {
  settings.playerType = playerType
  Message.success(`已切换到 ${getCurrentPlayerName()}`)
}

// 执行出厂重置
const resetAllSettings = async () => {
  await factoryResetWithConfirmation()
}

// 处理设置项点击
const handleSettingClick = (settingKey) => {
  console.log('Setting clicked:', settingKey)

  switch (settingKey) {
    case 'player-type':
      playerSelectVisible.value = true
      break
    case 'window-preview':
      Message.info('窗口预览设置')
      break
    case 'ijk-decode':
      Message.info('IJK解码设置')
      break
    case 'ad-filter':
      Message.info('广告过滤设置')
      break
    case 'ijk-cache':
      Message.info('IJK缓存设置')
      break
    case 'auto-live':
      Message.info('启动时进直播设置')
      break
    case 'csp-bypass':
      handleCSPBypassToggle()
      break
    case 'referrer-policy':
      handleReferrerPolicySelect()
      break
    case 'search-aggregation':
      handleSearchAggregationToggle()
      break
    case 'backup':
      backupRestoreVisible.value = true
      break
    case 'reset':
      resetAllSettings()
      break
    case 'about':
      aboutModalVisible.value = true
      break
    default:
      Message.info(`点击了设置项：${settingKey}`)
      break
  }
}

// 页面加载时从配置服务恢复配置
const loadConfig = async () => {
  try {
    // 加载地址设置
    const savedAddresses = localStorage.getItem('addressSettings')
    if (savedAddresses) {
      try {
        const parsed = JSON.parse(savedAddresses)
        Object.assign(addressSettings, parsed)
        // 确保代理嗅探接口有默认值
        if (!addressSettings.proxySniff) {
          addressSettings.proxySniff = 'http://localhost:57573/sniffer'
        }
        // 确保嗅探超时有默认值
        if (!addressSettings.snifferTimeout) {
          addressSettings.snifferTimeout = 10
        }
        // 确保访问超时有默认值
        if (!addressSettings.apiTimeout) {
          addressSettings.apiTimeout = 30
        }
      } catch (error) {
        console.error('Failed to load address settings:', error)
      }
    }

    // 兼容旧的配置地址设置
    const savedUrl = configService.getConfigUrl()
    if (savedUrl && !addressSettings.vodConfig) {
      addressSettings.vodConfig = savedUrl
    }
  } catch (error) {
    console.error('Failed to load config url:', error)
  }

  // 加载其他设置项的状态
  const savedSettings = localStorage.getItem('appSettings')
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings)
      Object.assign(settings, parsed)
      // 确保播放器类型有默认值
      if (!settings.playerType) {
        settings.playerType = 'ijk'
      }
      settings.themeMode = normalizeThemeMode(settings.themeMode)
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  } else {
    settings.themeMode = normalizeThemeMode(settings.themeMode)
  }

  applyTheme(settings.themeMode)

  // 加载CSP设置
  try {
    const cspConfig = getCSPConfig()
    settings.cspBypass = cspConfig.autoBypass
    settings.referrerPolicy = cspConfig.referrerPolicy
  } catch (error) {
    console.error('Failed to load CSP config:', error)
  }
}

// 保存设置项状态
const saveSettings = () => {
  localStorage.setItem('appSettings', JSON.stringify(settings))

  // 保存CSP设置
  try {
    saveCSPConfig({
      autoBypass: settings.cspBypass,
      referrerPolicy: settings.referrerPolicy
    })

    // 应用全局referrer策略
    setGlobalReferrerPolicy(settings.referrerPolicy)
  } catch (error) {
    console.error('Failed to save CSP config:', error)
  }
}

// 监听主题变化并立即应用
watch(() => settings.themeMode, (mode) => {
  const normalizedMode = normalizeThemeMode(mode)
  if (normalizedMode !== mode) {
    settings.themeMode = normalizedMode
    return
  }
  applyTheme(normalizedMode)
})

// 监听设置项变化并自动保存
watch(settings, saveSettings, {deep: true})

// 保存开发者调试设置
const saveDebugSettings = () => {
  try {
    localStorage.setItem('debugSettings', JSON.stringify(debugSettings))
    
    // 触发自定义事件，通知其他组件调试设置已更新
    window.dispatchEvent(new CustomEvent('debugSettingsChanged', {
      detail: { ...debugSettings }
    }))
    
    Message.success('调试设置已保存')
  } catch (error) {
    console.error('Failed to save debug settings:', error)
    Message.error('保存调试设置失败')
  }
}

// 加载开发者调试设置
const loadDebugSettings = () => {
  try {
    const saved = localStorage.getItem('debugSettings')
    if (saved) {
      const parsedSettings = JSON.parse(saved)
      Object.assign(debugSettings, parsedSettings)
    }
  } catch (error) {
    console.error('Failed to load debug settings:', error)
  }
}

// 重置悬浮组件状态
const resetFloatingState = async () => {
  debugSettings.resetting = true
  try {
    // 清除悬浮组件相关的localStorage数据
    localStorage.removeItem('floating-iframe-button-position')
    localStorage.removeItem('floating-iframe-window-position')
    localStorage.removeItem('floating-iframe-window-size')
    
    // 模拟异步操作
    await new Promise(resolve => setTimeout(resolve, 500))
    
    Message.success('悬浮组件状态已重置，刷新页面后生效')
  } catch (error) {
    console.error('Failed to reset floating state:', error)
    Message.error('重置悬浮组件状态失败')
  } finally {
    debugSettings.resetting = false
  }
}



// 监听开发者调试设置变化并自动保存
watch(debugSettings, saveDebugSettings, {deep: true})

// 初始化
onMounted(async () => {
  await loadConfig()
  loadDebugSettings()
})
</script>

<style scoped>
.settings-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.simple-header {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 16px 20px;
  background: var(--color-bg-3);
  border-bottom: 1px solid var(--color-border-2);
  box-sizing: border-box;
  flex-shrink: 0;
}

.settings-page-heading {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.navigation-title {
  font-size: 22px;
  line-height: 1.2;
  font-weight: 800;
  color: var(--dp-text-primary);
  white-space: nowrap;
}

.navigation-subtitle {
  font-size: 13px;
  line-height: 1.35;
  color: var(--dp-text-tertiary);
}

.settings-content {
  flex: 1;
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 20px 24px 40px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
  box-sizing: border-box;
  max-height: calc(100vh - 120px);
}

.settings-card {
  width: 100%;
  height: auto;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  overflow: visible;
  box-sizing: border-box;
}

.settings-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.settings-card :deep(.arco-card-header) {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 20px 24px;
}

.settings-card :deep(.arco-card-header-title) {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-icon {
  font-size: 20px;
  color: #6366f1;
}

.settings-card :deep(.arco-card) {
  height: auto;
}

.settings-card :deep(.arco-card-body) {
  padding: 24px;
  height: auto;
}

/* 配置地址卡片特殊样式 */
.config-card {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: auto;
  min-height: auto;
}

.config-input-group {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

.config-input {
  flex: 1;
  min-width: 0; /* 允许flex项目缩小到内容以下 */
  max-width: calc(100% - 180px); /* 为按钮组留出空间 */
  overflow: hidden;
}

.config-input :deep(.arco-input) {
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
  font-size: 14px;
}

.config-input :deep(.arco-input:focus) {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.config-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  max-width: 170px;
  overflow: hidden;
}

.config-actions .arco-btn {
  border-radius: 12px;
  font-weight: 600;
  min-width: 80px;
  transition: all 0.3s ease;
}

.config-actions .arco-btn-primary {
  background: var(--dp-primary-readable);
  border: none;
  color: #fff;
}

.config-actions .arco-btn-primary:hover {
  background: var(--color-primary-5);
  transform: translateY(-1px);
}

.config-actions .arco-btn-outline {
  border: 2px solid #e2e8f0;
  color: #64748b;
}

.config-actions .arco-btn-outline:hover {
  border-color: #6366f1;
  color: #6366f1;
  background: rgba(99, 102, 241, 0.05);
}

.config-status {
  margin-top: 12px;
}

.config-message {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid;
  background-color: rgba(255, 255, 255, 0.9);
}

.config-message-success {
  color: #00b42a;
  background-color: rgba(0, 180, 42, 0.1);
  border-color: rgba(0, 180, 42, 0.3);
}

.config-message-error {
  color: #f53f3f;
  background-color: rgba(245, 63, 63, 0.1);
  border-color: rgba(245, 63, 63, 0.3);
}

.config-message-warning {
  color: #ff7d00;
  background-color: rgba(255, 125, 0, 0.1);
  border-color: rgba(255, 125, 0, 0.3);
}

.config-icon {
  margin-right: 8px;
  font-size: 16px;
  flex-shrink: 0;
}

.config-text {
  flex: 1;
  line-height: 1.5;
}

/* 设置项网格 */
.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: auto;
  min-height: auto;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  min-width: 0; /* 允许flex项目缩小 */
  box-sizing: border-box;
}

.setting-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  transform: scaleY(0);
  transition: transform 0.3s ease;
}

.setting-item:hover {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(99, 102, 241, 0.2);
  transform: translateX(4px);
}

.setting-item:hover::before {
  transform: scaleY(1);
}

.setting-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0; /* 允许flex项目缩小 */
  max-width: calc(100% - 120px); /* 为右侧控件留出空间 */
  overflow: hidden;
}

.setting-icon {
  font-size: 20px;
  color: #6366f1;
  background: rgba(99, 102, 241, 0.1);
  padding: 8px;
  border-radius: 8px;
  flex-shrink: 0;
}

.setting-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0; /* 允许文本区域缩小 */
}

.setting-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.2;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.setting-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.3;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.setting-value {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  max-width: 110px;
  overflow: hidden;
}

.value-text {
  font-size: 14px;
  color: #475569;
  font-weight: 500;
  background: rgba(99, 102, 241, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
}

.arrow-icon {
  font-size: 16px;
  color: #94a3b8;
  transition: all 0.3s ease;
}

.setting-item:hover .arrow-icon {
  color: #6366f1;
  transform: translateX(2px);
}

/* 开关样式 */
.setting-value :deep(.arco-switch) {
  background: #e2e8f0;
}

.setting-value :deep(.arco-switch.arco-switch-checked) {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
}

/* 地址设置样式 */
.address-settings-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.address-config-item {
  padding: 16px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.address-config-item:hover {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(99, 102, 241, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.address-config-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.address-config-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 200px;
  flex-shrink: 0;
}

.address-config-icon {
  font-size: 18px;
  color: #6366f1;
  background: rgba(99, 102, 241, 0.1);
  padding: 8px;
  border-radius: 8px;
  flex-shrink: 0;
}

.address-config-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.address-config-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.2;
}

.address-config-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.3;
}

.address-config-input-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.address-config-switch {
  flex-shrink: 0;
}

.address-config-input {
  flex: 1;
  min-width: 200px;
}

.address-config-input :deep(.arco-input) {
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
}

.address-config-input :deep(.arco-input:focus) {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.address-config-input :deep(.arco-input:disabled) {
  background: #f8fafc;
  color: #94a3b8;
}

.address-config-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.address-config-actions :deep(.arco-btn) {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.address-config-actions :deep(.arco-btn-primary) {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
}

.address-config-actions :deep(.arco-btn-primary:hover) {
  background: linear-gradient(135deg, #5855eb 0%, #7c3aed 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.address-config-actions :deep(.arco-btn-outline) {
  border-color: #e2e8f0;
  color: #6366f1;
}

.address-config-actions :deep(.arco-btn-outline:hover) {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.05);
}

.address-config-status {
  margin-top: 8px;
}

.address-config-switch :deep(.arco-switch) {
  background: #e2e8f0;
}

.address-config-switch :deep(.arco-switch.arco-switch-checked) {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings-content {
    padding: 16px 16px 24px;
    gap: 16px;
  }

  .config-input-group {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .config-input {
    width: 100%;
    max-width: 100%;
  }

  .config-actions {
    width: 100%;
    max-width: 100%;
    justify-content: stretch;
    flex-direction: row;
  }

  .config-actions .arco-btn {
    flex: 1;
    min-width: 0;
  }

  .setting-item {
    padding: 14px 16px;
  }

  .setting-info {
    gap: 12px;
    max-width: calc(100% - 80px);
  }

  .setting-icon {
    font-size: 18px;
    padding: 6px;
  }

  .setting-title {
    font-size: 15px;
  }

  .setting-desc {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .config-actions {
    flex-direction: column;
    gap: 8px;
  }

  .config-actions .arco-btn {
    width: 100%;
    flex: none;
  }

  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .setting-value {
    width: 100%;
    max-width: 100%;
    justify-content: space-between;
  }
}

.settings-container {
  width: 100%;
  max-width: var(--dp-page-narrow-width);
  height: 100%;
  min-height: 0;
  margin: 0 auto;
  background: transparent;
}

.simple-header {
  padding: 20px 22px;
  margin-bottom: 16px;
  background: var(--dp-bg-surface);
  border: 1px solid var(--dp-border-subtle);
  border-radius: var(--dp-radius-xl);
  box-shadow: var(--dp-shadow-sm);
}

.navigation-title {
  color: var(--dp-text-primary);
}

.settings-content {
  min-height: 0;
  max-height: none;
  padding: 0 0 28px;
  gap: 16px;
}

.settings-card {
  border-radius: var(--dp-radius-lg);
  border: 1px solid var(--dp-border-subtle);
  background: var(--dp-bg-surface);
  box-shadow: var(--dp-shadow-sm);
  backdrop-filter: none;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.settings-card:hover {
  transform: none;
  border-color: var(--dp-border);
  box-shadow: var(--dp-shadow-md);
}

.settings-card :deep(.arco-card-header) {
  padding: 12px 16px;
  background: var(--dp-bg-surface);
  border-bottom: 1px solid var(--dp-border-subtle);
}

.settings-card :deep(.arco-card-header-title) {
  font-size: 15px;
  color: var(--dp-text-primary);
  gap: 8px;
}

.settings-card :deep(.arco-card-body) {
  padding: 14px 16px 16px;
}

.config-card {
  background: var(--dp-bg-surface);
}

.card-icon,
.setting-icon,
.address-config-icon {
  color: var(--color-primary-6);
}

.settings-grid,
.address-settings-section {
  gap: 10px;
}

.setting-item,
.address-config-item {
  padding: 12px 14px;
  background: var(--dp-bg-surface-muted);
  border: 1px solid var(--dp-border-subtle);
  border-radius: var(--dp-radius-md);
  transition: background 0.2s ease, border-color 0.2s ease;
}

.setting-item:hover,
.address-config-item:hover {
  background: var(--dp-bg-hover);
  border-color: var(--dp-border);
  transform: none;
  box-shadow: none;
}

.setting-item::before {
  background: var(--color-primary-6);
}

.setting-info {
  max-width: none;
  gap: 12px;
}

.setting-icon,
.address-config-icon {
  width: 16px !important;
  height: 16px !important;
  flex: 0 0 auto;
  padding: 7px;
  color: var(--dp-primary-readable) !important;
  background: var(--color-primary-light-1);
  border-radius: var(--dp-radius-md);
  box-sizing: content-box;
}

.setting-title,
.address-config-title {
  font-size: 14px;
  color: var(--dp-text-primary);
}

.setting-desc,
.address-config-desc {
  font-size: 12px;
  color: var(--dp-text-secondary);
}

.setting-value {
  max-width: 42%;
  gap: 8px;
}

.theme-setting-value {
  max-width: none;
  overflow: visible;
}

.theme-mode-group {
  max-width: 100%;
  border-color: var(--dp-border) !important;
  background: var(--dp-bg-surface) !important;
}

.theme-mode-group :deep(.arco-radio-button-content) {
  padding: 0 12px;
  color: var(--dp-text-secondary);
  font-weight: 600;
}

.theme-mode-group :deep(.arco-radio-checked .arco-radio-button-content) {
  color: #fff;
  background: var(--dp-primary-readable);
}

.theme-mode-group :deep(.arco-radio-group-button) {
  border-color: var(--dp-border);
  background: var(--dp-bg-surface);
}

.value-text {
  max-width: 100%;
  padding: 3px 8px;
  border-radius: 999px;
  color: var(--color-primary-6);
  background: var(--color-primary-light-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.arrow-icon {
  color: var(--dp-text-tertiary);
}

.address-config-row {
  align-items: flex-start;
  gap: 14px;
}

.address-config-info {
  min-width: 180px;
  width: 22%;
  min-width: min(180px, 32%);
}

.address-config-text {
  min-width: 0;
}

.address-config-input-group {
  min-width: 0;
  gap: 8px;
}

.address-config-input {
  min-width: 0;
}

.address-config-input :deep(.arco-input),
.config-input :deep(.arco-input) {
  border-color: var(--dp-border);
  background: var(--dp-bg-surface);
  color: var(--dp-text-primary);
}

.address-config-input :deep(.arco-input:disabled),
.config-input :deep(.arco-input:disabled) {
  color: var(--dp-text-tertiary);
  background: var(--dp-bg-surface-muted);
}

.address-config-input :deep(.arco-input::placeholder),
.config-input :deep(.arco-input::placeholder) {
  color: var(--dp-text-tertiary);
}

.config-actions .arco-btn-outline,
.address-config-actions :deep(.arco-btn-outline) {
  border-color: var(--dp-border);
  color: var(--dp-primary-readable);
}

.config-actions .arco-btn-outline:hover,
.address-config-actions :deep(.arco-btn-outline:hover) {
  border-color: var(--dp-primary-readable);
  color: var(--dp-primary-readable);
  background: color-mix(in srgb, var(--dp-primary-readable) 8%, transparent);
}

.setting-value :deep(.arco-switch),
.address-config-switch :deep(.arco-switch) {
  background: var(--dp-border);
}

.address-config-actions {
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.address-config-actions :deep(.arco-btn-primary),
.config-actions .arco-btn-primary,
.setting-value :deep(.arco-switch.arco-switch-checked),
.address-config-switch :deep(.arco-switch.arco-switch-checked) {
  background: var(--dp-primary-readable);
  color: #fff;
}

.address-config-actions :deep(.arco-btn-primary:hover),
.config-actions .arco-btn-primary:hover {
  background: var(--color-primary-5);
  transform: none;
  box-shadow: none;
}

.address-config-actions :deep(.arco-btn-disabled),
.address-config-actions :deep(.arco-btn-disabled *),
.config-actions .arco-btn-disabled,
.config-actions .arco-btn-disabled * {
  color: #6b7788 !important;
  background: var(--dp-bg-surface-muted) !important;
  border-color: var(--dp-border) !important;
  opacity: 1 !important;
}

.config-message {
  padding: 8px 10px;
  font-size: 12px;
  background: var(--dp-bg-surface);
}

@media (max-width: 900px) {
  .address-config-row {
    flex-direction: column;
  }

  .address-config-info {
    width: 100%;
    min-width: 0;
  }

  .address-config-input-group {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .simple-header {
    padding: 10px 12px;
    margin-bottom: 0;
    border: none;
    border-radius: 0;
    box-shadow: none;
  }

  .settings-content {
    padding: 12px;
    gap: 12px;
  }

  .settings-card :deep(.arco-card-header) {
    padding: 10px 12px;
  }

  .settings-card :deep(.arco-card-body) {
    padding: 12px;
  }

  .setting-info {
    max-width: none;
  }

  .address-config-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 560px) {
  .address-config-input-group {
    flex-direction: column;
    align-items: stretch;
  }

  .address-config-switch {
    align-self: flex-start;
  }

  .address-config-actions,
  .address-config-actions :deep(.arco-btn),
  .address-config-actions :deep(.arco-upload),
  .address-config-actions :deep(.arco-upload-trigger) {
    width: 100%;
  }

  .address-config-actions :deep(.arco-btn) {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .setting-item {
    padding: 12px;
  }

  .setting-value {
    max-width: 100%;
  }

  .theme-setting-item {
    align-items: flex-start;
  }

  .theme-setting-value {
    width: 100%;
    max-width: 100%;
  }

  .theme-mode-group {
    width: 100%;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .theme-mode-group::-webkit-scrollbar {
    display: none;
  }

  .value-text {
    max-width: calc(100% - 24px);
  }
}


</style>
