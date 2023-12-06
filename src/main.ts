import App from './App.vue';
import './samples/node-api';
import router from './router';
import { createApp } from 'vue';
import { createPinia } from 'pinia';

createApp(App)
	.use(router)
	.use(createPinia())
	.mount('#app')
	.$nextTick(() => postMessage({ payload: 'removeLoading' }, '*'));
