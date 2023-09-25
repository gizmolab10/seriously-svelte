<script lang=ts>
	import { Rect, Size, Point, Thing, Signals, Layout, onMount, onDestroy, LineRect, LineCurveType, normalizeOrderOf, handleSignalOfKind } from '../../ts/common/GlobalImports';
	import { lineGap } from '../../ts/managers/State';
	import Widget from './Widget.svelte';
	import Line from './Line.svelte';
	export let lineRects: Array<LineRect> = [];
	const offset = new Point(10, -14);   // TODO: WHY is this needed, where does this value come from?
	export let thing: Thing;

	let toggleDraw = false;
	let children = thing.children;
	onDestroy( () => {signalHandler.disconnect(); });
	function lineRectAt(index: number): LineRect { return lineRects[index]; }
	function curveTypeAt(index: number): number { return lineRectAt(index).curveType; }

	function drawnSize(): Size {
		const height = $lineGap;
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
			<Widget thing={child} origin={lineRectAt(index).extent.offsetBy(offset)}/>
			<Line color={child.color} curveType={curveTypeAt(index)} rect={lineRectAt(index)}/>
		{/each}
	{/if}
{/key}
