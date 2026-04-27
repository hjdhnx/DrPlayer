<template>
  <ActionShell
    :visible="visible"
    :title="config.title || '帮助信息'"
    :width="config.width || 700"
    :height="config.height"
    :canceled-on-touch-outside="!config.keep"
    :module="module"
    :extend="extend"
    :api-url="apiUrl"
    @close="handleClose"
    @toast="(message, type) => emit('toast', message, type)"
    @reset="() => emit('reset')"
  >
    <a-space direction="vertical" fill size="medium">
      <ActionMessage v-if="config.msg" :html="formattedMessage" />

      <a-descriptions v-if="config.data && dataList.length > 0" title="帮助信息" bordered :column="1">
        <a-descriptions-item v-for="(item, index) in dataList" :key="index" :label="item.key">
          <span v-html="formatDataText(item.value)"></span>
        </a-descriptions-item>
      </a-descriptions>

      <a-card v-if="config.img" :bordered="true">
        <a-image
          :src="config.img"
          :alt="config.imgAlt || '帮助图片'"
          :height="config.imgHeight || 300"
          fit="contain"
          show-loader
          @load="onImageLoad"
          @error="onImageError"
        />
        <a-alert v-if="imageError" type="error" show-icon>图片加载失败</a-alert>
      </a-card>

      <a-card v-if="config.qr" title="扫描二维码" :bordered="true" class="help-qrcode-card">
        <a-space direction="vertical" align="center" fill>
          <a-image
            :src="config.qr"
            alt="二维码"
            :preview="false"
            fit="contain"
            @load="onQrLoad"
            @error="onQrError"
          />
          <a-alert v-if="qrError" type="error" show-icon>二维码加载失败</a-alert>
          <a-typography-text v-if="config.qrText" type="secondary">
            {{ config.qrText }}
          </a-typography-text>
        </a-space>
      </a-card>

      <a-list v-if="config.details" bordered>
        <template #header>详细信息</template>
        <a-list-item v-for="(detail, index) in detailsList" :key="index">
          <a-list-item-meta :title="detail.title || undefined">
            <template #description>
              <div v-html="detail.content"></div>
            </template>
          </a-list-item-meta>
        </a-list-item>
      </a-list>

      <a-card v-if="config.steps" title="操作步骤" :bordered="true">
        <a-steps direction="vertical" :current="stepsList.length">
          <a-step v-for="(step, index) in stepsList" :key="index" :title="step.title || `步骤${index + 1}`">
            <template #description>
              <a-space direction="vertical" fill>
                <div v-html="step.content"></div>
                <a-image
                  v-if="step.image"
                  :src="step.image"
                  :alt="step.title || `步骤${index + 1}`"
                  :height="180"
                  fit="contain"
                />
              </a-space>
            </template>
          </a-step>
        </a-steps>
      </a-card>

      <a-collapse v-if="config.faq" accordion>
        <a-collapse-item v-for="(item, index) in faqList" :key="String(index)" :header="item.question">
          <div v-html="item.answer"></div>
        </a-collapse-item>
      </a-collapse>

      <a-list v-if="config.links" bordered>
        <template #header>相关链接</template>
        <a-list-item v-for="(link, index) in linksList" :key="index">
          <a-link :href="link.url" :target="link.target || '_blank'" @click="onLinkClick(link)">
            {{ link.title }}
          </a-link>
          <template v-if="link.description" #extra>
            <a-typography-text type="secondary">{{ link.description }}</a-typography-text>
          </template>
        </a-list-item>
      </a-list>

      <a-descriptions v-if="config.contact" title="联系我们" bordered :column="1">
        <a-descriptions-item v-if="config.contact.email" label="邮箱">
          <a-link :href="`mailto:${config.contact.email}`">{{ config.contact.email }}</a-link>
        </a-descriptions-item>
        <a-descriptions-item v-if="config.contact.phone" label="电话">
          <a-link :href="`tel:${config.contact.phone}`">{{ config.contact.phone }}</a-link>
        </a-descriptions-item>
        <a-descriptions-item v-if="config.contact.website" label="网站">
          <a-link :href="config.contact.website" target="_blank">{{ config.contact.website }}</a-link>
        </a-descriptions-item>
        <a-descriptions-item v-if="config.contact.address" label="地址">
          {{ config.contact.address }}
        </a-descriptions-item>
      </a-descriptions>

      <ActionTimeout
        v-if="config.timeout"
        :time-left="timeLeft"
        :total="Number(config.timeout) || 0"
      />
    </a-space>

    <template #footer>
      <ActionFooter
        :show-ok="true"
        :show-cancel="config.allowPrint || config.allowCopy"
        :show-reset="config.allowPrint && config.allowCopy"
        :ok-text="config.closeText || '关闭'"
        :cancel-text="config.allowCopy ? '复制内容' : '打印'"
        reset-text="打印"
        @ok="handleClose"
        @cancel="config.allowCopy ? handleCopy() : handlePrint()"
        @reset="handlePrint"
      />
    </template>
  </ActionShell>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import ActionShell from './shared/ActionShell.vue'
import ActionMessage from './shared/ActionMessage.vue'
import ActionTimeout from './shared/ActionTimeout.vue'
import ActionFooter from './shared/ActionFooter.vue'

export default {
  name: 'HelpAction',
  components: {
    ActionShell,
    ActionMessage,
    ActionTimeout,
    ActionFooter
  },
  props: {
    config: {
      type: Object,
      required: true
    },
    visible: {
      type: Boolean,
      default: true
    },
    // T4接口调用相关属性
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
  emits: ['close', 'link-click', 'toast', 'reset', 'special-action'],
  setup(props, { emit }) {
    const imageError = ref(false)
    const qrError = ref(false)
    const expandedFaq = ref(-1)
    const timeLeft = ref(0)
    const timer = ref(null)

    // 计算属性
    const formattedMessage = computed(() => {
      if (!props.config.msg) return ''
      
      // 如果消息已经包含HTML标签，直接返回
      if (/<[^>]+>/.test(props.config.msg)) {
        return props.config.msg
      }
      
      // 否则支持简单的 Markdown 格式转换
      return props.config.msg
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>')
    })

    const detailsList = computed(() => {
      if (!props.config.details) return []
      
      if (Array.isArray(props.config.details)) {
        return props.config.details
      }
      
      if (typeof props.config.details === 'string') {
        return [{ content: props.config.details }]
      }
      
      return [props.config.details]
    })

    const stepsList = computed(() => {
      if (!props.config.steps) return []
      
      if (Array.isArray(props.config.steps)) {
        return props.config.steps
      }
      
      return []
    })

    const faqList = computed(() => {
      if (!props.config.faq) return []
      
      if (Array.isArray(props.config.faq)) {
        return props.config.faq
      }
      
      return []
    })

    const linksList = computed(() => {
      if (!props.config.links) return []
      
      if (Array.isArray(props.config.links)) {
        return props.config.links
      }
      
      return []
    })

    const dataList = computed(() => {
      if (!props.config.data || typeof props.config.data !== 'object') return []
      
      return Object.entries(props.config.data).map(([key, value]) => ({
        key,
        value
      }))
    })

    // 方法
    const formatDataText = (text) => {
      if (!text) return ''
      
      // 如果文本已经包含HTML标签，直接返回
      if (/<[^>]+>/.test(text)) {
        return text
      }
      
      // 否则支持简单的 Markdown 格式转换和换行
      return String(text)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>')
    }

    const onImageLoad = () => {
      imageError.value = false
    }

    const onImageError = () => {
      imageError.value = true
    }

    const onQrLoad = () => {
      qrError.value = false
    }

    const onQrError = () => {
      qrError.value = true
    }

    const toggleFaq = (index) => {
      expandedFaq.value = expandedFaq.value === index ? -1 : index
    }

    const onLinkClick = (link) => {
      emit('link-click', link)
    }

    const handlePrint = () => {
      try {
        window.print()
      } catch (err) {
        console.warn('打印功能不可用:', err)
      }
    }

    const handleCopy = async () => {
      try {
        // 收集所有文本内容
        const content = []
        
        if (props.config.msg) {
          content.push(props.config.msg)
        }
        
        if (props.config.details) {
          content.push('\n详细信息:')
          detailsList.value.forEach(detail => {
            if (detail.title) content.push(`${detail.title}:`)
            content.push(detail.content.replace(/<[^>]*>/g, ''))
          })
        }
        
        if (props.config.steps) {
          content.push('\n操作步骤:')
          stepsList.value.forEach((step, index) => {
            content.push(`${index + 1}. ${step.title || ''}`)
            content.push(step.content.replace(/<[^>]*>/g, ''))
          })
        }
        
        if (props.config.faq) {
          content.push('\n常见问题:')
          faqList.value.forEach(item => {
            content.push(`Q: ${item.question}`)
            content.push(`A: ${item.answer.replace(/<[^>]*>/g, '')}`)
          })
        }
        
        const text = content.join('\n')
        
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(text)
        } else {
          // 降级方案
          const textarea = document.createElement('textarea')
          textarea.value = text
          document.body.appendChild(textarea)
          textarea.select()
          document.execCommand('copy')
          document.body.removeChild(textarea)
        }
        
        // 可以添加成功提示
        console.log('内容已复制到剪贴板')
      } catch (err) {
        console.warn('复制失败:', err)
      }
    }

    const handleClose = () => {
      emit('close')
    }

    // 超时处理
    const startTimeout = () => {
      if (!props.config.timeout || props.config.timeout <= 0) return

      timeLeft.value = props.config.timeout
      timer.value = setInterval(() => {
        timeLeft.value--
        if (timeLeft.value <= 0) {
          clearInterval(timer.value)
          handleClose()
        }
      }, 1000)
    }

    const stopTimeout = () => {
      if (timer.value) {
        clearInterval(timer.value)
        timer.value = null
      }
      timeLeft.value = 0
    }

    // 监听显示状态
    watch(() => props.visible, (visible) => {
      if (visible) {
        startTimeout()
      } else {
        stopTimeout()
      }
    })

    onMounted(() => {
      if (props.visible && props.config.timeout) {
        startTimeout()
      }
    })

    onUnmounted(() => {
      stopTimeout()
    })

    return {
      imageError,
      qrError,
      expandedFaq,
      timeLeft,
      formattedMessage,
      detailsList,
      stepsList,
      faqList,
      linksList,
      dataList,
      formatDataText,
      onImageLoad,
      onImageError,
      onQrLoad,
      onQrError,
      toggleFaq,
      onLinkClick,
      handlePrint,
      handleCopy,
      handleClose
    }
  }
}
</script>

<style scoped>
.help-qrcode-card :deep(.arco-card-body) {
  background: var(--action-qr-bg);
}
</style>