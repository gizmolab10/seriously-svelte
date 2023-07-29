<script>
  import { Thing, things, relationships, grabbedID, grabbedIDs, editingID, onMount, onDestroy, sortAccordingToOrder, signal, handleSignal, Signals, constants } from '../common/GlobalImports';
  import Children from './Children.svelte';
  import Crumbs from './Crumbs.svelte';
  export let here;
  let isLoading = true;
  let listener;

  async function handleKeyDown(event) {
    if ($grabbedID == null)     { alert('no grabs'); return; }
    if (event.key == undefined) { alert('no key for ' + event.type); return; }
    if ($editingID != null)     { return; }
    if (event.type == 'keydown') {
      let thing = things.thingForID($grabbedID);
      const key = event.key.toLowerCase();
      const OPTION = event.altKey;
      const SHIFT = event.shiftKey;
      switch (key) {
        case ' ':          addChildTo_redrawGraph_saveToCloud(thing); break;
        case 'd':          thing?.duplicate_refresh_saveToCloud(); break;
        case 't':          alert('PARENT-CHILD SWAP'); break;
        case 'tab':        addChildTo_redrawGraph_saveToCloud(thing?.firstParent); break; // Title also makes this call
        case 'enter':      thing?.edit(); break;
        case 'arrowup':    moveUp_redrawGraph_saveToCloud(true, SHIFT, OPTION); break;
        case 'arrowdown':  moveUp_redrawGraph_saveToCloud(false, SHIFT, OPTION); break;
        case 'arrowright': moveRight_redrawGraph_saveToCloud(thing, true, OPTION); break;
        case 'arrowleft':  moveRight_redrawGraph_saveToCloud(thing, false, OPTION); break;
        case 'delete':
        case 'backspace':  deleteGrabs_redrawGraph_saveToCloud(); break;
      }
    }
  }

  function addChildTo_redrawGraph_saveToCloud(parent) {
    parent.addChild_refresh();
    parent.pingHere();
  }

  function deleteGrabs_redrawGraph_saveToCloud() {
    const ids = $grabbedIDs;
    for (const id of ids) {
      const grab = things.thingForID(id);
      if (grab != null && !grab.isEditing && here != null) {
        const siblings = grab.siblings;
        let index = siblings.indexOf(grab);
        siblings.splice(index, 1);
        if (siblings.length == 0) {
          grab.firstParent.firstParent.becomeHere();
          grab.firstParent.grabOnly();
        } else {
          if (index >= siblings.length) {
            index = siblings.length - 1;
          }
          if (index >= 0) {
            siblings[index].grabOnly();
          }
          here.pingHere();          
        }
        signal(Signals.widgets);
        things.deleteThing_updateCloud(grab);
        relationships.deleteRelationships_updateCloudFor(grab);
      }
    }
  }

  function moveRight_redrawGraph_saveToCloud (thing, right, relocate) {
    if (relocate) {
      thing.relocateRight(right);
    } else {
      thing.browseRight(right);
    }
  }

  function highestGrab(up) {
    const ids = $grabbedIDs;
    let grabs = things.thingsForIDs(ids);
    sortAccordingToOrder(grabs);
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
{#if here != null}
  <Children parent={here}/>
{/if}
