<script>
  import { Thing, Signals, onDestroy, normalizeOrderOf, handleSignalOfKind } from '../common/GlobalImports';
  import Widget from './Widget.svelte';
  export let thing = Thing;
  let children = thing.children;
  let toggleDraw = false;
	onDestroy( () => {signalHandler.disconnect(); });

  const signalHandler = handleSignalOfKind(Signals.childrenOf, (thingID) => {
    const newChildren = thing.children;
    if (thingID == thing.id || children != newChildren) {
      normalizeOrderOf(newChildren);
      children = newChildren;
      toggleDraw = !toggleDraw;
    }
  })
</script>

{#key toggleDraw}
  {#if children && children.length != 0}
    <ul class='widget-ul'>
      {#each children as child}
        <li class='widget-li'><Widget thing={child}/>
      {/each}
    </ul>
  {/if}
{/key}

<style>
  .widget-ul { list-style: none; }
  .widget-li { line-height: 1.5; }
</style>
