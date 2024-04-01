<script lang='ts'>
	import { k, Path, Point, ZIndex, onMount, signals, Layout, transparentize } from '../../ts/common/GlobalImports';
	import Widget from '../widget/Widget.svelte';
	import Circle from '../kit/Circle.svelte';
	import Line from '../widget/Line.svelte';
	export let center: Point;
    export let path;
	let childOffset = new Point(k.dot_size / -3, k.cluster_offsetY);;
	let childMapRectArray: Array<ChildMapRect> = [];
	
	onMount( () => {
		layoutNecklace();
		const handler = signals.handle_relayoutWidgets((signal_path) => {});
		return () => { handler.disconnect() };
	});
	
	function layoutNecklace() {
		childMapRectArray = new Layout(path, center).childMapRectArray;
	}
	
	// needs:
	//  hover
</script>

<Circle
	center={center}
	zindex=ZIndex.lines
	color_background='transparent'
	radius={k.necklace_radius}
	color={transparentize(path.thing.color, 0.8)}/>
{#each childMapRectArray as map}
	<Widget path={map.childPath} origin={map.childOrigin.offsetBy(childOffset)}/>
{/each}