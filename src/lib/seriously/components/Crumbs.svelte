<script lang='ts'>
  import { things, Thing, grabbedIDs } from '../common/GlobalImports';
  import Crumb from './Crumb.svelte';
  let ancestors = [things.root];

  grabbedIDs.subscribe((ids) => {
    if (ids?.length > 0) {
      updateAncestors(ids[0]);
    }
  });

  function updateAncestors(id) {
    let thing = things.thingForID(id);
    const title = thing.title;
    ancestors = [];
    while (thing != null) {
      ancestors.push(thing);
      thing = thing.firstParent;
    }
    ancestors.reverse();
  }

</script>

<span>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;</span>    <!-- left side margin -->
{#each ancestors as thing, index}
  {#if index > 0}
    <span>&nbsp; &gt; </span>
  {/if}
  <Crumb thing={thing}/>
{/each}
