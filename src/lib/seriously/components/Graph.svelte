<svelte:options immutable = {true} />

<script>
  import { entities, grabbing, graphEditor, onMount, onDestroy, signal, handleSignal, SignalKinds, relationships } from '../common/imports.ts';
  import Widget from './Widget.svelte';
  let toggledReload = false;
  let isLoading = true;

  handleSignal.connect((kinds) => {
		if (kinds.includes(SignalKinds.fetch)) {
  		isLoading = false;
    } else if (kinds.includes(SignalKinds.graph)) {
      toggledReload = !toggledReload;
    }
  });

  onDestroy( () => { window.removeEventListener('keydown'); });

  onMount(async () => {
    window.addEventListener('keydown', graphEditor.handleKeyDown);
    try {
      entities.readAllFromCloud()
    } catch (error) {
      alert('Error reading Airtable database: ' + error);
    }
  });

</script>

{#key toggledReload}
  {#if isLoading}
    <p>Loading...</p>
  {:else if entities.all.length == 0}
    <p>No entities available.</p>
  {:else}
    <div>
      <ul>
        {#each entities.all as entity}
          <li>
            <Widget entity={entity}/>
          </li>
        {/each}
      </ul>
      <p/>
    </div>
  {/if}
{/key}

<style>
  p {
    font-size: 5em;
  }
  li {
    line-height: 1.5;
  }
  ul {
    list-style: none;
  }
</style>
