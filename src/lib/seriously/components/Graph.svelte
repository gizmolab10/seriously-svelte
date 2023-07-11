<svelte:options immutable = {true} />

<script>
  import { entities, grabbing, treeBrowser, editingID, onMount, onDestroy, handleSignal, SignalKinds } from '../common/imports.ts';
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
  }

  function handleKeyDown(event) {
    if (event.type == 'keydown') {
      let key = event.key;
      switch (key) {
        case 'Enter':
          if ($editingID == undefined) {
            editFirstGrab(); 
          }
          break;
        case 'ArrowUp':
          treeBrowser.moveGrabUp(true);
          break;
        case 'ArrowDown':
          treeBrowser.moveGrabUp(false);
          break;
        default: break;
      }
    }
  }

  onMount(async () => {
    window.addEventListener('keydown', handleKeyDown);
    try {
      entities.readAllFromCloud()
    } catch (error) {
      alert('Error reading Airtable database: ' + error);
    }
  });

  onDestroy( () => {
    window.removeEventListener('keydown');
  })

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
  p {
    font-size: 5em;
  }
  li {
    line-height: 2.3;
  }
  ul {
    list-style: none;
  }
</style>
