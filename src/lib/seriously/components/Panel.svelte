<script>
  import { relationships, things, hereID, onMount } from '../common/GlobalImports'
  import Graph from '/src/lib/seriously/components/Graph.svelte';
  // import GraphD3 from '/src/lib/seriously/components/GraphD3.svelte';
  let here = things.root;
  let isLoading = true;

  async function fetchData() {
    try {
      await relationships.cloud_relationships_readAll();
    } catch (error) {
      console.log('Error reading Relationships database: ' + error);
    }
    try {
      await things.cloud_things_readAll();
      isLoading = false;
    } catch (error) {
      console.log('Error reading Things database: ' + error);
    }
  }

  $: {
    here = things.thing_ID($hereID);
  }

  onMount(async () => {
    await fetchData();
    const root = things.root;
    root?.grabOnly();
    root?.becomeHere();    
  })
</script>

{#if isLoading}
  <p>Loading...</p>
{:else if !(things.root?.hasChildren ?? false)}
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
