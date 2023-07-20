<svelte:options immutable = {true} />

<script>
  import { Thing, things, relationships, grabbedIDs, editingID, hereID, swap, reassignOrdersOf, onMount, onDestroy, signal, SignalKinds } from '../common/GlobalImports';
  import Crumbs from './Crumbs.svelte';
  import Children from './Children.svelte';
  let toggledReload = false;
  let isLoading = true;
  let hasGrab = false;
  let listener;

  $: { hasGrab = ($grabbedIDs != null && $grabbedIDs.length > 0) }

  async function handleKeyDown(event) {
    if (event.type == 'keydown', hasGrab) {
      let id = $grabbedIDs[0];
      const thing = things.thingFor(id);
      let OPTION = event.altKey;
      let key = event.key.toLowerCase();
      // console.log('KEY:', key);
      let SHIFT = (event.key != key || event.shiftKey);
      if ($editingID != null) {
        switch (key) {
          case 'Enter':
          case 'Tab': event.preventDefault();     // destroy event, Title will handle it
        }
      } else {
        switch (key) {
          case ' ':
            console.log('CHILD');
            break;
          case 'd':
            console.log('DUPLICATE');
            break;
          case 'arrowup': await moveUpAndRedraw(true, OPTION); break;
          case 'arrowdown': await moveUpAndRedraw(false, OPTION); break;
          case 'arrowright': await thing.moveRightAndRedraw(true, OPTION); break;
          case 'arrowleft': await thing.moveRightAndRedraw(false, OPTION); break;
          case 'tab':
            await thing.addSiblingAndRedraw(); // Title also makes this call
            toggledReload = !toggledReload;
            break;
          case 'enter': 
            editingID.set(id);
            break;
          case 'delete':
          case 'backspace':
            if (thing != null && !thing.isEditing && things.root != null) {
              const all = things.root?.children;
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

  async function moveUpAndRedraw(up, relocate) {
    if (hasGrab) {
      const id = $grabbedIDs[0];
      const child = things.thingFor(id);
      const siblings = child?.siblings;
      if (siblings != null) {
        const index = siblings.indexOf(child);
        const newIndex = index.increment(!up, siblings.length - 1);
        if (newIndex.between(-1, siblings.length, false)) {
          const newGrab = siblings[newIndex];
          if (relocate) {
            swap(index, newIndex, siblings);
            reassignOrdersOf(siblings);
            signal([SignalKinds.widget], null);
            toggledReload = !toggledReload;
            await things.updateThingsInCloud(siblings);
          } else {
            newGrab.grabOnly();
            signal([SignalKinds.widget], null);
          }
        }
      }
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
  {:else if (things.root == null)}
    <p>Nothing is available.</p>
  {:else}
    <Children here={things.root}/>
  {/if}
{/key}

<style>
  p {
    text-align: center;
    font-size: 5em;
  }
</style>
