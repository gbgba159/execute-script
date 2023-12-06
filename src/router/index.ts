import { createRouter, createWebHashHistory } from 'vue-router';

import server from '@/views/server.vue';
import execute from '@/views/execute.vue';
import project from '@/views/project.vue';

const router = createRouter({
	history: createWebHashHistory(),
	routes: [
		{ path: '/', redirect: '/execute' },
		{
			path: '/server',
			component: server,
			meta: { title: '云端配置' },
		},
		{
			path: '/execute',
			component: execute,
			meta: { title: '执行脚本' },
		},
		{
			path: '/project',
			component: project,
			meta: { title: '项目配置' },
		},
	],
});

router.beforeEach(to => {
	document.title = to.meta.title as string;
});

export default router;
