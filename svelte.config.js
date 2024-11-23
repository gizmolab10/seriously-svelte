import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';

export default {
  preprocess: vitePreprocess(),
  preprocess: sveltePreprocess({
    scss: {
      prependData: ''
    },
  }),
  kit: {
    package: {
      dir: 'package',
      emitTypes: true, // Generate TypeScript declarations
      exports: (file) => {
        return ['index.js', 'SeriouslyApp.svelte'].includes(file);
      },
    },
  },
}
