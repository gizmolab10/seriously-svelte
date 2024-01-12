<script lang=ts>
	import { k, Rect, Size, Point, Thing, debug, signal, Signals, Layout, onMount, LineRect, onDestroy } from '../../ts/common/GlobalImports';
	import { DebugFlag, debugReact, LineCurveType, orders_normalize_remoteMaybe, handle_relayout } from '../../ts/common/GlobalImports';
	import { dot_size, graphRect, line_stretch } from '../../ts/managers/State';
	import Widget from '../widget/Widget.svelte';
	import Circle from '../kit/Circle.svelte';
	import Children from './Children.svelte';
	import Line, {relationship} from './Line.svelte';
    export let path = '';
	export let origin = new Point();
	export let thing: Thing;
	let lineRects: Array<LineRect> = [];
	let prior = new Date().getTime();
	let children = thing.children;
	let center = new Point();
	let childMapArray = [];

	onDestroy( () => { signalHandler.disconnect(); });
	onMount( () => { debugReact.log_mount(`CHILDREN ${thing.description}`); layoutChildren(); });
	
	const signalHandler = handle_relayout((idThing) => {
		if (!idThing || idThing == thing.id || thing.childrenIDs_anyMissingFromIDsOf(children)) {
			const now = new Date().getTime();
			if (now - prior > 100) {
				prior = now;
				setTimeout(async () => { // delay until all other handlers for this signal are done TODO: WHY?
					await orders_normalize_remoteMaybe(thing.children);
					debugReact.log_layout(`CHILDREN signal ${thing.description}`);
					layoutChildren();
					if (idThing) { // only recurse if starting at a specific id
						for (const child of children) {
							if (child.hasChildren && child.isExpanded) {
								child.signal_relayout();
							}
						}
					}
				}, 1);
			}
		}
	})

	$: {
		if ($dot_size > 0) {
			setTimeout(() => {
				debugReact.log_layout(`CHILDREN $dot_size ${thing.description}`);
				layoutChildren()
			}, 2);
		}
	}
	
	$: {
		if ($graphRect) {
			layoutChildren()
		}
	}
	
	function layoutChildren() {
		if (thing && !thing.ancestors_include(thing)) {
			const delta = new Point(19.5, -2.5);
			const height = (thing.visibleProgeny_halfHeight);
			const childOrigin = origin.offsetByY(height);
			center = childOrigin.offsetBy(delta);
			children = thing.children;
			lineRects = new Layout(thing, childOrigin).lineRects;
			childMapArray = lineRects.map((rect, index) => ({
				path: path + k.pathSeparator + children[index].id,
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
	{#each childMapArray as a}
		<Widget thing={a.child} path={a.path} origin={a.rect.extent.offsetBy(new Point(12, ($dot_size / -15) -10))}/>
		<Line thing={a.child} curveType={a.rect.curveType} rect={a.rect.offsetBy(new Point(($dot_size / 2) - 129, ($dot_size / 2) - 8))}/>
		{#if a.child.hasChildren && a.child.isExpanded}
			<Children thing={a.child} path={a.path} origin={a.origin}/>
		{/if}
	{/each}
{/if}
