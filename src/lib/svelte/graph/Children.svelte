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
    lineRects = new Layout(thing, origin).lineRects ?? [];
    console.log('CHILDREN', origin.verbose);
    console.log('CHILDREN', description());
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

  function description() {
    let strings: Array<string> = [];
    for (const lineRect of lineRects) {
      strings.push(lineRect.origin.verbose);
      strings.push(lineRect.extent.verbose);
      strings.push(lineRect.size.verbose);
    }
    return strings.join(', ');
  }

  // <p> &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; {lineRects.map(obj => obj.description).join(' ... ')}</p>
  // <div style="position: absolute; left: {lineRectAt(index).origin.x}px; top: {lineRectAt(index).origin.y}px;">
  // </div>

</script>

{#key toggleDraw}
  {#if children && children.length != 0 && lineRects.length == children.length}
    {#if $debug}
      {#each children as child, index}
        <Line color={child.color} curveType={lineTypeAt(index)} rect={lineRectAt(index)}/>
        <Widget thing={child} origin={lineRectAt(index).extent}/>
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
