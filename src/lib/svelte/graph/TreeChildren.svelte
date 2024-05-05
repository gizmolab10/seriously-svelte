<script lang=ts>
	import { k, u, Rect, Size, Point, Thing, debug, signals, onMount } from '../../ts/common/GlobalImports';
	import { IDLine, Layout, onDestroy, DebugFlag, debugReact } from '../../ts/common/GlobalImports';
	import { s_graphRect } from '../../ts/state/State';
	import TreeChildren from './TreeChildren.svelte';
	import Widget from '../widget/Widget.svelte';
	import Circle from '../kit/Circle.svelte';
	import TreeLine from './TreeLine.svelte';
	export let origin = new Point();
    export let path;
	const widgetOffset = new Point(12, (k.dot_size / -15) - 11.5);
	const lineOffset = new Point(-122.5, -1);
	let childMapRects: Array<ChildMapRect> = [];
	let priorTime = new Date().getTime();
	let center = new Point();
	
	$: {
		if ($s_graphRect) {
			layoutChildren()
		}
	}
	
	onMount( () => {
		layoutChildren();
		const handler = signals.handle_relayoutWidgets(1, (signal_path) => {
			const now = new Date().getTime();
			if (path.isExpanded &&
				((now - priorTime) > 100) &&
				(!signal_path || signal_path.matchesPath(path))) {
				priorTime = now;
				debugReact.log_origins(origin.x + ' before timeout');
				layoutChildren();
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
			childMapRects = new Layout(path, childrenOrigin).childMapRects;
			center = childrenOrigin.offsetBy(delta);
		} else {
			console.log(`not expanded, cannot layout ${path.description}`);
		}
	}
	
</script>

{#if debug.lines}
	<Circle radius=1 center={center} color=black thickness=1/>
{/if}
{#if path.isExpanded}
	{#each childMapRects as map}
		<Widget path={map.childPath} origin={map.extent.offsetBy(widgetOffset)}/>
		<TreeLine path={map.childPath} curveType={map.curveType} rect={map.offsetBy(lineOffset)}/>
		{#if map.childPath.showsChildRelationships}
			<TreeChildren path={map.childPath} origin={map.childOrigin}/>
		{/if}
	{/each}
{/if}
