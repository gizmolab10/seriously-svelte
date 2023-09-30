<script lang=ts>
	import { Rect, Size, Point, Thing, Signals, Layout, onMount, onDestroy, LineRect, LineCurveType, normalizeOrderOf, handleSignalOfKind } from '../../ts/common/GlobalImports';
	import { lineGap, lineStretch } from '../../ts/managers/State';
	import Children from './Children.svelte';
	import Widget from './Widget.svelte';
	import Line from './Line.svelte';
	const widgetOffset = new Point(10, -14);	// TODO: WHY is this needed, where does this value come from?
	let lineRects: Array<LineRect> = [];
	export let origin = new Point();
	export let thing: Thing;

	let toggleDraw = false;
	let children = thing.children;
	onMount( () => { layoutChildren(); });
	onDestroy( () => { signalHandler.disconnect(); });
	function lineRectAt(index: number): LineRect { return lineRects[index]; }
	function curveTypeAt(index: number): number { return lineRectAt(index).curveType; }
	
	const signalHandler = handleSignalOfKind(Signals.childrenOf, (idThing) => {
		setTimeout(() => { // delay until all other handlers for this signal are done
			const newChildren = thing.children;
			if (idThing == thing.id || children != newChildren) {
				normalizeOrderOf(newChildren);
				children = newChildren;
				layoutChildren();
				toggleDraw = !toggleDraw;
			}
		}, 1);
	})

	function layoutChildren() {
		if (thing) {
			const height = (thing.halfVisibleProgenyHeight) - 4;	// TODO: why 4?
			lineRects = new Layout(thing, origin.offsetBy(new Point(0, height))).lineRects;
		}
	}

	function originFor(child: Thing, index: number): Point {
		const offsetX = child.titleWidth + $lineStretch + 9;
		const offsetY = lineRectAt(index).origin.y - (child.halfVisibleProgenyHeight);
		return origin.offsetBy(new Point(offsetX, offsetY));
	}
	
	function description() {
		let strings: Array<string> = [];
		for (const lineRect of lineRects) {
			strings.push(lineRect.origin.verbose);
			strings.push(lineRect.extent.verbose);
			strings.push(lineRect.size.verbose);
		}
		return strings.join(', ');
	}

</script>

{#key toggleDraw}
	{#if children && children.length != 0 && lineRects.length == children.length}
		{#each children as child, index}
			<Widget thing={child} origin={lineRectAt(index).extent.offsetBy(widgetOffset)}/>
			<Line color={child.color} curveType={curveTypeAt(index)} rect={lineRectAt(index)}/>
			{#if child.hasChildren && child.isExpanded}
				<Children thing={child} origin={originFor(child, index)}/>
			{/if}
		{/each}
	{/if}
{/key}
