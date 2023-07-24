<script lang='ts'>
  import { things, Thing, grabbedIDs, handleSignal, SignalKinds } from '../common/GlobalImports';
  import Crumb from './Crumb.svelte';
  let ancestors = [things.root];
  let toggledReload = false;

  function redrawCrumbs() { toggledReload = !toggledReload; }

  grabbedIDs.subscribe((ids) => {
    if (ids?.length > 0) {
      updateAncestors(ids[0]);
      redrawCrumbs();
    }
  });

	handleSignal.connect((kinds, value) => {
		if (kinds.includes(SignalKinds.crumbs)) {
      redrawCrumbs();
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
  <p>what?</p>
  <span>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;</span>    <!-- left side margin -->
  {#each ancestors as thing, index}
    {#if index > 0}
      <span>&nbsp; &gt; </span>
    {/if}
    <Crumb thing={thing}/>
  {/each}
{/key}
