<script lang='ts'>
  import { Thing, grabs, Signals, onDestroy, dbDispatch, handleSignalOfKind } from '../../typescript/common/GlobalImports';
  import { grabbedIDs } from '../../typescript/managers/State';
  import Crumb from '../kit/Crumb.svelte';
  let ancestors: Array<Thing> = [];
  export let grab;
  let toggleDraw = false;
	onDestroy( () => {signalHandler.disconnect(); });

  const signalHandler = handleSignalOfKind(Signals.childrenOf, (thingID) => {
    toggleDraw = !toggleDraw;
  })

	$: {
    if (!$grabbedIDs?.includes(grab?.id) || ancestors.length == 0) {
      let id = grabs.lastGrabbedID;
      const thing = dbDispatch.db.hierarchy.getThing_forID(id);   // start over with new grab
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
        <span>&nbsp; &gt; </span>
      {/if}
      <Crumb thing={thing}/>
    {/each}
  {/if}
{/key}
