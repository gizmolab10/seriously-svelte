<script lang='ts'>
  import { Thing, things, grabbedID } from '../common/GlobalImports';
  import Crumb from './Crumb.svelte';
  export let grab;
  let ancestors;

  function refreshAncestors() {
    if (grab != null) {
      ancestors = [];    // start over with new grab
      let thing = grab;
      while (thing != null) {
        ancestors.push(thing);
        thing = thing.firstParent;
      }
      ancestors.reverse();
    }
  }

  $: {
    grab = things.thingForID($grabbedID)
    refreshAncestors();
  }

</script>

{#key grab}
  <span>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;</span>    <!-- left side margin -->
  {#each ancestors as thing, index}
    {#if index > 0}
      <span>&nbsp; &gt; </span>
    {/if}
    <Crumb thing={thing}/>
  {/each}
{/key}