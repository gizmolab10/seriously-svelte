<script>
  import { Rect, Size, Point, Thing, Signals, Layout, onDestroy, LineCurveType, normalizeOrderOf, handleSignalOfKind } from '../../ts/common/GlobalImports';
  import Widget from './Widget.svelte';
  import Line from './Line.svelte';
  export let thing = Thing;
  export let origin = Point;
  let layout = Layout;
  let toggleDraw = false;
  let children = thing.children;
	onDestroy( () => {signalHandler.disconnect(); });

  $: {
    layout = new Layout(thing, origin);
  }

  const signalHandler = handleSignalOfKind(Signals.childrenOf, (idThing) => {
    const newChildren = thing.children;
    if (idThing == thing.id || children != newChildren) {
      normalizeOrderOf(newChildren);
      children = newChildren;
      toggleDraw = !toggleDraw;
    }
  })
  // <Line curveType={LineCurveType.down} rect={new Rect(new Point(20, 20), new Size(50, 20))}/>
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
