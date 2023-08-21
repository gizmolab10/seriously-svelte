<script>
  import { Thing, Signals, onDestroy, handleSignalOfKind } from '../common/GlobalImports';
  import Widget from './Widget.svelte';
  export let thing = Thing;
  let children = thing.children;
	onDestroy( () => {signalHandler.disconnect(); });
  let toggleDraw = false;

  const signalHandler = handleSignalOfKind(Signals.childrenOf, (thingID) => {
    const newChildren = thing.children;
    if (thingID == thing.id && children != newChildren) {
      children = newChildren;
      toggleDraw = !toggleDraw;
    }
  })
</script>

{#key toggleDraw}
  {#if children && children.length != 0}
    <ul>
      {#each children as child}
        <li><Widget thing={child}/></li>
      {/each}
    </ul>
  {/if}
{/key}
<style>
  ul { list-style: none; }
  li { line-height: 1.5; }
</style>
