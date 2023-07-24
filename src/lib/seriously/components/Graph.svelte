<svelte:options immutable = {true} />

<script>
  import { Thing, things, relationships, grabbedIDs, editingID, hereID, reassignOrdersOf, onMount, onDestroy, signal, handleSignal, SignalKinds } from '../common/GlobalImports';
  import Children from './Children.svelte';
  import Crumbs from './Crumbs.svelte';
  let toggledReload = false;
  let here = things.root;
  let isLoading = true;
  let listener;

	handleSignal.connect((kinds, value) => {
		if (kinds.includes(SignalKinds.relayout)) {
      here = things.thingForID($hereID);
      // alert('HERE: ' + here?.title);
      toggledReload = !toggledReload;
    }
  })

  async function handleKeyDown(event) {
    if (event.type == 'keydown', ($grabbedIDs?.length ?? 0) > 0) {
      const id = $grabbedIDs[0];
      const thing = things.thingForID(id);
      const key = event.key.toLowerCase();
      const OPTION = event.altKey;
      const SHIFT = event.shiftKey;
      if ($editingID != null) {
        if ([' ', 'd', 'tab', 'enter'].includes(key)) { return; }
      } else {
        switch (key) {
          case ' ': alert('CHILD'); break;
          case 'd': thing.addSiblingAsDuplicateAndRedraw(true); break;
          case 't': alert('PARENT-CHILD SWAP'); break;
          case 'enter': thing.edit(); break;
          case 'arrowup': moveUpRedrawAndSaveToClouid(true, SHIFT, OPTION); break;
          case 'arrowdown': moveUpRedrawAndSaveToClouid(false, SHIFT, OPTION); break;
          case 'arrowright': moveRightRedrawAndSaveToClouid(thing, true, OPTION); break;
          case 'arrowleft': moveRightRedrawAndSaveToClouid(thing, false, OPTION); break;
          case 'tab':
            thing.addSiblingAsDuplicateAndRedraw(); // Title also makes this call
            toggledReload = !toggledReload;
            break;
          case 'delete':
          case 'backspace':
            if (thing != null && !thing.isEditing && here != null) {
              const all = here?.children;
              let index = all.indexOf(thing);
              all.splice(index, 1);
              if (index >= all.length) {
                index = all.length - 1;
              }
              if (index >= 0) {
                all[index].grabOnly();
              }              
              signal([SignalKinds.widget], null);
              toggledReload = !toggledReload;
              await relationships.deleteRelationshipsFromCloudFor(thing);
              await things.deleteThingFromCloud(thing);
            }
            break;
          }
      }
    }
  }

  function moveRightRedrawAndSaveToClouid (thing, right, relocate) {
    thing.moveRightAndRedraw(right, relocate);
    // alert(thing.title + ' parent: ', + thing.firstParent.title ?? ' whoceyortatty?');
    toggledReload = !toggledReload;
    relationships.updateAllDirtyRelationshipsToCloud();
    things.updateAllDirtyThingsInCloud();
  }

  function highestGrab(up) {
    const ids = $grabbedIDs;
    let grabs = things.thingsForIDs(ids);
    grabs.sort((a, b) => { return a.order - b.order; });
    if (up) {
      return grabs[0];
    } else {
      return grabs[grabs.length - 1];
    }
  }

  function moveUpRedrawAndSaveToClouid(up, expand, relocate) {
    const thing = highestGrab(up);
    thing.moveUpAndRedraw(up, expand, relocate);
    if (relocate) {
      toggledReload = !toggledReload;
      things.updateAllDirtyThingsInCloud();
    }
  }

  onDestroy( () => { window.removeEventListener('keydown', listener); });

  onMount(async () => {
    listener = window.addEventListener('keydown', handleKeyDown);
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
  {:else if (here == null || !here.hasChildren)}
    <p>Nothing is available ({here?.title}).</p>
  {:else}
    <Crumbs/>
    <Children parent={here}/>
  {/if}
{/key}

<style>
  p {
    text-align: center;
    font-size: 5em;
  }
</style>
