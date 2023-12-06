<template>
	<el-container class="container">
		<el-aside width="200px">
			<el-menu default-active="/execute" router class="menu">
				<el-menu-item index="/execute">
					<i-ep-position />
					<span>执行脚本</span>
				</el-menu-item>
				<el-menu-item index="/project">
					<i-ep-operation />
					<span>项目配置</span>
				</el-menu-item>
				<el-menu-item index="/server">
					<i-ep-cloudy />
					<span>云端配置</span>
				</el-menu-item>
			</el-menu>
		</el-aside>
		<el-main class="main">
			<router-view class="content" v-slot="{ Component }">
				<keep-alive>
					<component :is="Component" />
				</keep-alive>
			</router-view>
		</el-main>
	</el-container>
</template>

<script lang="ts" setup>
import fs from 'node:fs';
import { debounce } from '@/utils/methods';
import { useConfig } from '@/stores/config';

const config = useConfig(),
	configPath = process.resourcesPath + '/config.json';

// 获取本地配置
try {
	let data: Config | string = fs.readFileSync(configPath, 'utf-8');
	data = JSON.parse(data) as Config;
	config.$patch(data);
} catch (error) {}

// 监听配置变化重新写入
config.$subscribe(
	debounce((mutation: any, state: any) => {
		fs.writeFileSync(configPath, JSON.stringify(state, null, 4));
	})
);
</script>

<style lang="scss" src="./assets/styles/public.scss"></style>
<style lang="scss">
.container {
	border-top: $border;
	overflow: hidden;
	width: 100vw;
	height: 100vh;
	.content {
		@include full;
		.header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 10px;
			h5 {
				font-size: 20px;
				font-weight: bold;
			}
		}
		.table {
			.cell {
				font-size: 14px;
				@include line;
				user-select: none;
				path {
					color: #fff;
				}
				.desc {
					font-size: 14px;
				}
			}
		}
		.el-input__inner {
			flex-shrink: unset;
		}
	}
	.menu,
	.main {
		height: 100%;
	}
	.el-menu-item {
		@include center;
		&.is-active {
			background-color: #ecf5ff;
			path,
			span {
				color: $main-color;
			}
		}
		span {
			margin-left: 10px;
			user-select: none;
		}
	}
}
</style>
