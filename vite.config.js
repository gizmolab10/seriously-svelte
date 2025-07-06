import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [svelte()],
	server: {
		host: true,  // You can also use '0.0.0.0' to bind to all interfaces
		port: 5173,
	},
	css: {
		preprocessorOptions: {
			scss: {
				additionalData: `@import "./src/styles/variables.scss";`,
				// Add any other SASS options here
			}
		}
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
		sourcemap: true,
		minify: false,
		lib: {
			entry: 'src/main.ts',
			formats: ['iife'], // or 'umd'
			name: 'WebSeriouslyBubblePluginApp',
			fileName: 'bundle'
		},
	},
});