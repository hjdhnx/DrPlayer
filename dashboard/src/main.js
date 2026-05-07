import {createApp} from 'vue'
import './style.css'
import { initTheme } from '@/utils/theme'
import App from './App.vue'
import router from './router'  // 引入路由
import ArcoVue from '@arco-design/web-vue'
import ArcoVueIcon from '@arco-design/web-vue/es/icon';
import '@arco-design/web-vue/dist/arco.css'
import '@/assets/icon_font/iconfont.css'  // 引入iconfont样式
import {createPinia} from 'pinia'
import 'viewerjs/dist/viewer.css'
import VueViewer from 'v-viewer'
import ECharts from 'vue-echarts'
import ActionComponents from '@/components/actions'
import { initDefaultLocalStorage } from '@/config/defaults'
import { use } from 'echarts/core'
import {
  CanvasRenderer
} from 'echarts/renderers'
import {
  BarChart,
  LineChart,
  PieChart
} from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
} from 'echarts/components'

use([
  CanvasRenderer,
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
])

initDefaultLocalStorage()
initTheme()

const app = createApp(App)
app.use(router)
app.use(ArcoVue);
app.use(ArcoVueIcon);
app.use(createPinia())
app.use(VueViewer)
app.use(ActionComponents)
app.component('v-chart', ECharts)
app.mount('#app')