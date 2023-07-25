<script lang='ts'>
  import { things, Thing, grabbedIDs, handleSignal, Signals } from '../common/GlobalImports';
  import Crumb from './Crumb.svelte';
  let ancestors;
  export let grab;

  $: {
  ancestors = [];
    let thing = grab;
    while (thing != null) {
      ancestors.push(thing);
      thing = thing.firstParent;
    }
    ancestors.reverse();
  }
  
	handleSignal.connect((kinds, value) => {
		if (kinds.includes(Signals.crumbs)) {
      redrawCrumbs();
    }
  })

</script>

<span>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;</span>    <!-- left side margin -->
{#each ancestors as thing, index}
  {#if index > 0}
    <span>&nbsp; &gt; </span>
  {/if}
  <Crumb thing={thing}/>
{/each}
