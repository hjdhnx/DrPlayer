<template>
  <div class="breadcrumb-container">
    <!-- 左侧区域：导航标题和操作按钮 -->
    <div class="header-left">
      <span class="navigation-title">{{ navigation_title }}</span>
      <a-button type="outline" status="success" shape="round" @click="handleOpenForm">
        <template #icon>
          <icon-apps />
        </template>
        <template #default>{{ now_site_title }}</template>
      </a-button>

      <a-button type="outline" status="success" shape="round" @click="refreshPage">
        <template #icon>
          <icon-refresh />
        </template>
        <template #default>重载源</template>
      </a-button>
    </div>

    <!-- 中间搜索框 -->
    <div class="header-center">
      <a-input-search
        v-model="searchValue"
        placeholder="搜索视频"
        enter-button
        @search="onSearch"
        @press-enter="onSearch"
      />
    </div>

    <!-- 右侧控制按钮和时间 -->
    <div class="header-right">
      <a-button type="outline" status="success" shape="round" @click="handlePush">
        <template #icon>
          <icon-send />
        </template>
        <template #default>推送</template>
      </a-button>

      <a-button type="outline" status="success" shape="round" @click="handleGlobalAction">
        <template #icon>
          <icon-thunderbolt />
        </template>
        <template #default>全局动作</template>
      </a-button>
      
      <!-- 时间显示插槽 -->
      <slot name="default"></slot>
    </div>
  </div>

  <!-- 推送内容输入弹窗 -->
  <a-modal 
    v-model:visible="showPushModal"
    title="推送内容"
    :width="600"
    @ok="confirmPush"
    @cancel="cancelPush"
    ok-text="确认推送"
    cancel-text="取消"
    :ok-button-props="{ disabled: !pushContent.trim() }"
  >
    <div class="push-modal-content">
      <div class="push-description">
        <icon-send class="push-icon" />
        <span>请输入要推送的内容（vod_id）：</span>
      </div>
      <a-textarea
        v-model="pushContent"
        placeholder="请输入要推送的内容...&#10;支持多行输入，每行一个vod_id"
        :rows="6"
        :max-length="1000"
        show-word-limit
        allow-clear
        autofocus
        class="push-textarea"
      />
      <div class="push-hint">
        <div class="hint-item">
          <icon-info-circle class="hint-icon" />
          <span>输入的内容将作为vod_id调用push_agent源的详情接口</span>
        </div>
        <div class="hint-item">
          <icon-bulb class="hint-icon" />
          <span>支持多行输入，系统将使用第一行非空内容作为vod_id</span>
        </div>
      </div>
    </div>
  </a-modal>

  <!-- 全局动作弹窗 -->
  <GlobalActionDialog
    v-model:visible="showGlobalActionDialog"
    :sites="sites"
    @action-executed="handleActionExecuted"
    @special-action="handleSpecialAction"
  />
</template>

<script setup>
import { ref } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import GlobalActionDialog from './GlobalActionDialog.vue'

const props = defineProps({
  navigation_title: {
    type: String,
    default: "点播",
  },

  now_site_title: String,
  
  // 站源配置数据
  sites: {
    type: Array,
    default: () => []
  }
});
const emit = defineEmits([
  "handleOpenForm",
  "refreshPage",
  "onSearch",
  "handlePush",
  "minimize",
  "maximize", 
  "closeWindow",
  "actionExecuted",
  "special-action"
]);

const searchValue = ref('')
const showPushModal = ref(false)
const pushContent = ref('')
const showGlobalActionDialog = ref(false)

const handleOpenForm = () => {
  emit("handleOpenForm");
};
const refreshPage = () => {
  emit("refreshPage");
};
const onSearch = (value) => {
  // 如果value是字符串，使用它；否则使用当前输入框的值
  const searchTerm = typeof value === 'string' ? value : searchValue.value
  if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim()) {
    emit("onSearch", searchTerm.trim());
  }
};

// 推送按钮点击事件
const handlePush = () => {
  showPushModal.value = true
  pushContent.value = ''
};

// 全局动作按钮点击事件
const handleGlobalAction = () => {
  if (!props.sites || props.sites.length === 0) {
    Message.warning('当前没有可用的站源配置');
    return;
  }

  console.log(props.sites);
  
  // 检查是否有站源包含动作
  const sitesWithActions = props.sites.filter(site => 
    site.more && 
    site.more.actions && 
    Array.isArray(site.more.actions) && 
    site.more.actions.length > 0
  );
  
  if (sitesWithActions.length === 0) {
    Message.info('当前站源配置中没有可用的全局动作');
    return;
  }
  
  showGlobalActionDialog.value = true;
};

// 处理动作执行完成事件
const handleActionExecuted = (event) => {
  console.log('全局动作执行完成:', event);
  
  // 向父组件发送动作执行事件
  emit('actionExecuted', event);
  
  // 添加安全检查，防止null引用错误
  if (!event || typeof event !== 'object') {
    console.warn('Invalid event object received in handleActionExecuted');
    return;
  }
  
  const actionName = event.action?.name || '未知动作';
  
  if (event.success) {
    Message.success(`动作 "${actionName}" 执行成功`);
  } else {
    if (event.error !== 'cancel') {
      Message.error(`动作 "${actionName}" 执行失败: ${event.error || '未知错误'}`);
    }
  }
};


const handleSpecialAction = (actionType, actionData) => {
  emit('special-action', actionType, actionData);
};

defineExpose({
  openPushModal: handlePush,
  openGlobalActionDialog: handleGlobalAction
});


// 确认推送
const confirmPush = () => {
  if (!pushContent.value.trim()) {
    Message.error('推送内容不能为空');
    return;
  }
  
  // 处理多行输入，取第一行非空内容作为vod_id
  const lines = pushContent.value.split('\n').map(line => line.trim()).filter(line => line);
  
  if (lines.length === 0) {
    Message.error('请输入有效的推送内容');
    return;
  }
  
  const vodId = lines[0]; // 使用第一行非空内容
  
  if (lines.length > 1) {
    Message.info(`检测到多行输入，将使用第一行内容: ${vodId}`);
  }
  
  // 触发推送事件，传递处理后的vod_id
  emit('handlePush', vodId);
  
  // 关闭弹窗并清空内容
  showPushModal.value = false;
  pushContent.value = '';
};

// 取消推送
const cancelPush = () => {
  showPushModal.value = false
  pushContent.value = ''
};
</script>

<style scoped>
.breadcrumb-container {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 16px 20px;
  background: var(--color-bg-3);
  border-bottom: 1px solid var(--color-border-2);
  box-sizing: border-box;
}

.header-left {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  min-width: 0;
}

.navigation-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-1);
  margin-right: 16px;
  white-space: nowrap;
}

.header-left button {
  margin-right: 12px;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 0 20px;
  min-width: 0;
}

.header-center :deep(.arco-input-search) {
  max-width: 400px;
  width: 100%;
}

.header-right {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  min-width: 0;
}

.header-right button {
  margin-right: 12px;
}

.header-right button:last-of-type {
  margin-right: 16px;
}

/* 时间显示样式 */
.header-right :deep(.current-time) {
  font-size: 14px;
  color: var(--color-text-2);
  white-space: nowrap;
  margin-left: 8px;
}

/* 推送弹窗样式 */
.push-modal-content {
  padding: 20px 0;
}

.push-description {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  font-size: 16px;
  color: var(--color-text-1);
  font-weight: 500;
}

.push-icon {
  margin-right: 8px;
  font-size: 18px;
  color: var(--color-primary-6);
}

.push-textarea {
  margin-bottom: 16px;
}

.push-textarea :deep(.arco-textarea) {
  border-radius: 8px;
  border: 2px solid var(--color-border-2);
  transition: all 0.3s ease;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  line-height: 1.6;
}

.push-textarea :deep(.arco-textarea:focus) {
  border-color: var(--color-primary-6);
  box-shadow: 0 0 0 3px var(--color-primary-1);
}

.push-textarea :deep(.arco-textarea::placeholder) {
  color: var(--color-text-3);
  font-style: italic;
}

.push-hint {
  background: var(--color-bg-2);
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid var(--color-primary-6);
}

.hint-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--color-text-2);
  line-height: 1.5;
}

.hint-item:last-child {
  margin-bottom: 0;
}

.hint-icon {
  margin-right: 8px;
  margin-top: 2px;
  font-size: 16px;
  color: var(--color-primary-6);
  flex-shrink: 0;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .header-center :deep(.arco-input-search) {
    max-width: 300px;
  }
}

@media (max-width: 768px) {
  .breadcrumb-container {
    padding: 12px 16px;
  }
  
  .navigation-title {
    font-size: 14px;
    margin-right: 12px;
  }
  
  .header-center {
    padding: 0 12px;
  }
  
  .header-center :deep(.arco-input-search) {
    max-width: 250px;
  }
  
  .header-left button,
  .header-right button {
    margin-right: 8px;
  }
}
</style>
