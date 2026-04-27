// Action组件统一导出文件

// 导入所有组件
import ActionRenderer from './ActionRenderer.vue'
import InputAction from './InputAction.vue'
import MultiInputAction from './MultiInputAction.vue'
import MenuAction from './MenuAction.vue'

import MsgBoxAction from './MsgBoxAction.vue'
import WebViewAction from './WebViewAction.vue'
import BrowserAction from './BrowserAction.vue'
import HelpAction from './HelpAction.vue'

// 导入类型定义和工具函数
import * as types from './types.js'

// 导入状态管理器
import { 
  ActionStateManager, 
  actionStateManager,
  showAction,
  submitAction,
  cancelAction,
  actionError,
  currentAction,
  actionHistory,
  actionQueue,
  statistics,
  globalConfig
} from './ActionStateManager.js'

// 导入样式
import './styles.css'

// 组件列表
const components = {
  ActionRenderer,
  InputAction,
  MultiInputAction,
  MenuAction,
  MsgBoxAction,
  WebViewAction,
  BrowserAction,
  HelpAction
}

// Vue插件安装函数
const install = (app, options = {}) => {
  // 注册所有组件
  Object.keys(components).forEach(name => {
    app.component(name, components[name])
  })
  
  // 配置全局状态管理器
  if (options.config) {
    actionStateManager.updateConfig(options.config)
  }
  
  // 注册全局属性
  app.config.globalProperties.$actionManager = actionStateManager
  app.config.globalProperties.$showAction = showAction
  
  // 提供依赖注入
  app.provide('actionManager', actionStateManager)
  app.provide('showAction', showAction)
}

// 默认导出（Vue插件）
export default {
  install,
  ...components
}

// 单独导出组件
export {
  ActionRenderer,
  InputAction,
  MultiInputAction,
  MenuAction,
  MsgBoxAction,
  WebViewAction,
  BrowserAction,
  HelpAction
}

// 导出类型和工具
export {
  types,
  ActionStateManager,
  actionStateManager,
  showAction,
  submitAction,
  cancelAction,
  actionError,
  currentAction,
  actionHistory,
  actionQueue,
  statistics,
  globalConfig
}

// 导出便捷方法
export const Actions = {
  // 显示输入框
  input: (config) => showAction({ ...config, type: types.ActionType.INPUT }),
  
  // 显示多行编辑框
  edit: (config) => showAction({ ...config, type: types.ActionType.EDIT }),
  
  // 显示多输入框
  multiInput: (config) => showAction({ ...config, type: types.ActionType.MULTI_INPUT }),
  
  // 显示增强多输入框
  multiInputX: (config) => showAction({ ...config, type: types.ActionType.MULTI_INPUT_X }),
  
  // 显示菜单
  menu: (config) => showAction({ ...config, type: types.ActionType.MENU }),
  
  // 显示选择框
  select: (config) => showAction({ ...config, type: types.ActionType.SELECT }),
  
  // 显示消息框
  msgBox: (config) => showAction({ ...config, type: types.ActionType.MSGBOX }),
  
  // 显示网页视图
  webView: (config) => showAction({ ...config, type: types.ActionType.WEBVIEW }),

  // 显示内置浏览器
  browser: (config) => showAction({ ...config, type: types.ActionType.BROWSER }),

  // 显示帮助
  help: (config) => showAction({ ...config, type: types.ActionType.HELP }),
  
  // 显示确认对话框
  confirm: (message, title = '确认') => showAction({
    actionId: `confirm-${Date.now()}`,
    type: types.ActionType.MSGBOX,
    msg: message,
    title,
    button: types.ButtonType.OK_CANCEL
  }),
  
  // 显示警告对话框
  alert: (message, title = '提示') => showAction({
    actionId: `alert-${Date.now()}`,
    type: types.ActionType.MSGBOX,
    msg: message,
    title,
    button: types.ButtonType.OK_ONLY
  }),
  
  // 显示信息对话框
  info: (message, title = '信息') => showAction({
    actionId: `info-${Date.now()}`,
    type: types.ActionType.MSGBOX,
    msg: message,
    title,
    button: types.ButtonType.OK_ONLY,
    icon: 'info'
  }),
  
  // 显示成功对话框
  success: (message, title = '成功') => showAction({
    actionId: `success-${Date.now()}`,
    type: types.ActionType.MSGBOX,
    msg: message,
    title,
    button: types.ButtonType.OK_ONLY,
    icon: 'success'
  }),
  
  // 显示错误对话框
  error: (message, title = '错误') => showAction({
    actionId: `error-${Date.now()}`,
    type: types.ActionType.MSGBOX,
    msg: message,
    title,
    button: types.ButtonType.OK_ONLY,
    icon: 'error'
  }),
  
  // 显示警告对话框
  warning: (message, title = '警告') => showAction({
    actionId: `warning-${Date.now()}`,
    type: types.ActionType.MSGBOX,
    msg: message,
    title,
    button: types.ButtonType.OK_ONLY,
    icon: 'warning'
  }),
  
  // 显示加载对话框
  loading: (message = '加载中...', title = '请稍候') => showAction({
    actionId: `loading-${Date.now()}`,
    type: types.ActionType.MSGBOX,
    msg: message,
    title,
    button: types.ButtonType.NONE,
    showProgress: true
  }),
  
  // 显示进度对话框
  progress: (message, title = '进度', progress = 0) => showAction({
    actionId: `progress-${Date.now()}`,
    type: types.ActionType.MSGBOX,
    msg: message,
    title,
    button: types.ButtonType.CANCEL_ONLY,
    showProgress: true,
    progress
  })
}

// 导出配置创建函数
export const createActionConfig = types.createActionConfig
export const createInputActionConfig = types.createInputActionConfig
export const createMultiInputActionConfig = types.createMultiInputActionConfig
export const createMenuActionConfig = types.createMenuActionConfig

export const createMsgBoxActionConfig = types.createMsgBoxActionConfig
export const createWebViewActionConfig = types.createWebViewActionConfig
export const createBrowserActionConfig = types.createBrowserActionConfig
export const createHelpActionConfig = types.createHelpActionConfig