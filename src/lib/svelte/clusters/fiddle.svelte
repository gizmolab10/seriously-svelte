<script lang='ts'>
	import { k, Point, Thing, ZIndex, signals, transparentize } from '../../ts/common/GlobalImports';
	import Circle from '../kit/Circle.svelte';
	export let center = Point.zero;
	export let color = k.empty;
	export let thing: Thing;
</script>

<Circle name='necklace-ring'
	thickness=30
	center={center}
	zindex={ZIndex.lines}
	radius={k.cluster_arc_radius}
	color_background='transparent'
	color={transparentize(color, 0.97)}/>

