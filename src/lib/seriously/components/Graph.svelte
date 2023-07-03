<svelte:options immutable = {true} />

<script lang='ts'>
  import { entities, grabbing, editingID, onMount, handleSignal, SignalKinds } from '../common/imports.ts';
  import Widget from './Widget.svelte';
  let isLoading = true;

	handleSignal.connect((kinds) => {
		if (kinds.includes(SignalKinds.fetch)) {
  		isLoading = false;
    }
  });

  function editFirstGrab() {
    const entity = grabbing.firstGrabbedEntity();
    $editingID = entity?.id;

    // console.log('BEGIN:', entities.entityFor(id)?.title);
  }

  function handleKeyDown(event) {
    console.log('GRAPH:', $editingID);
    if (event.type == 'keydown') {
      if ($editingID == undefined) {
        let key = event.key;
        switch (key) {
          case 'Enter': 
            editFirstGrab();
            break;
          default:
            console.log('IGNORE');
            break;
        }
      }
    }
  }

  onMount(async () => {
    window.addEventListener('keydown', handleKeyDown);
    try {
      entities.readAllFromCloud()
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
    {#each entities.all as entity}
      <li>
        <Widget entity={entity}/>
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
