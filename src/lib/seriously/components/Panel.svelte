<script>
  import { cloud, hierarchy, onMount } from '../common/GlobalImports'
  import Graph from '/src/lib/seriously/components/Graph.svelte';
  // import GraphD3 from '/src/lib/seriously/components/GraphD3.svelte';
  let isLoading = true;

  onMount(async () => {
    cloud.readAll(async () => { 
      isLoading = false;
      const root = hierarchy.root;
      root?.grabOnly();
      root?.becomeHere();
    });    
  })

</script>

{#if isLoading}
  <p>Loading Seriously...</p>
{:else if !(hierarchy.root?.hasChildren ?? false)}
  <p>Nothing is available.</p>
{:else}
  <Graph/>
{/if}

<style>
  p {
    text-align: center;
    font-size: 5em;
  }
</style>
