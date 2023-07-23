<script lang='ts'>
  import { things, Thing, grabbedIDs, handleSignal, SignalKinds } from '../common/GlobalImports';
  import Crumb from './Crumb.svelte';
  let ancestors = [things.root];
  let toggledReload = false;

  grabbedIDs.subscribe((ids) => {
    if (ids?.length > 0) {
      updateAncestors(ids[0]);
    }
  });

	handleSignal.connect((kinds, value) => {
		if (kinds.includes(SignalKinds.crumbs)) {
      toggledReload = !toggledReload;
    }
  })

  function updateAncestors(id) {
    let thing = things.thingForID(id);
    ancestors = [];
    while (thing != null) {
      ancestors.push(thing);
      thing = thing.firstParent;
    }
    ancestors.reverse();
  }

</script>

{#key toggledReload}
  <span>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;</span>    <!-- left side margin -->
  {#each ancestors as thing, index}
    {#if index > 0}
      <span>&nbsp; &gt; </span>
    {/if}
    <Crumb thing={thing}/>
  {/each}
{/key}
