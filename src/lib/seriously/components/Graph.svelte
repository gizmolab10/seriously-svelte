<svelte:options immutable = {true} />

<script>
  import { Thing, things, relationships, grabbedIDs, editingID, hereID, reassignOrdersOf, onMount, onDestroy, signal, handleSignal, SignalKinds } from '../common/GlobalImports';
  import Children from './Children.svelte';
  import Crumbs from './Crumbs.svelte';
  let toggledReload = false;
  let here = things.root;
  let isLoading = true;
  let listener;

  function redrawGraph() { toggledReload = !toggledReload; }

	handleSignal.connect((kinds, value) => {
		if (kinds.includes(SignalKinds.relayout)) {
      here = things.thingForID($hereID);
      redrawGraph();
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
          case ' ': thing?.addChild_refresh(); redrawGraph(); break;
          case 'd': thing?.duplicate_refresh(true); redrawGraph(); break;
          case 't': alert('PARENT-CHILD SWAP'); break;
          case 'enter': thing?.edit(); break;
          case 'arrowup': moveUp_redrawGraph_saveToClouid(true, SHIFT, OPTION); break;
          case 'arrowdown': moveUp_redrawGraph_saveToClouid(false, SHIFT, OPTION); break;
          case 'arrowright': moveRight_redrawGraph_saveToClouid(thing, true, OPTION); break;
          case 'arrowleft': moveRight_redrawGraph_saveToClouid(thing, false, OPTION); break;
          case 'tab':
            thing?.duplicate_refresh(); // Title also makes this call
            redrawGraph();
            break;
          case 'delete':
          case 'backspace':
            const ids = $grabbedIDs;
            for (const id of ids) {
              const grab = things.thingForID(id);
              if (grab != null && !grab.isEditing && here != null) {
                const all = here?.children;
                let index = all.indexOf(grab);
                all.splice(index, 1);
                if (index >= all.length) {
                  index = all.length - 1;
                }
                if (index >= 0) {
                  all[index].grabOnly();
                }              
                signal([SignalKinds.widget], null);
                redrawGraph();
                await things.deleteThing_updateCloud(grab);
                await relationships.deleteRelationships_updateCloudFor(grab);
              }
            }
            break;
          }
      }
    }
  }

  function moveRight_redrawGraph_saveToClouid (thing, right, relocate) {
    thing.moveRight_refresh(right, relocate);
    // alert(thing.title + ' parent: ', + thing.firstParent.title ?? ' whoceyortatty?');
    redrawGraph();
    relationships.updateAllDirtyRelationshipsToCloud();
    things.updateAllDirtyThings_inCloud();
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

  function moveUp_redrawGraph_saveToClouid(up, expand, relocate) {
    const thing = highestGrab(up);
    thing.moveUp_refresh(up, expand, relocate);
    if (relocate) {
      redrawGraph();
      things.updateAllDirtyThings_inCloud();
    }
    redrawGraph();
  }

  onDestroy( () => { window.removeEventListener('keydown', listener); });

  onMount(async () => {
    listener = window.addEventListener('keydown', handleKeyDown);
    try {
      await relationships.readAllRelationships_fromCloud();
    } catch (error) {
      alert('Error reading Relationships database: ' + error);
    }
    try {
      await things.readAllThings_fromCloud()
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
