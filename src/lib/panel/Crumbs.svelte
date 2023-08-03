<script lang='ts'>
  import { Thing, hierarchy, lastGrabbedID, onDestroy, Signals, handleSignalOfKind } from '../common/GlobalImports';
  import Crumb from './Crumb.svelte';
  export let grab;
  let ancestors;

	onDestroy( () => { signalHandler.disconnect(); });

  const signalHandler = handleSignalOfKind(Signals.grab, (value) => {
    grab = hierarchy.thing_forID($lastGrabbedID);   // start over with new grab
    if (grab != null) {
      ancestors = grab.ancestors;
    }
	});

  $: {
    grab = hierarchy.thing_forID($lastGrabbedID);   // start over with new grab
    if (grab != null) {
      ancestors = grab.ancestors;
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