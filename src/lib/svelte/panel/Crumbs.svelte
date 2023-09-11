<script lang='ts'>
  import { Thing, Grabs, Signals, onDestroy, dbDispatch, handleSignalOfKind } from '../../ts/common/GlobalImports';
  import { idsGrabbed } from '../../ts/managers/State';
  import Crumb from '../kit/Crumb.svelte';
  let ancestors: Array<Thing> = [];
  let toggleDraw = false;
  export let grab;

  onDestroy( () => {signalHandler.disconnect(); });
  const signalHandler = handleSignalOfKind(Signals.childrenOf, (thingID) => { toggleDraw = !toggleDraw; })

  $: {
    if (!$idsGrabbed?.includes(grab?.id) || ancestors.length == 0) {
      const h = dbDispatch.db.hierarchy;
      let id = h.grabs.last_idGrabbed;
      const thing = h.getThing_forID(id);   // start over with new grab
      if (thing) {
        grab = thing;
      }
    }
    if (grab) {
      ancestors = grab.ancestors;
    }
  }
</script>

{#key toggleDraw}
  {#if ancestors}
    {#each ancestors as thing, index}
      {#if index > 0}
        <div>&nbsp; &gt; </div>
      {/if}
      <Crumb thing={thing}/>
    {/each}
  {/if}
{/key}
