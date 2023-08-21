<script>
  import { grabs, Thing, editor, constants, Signals, onDestroy, Predicate, ButtonIDs, hierarchy, handleSignalOfKind } from '../common/GlobalImports';
  import { popupViewID, editingID, hereID } from '../managers/State';
  import Children from './Children.svelte'
  let toggleDraw = false;
  let here = Thing;
  let listener;
	onDestroy( () => {signalHandler.disconnect(); });

  const signalHandler = handleSignalOfKind(Signals.childrenOf, (idThing) => {
    toggleDraw = !toggleDraw;
  })

	$: {
    here = hierarchy.thing_forID($hereID);
  }

  async function handleKeyDown(event) {
    let grab = grabs.furthestGrab(true);
    if ($editingID)      { return; } // let Title component consume the events
    if (event.key == undefined)  { alert('no key for ' + event.type); return; }
    if (!grab) {
      grab = hierarchy.root;
      grab?.becomeHere();
      grab?.grabOnly(); // to update crumbs and dots
    }
    if (event.type == 'keydown') {
      const key = event.key.toLowerCase();
      const OPTION = event.altKey;
      const SHIFT = event.shiftKey;
      switch (key) {
        case ' ':          editor.thing_redraw_addChildTo(grab); break;
        case '?':          $popupViewID = ButtonIDs.help; break;
        case 'd':          editor.thing_duplicate(grab); break;
        case 'r':          break; // restart app
        case 't':          alert('PARENT-CHILD SWAP'); break;
        case 'tab':        editor.thing_redraw_addChildTo(grab.firstParent); break; // Title also makes this call
        case 'delete':
        case 'backspace':  editor.grabs_redraw_delete(); break;
        case 'arrowup':    editor.furthestGrab_redraw_moveUp(true, SHIFT, OPTION); break;
        case 'arrowdown':  editor.furthestGrab_redraw_moveUp(false, SHIFT, OPTION); break;
        case 'arrowright': editor.thing_redraw_moveRight(grab, true, OPTION); break;
        case 'arrowleft':  editor.thing_redraw_moveRight(grab, false, OPTION); break;
        case 'enter':      grab.startEdit(); break;
      }
    }
  }

</script>

<svelte:document on:keydown={handleKeyDown} />
{#key toggleDraw, here}
  {#if here}
    <div style='position: fixed; left-padding=100px'>
      <Children thing={here}/>
    </div>
  {/if}
{/key}
