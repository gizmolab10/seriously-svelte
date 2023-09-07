<script lang=ts>
  import { Rect, Size, Point, Thing, Signals, Layout, onMount, onDestroy, LineRect, LineCurveType, normalizeOrderOf, handleSignalOfKind } from '../../ts/common/GlobalImports';
  import { debug } from '../../ts/managers/State';
  import Widget from './Widget.svelte';
  import Line from './Line.svelte';
  export let origin: Point;
  export let thing: Thing;

  let toggleDraw = false;
  let children = thing.children;
  let lineRects: Array<LineRect> = [];
  onMount(() => { updateLineRects(); });
	onDestroy( () => {signalHandler.disconnect(); });
  function lineRectAt(index: number): LineRect { return lineRects[index]; }
  function childRectAt(index: number): Rect { return lineRectAt(index).rect; }
  function lineTypeAt(index: number): number { return lineRectAt(index).lineType; }

  function updateLineRects() {
    const layout = new Layout(thing, origin);
    const array = layout.lineRects;
    if (array) {
      lineRects = array;
    }
  }

  const signalHandler = handleSignalOfKind(Signals.childrenOf, (idThing) => {
    const newChildren = thing.children;
    if (idThing == thing.id || children != newChildren) {
      normalizeOrderOf(newChildren);
      children = newChildren;
      updateLineRects();
      toggleDraw = !toggleDraw;
    }
  })

</script>

{#key toggleDraw}
  {#if children && children.length != 0 && lineRects.length == children.length}
    {#if $debug}
      {#each children as child, index}
        <Line curveType={lineTypeAt(index)} rect={childRectAt(index)}/>
        <Widget thing={child}/>
      {/each}
    {:else}
      <ul class='widget-ul'>
        {#each children as child}
          <li class='widget-li'><Widget thing={child}/>
        {/each}
      </ul>
    {/if}
  {/if}
{/key}

<style>
</style>
