import { viteSingleFile } from "vite-plugin-singlefile"
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import sveltePreprocess from 'svelte-preprocess'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
	plugins: [
		svelte({
			compilerOptions: {
				dev: command === 'serve',
				immutable: true,
				hydratable: true,
				enableSourcemap: true
			},
			extensions: ['.svelte'],
			preprocess: sveltePreprocess({
				typescript: true,
				sourceMap: true
			}),
			experimental: {
				inspector: true
			}
		}),
		...(command === 'build' ? [viteSingleFile()] : [])
	],
	server: {
		host: true,  // You can also use '0.0.0.0' to bind to all interfaces
		port: 5173,
		hmr: false
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src')
		},
		extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.svelte']
	},
	build: {
		rollupOptions: {
			output: {
				entryFileNames: 'assets/[name].js',
				chunkFileNames: 'assets/[name].js',
				assetFileNames: 'assets/[name].[ext]',
			},
			external: [/\/aside\//, /\/docs\//, /\/bubble\//]
		},
	},
}));