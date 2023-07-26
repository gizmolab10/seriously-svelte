<svelte:options immutable = {true} />

<script>
  import { Thing, things, relationships, grabbedID, grabbedIDs, editingID, hereID, onMount, onDestroy, signal, handleSignal, Signals as Signals, seriouslyGlobals } from '../common/GlobalImports';
  import Children from './Children.svelte';
  import Crumbs from './Crumbs.svelte';
  export let here;
  let isLoading = true;
  let listener;

  async function handleKeyDown(event) {
    if (event.type == 'keydown' && event.key != undefined && $grabbedID != null) {
      let thing = things.thingForID($grabbedID);
      const key = event.key.toLowerCase();
      const OPTION = event.altKey;
      const SHIFT = event.shiftKey;
      if ($editingID != null) {
        if ([' ', 'd', 'tab', 'enter', 'delete', 'backspace'].includes(key)) { return; }
      } else {
        switch (key) {
          case ' ': thing?.addChild_refresh(); toggledReload = !toggledReload; break;
          case 'd': thing?.duplicate_refresh(true); toggledReload = !toggledReload; break;
          case 't': alert('PARENT-CHILD SWAP'); break;
          case 'enter': thing?.edit(); break;
          case 'arrowup': moveUp_redrawGraph_saveToCloud(true, SHIFT, OPTION); break;
          case 'arrowdown': moveUp_redrawGraph_saveToCloud(false, SHIFT, OPTION); break;
          case 'arrowright': moveRight_redrawGraph_saveToCloud(thing, true, OPTION); break;
          case 'arrowleft': moveRight_redrawGraph_saveToCloud(thing, false, OPTION); break;
          case 'tab':
            thing?.duplicate_refresh(); // Title also makes this call
            break;
          case 'delete':
          case 'backspace':
            const ids = $grabbedIDs;
            for (const id of ids) {
              thing = things.thingForID(id);
              if (thing != null && !thing.isEditing && here != null) {
                const all = thing.firstParent?.children;
                let index = all.indexOf(thing);
                all.splice(index, 1);
                if (all.length == 0) {
                  thing.firstParent.firstParent.becomeHere();
                } else {
                  if (index >= all.length) {
                    index = all.length - 1;
                  }
                  if (index >= 0) {
                    all[index].grabOnly();
                  }              
                }
                signal(Signals.widgets);
                await things.deleteThing_updateCloud(thing);
                await relationships.deleteRelationships_updateCloudFor(thing);
              }
            }
            break;
          }
      }
    }
  }

  function moveRight_redrawGraph_saveToCloud (thing, right, relocate) {
    thing.moveRight_refresh(right, relocate);
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

  function moveUp_redrawGraph_saveToCloud(up, expand, relocate) {
    const thing = highestGrab(up);
    thing.moveUp_refresh(up, expand, relocate);
    if (relocate) {
      things.updateAllDirtyThings_inCloud();
    }
  }

  onDestroy( () => { window.removeEventListener('keydown', listener); });
  onMount(async () => { listener = window.addEventListener('keydown', handleKeyDown); });

</script>

<Crumbs grab={things.thingForID($grabbedID)}/>
<Children parent={here}/>
