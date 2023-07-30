<script>
  import { cloud, data, hereID, onMount } from '../common/GlobalImports'
  import Graph from '/src/lib/seriously/components/Graph.svelte';
  // import GraphD3 from '/src/lib/seriously/components/GraphD3.svelte';
  let here = data.root;
  let isLoading = true;

  $: {
    here = data.thing_ID($hereID);
  }

  onMount(async () => {
    await cloud.readAll(async () => { isLoading = false });
    // await fetchData();
    const root = data.root;
    root?.grabOnly();
    root?.becomeHere();    
  })
</script>

{#if isLoading}
  <p>Loading...</p>
{:else if !(data.root?.hasChildren ?? false)}
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
