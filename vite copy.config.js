import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
	define: {
		'process.env.NODE_ENV': JSON.stringify('production'),
	},
	plugins: [
		visualizer({
			filename: './dist/stats.html',
			open: false,					// Do not automatically open the file in your browser
		}),
		svelte({
			compilerOptions: {
				dev: false,					// Disable development mode
			},
		}),
	],
	build: {
		sourcemap: true,					// Generate detailed source maps
		minify: 'esbuild',					// Ensure esbuild is used for minification
		esbuild: {
			target: 'esnext',				// Target modern JavaScript
		},
		lib: {
			entry: './src/lib/js/main.js',	// Entry point for your app
			name: 'WebSeriouslyBundle',		// Global name for the library
			formats: ['iife'],    		  	// Use "iife" for browser-friendly bundles
			fileName: 'webseriously', 		// Output file name (webseriously.iife.js)
		},
		rollupOptions: {
			external: [],					// Do not exclude the `svelte` runtime
			output: {
				exports: 'named',
				sourcemap: 'inline',		// Inline source maps for easier debugging
				globals: {
					svelte: 'Svelte',		// Ensure all dependencies are included in the bundle
					'svelte/internal': 'svelteInternal', // Ensure proper bundling
				},
			},
		},
	},
});
