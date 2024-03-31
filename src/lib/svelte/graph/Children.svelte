<script lang=ts>
	import { k, u, Rect, Size, Point, Thing, debug, signals, onMount } from '../../ts/common/GlobalImports';
	import { IDLine, Layout, onDestroy, DebugFlag, debugReact } from '../../ts/common/GlobalImports';
	import { s_graphRect } from '../../ts/common/State';
	import Widget from '../widget/Widget.svelte';
	import Circle from '../kit/Circle.svelte';
	import Children from './Children.svelte';
	import Line from '../widget/Line.svelte';
	export let origin = new Point();
    export let path;
	const widgetOffset = new Point(12, (k.dot_size / -15) - 10.7);
	const lineOffset = new Point(-123.5, -1);
	let childMapRectArray: Array<ChildMapRect> = [];
	let priorTime = new Date().getTime();
	let center = new Point();
	
	$: {
		if ($s_graphRect) {
			layoutChildren()
		}
	}
	
	onMount( () => {
		layoutChildren();
		const handler = signals.handle_relayoutWidgets((signal_path) => {
			const now = new Date().getTime();
			if (path.isExpanded &&
				((now - priorTime) > 100) &&
				(!signal_path || signal_path.matchesPath(path))) {
				priorTime = now;
				debugReact.log_origins(origin.x + ' before timeout');
				setTimeout(async () => {	// delay until all other handlers for this signal are done TODO: WHY?
					layoutChildren();
				}, 1);
			}
		});
		return () => { handler.disconnect() };
	});
	
	function layoutChildren() {
		if (path.isExpanded) {
			debugReact.log_origins(origin.x + ' children layout');
			const delta = new Point(17.9, -2.4);
			const height = path.visibleProgeny_halfHeight;
			const childrenOrigin = origin.offsetByY(height);
			childMapRectArray = new Layout(path, childrenOrigin).childMapRectArray;
			center = childrenOrigin.offsetBy(delta);
		} else {
			console.log(`not expanded, cannot layout ${path.title}`);
		}
	}
	
</script>

{#if debug.lines}
	<Circle radius=1 center={center} color=black thickness=1/>
{/if}
{#if path.isExpanded}
	{#each childMapRectArray as map}
		<Widget path={map.childPath} origin={map.extent.offsetBy(widgetOffset)}/>
		<Line path={map.childPath} curveType={map.curveType} rect={map.offsetBy(lineOffset)}/>
		{#if map.childPath.showsChildren}
			<Children path={map.childPath} origin={map.childOrigin}/>
		{/if}
	{/each}
{/if}
