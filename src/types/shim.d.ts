/**
 * 项目操作
 */
declare type Operate = 'compress' | 'deploy' | 'move' | 'push';

/**
 * 项目配置
 */
declare interface Project {
	/** 项目名称 */
	name: string;
	/** 项目签名 */
	sign: string;
	/** 服务器 */
	server: string;
	/** 输出目录 */
	outDir: string;
	/** 新路径 */
	newPath: string;
	/** 构建命令 */
	buildCmd: string;
	/** 本地路径 */
	localPath: string;
	/** 服务器路径 */
	serverPath: string;
	/** 操作列表 */
	operates: Operate[];
}

/**
 * 代理服务器配置
 */
declare interface ProxyInfo {
	/** 服务器主机 */
	host: string;
	/** 服务器端口 */
	port: string;
	/** 用户名 */
	userId: string;
	/** 密码 */
	password: string;
}

/**
 * 服务器配置
 */
declare interface Server {
	/** 服务器名称 */
	name: string;
	/** 服务器主机 */
	host: string;
	/** 服务器端口 */
	port: string;
	/** 服务器签名 */
	sign: string;
	/** 是否使用代理 */
	proxy: boolean;
	/** 用户名 */
	username: string;
	/** 密码 */
	password: string;
	/** 代理服务器 */
	proxyInfo: ProxyInfo;
}

/**
 * 配置文件
 */
declare interface Config {
	/** 服务器列表 */
	serverList: Server[];
	/** 项目列表 */
	projectList: Project[];
}
