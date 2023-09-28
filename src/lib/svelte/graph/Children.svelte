<script lang=ts>
	import { Rect, Size, Point, Thing, Signals, Layout, onMount, onDestroy, LineRect, LineCurveType, normalizeOrderOf, handleSignalOfKind } from '../../ts/common/GlobalImports';
	import { lineGap } from '../../ts/managers/State';
	import Widget from './Widget.svelte';
	import Line from './Line.svelte';
	export let thing: Thing;
	let lineRects: Array<LineRect> = [];
	const widgetOffset = new Point(10, -14);	// TODO: WHY is this needed, where does this value come from?
	const defaultOrigin = new Point(25, 56);	// TODO: center of screen minus children size width over two

	let toggleDraw = false;
	let children = thing.children;
	onMount( () => { layout(); });
	onDestroy( () => { signalHandler.disconnect(); });
	function lineRectAt(index: number): LineRect { return lineRects[index]; }
	function curveTypeAt(index: number): number { return lineRectAt(index).curveType; }
	
	const signalHandler = handleSignalOfKind(Signals.childrenOf, (idThing) => {
		setTimeout(() => { // delay until all other handlers for this signal are done
			const newChildren = thing.children;
			if (idThing == thing.id || children != newChildren) {
				normalizeOrderOf(newChildren);
				children = newChildren;
				layout();
				toggleDraw = !toggleDraw;
			}
		}, 1);
	})

	function layout() {
		if (thing) {
			lineRects = new Layout(thing, defaultOrigin).lineRects;
		}
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
		{/each}
	{/if}
{/key}
