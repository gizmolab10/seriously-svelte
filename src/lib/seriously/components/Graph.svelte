<svelte:options immutable = {true} />

<script lang='ts'>
  import { WorkState, states, setWorkState } from '../managers/States';
  import { fetchCompleted } from '../managers/Signals';
  import { grabbing } from '../managers/Grabbing';
  import { editingID } from '../managers/Stores';
  import { entities } from '../managers/Entities';
  import { onMount } from 'svelte';
  import Widget from './Widget.svelte';
  import Entity from '../data/Entity';
  let isLoading = true;

  fetchCompleted.connect((text, Object) => {
		isLoading = false;
  });

  function handleKeyDown(event) {
    let key = event.key;
    if (event.type == 'keydown') {
      let id = grabbing.firstGrab();
      switch (event.key) {
        case 'Enter': $editingID = id;
        default: break;
      }
      if (states.workingState == WorkState.idea) {
        event.target.blur();
        setWorkState(WorkState.graph);
      } else {
        
      }
    }
  }

  onMount(async () => {
    window.addEventListener('keydown', handleKeyDown);
    try {
      entities.fetchAll()
    } catch (error) {
      console.error('Error reading Airtable database:', error);
    }
  });

</script>

{#if isLoading}
  <p>Loading...</p>
{:else if entities.all.length == 0}
  <p>No entities available.</p>
{:else}
<div>
  <ul>
    {#each entities.all as idea}
      <li>
        <Widget idea={idea}/>
      </li>
    {/each}
  </ul>
  <p/>
</div>
{/if}

<style>
  li {
    line-height: 2.3;
  }
  ul {
    list-style: none;
  }
</style>
