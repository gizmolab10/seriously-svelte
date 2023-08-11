<script>
  import { cloudEditor, hierarchy, onMount } from '../common/GlobalImports'
  onMount(async () => { hierarchy.setup(() => { isLoading = false; }) })
  import Panel from './Panel.svelte';
  const build = 18; // eliminate signals
  let isLoading = true;
</script>

{#if isLoading}
  <p>Welcome to Seriously</p>
{:else if hierarchy.hasNothing}
  <p>Nothing is available.</p>
{:else}
  <Panel build={build}/>
{/if}

<style>
  p {
    text-align: center;
    font-size: 3em;
  }
</style>
