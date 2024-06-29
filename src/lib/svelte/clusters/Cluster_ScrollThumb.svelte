<script lang='ts'>
	import { k, s, Point, ZIndex, onMount } from '../../ts/common/GlobalImports';
	import Mouse_Responder from '../mouse buttons/Mouse_Responder.svelte';
	export let cluster_map: Cluster_Map;
	export let size = k.dot_size;
	export let color = 'red';
	const elementState = cluster_map.thumbState;		// survives onDestroy, created by cluster arc map
	const name = elementState.name;
	let center = Point.zero;
	let cluster_thumb;

	onMount(() => {
		center = cluster_map.thumb_center.offsetBy(cluster_map.origin);
	});

	function closure() {}

</script>

<Mouse_Responder
	width={size}
	height={size}
	center={center}
	closure={closure}
	name={elementState.name}>
	<button class='dot'
		bind:this={cluster_thumb}
		id={'button-for-' + name}
		style='
			border:none;
			cursor:pointer;
			width:{size}px;
			height:{size}px;
			color:transparent;
			position:absolute;
			z-index:{ZIndex.dots};
			background-color:transparent;'>
		<svg>
			<path stroke={color} fill={k.color_background} d={cluster_map.thumb_svgPath}/>
		</svg>
</Mouse_Responder>
