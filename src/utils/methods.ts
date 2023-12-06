import CryptoJS from 'crypto-js';

/** AES加密解密 */
export const AES = {
	secretKey: {
		key: CryptoJS.enc.Utf8.parse('1234567898765432'),
		iv: CryptoJS.enc.Utf8.parse('9876543212345678'),
	},
	encrypt(data: string): string {
		data = String(data);
		let { key, iv } = this.secretKey;

		return CryptoJS.AES.encrypt(data, key, {
			iv,
			mode: CryptoJS.mode.CBC,
			padding: CryptoJS.pad.Pkcs7,
		}).toString();
	},
	decrypt(data: string): string {
		let { key, iv } = this.secretKey;

		return CryptoJS.AES.decrypt(data, key, {
			iv,
			mode: CryptoJS.mode.CBC,
			padding: CryptoJS.pad.Pkcs7,
		}).toString(CryptoJS.enc.Utf8);
	},
};

/** 生成随机标识 */
export const createSign = () => {
	let str = Math.random() + '';
	str += new Date().getTime();
	return btoa(str);
};

/**
 * 深克隆
 * @param data - 要克隆的数据
 * @returns  克隆完成的数据
 */
export const deepClone = <T>(data: T): T => {
	let cloneData: any;
	switch (Object.prototype.toString.call(data)) {
		case '[object Map]':
			cloneData = new Map();
			(data as Map<any, any>).forEach((val: any, key: any) => {
				cloneData.set(key, deepClone(val));
			});
			break;
		case '[object Array]':
			cloneData = [];
			(data as Array<any>).forEach((val: any) => {
				cloneData.push(deepClone(val));
			});
			break;
		case '[object Object]':
			cloneData = {};
			for (let key in data) cloneData[key] = deepClone(data[key]);
			break;
		default:
			cloneData = data;
	}
	return cloneData;
};

/** 防抖 */
export const debounce = (fun: Function, delay = 250) => {
	let timer: any;
	return function (this: any, ...args: any) {
		clearTimeout(timer);
		timer = setTimeout(() => fun.apply(this, args), delay);
	};
};
