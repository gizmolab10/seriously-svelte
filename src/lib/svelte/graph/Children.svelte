<script lang=ts>
	import { k, u, Rect, Size, Point, Thing, debug, signals, onMount, Layout } from '../../ts/common/GlobalImports';
	import { onDestroy, DebugFlag, debugReact, LineCurveType } from '../../ts/common/GlobalImports';
	import { s_dot_size, s_graphRect, s_line_stretch } from '../../ts/managers/State';
	import Widget from '../widget/Widget.svelte';
	import Circle from '../kit/Circle.svelte';
	import Children from './Children.svelte';
	import Line from './Line.svelte';
	export let origin = new Point();
    export let path = '';
	const halfDotSize = $s_dot_size / 2;
	const widgetOffset = new Point(12, ($s_dot_size / -15) - 10);
	const lineOffset = new Point(halfDotSize - 129, halfDotSize - 8);
	let childMapArray: Array<ChildMap> = [];
	let prior = new Date().getTime();
	let center = new Point();
	onMount( () => { layoutChildren(); });
	onDestroy( () => { signalHandler.disconnect(); });
	
	$: {
		if ($s_graphRect) {
			layoutChildren()
		}
	}

	$: {
		if ($s_dot_size > 0) {
			setTimeout(() => {
				layoutChildren()
			}, 2);
		}
	}
	
	const signalHandler = signals.handle_relayout((signalPath) => {
		if (!signalPath || signalPath.matchesPath(path)) {
			const now = new Date().getTime();
			if (now - prior > 100) {
				prior = now;
				setTimeout(async () => { // delay until all other handlers for this signal are done TODO: WHY?
					layoutChildren();
					if (signalPath) { // only recurse if starting at a specific signalPath
						for (const childMap of childMapArray) {
							if (childMap.child.hasChildren && childMap.path.isExpanded) {
								childMap.path.signal_relayout();
							}
						}
					}
				}, 1);
			}
		}
	})
	
	function layoutChildren() {
		const delta = new Point(19.5, -2.5);
		const height = (path.visibleProgeny_halfHeight);
		const childrenOrigin = origin.offsetByY(height);
		childMapArray = new Layout(path, childrenOrigin).childMapArray;
		center = childrenOrigin.offsetBy(delta);
	}
	
</script>

{#if debug.lines}
	<Circle radius=1 center={center} color=black thickness=1/>
{/if}
{#each childMapArray as map}
	<Widget thing={map.child} path={map.path} origin={map.extent.offsetBy(widgetOffset)}/>
	<Line thing={map.child} path={map.path} curveType={map.curveType} rect={map.offsetBy(lineOffset)}/>
	{#if map.child.hasChildren && map.path.isExpanded}
		<Children path={map.path} origin={map.origin}/>
	{/if}
{/each}
