import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess'

const config = {
  preprocess: vitePreprocess(),
  preprocess: sveltePreprocess({
    scss: {
      prependData: '@use "src/styles/variables.scss";'
    }
  })
}

export default config;
