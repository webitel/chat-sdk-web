import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
	plugins: [
		vue({
			features: {
				customElement: true,
			},
		}),
		dts({
			tsconfigPath: 'tsconfig.build.json',
			include: [
				'src',
			],
		}),
	],
	build: {
		sourcemap: true,
		lib: {
			entry: 'src/index.ts',
			formats: [
				'es',
			],
			fileName: 'index',
		},
	},
	resolve: {
		alias: {
			lodash: 'lodash-es',
		},
	},
});
