<script>
  import { Thing, hierarchy, cloud, editingID, signal, Signals, handleSignalOfKind, onMount, onDestroy, constants } from '../common/GlobalImports';
  import Children from './Children.svelte';
  let listener;
  let redraw;

  onDestroy( () => { window.removeEventListener('keydown', listener); signalHandler.disconnect(); });
  onMount(async () => { listener = window.addEventListener('keydown', handleKeyDown); });

  const signalHandler = handleSignalOfKind(Signals.here, (value) => {
    redraw = !redraw;
    setTimeout(() => { // give graph's new widgets time to be created
      signal(Signals.grab);
    }, 1);
  });

  async function handleKeyDown(event) {
    let grab = hierarchy.grabbedThing;
    if (grab == null)            { alert('no grabs'); return; }
    if (event.key == undefined)  { alert('no key for ' + event.type); return; }
    if ($editingID != null)      { return; } // let Title component consume the events
    if (event.type == 'keydown') {
      const key = event.key.toLowerCase();
      const OPTION = event.altKey;
      const SHIFT = event.shiftKey;
      switch (key) {
        case ' ':          cloud.thing_redraw_addChildTo(grab); break;
        case 'd':          cloud.thing_duplicate(grab); break;
        case 'r':          break; // restart app
        case 't':          alert('PARENT-CHILD SWAP'); break;
        case 'tab':        cloud.thing_redraw_addChildTo(grab.firstParent); break; // Title also makes this call
        case 'delete':
        case 'backspace':  cloud.grabs_redraw_delete(); break;
        case 'arrowup':    cloud.grab_redraw_moveUp(true, SHIFT, OPTION); break;
        case 'arrowdown':  cloud.grab_redraw_moveUp(false, SHIFT, OPTION); break;
        case 'arrowright': cloud.thing_redraw_moveRight(grab, true, OPTION); break;
        case 'arrowleft':  cloud.thing_redraw_moveRight(grab, false, OPTION); break;
        case 'enter':      grab.editTitle(); break;
      }
    }
  }

</script>

{#key redraw}
  {#if hierarchy.here != null}
    <Children parent={hierarchy.here}/>
  {/if}
{/key}
