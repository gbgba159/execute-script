<template>
	<div class="deploy-item">
		<div class="project">
			<div class="box">
				<el-select
					:disabled="deployIng"
					v-model="projectName"
					placeholder="选择要执行的项目"
				>
					<el-option v-for="item in config.projectList" :value="item.name" />
				</el-select>
				<el-button class="button" type="primary" @click="toDeploy" :disabled="disabled">
					执行
				</el-button>
			</div>
			<el-progress
				:duration="1"
				:format="format"
				class="progress"
				:percentage="100"
				:indeterminate="true"
				:class="{ hide: !deployIng }"
			/>
		</div>
		<div class="header">
			<h5>执行日志</h5>
		</div>
		<div class="term" ref="term">
			<div v-for="item in msgList">
				<span class="time">{{ item.time }}</span>
				<span class="msg" :class="item.type">{{ item.msg }}</span>
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
import Deploy from '@/utils/deploy';
import { useConfig } from '@/stores/config';
import { ref, computed, watch, onBeforeMount, nextTick } from 'vue';

const props = defineProps<{ underway: any[] }>(),
	emits = defineEmits(['tabName', 'change']);

const term = ref(),
	config = useConfig(),
	projectName = ref(''),
	deploy = new Deploy(),
	deployIng = ref(false);

const msgList = ref<
	{
		msg: string;
		type: string;
		time: string | number;
	}[]
>([]);

deploy.on('end', () => (deployIng.value = false));
deploy.on('msg', (msg: any) => {
	let list = msgList.value;
	list.length > 999 && msgList.value.splice(0, list.length);
	msgList.value.push(msg);
});

const disabled = computed(() => {
	let bol = false;
	bol = deployIng.value;
	bol = !projectName.value;
	if (projectName.value) {
		bol = props.underway.includes(getConfig()?.project?.sign || '');
	}
	return bol;
});

const format = () => '正在执行脚本';

// 获取当前选中的配置
const getConfig = () => {
	let server!: Server, project!: Project;

	for (let item of config.projectList)
		if (item.name == projectName.value) {
			project = item;
			break;
		}
	for (let item of config.serverList)
		if (item.sign == project?.server) {
			server = item;
			break;
		}

	return {
		server: server || {},
		project: project || {},
	};
};

const toDeploy = () => {
	let { project, server } = getConfig();

	deployIng.value = true;
	deploy.start({ server, project });
};

watch(
	projectName,
	val => {
		val && emits('tabName', val);
	},
	{ immediate: true }
);
watch(
	msgList,
	val => {
		nextTick(() => (term.value.scrollTop = 99999999999));
	},
	{ deep: true }
);
watch(deployIng, val => {
	let sign = val ? getConfig()?.project?.sign || '' : '';
	emits('change', sign);
});

projectName.value == '' && (projectName.value = config.projectList[0]?.name || '');

onBeforeMount(() => deploy.end());
</script>

<style lang="scss" scoped>
.deploy-item {
	display: flex;
	flex-direction: column;
	overflow: hidden;
	height: 100%;
	.project {
		height: 150px;
		@include center;
		display: inline-flex;
		flex-direction: column;
		.button {
			margin-left: 20px;
		}
		.progress {
			width: 355px;
			margin-top: 20px;
			&.hide {
				visibility: hidden;
			}
		}
	}
	.term {
		flex: 1;
		width: 100%;
		background-color: #303030;
		color: #f0f0f0;
		padding: 15px;
		overflow-y: auto;
		scroll-behavior: smooth;
		div {
			min-height: 1.5em;
			display: flex;
			span {
				font-size: 14px;
				line-height: 1.5em;
				&.time {
					color: #c0c0c0;
					width: 100px;
				}
				&.msg {
					flex: 1;
					white-space: pre-wrap;
					word-break: break-all;
					&.run {
						color: aqua;
					}
					&.warn {
						color: orange;
					}
					&.error {
						color: red;
					}
					&.step {
						color: deepskyblue;
					}
					&.success {
						color: greenyellow;
					}
				}
			}
		}
	}
}
</style>
