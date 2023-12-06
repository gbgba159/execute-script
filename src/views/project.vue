<template>
	<div class="project-config">
		<div class="header">
			<h5>项目配置</h5>
			<el-button @click="dialogVisible = true">新增项目</el-button>
		</div>

		<el-table :data="config.projectList" stripe style="width: 100%" class="table">
			<el-table-column width="120px" prop="name" label="项目名" />
			<el-table-column width="110px" label="脚本类型">
				<template #default="scope">
					<el-tag class="tag" size="small" effect="dark" v-if="tagContent(scope)">
						{{ tagContent(scope) }}
					</el-tag>
				</template>
			</el-table-column>
			<el-table-column prop="localPath" label="本地路径" />
			<el-table-column width="200px" prop="outDir" label="打包目录" />
			<el-table-column width="100px" label="服务器">
				<template #default="scope">
					<span class="desc">{{ searchserver(scope.row) }}</span>
				</template>
			</el-table-column>
			<el-table-column width="100px" fixed="right" label="操作">
				<template #default="scope">
					<el-button type="primary" circle size="small" @click.stop="editData(scope)">
						<i-ep-edit width="1em" height="1em"></i-ep-edit>
					</el-button>
					<el-button
						type="danger"
						circle
						size="small"
						@click.stop="delData(scope.$index)"
					>
						<i-ep-delete width="1em" height="1em"></i-ep-delete>
					</el-button>
				</template>
			</el-table-column>
		</el-table>

		<el-dialog
			width="55%"
			title="Tips"
			@closed="clearParams"
			v-model="dialogVisible"
			:close-on-click-modal="false"
		>
			<template #header>
				<h5>{{ actIndex == undefined ? '新增项目配置' : '编辑项目配置' }}</h5>
			</template>
			<el-form label-width="100px" :model="params" style="max-width: 500px">
				<el-form-item label="项目名：">
					<el-input v-model="params.name" placeholder="输入项目名" />
				</el-form-item>
				<el-form-item label="本地路径：" class="select-path">
					<el-input v-model="params.localPath" readonly placeholder="选择项目路径">
						<template #suffix>
							<el-button type="primary" plain size="small" @click="selectLocalPath">
								选择
							</el-button>
						</template>
					</el-input>
				</el-form-item>
				<el-form-item label="打包目录：">
					<el-input v-model="params.outDir" placeholder="输入打包目录" />
				</el-form-item>
				<el-form-item label="打包指令：">
					<el-input v-model="params.buildCmd" placeholder="输入打包指令" />
				</el-form-item>
				<el-form-item label="打包操作：">
					<el-checkbox-group v-model="params.operates">
						<el-checkbox
							:label="item"
							v-for="item in operates"
							@change="onChange(item)"
							:disabled="isDisabled(item)"
						/>
					</el-checkbox-group>
				</el-form-item>
				<keep-alive>
					<template v-if="params.operates.includes('deploy')">
						<el-form-item label="服务器：">
							<el-select v-model="params.server" placeholder="选择使用的服务器">
								<el-option
									:key="index"
									:label="item.name"
									:value="item.sign"
									v-for="(item, index) in config.serverList"
								/>
							</el-select>
						</el-form-item>
						<el-form-item label="服务器路径：">
							<el-input
								v-model="params.serverPath"
								placeholder="输入项目服务器路径"
							/>
						</el-form-item>
					</template>
				</keep-alive>
				<keep-alive>
					<template v-if="params.operates.includes('move')">
						<el-form-item label="目标路径：" class="select-path">
							<el-input
								v-model="params.newPath"
								readonly
								placeholder="选择项目移动目标路径"
							>
								<template #suffix>
									<el-button
										type="primary"
										plain
										size="small"
										@click="selectNewPath"
									>
										选择
									</el-button>
								</template>
							</el-input>
						</el-form-item>
					</template>
				</keep-alive>
			</el-form>
			<template #footer>
				<el-button type="primary" @click="saveData">保存</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { ipcRenderer } from 'electron';
import { useConfig } from '@/stores/config';
import { ElMessage, ElMessageBox } from 'element-plus';
import { createSign, deepClone } from '@/utils/methods';

const config = useConfig(),
	dialogVisible = ref<boolean>(false),
	actIndex = ref<number | undefined>(undefined),
	operates: Operate[] = ['compress', 'deploy', 'move', 'push'],
	defaultParams = {
		name: '',
		server: '',
		outDir: '',
		newPath: '',
		buildCmd: '',
		localPath: '',
		serverPath: '',
		operates: [],
	},
	params = ref<Project>({
		sign: createSign(),
		...deepClone(defaultParams),
	});

// 查询当前选中的服务器
const searchserver = ({ operates, server }: Project) => {
	if (operates.includes('deploy')) {
		for (const item of config.serverList) {
			if (item.sign === server) return item.name;
		}
	} else return '';
};

// 切换类型
const onChange = (type: Operate) => {
	const operates = params.value.operates;
	let isSelected = operates.includes(type);
	switch (type) {
		case 'compress':
			if (!isSelected && operates.includes('deploy')) {
				operates.splice(operates.indexOf('deploy'), 1);
			}
			break;
		case 'move':
			if (!isSelected && operates.includes('push')) {
				operates.splice(operates.indexOf('push'), 1);
			}
			break;
	}
};

// 判断是否禁用
const isDisabled = (type: Operate) => {
	let operates = params.value.operates;
	switch (type) {
		case 'deploy':
			return !operates.includes('compress');
		case 'push':
			return !operates.includes('move');
		default:
			return false;
	}
};

// 选择项目路径
const selectLocalPath = () => {
	getPath().then((path: string) => {
		params.value.localPath = path;
	});
};

// 选择新路径
const selectNewPath = () => {
	getPath().then((path: string) => {
		params.value.newPath = path;
	});
};

// 选择路径
const getPath = (): Promise<string> => {
	return new Promise(resolve => {
		ipcRenderer.send('open-directory-dialog', 'openDirectory');
		ipcRenderer.on('selectedItem', (e, files) => {
			files && resolve(files.replace(/\\/g, '/'));
		});
	});
};

// 获取脚本类型
const tagContent = ({ row: { operates = [] } }: any): string => {
	let str = '';
	operates.length > 0 && (str = operates[operates.length - 1]);
	return str;
};

const delData = (index: number) => {
	ElMessageBox.confirm('确定要删除该配置吗？', '提示', {
		confirmButtonText: '确定',
		cancelButtonText: '取消',
		type: 'warning',
	}).then(() => {
		config.projectList.splice(index, 1);
		ElMessage.success('删除成功');
	});
};

const saveData = () => {
	if (actIndex.value === undefined) {
		config.projectList.unshift(params.value);
	} else {
		config.projectList[actIndex.value] = params.value;
	}
	dialogVisible.value = false;
};

const editData = ({ row, $index }: { row: Project; $index: number }) => {
	actIndex.value = $index;
	params.value = row;
	dialogVisible.value = true;
};

const clearParams = () => {
	actIndex.value = undefined;
	params.value = {
		sign: createSign(),
		...deepClone(defaultParams),
	};
};
</script>

<style lang="scss" scoped>
.project-config {
	:deep(.el-tag__content) {
		font-size: 14px;
	}
	:deep(.el-select) {
		width: 100%;
	}
	:deep(.select-path) {
		input {
			cursor: default;
		}
	}
}
</style>
