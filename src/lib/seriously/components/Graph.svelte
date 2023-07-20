<svelte:options immutable = {true} />

<script>
  import { Thing, things, relationships, grabbing, editingID, hereID, swap, reassignOrdersOf, onMount, onDestroy, signal, SignalKinds } from '../common/Imports';
  import Crumbs from './Crumbs.svelte';
  import Children from './Children.svelte';
  let toggledReload = false;
  let isLoading = true;
  let listener;

  async function handleKeyDown(event) {
    if (event.type == 'keydown') {
      const thing = grabbing.firstGrabbedThing;
      let id = grabbing.firstGrab ?? null;
      let OPTION = event.altKey;
      let key = event.key.toLowerCase();
      console.log('KEY:', key);
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
          case 'arrowright': moveRightAndRedraw(true, OPTION); break;
          case 'arrowleft': moveRightAndRedraw(false, OPTION); break;
          case 'tab':
            addSiblingAndRedraw(); // Title also makes this call
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
                grabbing.grabOnly(all[index]);
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

  async function addSiblingAndRedraw() {
    const parentID = grabbing.firstGrabbedThing?.firstParent?.id ?? seriouslyGlobals.rootID;
    const sibling = new Thing(createCloudID(), seriouslyGlobals.defaultTitle, 'blue', 't', 1.0);
    grabbing.grabOnly(sibling);
    editingID.set(sibling.id);
    await relationships.createAndSaveUniqueRelationshipMaybe(RelationshipKind.parent, sibling.id, parentID);
    signal([SignalKinds.widget], null);
    toggledReload = !toggledReload;
    await things.createThingInCloud(sibling);
  }

  async function moveRightAndRedraw(right, relocate) {
    const thing = grabbing.firstGrabbedThing;
    if (thing != null) {
      if (relocate) {
        
      } else {
        thing.browseRightAndRedraw(right);
      }
    }
  }

  async function moveUpAndRedraw(up, relocate) {
    if (grabbing.hasGrab) {
      const child = grabbing.firstGrabbedThing;
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
            grabbing.grabOnly(newGrab);
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
