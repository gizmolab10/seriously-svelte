<script>
  import { cloud, hierarchy, onMount } from '../common/GlobalImports'
  import Panel from './Panel.svelte';
  let isLoading = true;

  onMount(async () => {
    cloud.readAll(async () => { 
      isLoading = false;
    });    
  })

</script>

{#if isLoading}
  <p>Welcome to Seriously (10)</p>
{:else if !(hierarchy.root?.hasChildren ?? false)}
  <p>Nothing is available.</p>
{:else}
  <Panel/>
{/if}

<style>
  p {
    text-align: center;
    font-size: 5em;
  }
</style>
