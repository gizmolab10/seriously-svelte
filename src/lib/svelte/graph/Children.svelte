<script lang=ts>
	import { Rect, Size, Point, Thing, signal, Signals, Layout, onMount, LineRect, onDestroy } from '../../ts/common/GlobalImports';
	import { DebugOption, LineCurveType, orders_normalize_remoteMaybe, handleSignalOfKind } from '../../ts/common/GlobalImports';
	import { dot_size, line_stretch, user_graphOffset } from '../../ts/managers/State';
	import Widget from '../widget/Widget.svelte';
	import Children from './Children.svelte';
	import Line from './Line.svelte';
	export let origin = new Point();
	export let thing: Thing;
	let lineRects: Array<LineRect> = [];
	let prior = new Date().getTime();
	let children = thing.children;
	let threeArrays = [];

	onMount( () => { thing.debugLog('CHILDREN MOUNT'); layoutChildren(); });
	onDestroy( () => { layout_signalHandler.disconnect(); redraw_signalHandler.disconnect(); });
	
	const layout_signalHandler = handleSignalOfKind(Signals.layout, (idThing) => {
		if (idThing && idThing == thing.id) {
			layoutChildren();
			for (const child of children) {
				if (child.hasChildren && child.isExpanded) {
					signal(Signals.layout, child.id); // percolate
				}
			}
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
					// thing.debugLog('CHILDREN SIGNAL' + idThing);
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
			layoutChildren();
		}
	}
	
	function layoutChildren() {
		if (thing) {
			const height = (thing.visibleProgeny_halfHeight);
			const childOrigin = origin.offsetByY(height);
			lineRects = new Layout(thing, childOrigin).lineRects;
			threeArrays = lineRects.map((rect, index) => ({
				origin: originForGrandchildren(children[index], rect),
				child: children[index], 
				rect: rect,
			}));
		}
	}

	function originForGrandchildren(child: Thing, rect: LineRect): Point {
		const more = 0;									// TODO: WHY 1? perhaps it accounts for title margin
		if (!rect) {
			alert('grandchildren origin not computable');
		}
		const x = origin.x + child.titleWidth + $dot_size + $line_stretch + more;
		const y = rect.extent.y - child.visibleProgeny_halfHeight;
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

	function describe(things: Array<Thing>) {
		for (const [index, thing] of things.entries()) {
			thing.debugLog('CHILD at ' + index);
		}
	}
	
</script>

{#if children && children.length != 0 && lineRects.length == children.length}
	{#each threeArrays as i, index}
		<Widget thing={i.child} origin={i.rect.extent.offsetBy(new Point(10, -13))}/>
		<Line thing={i.child} curveType={i.rect.curveType} rect={i.rect.offsetBy(new Point(($dot_size / 2) - 130, ($dot_size / 2) - 8))}/>
		{#if i.child.hasChildren && i.child.isExpanded}
			<Children thing={i.child} origin={i.origin}/>
		{/if}
	{/each}
{/if}
