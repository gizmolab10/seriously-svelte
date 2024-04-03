<script lang='ts'>
	import { k, Path, Point, ZIndex, onMount, signals, Layout, transparentize } from '../../ts/common/GlobalImports';
	import Widget from '../widget/Widget.svelte';
	import Arrow from '../widget/Arrow.svelte';
	import Circle from '../kit/Circle.svelte';
	export let center = Point.zero;
    export let path;
	let childOffset = new Point(k.dot_size / -3, k.cluster_offsetY);;
	let color = path.thing?.color ?? k.color_default;
	let childMapRectArray: Array<ChildMapRect> = [];
	let clusterArray: Array<NecklaceCluster>;
	
	onMount( () => {
		layoutNecklace();
		const handler = signals.handle_relayoutWidgets((signal_path) => {});
		return () => { handler.disconnect() };
	});
	
	function layoutNecklace() {
		const layout = new Layout(path, center);
		childMapRectArray = layout.childMapRectArray;
		clusterArray = layout.clusterArray;
	}
	

	// needs:
	//  hover
</script>

<Circle
	center={center}
	zindex=ZIndex.lines
	color_background='transparent'
	radius={k.necklace_radius}
	color={transparentize(color, 0.8)}/>
{#if childMapRectArray}
	{#each childMapRectArray as map}
		<Widget path={map.childPath} origin={map.childOrigin.offsetBy(childOffset)}/>
	{/each}
{/if}
{#if clusterArray}
	{#each clusterArray as cluster}
		<Arrow cluster={cluster} center={center} color={color}/>
	{/each}
{/if}
