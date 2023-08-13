<script>
  import { grabs, Thing, ButtonIDs, hierarchy, cloudEditor, constants } from '../common/GlobalImports';
  import { popupID, editingID, hereID } from '../managers/State';
  import Children from './Children.svelte'
  let here = Thing;
  let listener;

	$: { here = hierarchy.thing_forID($hereID); }

  async function handleKeyDown(event) {
    let grab = grabs.grabbedThing;
    if ($editingID != null)      { return; } // let Title component consume the events
    if (event.key == undefined)  { alert('no key for ' + event.type); return; }
    if (grab == null) {
      grab = hierarchy.root;
      grab.becomeHere();
      grab?.grabOnly(); // to update crumbs and dots
    }
    if (event.type == 'keydown') {
      const key = event.key.toLowerCase();
      const OPTION = event.altKey;
      const SHIFT = event.shiftKey;
      switch (key) {
        case ' ':          cloudEditor.thing_redraw_addChildTo(grab); break;
        case '?':          $popupID = ButtonIDs.help; break;
        case 'd':          cloudEditor.thing_duplicate(grab); break;
        case 'r':          break; // restart app
        case 't':          alert('PARENT-CHILD SWAP'); break;
        case 'tab':        cloudEditor.thing_redraw_addChildTo(grab.firstParent); break; // Title also makes this call
        case 'delete':
        case 'backspace':  cloudEditor.grabs_redraw_delete(); break;
        case 'arrowup':    cloudEditor.grab_redraw_moveUp(true, SHIFT, OPTION); break;
        case 'arrowdown':  cloudEditor.grab_redraw_moveUp(false, SHIFT, OPTION); break;
        case 'arrowright': cloudEditor.thing_redraw_moveRight(grab, true, OPTION); break;
        case 'arrowleft':  cloudEditor.thing_redraw_moveRight(grab, false, OPTION); break;
        case 'enter':      grab.startEdit(); break;
      }
    }
  }

</script>

<svelte:document on:keydown={handleKeyDown} />
<div style='position: fixed; left=10px'>
  {#if here != null}
    <Children parent={here}/>
  {/if}
</div>
