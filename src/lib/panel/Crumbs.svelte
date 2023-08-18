<script lang='ts'>
  import { Thing, grabs, onMount, hierarchy } from '../common/GlobalImports';
  import { grabbedIDs } from '../managers/State';
  import Crumb from '../kit/Crumb.svelte';
  let ancestors: Array<Thing> = [];
  export let grab;

	$: {
    if (!$grabbedIDs?.includes(grab?.id) || ancestors.length == 0) {
      let id = grabs.lastGrabbedID;
      const thing = hierarchy.thing_forID(id);   // start over with new grab
      if (thing) {
        grab = thing;
      }
    }
    if (grab) {
      ancestors = grab.ancestors;
    }
	}

</script>

{#if ancestors}
  {#each ancestors as thing, index}
    {#if index > 0}
      <span>&nbsp; &gt; </span>
    {/if}
    <Crumb thing={thing}/>
  {/each}
{/if}
