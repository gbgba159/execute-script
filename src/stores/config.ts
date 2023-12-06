import { defineStore } from 'pinia';

export const useConfig = defineStore('config', {
	state: (): Config => ({
		serverList: [],
		projectList: [],
	}),
});
