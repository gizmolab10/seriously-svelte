<script lang='ts'>
  import { Thing, grabs, hierarchy, grabbedIDs } from '../common/GlobalImports';
  import Crumb from './Crumb.svelte';
  let ancestors: Array<Thing> = [];
  export let grab;

	$: {
    if (!$grabbedIDs?.includes(grab?.id)) {
      let id = grabs.lastGrabbedID;
      const thing = hierarchy.thing_forID(id);   // start over with new grab
      if (thing != null) {
        grab = thing;
        ancestors = grab.ancestors;
      }
    }
	}

</script>

{#key grab}
  {#each ancestors as thing, index}
    {#if index > 0}
      <span>&nbsp; &gt; </span>
    {/if}
    <Crumb thing={thing}/>
  {/each}
{/key}