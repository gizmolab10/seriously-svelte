<svelte:options immutable = {true} />

<script>
  import { Thing, things, grabbing, graphEditor, onMount, onDestroy, signal, handleSignal, SignalKinds, relationships } from '../common/imports.ts';
  import ChildrenWidgets from './ChildrenWidgets.svelte';
  let toggledReload = false;
  let isLoading = true;
  let listener;

  handleSignal.connect((kinds) => {
		if (kinds.includes(SignalKinds.fetch)) {
  		isLoading = false;
    } else if (kinds.includes(SignalKinds.graph)) {
      toggledReload = !toggledReload;
    }
  });

  onDestroy( () => { window.removeEventListener('keydown', listener); });

  onMount(async () => {
    listener = window.addEventListener('keydown', graphEditor.handleKeyDown);
    try {
      things.readAllFromCloud()
    } catch (error) {
      alert('Error reading Airtable database: ' + error);
    }
  });

  </script>

{#key toggledReload}
  {#if isLoading}
    <p>Loading...</p>
  {:else if (things.main == null || things.main?.children.length == 0)}
    <p>No things available.</p>
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
