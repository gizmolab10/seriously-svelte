<script>
  import { relationships, things, hereID, onMount } from '../common/GlobalImports'
  import Graph from '/src/lib/seriously/components/Graph.svelte';
  // import GraphD3 from '/src/lib/seriously/components/GraphD3.svelte';
  let isLoading = true;

  async function fetchData() {
    try {
      await relationships.readAllRelationships_fromCloud();
    } catch (error) {
      console.log('Error reading Relationships database: ' + error);
    }
    try {
      await things.readAllThings_fromCloud();
      isLoading = false;
    } catch (error) {
      console.log('Error reading Things database: ' + error);
    }
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
  <p>Nothing is available ({here?.title}).</p>
{:else}
  <Graph here={things.thingForID($hereID)}/>
{/if}

<style>
  p {
    text-align: center;
    font-size: 5em;
  }
</style>
