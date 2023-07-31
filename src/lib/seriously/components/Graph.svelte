<script>
  import { Thing, hierarchy, cloud, editingID, Signals, handleSignalOfKind, onMount, onDestroy, constants } from '../common/GlobalImports';
  import Children from './Children.svelte';
  import Crumbs from './Crumbs.svelte';
  let listener;
  let redraw;

  onDestroy( () => { window.removeEventListener('keydown', listener); });
  onMount(async () => { listener = window.addEventListener('keydown', handleKeyDown); });

  async function handleKeyDown(event) {
    let thing = hierarchy.grabbedThing;
    if (thing == null)           { alert('no grabs'); return; }
    if (event.key == undefined)  { alert('no key for ' + event.type); return; }
    if ($editingID != null)      { return; }
    if (event.type == 'keydown') {
      const key = event.key.toLowerCase();
      const OPTION = event.altKey;
      const SHIFT = event.shiftKey;
      switch (key) {
        case ' ':          cloud.thing_redraw_addChildTo(thing); break;
        case 'd':          cloud.thing_duplicate(thing); break;
        case 't':          alert('PARENT-CHILD SWAP'); break;
        case 'tab':        cloud.thing_redraw_addChildTo(thing.firstParent); break; // Title also makes this call
        case 'enter':      thing.editTitle(); break;
        case 'delete':
        case 'backspace':  cloud.grabs_redraw_delete(); break;
        case 'arrowup':    cloud.grab_redraw_moveUp(true, SHIFT, OPTION); break;
        case 'arrowdown':  cloud.grab_redraw_moveUp(false, SHIFT, OPTION); break;
        case 'arrowright': cloud.thing_redraw_moveRight(thing, true, OPTION); break;
        case 'arrowleft':  cloud.thing_redraw_moveRight(thing, false, OPTION); break;
      }
    }
  }

  handleSignalOfKind(Signals.graph, (value) => {
    redraw = !redraw;
  });

</script>

{#key redraw}
  <Crumbs grab={hierarchy.grabbedThing}/>
  {#if hierarchy.here != null}
    <Children parent={hierarchy.here}/>
  {/if}
{/key}
