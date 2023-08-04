<script lang='ts'>
  import { Thing, grabs, hierarchy, onDestroy, Signals, handleSignalOfKind } from '../common/GlobalImports';
  import Crumb from './Crumb.svelte';
  let ancestors: Array<Thing> = [];
  export let grab;

	onDestroy( () => { signalHandler.disconnect(); });
  const signalHandler = handleSignalOfKind(Signals.widgets, (value) => { handleGrabbedID(grabs.lastGrabbedID); });

  function handleGrabbedID(id: string) {
    grab = hierarchy.thing_forID(id);   // start over with new grab
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