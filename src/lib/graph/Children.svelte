<script>
  import { Thing, Signals, onDestroy, handleSignalOfKind } from '../common/GlobalImports';
  import Widget from './Widget.svelte';
  export let thing = Thing;
  let children = thing.children;
	onDestroy( () => {signalHandler.disconnect(); });

  const signalHandler = handleSignalOfKind(Signals.childrenOf, (thingID) => {
    if (thingID == thing.id) {
      children = thing.children;
    }
  })
</script>

{#if children && children.length != 0}
  <ul>
    {#each children as child}
      <li><Widget thing={child}/></li>
    {/each}
  </ul>
{/if}

<style>
  ul { list-style: none; }
  li { line-height: 1.5; }
</style>
