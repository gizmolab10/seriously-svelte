<script lang=ts>
	import { k, u, Rect, Size, Point, Thing, debug, signals, onMount } from '../../ts/common/GlobalImports';
	import { IDLine, Layout, onDestroy, DebugFlag, debugReact } from '../../ts/common/GlobalImports';
	import { s_dot_size, s_graphRect, s_line_stretch } from '../../ts/managers/State';
	import Widget from '../widget/Widget.svelte';
	import Circle from '../kit/Circle.svelte';
	import Children from './Children.svelte';
	import Line from './Line.svelte';
	export let origin = new Point();
    export let path = '';
	const halfDotSize = $s_dot_size / 2;
	const widgetOffset = new Point(12, ($s_dot_size / -15) - 10);
	const lineOffset = new Point(halfDotSize - 129, halfDotSize - 7);
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
							if (childMap.path.hasChildren && childMap.path.isExpanded) {
								childMap.path.signal_relayout();
							}
						}
					}
				}, 1);
			}
		}
	})
	
	function layoutChildren() {
		// console.log(`layoutChildren => ${path.thingTitles}`);
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
	<Widget thing={map.child} path={map.childPath} origin={map.extent.offsetBy(widgetOffset)}/>
	<Line thing={map.child} path={map.childPath} curveType={map.curveType} rect={map.offsetBy(lineOffset)}/>
	{#if map.childPath.hasChildren && map.childPath.isExpanded}
		<Children path={map.childPath} origin={map.childOrigin}/>
	{/if}
{/each}
