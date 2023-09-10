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
  function lineTypeAt(index: number): number { return lineRectAt(index).lineType; }

  function updateLineRects() {
    console.log('CHILDREN', origin.verbose);
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
      <p> &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; {lineRects.map(obj => obj.description).join(' ... ')}</p>
      {#each children as child, index}
        <span style="position: absolute; left: {lineRectAt(index).origin.x}px; top: {lineRectAt(index).origin.y}px;">
          <Line curveType={lineTypeAt(index)} rect={lineRectAt(index)}/>
          <Widget thing={child} origin={lineRectAt(index).origin}/>
        </span>
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
  .widget-ul { list-style: none; }
  .widget-li { line-height: 1.5; }
</style>
