<script lang=ts>
	import { Rect, Size, Point, Thing, signal, Signals, Layout, onMount, LineRect, onDestroy } from '../../ts/common/GlobalImports';
	import { DebugOption, LineCurveType, orders_normalize_remoteMaybe, handleSignalOfKind } from '../../ts/common/GlobalImports';
	import { lineGap, lineStretch, dotSize } from '../../ts/managers/State';
	import Widget from '../widget/Widget.svelte';
	import Children from './Children.svelte';
	import Line from './Line.svelte';
	export let origin = new Point();
	export let thing: Thing;

	const mysteryWidgetOffset = new Point(10, -10);	// TODO: WHY is this needed, where does this value come from?
	let lineRects: Array<LineRect> = [];
	let prior = new Date().getTime();
	let children = thing.children;

	onMount( () => { thing.debugLog('CHILDREN MOUNT'); layoutChildren(); });
	onDestroy( () => { signalHandler.disconnect(); });
	function lineRectAt(index: number): LineRect { return lineRects[index]; }
	function curveTypeAt(index: number): number { return lineRectAt(index).curveType; }
	
	const signalHandler = handleSignalOfKind(Signals.childrenOf, (idThing) => {
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

	function describe(things: Array<Thing>) {
		for (const [index, thing] of things.entries()) {
			thing.debugLog('CHILD at ' + index);
		}
	}

	function layoutChildren() {
		if (thing) {
			const height = (thing.visibleProgeny_halfHeight);
			const childOrigin = origin.offsetByY(height);
			lineRects = new Layout(thing, childOrigin).lineRects;
			// console.log(lineRects);
		}
	}

	function originForGrandchildren(child: Thing, index: number): Point {
		const more = 0;									// TODO: WHY 1? perhaps it accounts for title margin
		const rect = lineRectAt(index);
		const x = origin.x + child.titleWidth + $dotSize + $lineStretch + more;
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

	// {thing.debugLog('CHILDREN DRAW')}
	
</script>

{#if children && children.length != 0 && lineRects.length == children.length}
	{#each lineRects as lineRect, index}
		<Widget thing={children[index]} origin={lineRect.extent.offsetBy(mysteryWidgetOffset)}/>
		<Line thing={children[index]} curveType={curveTypeAt(index)} rect={lineRect.offsetBy(new Point(-120, 1))}/>
		{#if children[index].hasChildren && children[index].isExpanded}
			<Children thing={children[index]} origin={originForGrandchildren(children[index], index)}/>
		{/if}
	{/each}
{/if}
