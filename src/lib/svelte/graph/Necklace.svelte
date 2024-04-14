<script lang='ts'>
	import { k, Path, Point, ZIndex, onMount, signals, Layout, transparentize } from '../../ts/common/GlobalImports';
	import ClusterLine from './ClusterLine.svelte';
	import Widget from '../widget/Widget.svelte';
	import Circle from '../kit/Circle.svelte';
	export let center = Point.zero;
    export let path;
	let childOffset = new Point(k.dot_size / -3, k.cluster_offsetY);;
	let color = path.thing?.color ?? k.color_default;
	let clusterLayouts: Array<ClusterLayout> = [];
	let childMapRects: Array<ChildMapRect> = [];
	let rebuilds = 0;
	
	onMount( () => {
		const layout = new Layout(path, center);
		childMapRects = layout.childMapRects;
		clusterLayouts = layout.clusterLayouts;
		const handler = signals.handle_anySignal((signal_path) => { rebuilds += 1; });
		return () => { handler.disconnect() };
	});
	
	// <Circle
	// 	center={center}
	// 	zindex=ZIndex.lines
	// 	color_background='transparent'
	// 	radius={k.necklace_gap}
	// 	color={transparentize(color, 0.8)}/>

	// needs:
	//  hover
</script>

{#key rebuilds}
	{#if childMapRects}
		{#each childMapRects as map}
			<Widget path={map.childPath} angle={map.childAngle} origin={map.childOrigin.offsetBy(childOffset)}/>
		{/each}
	{/if}
	{#if clusterLayouts}
		{#each clusterLayouts as clusterLayout}
			<ClusterLine layout={clusterLayout} center={center} color={color}/>
		{/each}
	{/if}
{/key}
