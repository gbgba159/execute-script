import { SocksClient } from 'socks';
import { AES } from '@/utils/methods';

const fs = require('fs');
const shell = require('shelljs');
const { Client } = require('ssh2');
const archiver = require('archiver');
const SFTPClient = require('ssh2-sftp-client');
shell.config.execPath = shell.which('node').toString();

const filter = (num: number, min = 9) => {
	return num > min ? num : '0' + num;
};

// 获取日期
const getDate = () => {
	let time = new Date(),
		y = time.getFullYear(),
		d = filter(time.getDate()),
		m = filter(time.getMonth() + 1);

	return `${y}/${m}/${d}`;
};

// 获取时间
const getTime = () => {
	let time = new Date(),
		h = filter(time.getHours()),
		m = filter(time.getMinutes()),
		s = filter(time.getSeconds()),
		ms = filter(time.getMilliseconds(), 99);

	return `${h}:${m}:${s}.${ms}`;
};

// 删除文件/目录
const deleteFolder = (path: string) => {
	if (fs.existsSync(path)) {
		if (fs.statSync(path).isFile()) {
			fs.unlinkSync(path);
		} else {
			let files = [];
			files = fs.readdirSync(path);
			files.forEach((file: string) => {
				let dirPath = path + '/' + file;
				deleteFolder(dirPath);
			});
			fs.rmdirSync(path);
		}
	}
};

// 执行shell命令
const runCmd = (command: string): Promise<string> => {
	return new Promise((resolve, reject) => {
		shell.exec(command, (code: any, stdout: string, stderr: any) => {
			code === 0 ? resolve(stdout) : reject(stdout);
		});
	});
};

// 压缩
const inquiry = (path: string, fileName: string) => {
	return new Promise((resolve, reject) => {
		let output = fs.createWriteStream(`${path}.zip`);
		let archive = archiver('zip', { zlib: { level: 9 } });

		output.on('close', () => {
			let size: any = archive.pointer() / 1024 / 1024;
			size = size.toFixed(2);
			resolve(size);
		});

		output.on('end', () => reject('error'));
		archive.pipe(output);
		archive.directory(path + '/', fileName);
		archive.finalize();
		archive.on('error', (err: any) => {
			throw err;
		});
		archive.on('warning', (err: any) => {
			if (err.code === 'ENOENT') {
				reject('warn');
			} else {
				throw err;
			}
		});
	});
};

// 移动文件
const moveDir = (path: string, newPath: string) => {
	let files = fs.readdirSync(newPath);
	files.forEach((file: string) => {
		file.indexOf('.') != 0 && deleteFolder(newPath + '/' + file);
	});

	files = fs.readdirSync(path);
	files.forEach((file: string) => {
		file.indexOf('.') != 0 &&
			fs.cpSync(path + '/' + file, newPath + '/' + file, { recursive: true });
	});
};

export default class Deploy {
	server!: Server;
	project!: Project;
	events: { [key: string]: Function } = {};

	// 添加监听事件
	on(event: string, fun: Function) {
		this.events[event] = fun;
	}

	// 添加消息日志
	addMsg(msg: string, type: string = 'default', time: string = `[${getTime()}]`) {
		this.events.msg && this.events.msg({ msg, type, time });
	}

	// 添加cmd消息日志
	addCmdMsg(cmd: string) {
		let arr = cmd.split(' && ');
		arr.forEach(item => this.addMsg(item, 'run'));
	}

	// 结束任务
	end() {
		this.events.end && this.events.end();
	}

	// 开始任务
	async start({ project, server }: { project: Project; server: Server }) {
		this.server = server;
		this.project = project;

		let time: string | number = new Date().getTime(),
			{ operates, localPath, buildCmd, outDir, newPath } = project,
			outPath = localPath + '/' + outDir,
			strArr = outDir.split('/'),
			fileName = strArr[strArr.length - 1],
			compress = operates.includes('compress'),
			deploy = operates.includes('deploy'),
			move = operates.includes('move'),
			push = operates.includes('push');

		this.addMsg(`正在打包${this.project.name}...`, 'step');
		try {
			let cmd = `cd /d ${localPath} && ${buildCmd}`;
			this.addCmdMsg(cmd);
			await runCmd(cmd);
			this.addMsg('打包完成', 'success');
		} catch (err: any) {
			this.addMsg(err.toString(), 'error');
			this.addMsg('请检查项目配置', 'error');
			this.end();
			return;
		}

		if (compress) {
			this.addMsg('正在压缩...', 'step');
			try {
				let size = await inquiry(outPath, fileName);
				this.addMsg(`压缩完成，大小${size}MB。`, 'success');
			} catch (err: any) {
				switch (err) {
					case 'error':
						this.addMsg('数据源已耗尽', 'error');
						break;
					case 'warn':
						this.addMsg('stat故障和其他非阻塞错误', 'warn');
						break;
				}
				this.end();
				return;
			}
		}

		if (deploy) {
			if (server) {
				await this.deployProject(outPath, fileName);
			} else {
				this.addMsg('服务器配置错误', 'error');
			}
		}

		if (move) {
			this.addMsg('正在移动文件...', 'step');
			moveDir(outPath, newPath);
			this.addMsg('移动完成', 'success');
		}

		if (push) {
			let time = getDate() + ' ' + getTime(),
				cmd = `cd /d ${newPath} && git add . && git commit -m "auto push in ${time}" && git push`;
			this.addMsg('正在推送至git仓库...', 'step');
			this.addCmdMsg(cmd);
			try {
				let stdout = await runCmd(cmd);
				this.addMsg(stdout);
				this.addMsg('推送完成', 'success');
			} catch (error: any) {
				this.addMsg(error, 'error');
				this.end();
				return;
			}
		}

		(compress || move) && deleteFolder(outPath);
		time = (new Date().getTime() - time) / 1000;
		time = time.toFixed(2);
		let str = `执行完毕, 耗时${time}s`;
		this.addMsg(str, 'success');
		this.addMsg('', 'default', '');
		this.end();
	}

	// 创建服务器链接
	async createConnect(addMsg = false) {
		let { port, host, username, password, proxy, proxyInfo } = this.server,
			connect: any = { host, username, password: AES.decrypt(password) };

		if (proxy) {
			addMsg && this.addMsg(`正在连接代理${proxyInfo.host}:${proxyInfo.port}...`, 'step');
			try {
				let info = await SocksClient.createConnection({
					proxy: {
						type: 5,
						...proxyInfo,
						port: Number(proxyInfo.port),
						password: AES.decrypt(proxyInfo.password),
					},
					command: 'connect',
					destination: {
						host,
						port: Number(port),
					},
				});
				connect.sock = info.socket;
				addMsg && this.addMsg('连接代理成功...', 'success');
				return connect;
			} catch (error: any) {
				return Promise.reject(error);
			}
		} else {
			connect.port = port;
			return connect;
		}
	}

	// 部署项目
	deployProject(zipPath: string, fileName: string) {
		return new Promise(async (resolve, reject) => {
			let sftp: any,
				conn: any,
				connect: any,
				serverPath = this.project.serverPath;

			try {
				connect = await this.createConnect(true);
			} catch (error: any) {
				this.addMsg(error.toString(), 'error');
				this.end();
				return;
			}
			sftp = new SFTPClient();
			this.addMsg(`正在连接${this.server.name}...`, 'step');
			try {
				await sftp.connect(connect);
				this.addMsg('连接成功...', 'success');
			} catch (err: any) {
				this.addMsg(err.toString(), 'error');
				this.end();
				return;
			}

			if (!(await sftp.exists(serverPath))) {
				this.addMsg('目录不存在，请检查配置', 'error');
				this.end();
				return;
			}

			let filePath = serverPath + '/' + fileName,
				bakPath = filePath + '-bak';

			if (await sftp.exists(`${zipPath}.zip`)) {
				this.addMsg(`delete ${zipPath}.zip`, 'run');
				await sftp.delete(`${zipPath}.zip`, true);
			}

			this.addMsg('正在上传...', 'step');
			await sftp.fastPut(`${zipPath}.zip`, `${filePath}.zip`);
			this.addMsg('上传完毕', 'success');
			this.addMsg('正在部署...', 'step');

			if (await sftp.exists(bakPath)) {
				this.addMsg(`rmdir ${fileName}-bak`, 'run');
				await sftp.rmdir(bakPath, true);
			}

			if (await sftp.exists(filePath)) {
				this.addMsg(`rename ${fileName} to ${fileName}-bak`, 'run');
				await sftp.rename(filePath, bakPath);
			}

			sftp.end();

			try {
				connect = await this.createConnect();
			} catch (error: any) {
				this.addMsg(error.toString(), 'error');
				this.end();
				return;
			}
			conn = new Client();
			conn.on('ready', () => {
				let cmd = `cd ${serverPath} && unzip ${fileName}.zip && chown -R www.www ${fileName} && rm -rf ${fileName}.zip`;
				this.addCmdMsg(cmd);
				conn.exec(cmd, (err: any, stream: any) => {
					if (err) {
						this.addMsg(err.toString(), 'error');
						conn.end();
						this.end();
					}
					stream
						.on('close', (code: any, signal: any) => {
							conn.end();
							this.end();
							fs.unlinkSync(`${zipPath}.zip`);
							if (code == 0) {
								this.addMsg('部署完成', 'success');
								resolve(null);
							} else {
								this.addMsg('脚本异常退出', 'error');
							}
						})
						.on('data', (data: any) => {
							// this.addMsg(data.toString());
						})
						.stderr.on('data', (data: any) => {
							this.addMsg(data.toString());
							conn.end();
							this.end();
						});
				});
			})
				.on('error', (err: any) => {
					this.addMsg(err.toString(), 'error');
					conn.end();
					this.end();
				})
				.connect(connect);
		});
	}
}
