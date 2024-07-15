<script lang='ts'>
	import { Arc_Map } from '../../ts/common/Global_Imports';
	import Button from '../mouse buttons/Button.svelte';
	export let element_state: Element_State;
	export let viewBox = k.empty;
	export let arc_map: Arc_Map;
	export let color = 'red';
	export let size = 20;

</script>

<Button
	width={size}
	height={size}
	name={element_state.name}
	element_state={element_state}
	center={arc_map.clusters_center}>
	<svg class='svg-scroll-arc' viewBox={viewBox}>
		{#if arc_map.shown < 2}
			<path stroke={color} fill=transparent d={arc_map.single_svgPath}/>
		{:else}
			<path stroke={color} fill=transparent d={arc_map.arc_svgPath}/>
		{/if}
	</svg>
</Button>
