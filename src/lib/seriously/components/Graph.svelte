<script>
  import { Thing, things, relationships, grabbedID, grabbedIDs, editingID, onMount, onDestroy, sortAccordingToOrder, signal, handleSignal, Signals, constants } from '../common/GlobalImports';
  import Children from './Children.svelte';
  import Crumbs from './Crumbs.svelte';
  export let here;
  let isLoading = true;
  let listener;

  onDestroy( () => { window.removeEventListener('keydown', listener); });
  onMount(async () => { listener = window.addEventListener('keydown', handleKeyDown); });

  async function handleKeyDown(event) {
    if ($grabbedID == null)     { alert('no grabs'); return; }
    if (event.key == undefined) { alert('no key for ' + event.type); return; }
    if ($editingID != null)     { return; }
    if (event.type == 'keydown') {
      let thing = things.thing_ID($grabbedID);
      const key = event.key.toLowerCase();
      const OPTION = event.altKey;
      const SHIFT = event.shiftKey;
      switch (key) {
        case ' ':          thing?.redraw_addchildto(); break;
        case 'd':          thing?.cloud_duplicate(); break;
        case 't':          alert('PARENT-CHILD SWAP'); break;
        case 'tab':        thing?.firstParent.redraw_addchildto(); break; // Title also makes this call
        case 'enter':      thing?.edit(); break;
        case 'arrowup':    cloud_redraw_moveUp(true, SHIFT, OPTION); break;
        case 'arrowdown':  cloud_redraw_moveUp(false, SHIFT, OPTION); break;
        case 'arrowright': cloud_redraw_moveRight(thing, true, OPTION); break;
        case 'arrowleft':  cloud_redraw_moveRight(thing, false, OPTION); break;
        case 'delete':
        case 'backspace':  cloud_redraw_deletegrabs(); break;
      }
    }
  }

  function highestGrab(up) {
    const ids = $grabbedIDs;
    let grabs = things.things_IDs(ids);
    sortAccordingToOrder(grabs);
    if (up) {
      return grabs[0];
    } else {
      return grabs[grabs.length - 1];
    }
  }

  function cloud_redraw_deletegrabs() {
    const ids = $grabbedIDs;
    for (const id of ids) {
      const grab = things.thing_ID(id);
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
        things.cloud_thing_delete(grab);
        relationships.cloud_relationships_deleteAll_thing(grab);
      }
    }
  }

  function cloud_redraw_moveRight(thing, right, relocate) {
    if (relocate) {
      thing.cloud_redraw_relocateRight(right);
    } else {
      thing.redraw_browseRight(right);
    }
  }
  
  function cloud_redraw_moveUp(up, expand, relocate) {
    const thing = highestGrab(up);
    thing.redraw_moveup(up, expand, relocate);
    if (relocate) {
      things.cloud_things_saveDirty();
    }
  }

</script>

<Crumbs grab={things.thing_ID($grabbedID)}/>
{#if here != null}
  <Children parent={here}/>
{/if}
