import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [svelte()],
	server: {
		host: true,  // You can also use '0.0.0.0' to bind to all interfaces
		port: 5173,
	},
});