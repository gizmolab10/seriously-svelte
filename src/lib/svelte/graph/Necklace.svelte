<script lang='ts'>
	import { k, Point, ZIndex, signals, onMount, Layout, ClusterLayout } from '../../ts/common/GlobalImports';
	import ClusterLine from './ClusterLine.svelte';
	import ClusterArc from './ClusterArc.svelte';
	import Widget from '../widget/Widget.svelte';
	import Circle from '../kit/Circle.svelte';
	export let center = Point.zero;
    export let ancestry;
	const childOffset = new Point(k.dot_size / -3, k.cluster_offsetY);;
	let color = ancestry.thing?.color ?? k.color_default;
	let clusterLayouts: Array<ClusterLayout> = [];
	let childMapRects: Array<ChildMapRect> = [];
	let rebuilds = 0;
	
	onMount( () => {
		debugReact.log_mount(`NECKLACE`);
		const layout = new Layout(ancestry, center);
		clusterLayouts = layout.clusterLayouts;
		childMapRects = layout.childMapRects;
		const handleAny = signals.handle_anySignal((signal_ancestry) => {
			rebuilds += 1;
		});
		const handleChanges = signals.hangle_thingChanged(0, ancestry.thing?.id, (value: any) => {
			color = ancestry.thing?.color ?? k.color_default;
			rebuilds += 1;
		});
		return () => {
			handleAny.disconnect()
			handleChanges.disconnect();
		};
	});

	// needs:
	//  hover
</script>

{#key rebuilds}
	{#if !!childMapRects}
		{#each childMapRects as map}
			<Widget ancestry={map.childAncestry} angle={map.childAngle} origin={map.childOrigin.offsetBy(childOffset)}/>
		{/each}
	{/if}
	{#if clusterLayouts}
		{#each clusterLayouts as cluster_layout}
			<ClusterLine cluster_layout={cluster_layout} center={center} color={color}/>
			{#if cluster_layout.count > 1}
				<ClusterArc cluster_layout={cluster_layout} center={center} color={color}/>
			{/if}
		{/each}
	{/if}
{/key}
