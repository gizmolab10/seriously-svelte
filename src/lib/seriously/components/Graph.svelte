<script>
  import { Thing, hierarchy, editor, cloud, editingID, normalizeOrderOf, onMount, onDestroy, sortAccordingToOrder, constants } from '../common/GlobalImports';
  import Children from './Children.svelte';
  import Crumbs from './Crumbs.svelte';
  export let here;
  let listener;

  $: { editor.here = here; }

  onDestroy( () => { window.removeEventListener('keydown', listener); });
  onMount(async () => { listener = window.addEventListener('keydown', handleKeyDown); });

  async function handleKeyDown(event) {
    let thing = hierarchy.grabbedThing;
    if (thing == null)     { alert('no grabs'); return; }
    if (event.key == undefined) { alert('no key for ' + event.type); return; }
    if ($editingID != null)     { return; }
    if (event.type == 'keydown') {
      const key = event.key.toLowerCase();
      const OPTION = event.altKey;
      const SHIFT = event.shiftKey;
      switch (key) {
        case ' ':          thing.cloud_redraw_addChildTo(); break;
        case 'd':          thing.cloud_duplicate(); break;
        case 't':          alert('PARENT-CHILD SWAP'); break;
        case 'tab':        thing.firstParent.cloud_redraw_addChildTo(); break; // Title also makes this call
        case 'enter':      thing.edit(); break;
        case 'arrowup':    editor.cloud_redraw_moveUp(true, SHIFT, OPTION); break;
        case 'arrowdown':  editor.cloud_redraw_moveUp(false, SHIFT, OPTION); break;
        case 'arrowright': editor.cloud_redraw_moveRight(thing, true, OPTION); break;
        case 'arrowleft':  editor.cloud_redraw_moveRight(thing, false, OPTION); break;
        case 'delete':
        case 'backspace':  editor.cloud_redraw_deleteGrabs(); break;
      }
    }
  }

</script>

<Crumbs grab={hierarchy.grabbedThing}/>
{#if here != null}
  <Children parent={here}/>
{/if}
