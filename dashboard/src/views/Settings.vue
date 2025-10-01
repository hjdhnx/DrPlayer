<template>
  <div class="settings-container">
    <!-- 简化的标题显示 -->
    <div class="simple-header">
      <span class="navigation-title">Settings</span>
    </div>

    <!-- 设置内容 -->
    <div class="settings-content">
      <!-- 地址设置卡片 -->
      <a-card class="settings-card config-card" title="地址设置" :bordered="false">
        <template #extra>
          <icon-link class="card-icon" />
        </template>
        
        <div class="address-settings-section">
          <!-- 点播配置 -->
          <div class="address-config-item">
            <div class="address-config-row">
              <div class="address-config-info">
                <icon-play-circle class="address-config-icon" />
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
                    <icon-link />
                  </template>
                </a-input>
                <div class="address-config-actions">
                  <AddressHistory 
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
                      <icon-check-circle />
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
                      <icon-save />
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
                <icon-check-circle v-if="addressStatus.vodConfig.type === 'success'" class="config-icon" />
                <icon-exclamation-circle v-else-if="addressStatus.vodConfig.type === 'error'" class="config-icon" />
                <icon-info-circle v-else class="config-icon" />
                <span class="config-text">{{ addressStatus.vodConfig.message }}</span>
              </div>
            </div>
          </div>

          <!-- 直播配置 -->
          <div class="address-config-item">
            <div class="address-config-row">
              <div class="address-config-info">
                <icon-live-broadcast class="address-config-icon" />
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
                    <icon-link />
                  </template>
                </a-input>
                <div class="address-config-actions">
                  <AddressHistory 
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
                      <icon-refresh />
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
                      <icon-save />
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
                <icon-check-circle v-if="addressStatus.liveConfig.type === 'success'" class="config-icon" />
                <icon-exclamation-circle v-else-if="addressStatus.liveConfig.type === 'error'" class="config-icon" />
                <icon-info-circle v-else class="config-icon" />
                <span class="config-text">{{ addressStatus.liveConfig.message }}</span>
              </div>
            </div>
          </div>

          <!-- 代理访问接口 -->
          <div class="address-config-item">
            <div class="address-config-row">
              <div class="address-config-info">
                <icon-swap class="address-config-icon" />
                <div class="address-config-text">
                  <div class="address-config-title">代理访问接口</div>
                  <div class="address-config-desc">配置代理访问服务接口地址</div>
                </div>
              </div>
              <div class="address-config-input-group">
                <a-switch v-model="addressSettings.proxyAccessEnabled" class="address-config-switch" />
                <a-input 
                  v-model="addressSettings.proxyAccess" 
                  placeholder="请输入代理访问接口地址"
                  size="medium"
                  class="address-config-input"
                  :disabled="!addressSettings.proxyAccessEnabled"
                >
                  <template #prefix>
                    <icon-link />
                  </template>
                </a-input>
                <div class="address-config-actions">
                  <AddressHistory 
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
                      <icon-save />
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
                <icon-check-circle v-if="addressStatus.proxyAccess.type === 'success'" class="config-icon" />
                <icon-exclamation-circle v-else-if="addressStatus.proxyAccess.type === 'error'" class="config-icon" />
                <icon-info-circle v-else class="config-icon" />
                <span class="config-text">{{ addressStatus.proxyAccess.message }}</span>
              </div>
            </div>
          </div>

          <!-- 代理播放接口 -->
          <div class="address-config-item">
            <div class="address-config-row">
              <div class="address-config-info">
                <icon-play-arrow class="address-config-icon" />
                <div class="address-config-text">
                  <div class="address-config-title">代理播放接口</div>
                  <div class="address-config-desc">配置代理播放服务接口地址</div>
                </div>
              </div>
              <div class="address-config-input-group">
                <a-switch v-model="addressSettings.proxyPlayEnabled" class="address-config-switch" />
                <a-input 
                  v-model="addressSettings.proxyPlay" 
                  placeholder="请输入代理播放接口地址"
                  size="medium"
                  class="address-config-input"
                  :disabled="!addressSettings.proxyPlayEnabled"
                >
                  <template #prefix>
                    <icon-link />
                  </template>
                </a-input>
                <div class="address-config-actions">
                  <AddressHistory 
                    config-key="proxy-play"
                    :current-value="addressSettings.proxyPlay"
                    @select="(value) => addressSettings.proxyPlay = value"
                  />
                  <a-button 
                    type="primary" 
                    @click="saveAddress('proxyPlay')"
                    :loading="addressSaving.proxyPlay"
                    :disabled="!addressSettings.proxyPlayEnabled"
                    size="medium"
                  >
                    <template #icon>
                      <icon-save />
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
                <icon-check-circle v-if="addressStatus.proxyPlay.type === 'success'" class="config-icon" />
                <icon-exclamation-circle v-else-if="addressStatus.proxyPlay.type === 'error'" class="config-icon" />
                <icon-info-circle v-else class="config-icon" />
                <span class="config-text">{{ addressStatus.proxyPlay.message }}</span>
              </div>
            </div>
          </div>

          <!-- 代理嗅探接口 -->
          <div class="address-config-item">
            <div class="address-config-row">
              <div class="address-config-info">
                <icon-search class="address-config-icon" />
                <div class="address-config-text">
                  <div class="address-config-title">代理嗅探接口</div>
                  <div class="address-config-desc">配置代理嗅探服务接口地址</div>
                </div>
              </div>
              <div class="address-config-input-group">
                <a-switch v-model="addressSettings.proxySniffEnabled" class="address-config-switch" />
                <a-input 
                  v-model="addressSettings.proxySniff" 
                  placeholder="请输入代理嗅探接口地址"
                  size="medium"
                  class="address-config-input"
                  :disabled="!addressSettings.proxySniffEnabled"
                >
                  <template #prefix>
                    <icon-link />
                  </template>
                </a-input>
                <div class="address-config-actions">
                  <AddressHistory 
                    config-key="proxy-sniff"
                    :current-value="addressSettings.proxySniff"
                    @select="(value) => addressSettings.proxySniff = value"
                  />
                  <a-button 
                    type="primary" 
                    @click="saveAddress('proxySniff')"
                    :loading="addressSaving.proxySniff"
                    :disabled="!addressSettings.proxySniffEnabled"
                    size="medium"
                  >
                    <template #icon>
                      <icon-save />
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
                <icon-check-circle v-if="addressStatus.proxySniff.type === 'success'" class="config-icon" />
                <icon-exclamation-circle v-else-if="addressStatus.proxySniff.type === 'error'" class="config-icon" />
                <icon-info-circle v-else class="config-icon" />
                <span class="config-text">{{ addressStatus.proxySniff.message }}</span>
              </div>
            </div>
          </div>
        </div>
      </a-card>

      <!-- 首页设置卡片 -->
      <a-card class="settings-card" title="首页设置" :bordered="false">
        <template #extra>
          <icon-home class="card-icon" />
        </template>
        
        <div class="settings-grid">
          <div class="setting-item" @click="handleSettingClick('datasource')">
            <div class="setting-info">
              <icon-storage class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">数据源</div>
                <div class="setting-desc">管理视频数据来源</div>
              </div>
            </div>
            <div class="setting-value">
              <span class="value-text">配置中</span>
              <icon-right class="arrow-icon" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('datasource-display')">
            <div class="setting-info">
              <icon-eye class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">数据源显示</div>
                <div class="setting-desc">控制数据源的显示状态</div>
              </div>
            </div>
            <div class="setting-value">
              <a-switch v-model="settings.datasourceDisplay" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('recommendation')">
            <div class="setting-info">
              <icon-star class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">推荐</div>
                <div class="setting-desc">推荐内容设置</div>
              </div>
            </div>
            <div class="setting-value">
              <span class="value-text">站点推荐</span>
              <icon-right class="arrow-icon" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('history-count')">
            <div class="setting-info">
              <icon-history class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">历史条数</div>
                <div class="setting-desc">设置历史记录保存数量</div>
              </div>
            </div>
            <div class="setting-value">
              <span class="value-text">100条</span>
              <icon-right class="arrow-icon" />
            </div>
          </div>
        </div>
      </a-card>

      <!-- 播放器设置卡片 -->
      <a-card class="settings-card" title="播放器设置" :bordered="false">
        <template #extra>
          <icon-play-circle class="card-icon" />
        </template>
        
        <div class="settings-grid">
          <div class="setting-item" @click="handleSettingClick('window-preview')">
            <div class="setting-info">
              <icon-computer class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">窗口预览</div>
                <div class="setting-desc">启用播放器窗口预览</div>
              </div>
            </div>
            <div class="setting-value">
              <a-switch v-model="settings.windowPreview" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('player-type')">
            <div class="setting-info">
              <icon-play-arrow class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">播放器</div>
                <div class="setting-desc">选择播放器类型</div>
              </div>
            </div>
            <div class="setting-value">
              <span class="value-text">{{ getCurrentPlayerName() }}</span>
              <icon-right class="arrow-icon" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('ijk-decode')">
            <div class="setting-info">
              <icon-code class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">IJK解码</div>
                <div class="setting-desc">设置解码方式</div>
              </div>
            </div>
            <div class="setting-value">
              <span class="value-text">硬解码</span>
              <icon-right class="arrow-icon" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('ad-filter')">
            <div class="setting-info">
              <icon-safe class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">广告过滤</div>
                <div class="setting-desc">自动过滤广告内容</div>
              </div>
            </div>
            <div class="setting-value">
              <a-switch v-model="settings.adFilter" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('ijk-cache')">
            <div class="setting-info">
              <icon-storage class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">IJK缓存</div>
                <div class="setting-desc">启用播放器缓存</div>
              </div>
            </div>
            <div class="setting-value">
              <a-switch v-model="settings.ijkCache" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('auto-live')">
            <div class="setting-info">
              <icon-live-broadcast class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">启动时进直播</div>
                <div class="setting-desc">应用启动时自动进入直播</div>
              </div>
            </div>
            <div class="setting-value">
              <a-switch v-model="settings.autoLive" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('csp-bypass')">
            <div class="setting-info">
              <icon-safe class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">CSP绕过</div>
                <div class="setting-desc">自动绕过防盗链检测</div>
              </div>
            </div>
            <div class="setting-value">
              <a-switch v-model="settings.cspBypass" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('referrer-policy')">
            <div class="setting-info">
              <icon-link class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">Referrer策略</div>
                <div class="setting-desc">设置HTTP Referrer策略</div>
              </div>
            </div>
            <div class="setting-value">
              <span class="value-text">{{ getCurrentReferrerPolicyName() }}</span>
              <icon-right class="arrow-icon" />
            </div>
          </div>
        </div>
      </a-card>

      <!-- 系统设置卡片 -->
      <a-card class="settings-card" title="系统设置" :bordered="false">
        <template #extra>
          <icon-desktop class="card-icon" />
        </template>
        
        <div class="settings-grid">
          <div class="setting-item" @click="handleSettingClick('language')">
            <div class="setting-info">
              <icon-language class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">语言</div>
                <div class="setting-desc">选择界面语言</div>
              </div>
            </div>
            <div class="setting-value">
              <span class="value-text">中文</span>
              <icon-right class="arrow-icon" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('theme')">
            <div class="setting-info">
              <icon-palette class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">主题</div>
                <div class="setting-desc">选择应用主题</div>
              </div>
            </div>
            <div class="setting-value">
              <span class="value-text">奈飞</span>
              <icon-right class="arrow-icon" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('wallpaper')">
            <div class="setting-info">
              <icon-image class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">换张壁纸</div>
                <div class="setting-desc">更换应用背景壁纸</div>
              </div>
            </div>
            <div class="setting-value">
              <icon-right class="arrow-icon" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('reset-wallpaper')">
            <div class="setting-info">
              <icon-refresh class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">重置壁纸</div>
                <div class="setting-desc">恢复默认背景壁纸</div>
              </div>
            </div>
            <div class="setting-value">
              <icon-right class="arrow-icon" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('render-mode')">
            <div class="setting-info">
              <icon-desktop class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">渲染方式</div>
                <div class="setting-desc">选择渲染模式</div>
              </div>
            </div>
            <div class="setting-value">
              <span class="value-text">TextureView</span>
              <icon-right class="arrow-icon" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('search-display')">
            <div class="setting-info">
              <icon-search class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">搜索展示</div>
                <div class="setting-desc">搜索结果展示方式</div>
              </div>
            </div>
            <div class="setting-value">
              <span class="value-text">缩略图</span>
              <icon-right class="arrow-icon" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('webview')">
            <div class="setting-info">
              <icon-code class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">嗅探Webview</div>
                <div class="setting-desc">选择Webview类型</div>
              </div>
            </div>
            <div class="setting-value">
              <span class="value-text">系统自带</span>
              <icon-right class="arrow-icon" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('secure-dns')">
            <div class="setting-info">
              <icon-safe class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">安全DNS</div>
                <div class="setting-desc">启用安全DNS解析</div>
              </div>
            </div>
            <div class="setting-value">
              <a-switch v-model="settings.secureDns" />
            </div>
          </div>
        </div>
      </a-card>

      <!-- 数据管理卡片 -->
      <a-card class="settings-card" title="数据管理" :bordered="false">
        <template #extra>
          <icon-folder class="card-icon" />
        </template>
        
        <div class="settings-grid">
          <div class="setting-item" @click="handleSettingClick('backup')">
            <div class="setting-info">
              <icon-download class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">数据备份还原</div>
                <div class="setting-desc">备份或还原应用数据</div>
              </div>
            </div>
            <div class="setting-value">
              <icon-right class="arrow-icon" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('reset')">
            <div class="setting-info">
              <icon-delete class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">重置</div>
                <div class="setting-desc">重置所有设置到默认状态</div>
              </div>
            </div>
            <div class="setting-value">
              <icon-right class="arrow-icon" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('search-aggregation')">
            <div class="setting-info">
              <icon-find-replace class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">聚搜</div>
                <div class="setting-desc">聚合搜索功能</div>
              </div>
            </div>
            <div class="setting-value">
              <span class="value-text">已关闭</span>
              <icon-right class="arrow-icon" />
            </div>
          </div>

          <div class="setting-item" @click="handleSettingClick('about')">
            <div class="setting-info">
              <icon-info-circle class="setting-icon" />
              <div class="setting-text">
                <div class="setting-title">关于</div>
                <div class="setting-desc">查看应用信息和版本</div>
              </div>
            </div>
            <div class="setting-value">
              <icon-right class="arrow-icon" />
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
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
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
  IconComputer,
  IconCode
} from '@arco-design/web-vue/es/icon'
import AddressHistory from '@/components/AddressHistory.vue'
import PlayerSelector from '@/components/PlayerSelector.vue'
import { 
  getCSPConfig, 
  saveCSPConfig, 
  REFERRER_POLICIES_LIST, 
  getCurrentReferrerPolicy,
  setGlobalReferrerPolicy 
} from '@/utils/csp'

// 地址设置相关
const addressSettings = reactive({
  vodConfig: '',
  liveConfig: '',
  proxyAccess: '',
  proxyAccessEnabled: false,
  proxyPlay: '',
  proxyPlayEnabled: false,
  proxySniff: '',
  proxySniffEnabled: false
})

const addressSaving = reactive({
  vodConfig: false,
  liveConfig: false,
  liveConfigReset: false,
  proxyAccess: false,
  proxyPlay: false,
  proxySniff: false
})

const addressTesting = reactive({
  vodConfig: false
})

const addressStatus = reactive({
  vodConfig: null,
  liveConfig: null,
  proxyAccess: null,
  proxyPlay: null,
  proxySniff: null
})

// 播放器类型选项
const playerTypes = [
  { value: 'art', label: 'Art Player', description: '现代化的HTML5播放器' },
  { value: 'ijk', label: 'IJK Player', description: '基于FFmpeg的播放器' },
  { value: 'exo', label: 'Exo Player', description: 'Google开发的Android播放器' },
  { value: 'mpv', label: 'MPV Player', description: '轻量级的媒体播放器' },
  { value: 'vlc', label: 'VLC Player', description: '功能强大的多媒体播放器' }
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
  referrerPolicy: 'no-referrer' // 默认referrer策略
})

// 播放器选择对话框状态
const playerSelectVisible = ref(false)

// 保存地址配置
const saveAddress = async (configType) => {
  const addressValue = addressSettings[configType]
  
  if (!addressValue || !addressValue.trim()) {
    Message.warning('请输入地址')
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
    
    // 如果是点播配置，尝试使用配置服务设置地址并自动设置直播配置地址
    if (configType === 'vodConfig') {
      try {
        const configService = (await import('@/api/services/config')).default
        await configService.setConfigUrl(addressValue)
        
        // 检查是否自动设置了直播配置地址
        const liveConfigUrl = configService.getLiveConfigUrl()
        if (liveConfigUrl && liveConfigUrl !== addressSettings.liveConfig) {
          // 更新界面显示的直播配置地址
          addressSettings.liveConfig = liveConfigUrl
          
          // 同步保存到本地存储
          savedAddresses.liveConfig = liveConfigUrl
          localStorage.setItem('addressSettings', JSON.stringify(savedAddresses))
          
          Message.success('点播配置保存成功，已自动设置直播配置地址')
        } else {
          Message.success('点播配置保存成功')
        }
      } catch (error) {
        console.error('设置配置服务失败:', error)
        Message.success('地址保存成功，但配置服务设置失败')
      }
    } else if (configType === 'liveConfig') {
      // 如果是直播配置，使用配置服务设置直播配置地址
      try {
        const configService = (await import('@/api/services/config')).default
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
    const historyComponent = document.querySelector(`[config-key="${getConfigKey(configType)}"]`)
    if (historyComponent && historyComponent.__vueParentComponent) {
      historyComponent.__vueParentComponent.exposed.addHistory(addressValue)
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
    const configService = (await import('@/api/services/config')).default
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
    const configService = (await import('@/api/services/config')).default
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

// 获取配置键名
const getConfigKey = (configType) => {
  const keyMap = {
    vodConfig: 'vod-config',
    liveConfig: 'live-config',
    proxyAccess: 'proxy-access',
    proxyPlay: 'proxy-play',
    proxySniff: 'proxy-sniff'
  }
  return keyMap[configType] || configType
}

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
      } catch (error) {
        console.error('Failed to load address settings:', error)
      }
    }
    
    // 兼容旧的配置地址设置
    const configService = (await import('@/api/services/config')).default
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
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }
  
  // 加载CSP设置
  try {
    const cspConfig = getCSPConfig()
    settings.cspBypass = cspConfig.enabled
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
      enabled: settings.cspBypass,
      referrerPolicy: settings.referrerPolicy
    })
    
    // 应用全局referrer策略
    setGlobalReferrerPolicy(settings.referrerPolicy)
  } catch (error) {
    console.error('Failed to save CSP config:', error)
  }
}

// 监听设置项变化并自动保存
watch(settings, saveSettings, { deep: true })

// 初始化
loadConfig()
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

.navigation-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-1);
  white-space: nowrap;
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
  font-weight: 500;
  min-width: 80px;
  transition: all 0.3s ease;
}

.config-actions .arco-btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
}

.config-actions .arco-btn-primary:hover {
  background: linear-gradient(135deg, #5b5bd6 0%, #7c3aed 100%);
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
</style>
