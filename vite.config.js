import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [svelte()],
	server: {
		host: true,  // You can also use '0.0.0.0' to bind to all interfaces
		port: 5173,
	},
});