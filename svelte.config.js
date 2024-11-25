import sveltePreprocess from 'svelte-preprocess';

export default {
  preprocess: sveltePreprocess({
    scss: {
      prependData: ''
    },
  }),
  compilerOptions: {
    compatibility: {
      componentApi: 4, // Enable Svelte 4-style component API
    },
  },
}
