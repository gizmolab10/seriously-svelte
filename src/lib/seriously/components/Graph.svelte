<svelte:options immutable = {true} />

<script>
  import { Thing, things, relationships, grabbing, graphEditor, onMount, onDestroy, signal, handleSignal, SignalKinds } from '../common/Imports';
  import Crumbs from './Crumbs.svelte';
  import Children from './Children.svelte';
  let toggledReload = false;
  let isLoading = true;
  let listener;

  handleSignal.connect((kinds) => {
		if (kinds.includes(SignalKinds.graph)) {
      toggledReload = !toggledReload;
    }
  });

  onDestroy( () => { window.removeEventListener('keydown', listener); });

  onMount(async () => {
    listener = window.addEventListener('keydown', graphEditor.handleKeyDown);
    try {
      await relationships.readAllRelationshipsFromCloud();
    } catch (error) {
      alert('Error reading Relationships database: ' + error);
    }
    try {
      await things.readAllThingsFromCloud()
  		isLoading = false;
    } catch (error) {
      alert('Error reading Things database: ' + error);
    }
  });

  </script>

{#key toggledReload}
  {#if isLoading}
    <p>Loading...</p>
  {:else if (things.root == null)}
    <p>Nothing is available.</p>
  {:else}
    <Crumbs/>
    <Children here={things.root}/>
  {/if}
{/key}

<style>
  p {
    text-align: center;
    font-size: 5em;
  }
</style>
