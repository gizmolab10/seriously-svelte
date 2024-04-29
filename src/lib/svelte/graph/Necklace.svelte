<script lang='ts'>
	import { k, Point, ZIndex, signals, onMount, Layout, ClusterLayout } from '../../ts/common/GlobalImports';
	import ClusterLine from './ClusterLine.svelte';
	import ClusterArc from './ClusterArc.svelte';
	import Widget from '../widget/Widget.svelte';
	import Circle from '../kit/Circle.svelte';
	export let center = Point.zero;
    export let path;
	const childOffset = new Point(k.dot_size / -3, k.cluster_offsetY);;
	const color = path.thing?.color ?? k.color_default;
	let clusterLayouts: Array<ClusterLayout> = [];
	let childMapRects: Array<ChildMapRect> = [];
	let rebuilds = 0;
	
	onMount( () => {
		const layout = new Layout(path, center);
		clusterLayouts = layout.clusterLayouts;
		childMapRects = layout.childMapRects;
		const handler = signals.handle_anySignal((signal_path) => { rebuilds += 1; });
		return () => { handler.disconnect() };
	});

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
			{#if clusterLayout.count > 1}
				<ClusterArc layout={clusterLayout} center={center} color={color}/>
			{/if}
		{/each}
	{/if}
{/key}
