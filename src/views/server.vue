<template>
	<div class="server-config">
		<div class="header">
			<h5>云端配置</h5>
			<el-button @click="dialogVisible = true">新增云端</el-button>
		</div>

		<el-table :data="config.serverList" stripe style="width: 100%" class="table">
			<el-table-column width="140px" prop="name" label="云端名" />
			<el-table-column label="云端地址">
				<template #default="scope">
					<span class="desc">{{ scope.row.host + ':' + scope.row.port }}</span>
				</template>
			</el-table-column>
			<el-table-column label="代理地址">
				<template #default="scope">
					<span class="desc">{{ getProxy(scope.row) }}</span>
				</template>
			</el-table-column>
			<el-table-column prop="username" label="用户名" />
			<el-table-column width="120px" fixed="right" label="操作">
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
				<h5>{{ actIndex === undefined ? '新增云端配置' : '编辑云端配置' }}</h5>
			</template>
			<el-form label-width="100px" :model="params" style="max-width: 500px">
				<el-form-item label="云端名：">
					<el-input v-model="params.name" placeholder="输入云端名" />
				</el-form-item>
				<el-form-item label="云端地址：">
					<el-input v-model="params.host" placeholder="输入云端地址" />
				</el-form-item>
				<el-form-item label="端口：">
					<el-input v-model="params.port" placeholder="输入云端端口" />
				</el-form-item>
				<el-form-item label="用户名：">
					<el-input v-model="params.username" placeholder="输入登录用户名" />
				</el-form-item>
				<el-form-item label="密码：">
					<el-input
						type="password"
						v-model="params.password"
						placeholder="输入登录密码"
					/>
				</el-form-item>
				<el-form-item label="使用代理：">
					<el-switch v-model="params.proxy" />
				</el-form-item>
				<keep-alive>
					<template v-if="params.proxy">
						<el-form-item label="代理地址：">
							<el-input
								v-model="params.proxyInfo.host"
								placeholder="输入代理服务器地址"
							/>
						</el-form-item>
						<el-form-item label="代理端口：">
							<el-input
								v-model="params.proxyInfo.port"
								placeholder="输入代理服务器端口"
							/>
						</el-form-item>
						<el-form-item label="用户名：">
							<el-input
								v-model="params.proxyInfo.userId"
								placeholder="输入代理服务器用户名"
							/>
						</el-form-item>
						<el-form-item label="密码：">
							<el-input
								type="password"
								v-model="params.proxyInfo.password"
								placeholder="输入代理服务器密码"
							/>
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
import { useConfig } from '@/stores/config';
import { ElMessage, ElMessageBox } from 'element-plus';
import { createSign, deepClone, AES } from '@/utils/methods';

const config = useConfig(),
	dialogVisible = ref(false),
	actIndex = ref<undefined | number>(undefined),
	defaultParams = {
		name: '',
		host: '',
		port: '',
		proxy: false,
		username: '',
		password: '',
		proxyInfo: {
			port: '',
			host: '',
			userId: '',
			password: '',
		},
	},
	params = ref<Server>({
		sign: createSign(),
		...deepClone(defaultParams),
	});

// 输出代理地址
const getProxy = ({ proxyInfo: { host, port }, proxy }: Server): string => {
	return proxy ? `${host}:${port}` : '';
};

const delData = (index: number) => {
	ElMessageBox.confirm('确定要删除该配置吗？', '提示', {
		confirmButtonText: '确定',
		cancelButtonText: '取消',
		type: 'warning',
	}).then(() => {
		config.serverList.splice(index, 1);
		ElMessage.success('删除成功');
	});
};

const saveData = () => {
	let _params = deepClone(params.value);
	let {
		password,
		proxyInfo: { password: proxyPwd },
	} = _params;

	_params.password = AES.encrypt(password);
	_params.proxyInfo.password = AES.encrypt(proxyPwd);

	if (actIndex.value === undefined) {
		config.serverList.unshift(_params);
	} else {
		config.serverList[actIndex.value] = _params;
	}
	dialogVisible.value = false;
};

const editData = ({ row, $index }: { row: Server; $index: number }) => {
	let _params = deepClone(row);
	let {
		password,
		proxyInfo: { password: proxyPwd },
	} = _params;

	_params.password = AES.decrypt(password);
	_params.proxyInfo.password = AES.decrypt(proxyPwd);

	actIndex.value = $index;
	params.value = _params;
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
