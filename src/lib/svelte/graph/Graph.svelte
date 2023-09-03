<script>
  import { grabs, Thing, editor, constants, Signals, onDestroy, Predicate, ButtonID, dbDispatch, handleSignalOfKind } from '../../ts/common/GlobalImports';
  import { popupViewID, editingID, hereID } from '../../ts/managers/State';
  import Children from './Children.svelte'
  let toggleDraw = false;
  let here = Thing;
  let listener;

	$: { here = dbDispatch.db.hierarchy.getThing_forID($hereID); }
	onDestroy( () => {signalHandler.disconnect(); });

  const signalHandler = handleSignalOfKind(Signals.childrenOf, (idThing) => {
    if (here && idThing == here.id) {
      toggleDraw = !toggleDraw;
    }
  })

  async function handleKeyDown(event) {
    let grab = grabs.furthestGrab(true);
    if ($editingID)      { return; } // let Title component consume the events
    if (event.key == undefined)  { alert('no key for ' + event.type); return; }
    if (!grab) {
      grab = dbDispatch.db.hierarchy.root;
      grab?.becomeHere();
      grab?.grabOnly(); // to update crumbs and dots
    }
    if (event.type == 'keydown') {
      const key = event.key.toLowerCase();
      const OPTION = event.altKey;
      const SHIFT = event.shiftKey;
      switch (key) {
        case ' ':          await editor.thing_redraw_remoteAddChildTo(grab); break;
        case '?':          $popupViewID = ButtonID.help; break;
        case 'd':          await editor.thing_redraw_remoteDuplicate(grab); break;
        case 'r':          break; // restart app
        case 't':          alert('PARENT-CHILD SWAP'); break;
        case 'tab':        await editor.thing_redraw_remoteAddChildTo(grab.firstParent); break; // Title also makes this call
        case 'delete':
        case 'backspace':  await editor.grabs_redraw_remoteDelete(); break;
        case 'arrowup':    await editor.furthestGrab_redraw_remoteMoveUp(true, SHIFT, OPTION); break;
        case 'arrowdown':  await editor.furthestGrab_redraw_remoteMoveUp(false, SHIFT, OPTION); break;
        case 'arrowright': await editor.thing_redraw_remoteMoveRight(grab, true, OPTION); break;
        case 'arrowleft':  await editor.thing_redraw_remoteMoveRight(grab, false, OPTION); break;
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
