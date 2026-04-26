import {createRouter, createWebHistory} from 'vue-router';
import Home from '@/views/Home.vue';
import Video from '@/views/Video.vue';
import VideoDetail from '@/views/VideoDetail.vue';
import Live from '@/views/Live.vue';
import Parser from '@/views/Parser.vue';
import Collection from '@/views/Collection.vue';
import History from '@/views/History.vue';
import Settings from '@/views/Settings.vue';
import BookGallery from '@/views/BookGallery.vue';
import ActionTest from '@/views/ActionTest.vue';
import ActionDebugTest from '@/views/ActionDebugTest.vue';
import VideoTest from '@/views/VideoTest.vue';
import CSPTest from '@/views/CSPTest.vue';
import SearchAggregation from '@/views/SearchAggregation.vue';
import { routeMeta } from '@/config/navigation';

const withMeta = (name, extraMeta = {}) => ({
    ...(routeMeta[name] || {}),
    ...extraMeta
});


const routes = [
    {path: '/', component: Home, name: 'Home', meta: withMeta('Home')},
    {path: '/video', component: Video, name: 'Video', meta: withMeta('Video')},
    {path: '/video/:id', component: VideoDetail, name: 'VideoDetail', props: true, meta: withMeta('VideoDetail')},
    {path: '/live', component: Live, name: 'Live', meta: withMeta('Live')},
    {path: '/settings', component: Settings, name: 'Settings', meta: withMeta('Settings')},
    {path: '/collection', component: Collection, name: 'Collection', meta: withMeta('Collection')},
    {path: '/book-gallery', component: BookGallery, name: 'BookGallery', meta: withMeta('BookGallery')},
    {path: '/local-book-reader/:bookId', component: () => import('@/views/LocalBookReader.vue'), name: 'LocalBookReader', props: true, meta: withMeta('LocalBookReader')},
    {path: '/download-manager', component: () => import('@/components/downloader/NovelDownloader.vue'), name: 'DownloadManager', meta: withMeta('DownloadManager')},
    {path: '/history', component: History, name: 'History', meta: withMeta('History')},
    {path: '/parser', component: Parser, name: 'Parser', meta: withMeta('Parser')},
    {path: '/action-test', component: ActionTest, name: 'ActionTest', meta: withMeta('ActionTest')},
    {path: '/action-debug-test', component: ActionDebugTest, name: 'ActionDebugTest', meta: withMeta('ActionDebugTest')},
    {path: '/video-test', component: VideoTest, name: 'VideoTest', meta: withMeta('VideoTest')},
    {path: '/csp-test', component: CSPTest, name: 'CSPTest', meta: withMeta('CSPTest')},
    {path: '/search', component: SearchAggregation, name: 'SearchAggregation', meta: withMeta('SearchAggregation')},

    // 404 fallback路由 - 必须放在最后
    {path: '/:pathMatch(.*)*', redirect: '/'}
];

// 获取base路径，支持子目录部署
const getBasePath = () => {
    // 在生产环境中，如果设置了VITE_BASE_PATH环境变量，使用它
    if (import.meta.env.PROD && import.meta.env.VITE_BASE_PATH) {
        return import.meta.env.VITE_BASE_PATH;
    }
    // 否则使用Vite的BASE_URL
    return import.meta.env.BASE_URL;
};

const router = createRouter({
    history: createWebHistory(getBasePath()),
    routes,
    // 滚动行为
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition;
        } else {
            return { top: 0 };
        }
    }
});

// 路由守卫 - 可以在这里添加权限检查等逻辑
router.beforeEach((to, from, next) => {
    const title = to.meta?.title || to.name;
    if (title) {
        document.title = `DrPlayer - ${title}`;
    }
    next();
});

export default router;
