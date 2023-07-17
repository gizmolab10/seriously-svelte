<svelte:options immutable = {true} />

<script>
  import { Thing, things, relationships, grabbing, graphEditor, onMount, onDestroy, signal, handleSignal, SignalKinds } from '../common/imports.ts';
  import ChildrenWidgets from './ChildrenWidgets.svelte';
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
  {:else if (things.main == null || things.main?.children.length == 0)}
    <p>Nothing is available.</p>
  {:else}
    <ChildrenWidgets/>
  {/if}
{/key}

<style>
  p {
    text-align: center;
    font-size: 5em;
  }
</style>
