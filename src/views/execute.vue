<template>
	<div class="execute">
		<el-tabs
			addable
			type="card"
			class="tabs"
			v-model="actTab"
			@edit="handleTabsEdit"
			:closable="tabs.length > 1"
		>
			<el-tab-pane v-for="(item, index) in tabs" :key="index" :name="index">
				<template #label>
					<span class="label">
						<i-ep-loading class="icon loading" v-show="item.sign" />
						<i-ep-circle-check-filled class="icon circle" v-show="item.sign === ''" />
						<span>{{ item.title }}</span>
					</span>
				</template>
				<execute-item
					:underway="underway"
					@change="tabs[index].sign = $event"
					@tabName="tabs[index].title = $event"
				></execute-item>
			</el-tab-pane>
		</el-tabs>
	</div>
</template>
<script lang="ts" setup>
import { ref, reactive, computed } from 'vue';
import executeItem from '@/components/execute.vue';

const actTab = ref(0),
	tabs = reactive([
		{
			sign: null,
			title: 'deploy',
		},
	]);

// 执行中的脚本	
const underway = computed(() => {
	let arr: string[] = [];
	tabs.forEach((val: any) => val.sign && arr.push(val.sign));
	return arr;
});

// 编辑tab
const handleTabsEdit = (targetName: any, action: 'remove' | 'add') => {
	if (action == 'add') {
		tabs.push({
			sign: null,
			title: 'deploy',
		});
		actTab.value = tabs.length - 1;
	} else if (action == 'remove') {
		actTab.value >= targetName && actTab.value != 0 && actTab.value--;
		tabs.splice(targetName, 1);
	}
};
</script>

<style lang="scss" scoped>
.execute {
	height: 100%;
	:deep(.tabs) {
		height: 100%;
		display: flex;
		flex-direction: column;
		.label {
			.icon {
				font-size: 14px;
				margin-right: 5px;
				vertical-align: middle;
				&.loading {
					animation: roll linear infinite 2s;
					@keyframes roll {
						0% {
							transform: rotate(0turn);
						}
						100% {
							transform: rotate(1turn);
						}
					}
				}
				&.circle {
					color: greenyellow;
				}
			}
		}
		.el-tabs__content {
			flex: 1;
			.el-tab-pane {
				height: 100%;
			}
		}
	}
}
</style>
