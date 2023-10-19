<script lang=ts>
	import { noop, Rect, Size, Point, Thing, Signals, Layout, onMount, onDestroy, LineRect, LineCurveType, orders_normalize_remoteMaybe, handleSignalOfKind } from '../../ts/common/GlobalImports';
	import { lineGap, lineStretch, dotDiameter } from '../../ts/managers/State';
	import Children from './Children.svelte';
	import Widget from './Widget.svelte';
	import Line from './Line.svelte';
	export let origin = new Point();
	export let thing: Thing;

	const mysteryWidgetOffset = new Point(10, -14);	// TODO: WHY is this needed, where does this value come from?
	let lineRects: Array<LineRect> = [];
	let children = thing.children;
	let toggleDraw = false;

	onMount( () => { layoutChildren(); });
	onDestroy( () => { signalHandler.disconnect(); });
	function lineRectAt(index: number): LineRect { return lineRects[index]; }
	function curveTypeAt(index: number): number { return lineRectAt(index).curveType; }
	
	const signalHandler = handleSignalOfKind(Signals.childrenOf, (signal_idThing) => {
		setTimeout(() => { // delay until all other handlers for this signal are done TODO: WHY?
			if (signal_idThing == thing.id || children != thing.children) {
				orders_normalize_remoteMaybe(thing.children);
				children = thing.children;
				layoutChildren();
				toggleDraw = !toggleDraw;
			}
		}, 1000);
	})

	function layoutChildren() {
		if (thing) {
			const height = (thing.halfVisibleProgenyHeight);		// TODO: why 4?
			const childOrigin = origin.offsetByY(height);
			lineRects = new Layout(thing, childOrigin).lineRects;
		}
	}

	function originForGrandchildren(child: Thing, index: number): Point {
		const more = 17;									// TODO: WHY 14? perhaps it accounts for title margin
		const rect = lineRectAt(index);
		const x = origin.x + child.titleWidth + $dotDiameter + $lineStretch + more;
		const y = rect.extent.y - child.halfVisibleProgenyHeight;
		return new Point(x, y);
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
			<Widget thing={child} origin={lineRectAt(index).extent.offsetBy(mysteryWidgetOffset)}/>
			<Line color={child.color} curveType={curveTypeAt(index)} rect={lineRectAt(index).offsetByX(25)}/>
			{#if child.hasChildren && child.isExpanded}
				<Children thing={child} origin={originForGrandchildren(child, index)}/>
			{/if}
		{/each}
	{/if}
{/key}
