<script lang=ts>
	import { k, Rect, Size, Point, Thing, debug, signals, onMount, Layout } from '../../ts/common/GlobalImports';
	import { LineRect, onDestroy, DebugFlag, debugReact, LineCurveType } from '../../ts/common/GlobalImports';
	import { s_dot_size, s_graphRect, s_line_stretch } from '../../ts/managers/State';
	import Widget from '../widget/Widget.svelte';
	import Circle from '../kit/Circle.svelte';
	import Children from './Children.svelte';
	import Line, {relationship} from './Line.svelte';
	export let origin = new Point();
	export let thing: Thing;
    export let path = '';
	let lineRects: Array<LineRect> = [];
	let prior = new Date().getTime();
	let children = thing.children;
	let center = new Point();
	let childMapArray = [];

	onDestroy( () => { signalHandler.disconnect(); });
	onMount( () => { debugReact.log_mount(`CHILDREN ${thing.description}`); layoutChildren(); });
	
	$: {
		if ($s_graphRect) {
			layoutChildren()
		}
	}

	$: {
		if ($s_dot_size > 0) {
			setTimeout(() => {
				debugReact.log_layout(`CHILDREN $s_dot_size ${thing.description}`);
				layoutChildren()
			}, 2);
		}
	}
	
	const signalHandler = signals.handle_relayout((id) => {
		if (!id || id == thing.id) {
			const now = new Date().getTime();
			if (now - prior > 100) {
				prior = now;
				setTimeout(async () => { // delay until all other handlers for this signal are done TODO: WHY?
					await orders_normalize_remoteMaybe(thing.children);
					debugReact.log_layout(`CHILDREN signal ${thing.description}`);
					layoutChildren();
					if (id) { // only recurse if starting at a specific id
						for (const childMap of childMapArray) {
							if (childMap.child.hasChildren && childMap.path.isExpanded) {
								childMap.child.signal_relayout();
							}
						}
					}
				}, 1);
			}
		}
	})
	
	function layoutChildren() {
		if (thing && !thing.ancestors_include(thing)) {
			const delta = new Point(19.5, -2.5);
			const height = (path.visibleProgeny_halfHeight);
			const childOrigin = origin.offsetByY(height);
			center = childOrigin.offsetBy(delta);
			children = thing.children;
			lineRects = new Layout(thing, path, childOrigin).lineRects;
			childMapArray = lineRects.map((rect, index) => ({
				origin: originForChildrenOf(children[index], rect),
				path: path.appendingThing(children[index]),
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
		const childPath = path.appendingThing(child);
		const y = rect.extent.y - childPath.visibleProgeny_halfHeight;
		const x = origin.x + child.titleWidth + $s_dot_size + $s_line_stretch - 2;
		return new Point(x, y);
	}
	
</script>

{#if children && children.length != 0 && lineRects.length == children.length}
	{#if debug.lines}
		<Circle radius=1 center={center} color=black thickness=1/>
	{/if}
	{#each childMapArray as a}
		<Widget thing={a.child} path={a.path} origin={a.rect.extent.offsetBy(new Point(12, ($s_dot_size / -15) -10))}/>
		<Line thing={a.child} curveType={a.rect.curveType} rect={a.rect.offsetBy(new Point(($s_dot_size / 2) - 129, ($s_dot_size / 2) - 8))}/>
		{#if a.child.hasChildren && a.path.isExpanded}
			<Children thing={a.child} path={a.path} origin={a.origin}/>
		{/if}
	{/each}
{/if}
