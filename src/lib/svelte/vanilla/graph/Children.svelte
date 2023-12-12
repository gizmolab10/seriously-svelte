<script lang=ts>
	import { Size, Point, Thing, debug, signal, Signals, Layout, onMount, LineRect, onDestroy } from '../../../ts/common/GlobalImports';
	import { LineCurveType, orders_normalize_remoteMaybe, handleSignalOfKind } from '../../../ts/common/GlobalImports';
	import { dot_size, row_height, line_stretch, user_graphOffset } from '../../../ts/managers/State';
	import Widget, {dotCenter} from '../widget/Widget.svelte';
	import Circle from '../../kit/Circle.svelte';
	import Children from './Children.svelte';
	import Line from './Line.svelte';
	export let rightCenter = new Point();
	export let thing: Thing;
	let center = new Point($line_stretch + $dot_size, -$row_height).dividedInHalf;
	let lineRects: Array<LineRect> = [];
	let prior = new Date().getTime();
	let children = thing.children;
	let origin = new Point();
	let size = new Size();
	let lineMap = [];

	onMount( () => { thing.debugLog('CHILDREN MOUNT'); layoutChildren(); });
	onDestroy( () => { layout_signalHandler.disconnect(); redraw_signalHandler.disconnect(); });
	
	const layout_signalHandler = handleSignalOfKind(Signals.layout, (idThing) => {
		if (idThing && idThing == thing.id) {
			thing.debugLog('CHILDREN LAYOUT');
			for (const child of children) {
				if (child.hasChildren && child.isExpanded) {
					signal(Signals.layout, child.id); // percolate
				}
			}
			layoutChildren();
		}
	})
	
	const redraw_signalHandler = handleSignalOfKind(Signals.childrenOf, (idThing) => {
		if (!idThing || idThing == thing.id || thing.childrenIDs_anyMissingFromIDsOf(children) || thing.isRoot) {
			const now = new Date().getTime();
			if (now - prior > 1000) {
				prior = now;
				setTimeout(async () => { // delay until all other handlers for this signal are done TODO: WHY?
					await orders_normalize_remoteMaybe(thing.children);
					children = thing.children;
					thing.debugLog('CHILDREN SIGNAL');
					// describe(children);
					layoutChildren();
					for (const child of children) {
						if (child.hasChildren && child.isExpanded) {
							signal(Signals.childrenOf, child.id); // percolate
						}
					}
				}, 10);
			}
		}
	})
	
	$: {
		if ($user_graphOffset != null) {
			layoutChildren();
		}
	}

	$: {
		if ($dot_size > 0) {
			setTimeout(() => {
				layoutChildren()
			}, 2);
		}
	}
	
	function layoutChildren() {
		if (thing) {
			size = thing.visibleProgeny_size;
			lineRects = new Layout(thing).lineRects;
			origin = rightCenter.offsetByY(size.height / 2);
			center = new Point($line_stretch + $dot_size, -$row_height).dividedInHalf;
			lineMap = lineRects.map((l, index) => ({
				rightCenter: rightCenterForGrandchildren(children[index], l.extent),
				curveType: l.curveType,
				child: children[index],
				extent: l.extent,
			}));
		}
	}

	function rightCenterForGrandchildren(child: Thing, extent: number): Point | null {
		if (!child.hasChildren || !child.isExpanded) {
			return null;
		}
		const x = child.titleWidth + $dot_size + $line_stretch;
		const y = -1; // sometimes 0 (???)
		return new Point(x, y - extent);
	}
	
</script>

{#if children && children.length != 0 && lineRects.length == children.length}
	<div class='children' style='
			top: {origin.y}px;
			left: {origin.x}px;
			position: absolute;
			width: {size.width}px;
			height: {size.height}px;'>
		{#if debug.lines}
			<Circle radius=1 center={new Point(0, size.height / 2)} color=black thickness=1/>
		{/if}
		{#each lineMap as l}
			<Widget thing={l.child} dotCenter={center.offsetByY(l.extent)}/>
			<Line thing={l.child} curveType={l.curveType} yOrigin={origin.y - rightCenter.y} yExtent={l.extent}/>
			{#if l.rightCenter}
				<Children thing={l.child} rightCenter={l.rightCenter}/>
			{/if}
		{/each}
	</div>
{/if}
