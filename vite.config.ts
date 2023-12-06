import { rmSync } from 'fs';
import pkg from './package.json';
import { defineConfig } from 'vite';
import path, { resolve } from 'path';
import vue from '@vitejs/plugin-vue';
import Icons from 'unplugin-icons/vite';
import electron from 'vite-plugin-electron';
import AutoImport from 'unplugin-auto-import/vite';
import IconsResolver from 'unplugin-icons/resolver';
import renderer from 'vite-plugin-electron-renderer';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';

const sourcemap = !!process.env.VSCODE_DEBUG;
const pathSrc = path.resolve(__dirname, 'src');
const isBuild = process.argv.slice(2).includes('build');
rmSync('dist-electron', { recursive: true, force: true });

// https://vitejs.dev/config/
export default defineConfig({
	css: {
		preprocessorOptions: {
			scss: {
				additionalData: "@import '@/assets/styles/common.scss';",
			},
		},
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, 'src'),
		},
	},
	optimizeDeps: {
		exclude: ['ssh2'],
		esbuildOptions: {
			target: 'es2020',
		},
	},
	plugins: [
		vue(),
		AutoImport({
			imports: ['vue'],
			resolvers: [
				ElementPlusResolver(),
				IconsResolver({
					prefix: 'Icon',
				}),
			],
			dts: path.resolve(pathSrc, 'auto-imports.d.ts'),
		}),
		Components({
			resolvers: [
				ElementPlusResolver(),
				IconsResolver({
					enabledCollections: ['ep'],
				}),
			],
			dts: path.resolve(pathSrc, 'components.d.ts'),
		}),
		Icons({
			autoInstall: true,
		}),
		electron([
			{
				entry: 'electron/main/index.ts',
				onstart(options) {
					if (process.env.VSCODE_DEBUG) {
						console.log(/* For `.vscode/.debug.script.mjs` */ '[startup] Electron App');
					} else {
						options.startup();
					}
				},
				vite: {
					build: {
						sourcemap,
						minify: isBuild,
						outDir: 'dist-electron/main',
						rollupOptions: {
							external: Object.keys(pkg.dependencies),
						},
					},
				},
			},
			{
				entry: 'electron/preload/index.ts',
				onstart(options) {
					options.reload();
				},
				vite: {
					build: {
						sourcemap,
						minify: isBuild,
						outDir: 'dist-electron/preload',
						rollupOptions: {
							external: Object.keys(pkg.dependencies),
						},
					},
				},
			},
		]),
		renderer({
			nodeIntegration: true,
		}),
	],
	server: process.env.VSCODE_DEBUG
		? (() => {
				const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL);
				return {
					host: url.hostname,
					port: +url.port,
				};
		  })()
		: undefined,
	clearScreen: false,
});
