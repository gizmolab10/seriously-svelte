<script lang=ts>
	import { Rect, Size, Point, Thing, debug, signal, Signals, Layout, onMount, LineRect, onDestroy } from '../../../ts/common/GlobalImports';
	import { debugReact, LineCurveType, orders_normalize_remoteMaybe, handle_relayout } from '../../../ts/common/GlobalImports';
	import { dot_size, line_stretch, user_graphOffset } from '../../../ts/managers/State';
	import Widget from '../widget/Widget.svelte';
	import Circle from '../../kit/Circle.svelte';
	import Children from './Children.svelte';
	import Line from './Line.svelte';
	export let origin = new Point();
	export let thing: Thing;
	let lineRects: Array<LineRect> = [];
	let prior = new Date().getTime();
	let children = thing.children;
	let center = new Point();
	let childArray = [];

	onDestroy( () => { signalHandler.disconnect(); });
	onMount( () => { debugReact.log_mount(`CHILDREN ${thing.description}`); layoutChildren(); });
	
	const signalHandler = handle_relayout((idThing) => {
		if (!idThing || idThing == thing.id || thing.childrenIDs_anyMissingFromIDsOf(children)) {
			const now = new Date().getTime();
			if (now - prior > 1000) {
				prior = now;
				setTimeout(async () => { // delay until all other handlers for this signal are done TODO: WHY?
					await orders_normalize_remoteMaybe(thing.children);
					debugReact.log_layout('CHILDREN signal');
					// describe(children);
					layoutChildren();
					if (idThing) { // only recurse if starting at a specific id
						for (const child of children) {
							if (child.hasChildren && child.isExpanded) {
								child.thing_relayout();
							}
						}
					}
				}, 10);
			}
		}
	})
	
	$: {
		if ($user_graphOffset != null) {
			debugReact.log_layout(`CHILDREN $user_graphOffset ${thing.description}`);
			layoutChildren();
		}
	}

	$: {
		if ($dot_size > 0) {
			setTimeout(() => {
				debugReact.log_layout(`CHILDREN $dot_size ${thing.description}`);
				layoutChildren()
			}, 2);
		}
	}
	
	function layoutChildren() {
		if (thing) {
			const delta = new Point(19.5, -2.5);
			const height = (thing.visibleProgeny_halfHeight);
			const childOrigin = origin.offsetByY(height);
			center = childOrigin.offsetBy(delta);
			children = thing.children;
			lineRects = new Layout(thing, childOrigin).lineRects;
			childArray = lineRects.map((rect, index) => ({
				origin: originForChildrenOf(children[index], rect),
				child: children[index], 
				rect: rect,
			}));
		}
	}

	function originForChildrenOf(child: Thing, rect: LineRect): Point {
		if (!rect || !child) {
			alert('grandchildren origin not computable');
			return new Point();
		}
		const x = origin.x + child.titleWidth + $dot_size + $line_stretch - 2;
		const y = rect.extent.y - child.visibleProgeny_halfHeight;
		return new Point(x, y);
	}
	
</script>

{#if children && children.length != 0 && lineRects.length == children.length}
	{#if debug.lines}
		<Circle radius=1 center={center} color=black thickness=1/>
	{/if}
	{#each childArray as i}
		<Widget thing={i.child} origin={i.rect.extent.offsetBy(new Point(12, ($dot_size / -15) -11))}/>
		<Line thing={i.child} curveType={i.rect.curveType} rect={i.rect.offsetBy(new Point(($dot_size / 2) - 129, ($dot_size / 2) - 8))}/>
		{#if i.child.hasChildren && i.child.isExpanded}
			<Children thing={i.child} origin={i.origin}/>
		{/if}
	{/each}
{/if}
