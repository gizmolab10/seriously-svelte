<script lang=ts>
	import { k, u, Rect, Size, Point, Thing, debug, signals, onMount } from '../../ts/common/GlobalImports';
	import { IDLine, Layout, onDestroy, DebugFlag, debugReact } from '../../ts/common/GlobalImports';
	import { s_graphRect } from '../../ts/common/State';
	import Widget from '../widget/Widget.svelte';
	import Circle from '../kit/Circle.svelte';
	import Children from './Children.svelte';
	import Line from '../widget/Line.svelte';
	export let origin = new Point();
    export let path = '';
	const widgetOffset = new Point(12, (k.dot_size / -15) - 10.5);
	const lineOffset = new Point(-123.5, -0.8);
	let childMapRectArray: Array<ChildMapRect> = [];
	let priorTime = new Date().getTime();
	let center = new Point();

	onMount( () => { layoutChildren(); });
	onDestroy( () => { signalHandler.disconnect(); });
	
	$: {
		if ($s_graphRect) {
			layoutChildren()
		}
	}
	
	const signalHandler = signals.handle_relayoutWidgets((signal_path) => {
		const now = new Date().getTime();
		if (path.isExpanded &&
			((now - priorTime) > 100) &&
			(!signal_path || signal_path.matchesPath(path))) {
			priorTime = now;
			console.log(origin.x + ' before timeout');
			setTimeout(async () => {	// delay until all other handlers for this signal are done TODO: WHY?
				layoutChildren();
				if (signal_path) {		// only recurse if starting at a specific signal_path
					for (const childMapRect of childMapRectArray) {
						if (childMapRect.path.hasChildren && childMapRect.path.isExpanded) {
							childMapRect.path.signal_relayoutWidgets();
						}
					}
				}
			}, 1);
		}
	});
	
	function layoutChildren() {
		if (path.isExpanded) {
			console.log(origin.x + ' children layout');
			const delta = new Point(19, -2);
			const height = path.visibleProgeny_halfHeight;
			const childrenOrigin = origin.offsetByY(height);
			childMapRectArray = new Layout(path, childrenOrigin).childMapRectArray;
			center = childrenOrigin.offsetBy(delta);
		}
	}
	
</script>

{#if debug.lines}
	<Circle radius=1 center={center} color=black thickness=1/>
{/if}
{#if path.isExpanded}
	{#each childMapRectArray as map}
		<Widget thing={map.child} path={map.childPath} origin={map.extent.offsetBy(widgetOffset)}/>
		<Line thing={map.child} path={map.childPath} curveType={map.curveType} rect={map.offsetBy(lineOffset)}/>
		{#if map.childPath.hasChildren && map.childPath.isExpanded}
			<Children path={map.childPath} origin={map.childOrigin}/>
		{/if}
	{/each}
{/if}
