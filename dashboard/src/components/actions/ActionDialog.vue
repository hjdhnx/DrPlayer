<template>
  <Teleport to="body">
    <Transition name="action-mask" appear>
      <div
        v-if="visible"
        class="action-mask modal-backdrop"
        :class="{ closing: isClosing }"
        :style="{ '--dim-amount': dimAmount }"
        @click="handleMaskClick"
      >
        <Transition name="action-dialog" appear>
          <div
            v-if="visible && !isClosing"
            class="action-dialog glass-effect card-modern animate-bounce-in"
            :class="[
              customClass,
              {
                'action-dialog-mobile': isMobile,
                'action-dialog-resizable': resizable && !isMobile
              }
            ]"
            :style="dialogStyle"
            @click.stop
          >
            <!-- 装饰性渐变背景 -->
            <div class="action-dialog-bg gradient-primary"></div>
            
            <!-- 关闭按钮 -->
            <button
              v-if="showClose"
              class="action-dialog-close btn-modern-icon"
              @click="handleClose"
              title="关闭"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <!-- 头部 -->
            <div v-if="title || $slots.header" class="action-dialog-header">
              <slot name="header">
                <h3 class="action-dialog-title">{{ title }}</h3>
              </slot>
            </div>

            <!-- 内容 -->
            <div class="action-dialog-content" :style="contentStyle">
              <slot></slot>
            </div>

            <!-- 底部 -->
            <div v-if="$slots.footer" class="action-dialog-footer">
              <slot name="footer"></slot>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
import { ref, computed, watch, nextTick } from 'vue'

export default {
  name: 'ActionDialog',
  props: {
    // 是否显示弹窗
    visible: {
      type: Boolean,
      default: false
    },
    // 弹窗标题
    title: {
      type: String,
      default: ''
    },
    // 弹窗宽度
    width: {
      type: [Number, String],
      default: 400
    },
    // 弹窗高度
    height: {
      type: [Number, String],
      default: 'auto'
    },
    // 距离底部的距离
    bottom: {
      type: Number,
      default: 0
    },
    // 点击外部是否关闭
    canceledOnTouchOutside: {
      type: Boolean,
      default: true
    },
    // 遮罩透明度
    dimAmount: {
      type: Number,
      default: 0.45
    },
    // 是否显示关闭按钮
    showClose: {
      type: Boolean,
      default: true
    },
    // 是否可以通过ESC键关闭
    escapeToClose: {
      type: Boolean,
      default: true
    },
    resizable: {
      type: Boolean,
      default: false
    },
    // 自定义类名
    customClass: {
      type: String,
      default: ''
    },
    // T4接口相关属性
    module: {
      type: String,
      default: ''
    },
    extend: {
      type: [Object, String],
      default: () => ({})
    },
    apiUrl: {
      type: String,
      default: ''
    }
  },
  emits: ['update:visible', 'close', 'open', 'opened', 'closed', 'toast', 'reset'],
  setup(props, { emit }) {
    const isClosing = ref(false)
    const isMobile = ref(false)

    // 检测移动端
    const checkMobile = () => {
      isMobile.value = window.innerWidth <= 768
    }

    // 计算弹窗样式
    const dialogStyle = computed(() => {
      const style = {}
      
      if (isMobile.value) {
        // 移动端样式
        style.width = '95vw'
        style.maxWidth = '95vw'
        style.margin = '0 auto'
        // 移除移动端的高度限制，让CSS控制
      } else {
        // 桌面端样式
        if (props.width) {
          style.width = typeof props.width === 'number' ? `${props.width}px` : props.width
          style.maxWidth = '90vw'
        }
        
        // 只有明确设置了固定高度时才应用
        if (props.height && props.height !== 'auto') {
          style.height = typeof props.height === 'number' ? `${props.height}px` : props.height
        }
        // 移除桌面端的maxHeight限制，让CSS控制
      }
      
      if (props.bottom > 0) {
        style.marginBottom = `${props.bottom}px`
      }
      
      return style
    })

    // 计算内容样式
    const contentStyle = computed(() => {
      const style = {}
      
      // 只有在明确设置了固定高度时才应用内容区域的高度限制
      if (props.height && props.height !== 'auto') {
        style.maxHeight = 'calc(100% - 120px)' // 预留头部和底部空间
        style.overflowY = 'auto'
      }
      // 其他情况让CSS的max-height规则控制
      
      return style
    })

    // 处理遮罩点击
    const handleMaskClick = () => {
      if (props.canceledOnTouchOutside) {
        handleClose()
      }
    }

    // 处理关闭
    const handleClose = async () => {
      if (isClosing.value) return
      
      emit('close')
      isClosing.value = true
      
      // 等待动画完成
      await new Promise(resolve => setTimeout(resolve, 300))
      
      emit('update:visible', false)
      isClosing.value = false
      emit('closed')
    }

    // 处理ESC键
    const handleKeydown = (event) => {
      if (event.key === 'Escape' && props.escapeToClose && props.visible) {
        handleClose()
      }
    }

    // 监听visible变化
    watch(() => props.visible, (newVal) => {
      if (newVal) {
        emit('open')
        checkMobile() // 检查移动端状态
        nextTick(() => {
          emit('opened')
        })
        // 添加键盘事件监听
        document.addEventListener('keydown', handleKeydown)
        // 添加窗口大小监听
        window.addEventListener('resize', checkMobile)
        // 禁止body滚动
        document.body.style.overflow = 'hidden'
      } else {
        // 移除键盘事件监听
        document.removeEventListener('keydown', handleKeydown)
        // 移除窗口大小监听
        window.removeEventListener('resize', checkMobile)
        // 恢复body滚动
        document.body.style.overflow = ''
      }
    }, { immediate: true })

    // 组件卸载时清理
    const cleanup = () => {
      document.removeEventListener('keydown', handleKeydown)
      window.removeEventListener('resize', checkMobile)
      document.body.style.overflow = ''
    }

    return {
      isClosing,
      isMobile,
      dialogStyle,
      contentStyle,
      handleMaskClick,
      handleClose,
      cleanup
    }
  },
  beforeUnmount() {
    this.cleanup()
  }
}
</script>

<style scoped>
/* 现代化弹窗遮罩 */
.action-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, calc(var(--dim-amount, 0.45)));
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  overflow: hidden;
}

/* 现代化弹窗容器 */
.action-dialog {
  position: relative;
  z-index: 20001;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--ds-radius-2xl);
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  overflow: hidden;
  transform-origin: center;
  transition: all var(--ds-duration-normal) cubic-bezier(0.34, 1.56, 0.64, 1);
  max-height: calc(100vh - 2rem);
  max-width: 90vw;
  display: flex;
  flex-direction: column;
}

.action-dialog-resizable {
  resize: both;
  overflow: hidden;
  min-width: min(560px, 90vw);
  min-height: min(420px, calc(100vh - 2rem));
  max-width: 96vw;
  max-height: calc(100vh - 2rem);
}

/* 装饰性背景 */
.action-dialog-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  opacity: 0.8;
  z-index: 0;
}

/* 关闭按钮 */
.action-dialog-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  border-radius: var(--ds-radius-lg);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: rgba(0, 0, 0, 0.6);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--ds-duration-fast) ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.action-dialog-close:hover {
  background: rgba(255, 255, 255, 0.2);
  color: rgba(0, 0, 0, 0.8);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-dialog-close:active {
  transform: scale(0.95);
}

/* 头部样式 */
.action-dialog-header {
  position: relative;
  z-index: 1;
  padding: 2rem 2rem 1rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.action-dialog-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  text-align: center;
  letter-spacing: -0.025em;
}

/* 内容样式 */
.action-dialog-content {
  position: relative;
  z-index: 1;
  padding: 1.5rem 2rem;
  flex: 1 1 auto;
  overflow: visible; /* 移除滚动条，让子元素处理滚动 */
  min-height: 0; /* 重要：允许flex子项收缩 */
  max-height: 100%; /* 确保不超出父容器 */
}

/* action-dialog-content 不再需要滚动条样式，因为滚动由子元素处理 */

/* 底部样式 */
.action-dialog-footer {
  position: relative;
  z-index: 1;
  padding: 1rem 2rem 2rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.1) 100%);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-shrink: 0;
}

/* 移动端适配 */
.action-dialog-mobile {
  margin: 1rem;
  border-radius: var(--ds-radius-xl);
}

.action-dialog-mobile .action-dialog-header {
  padding: 1.5rem 1.5rem 1rem;
}

.action-dialog-mobile .action-dialog-content {
  padding: 1rem 1.5rem;
  /* 移除max-height，使用flex布局控制 */
}

.action-dialog-mobile .action-dialog-footer {
  padding: 1rem 1.5rem 1.5rem;
}

.action-dialog-mobile .action-dialog-close {
  top: 0.75rem;
  right: 0.75rem;
  width: 2rem;
  height: 2rem;
}

/* 动画效果 */
.action-mask-enter-active,
.action-mask-leave-active {
  transition: all var(--ds-duration-normal) ease;
}

.action-mask-enter-from,
.action-mask-leave-to {
  opacity: 0;
  backdrop-filter: blur(0px);
  -webkit-backdrop-filter: blur(0px);
}

.action-dialog-enter-active {
  transition: all var(--ds-duration-normal) cubic-bezier(0.34, 1.56, 0.64, 1);
}

.action-dialog-leave-active {
  transition: all var(--ds-duration-fast) ease-in;
}

.action-dialog-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(-2rem);
}

.action-dialog-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(1rem);
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .action-dialog {
    background: rgba(30, 30, 30, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .action-dialog-title {
    color: rgba(255, 255, 255, 0.9);
  }
  
  .action-dialog-close {
    color: rgba(255, 255, 255, 0.7);
    background: rgba(0, 0, 0, 0.2);
  }
  
  .action-dialog-close:hover {
    color: rgba(255, 255, 255, 0.9);
    background: rgba(0, 0, 0, 0.3);
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .action-dialog {
    border: 2px solid;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    background: white;
  }
  
  .action-dialog-close {
    border: 1px solid;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}

/* 减少动画模式支持 */
@media (prefers-reduced-motion: reduce) {
  .action-mask-enter-active,
  .action-mask-leave-active,
  .action-dialog-enter-active,
  .action-dialog-leave-active,
  .action-dialog-close {
    transition: none;
  }
  
  .action-dialog-close:hover {
    transform: none;
  }
}
</style>