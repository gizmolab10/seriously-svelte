<script lang=ts>
	import { Rect, Size, Point, Thing, Signals, Layout, onMount, onDestroy, LineRect, LineCurveType, normalizeOrderOf, handleSignalOfKind } from '../../ts/common/GlobalImports';
	import { widgetHeightGap } from '../../ts/managers/State';
	import Widget from './Widget.svelte';
	import Line from './Line.svelte';
	export let lineRects: Array<LineRect> = [];
	export let thing: Thing;

	let toggleDraw = false;
	let children = thing.children;
	onDestroy( () => {signalHandler.disconnect(); });
	function lineRectAt(index: number): LineRect { return lineRects[index]; }
	function lineTypeAt(index: number): number { return lineRectAt(index).lineType; }

	function drawnSize(): Size {
		const height = $widgetHeightGap;
		return new Size(100, children.length * height);
	}

	const signalHandler = handleSignalOfKind(Signals.childrenOf, (idThing) => {
		setTimeout(() => { // delay until all other handlers for this signal are done
			const newChildren = thing.children;
			if (idThing == thing.id || children != newChildren) {
				normalizeOrderOf(newChildren);
				children = newChildren;
				toggleDraw = !toggleDraw;
			}
		}, 1);
	})

</script>

{#key toggleDraw}
	{#if children && children.length != 0 && lineRects.length == children.length}
		{#each children as child, index}
			<Widget thing={child} origin={lineRectAt(index).extent.offsetBy(new Point(18, -14))}/>
			<Line color={child.color} curveType={lineTypeAt(index)} rect={lineRectAt(index)}/>
		{/each}
	{/if}
{/key}
