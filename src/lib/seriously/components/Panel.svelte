<script>
  import { cloud, hierarchy, hereID, onMount } from '../common/GlobalImports'
  import Graph from '/src/lib/seriously/components/Graph.svelte';
  // import GraphD3 from '/src/lib/seriously/components/GraphD3.svelte';
  let here = hierarchy.root;
  let isLoading = true;

  $: {
    here = hierarchy.thing_ID($hereID);
  }

  onMount(async () => {
    await cloud.readAll(async () => { isLoading = false });
    const root = hierarchy.root;
    root?.grabOnly();
    root?.becomeHere();    
  })
</script>

{#if isLoading}
  <p>Loading...</p>
{:else if !(hierarchy.root?.hasChildren ?? false)}
  <p>Nothing is available.</p>
{:else}
  <Graph here={here}/>
{/if}

<style>
  p {
    text-align: center;
    font-size: 5em;
  }
</style>
