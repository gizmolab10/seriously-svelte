<script lang='ts'>
	import { s_ring_angle, s_mouse_up_count, s_mouse_location, s_cluster_arc_radius } from '../../ts/state/Reactive_State';
	import { g, k, s, u, Point, ZIndex, onMount, Cluster_Map } from '../../ts/common/Global_Imports';
	import { ArcPart } from '../../ts/common/Enumerations';
	import Button from '../mouse buttons/Button.svelte';
	export let cursor_closure = () => {};
	export let cluster_map: Cluster_Map;
	export let center = Point.zero;
	export let color = 'red';
	const name = cluster_map.cluster_title;
	const offset = k.necklace_widget_padding;
	const thumb_state = cluster_map.thumb_state;
	const thumb_size = cluster_map.thumb_radius * 2;
	const rotation_state = s.rotationState_forName(name);
	let thumb_svgPath = cluster_map.thumb_svgPath;
	let thumb_center = cluster_map.thumb_center;
	let radius = $s_cluster_arc_radius + offset;
	const breadth = radius * 2;
	let mouse_up_count = 0;

	onMount(() => {
		thumb_state.color_background = color;
	})

	function update_thumb() {
		thumb_svgPath = cluster_map.thumb_svgPath;
		thumb_center = cluster_map.thumb_center;
	}

	// draws the "talking" scroll bar
	// uses cluster map for svg, which also has total and shown
	//
	// drawn by scrolling ring, which is drawn by clusters graph
	// CHANGE: drawn by clusters (which is drawn by clusters graph)?

	$: {
		if (mouse_up_count != $s_mouse_up_count) {
			mouse_up_count = $s_mouse_up_count;
			rotation_state.reset();
			update_thumb();
		}
	}

	$: {

		////////////////////////////////////
		// detect movement & adjust state //
		////////////////////////////////////

		const _ = k.empty + $s_ring_angle + ($s_mouse_location?.description ?? k.empty);		// use store, to react
		if (!!rotation_state.priorAngle) {										// rotate
			cursor_closure();
			const mouseAngle = computed_mouseAngle();
			if (!!mouseAngle) {
				const delta = Math.abs(mouseAngle - rotation_state.priorAngle);	// subtract to find difference
				if (delta >= (Math.PI / 90)) {									// minimum two degree changes
					rotation_state.priorAngle = mouseAngle;
					cluster_map.adjust_index_forThumb_angle(mouseAngle);
				}
			}
		}
		update_thumb();
	}

	function computed_mouseAngle(): number | null {
		return u.vector_ofOffset_fromGraphCenter_toMouseLocation(center)?.angle ?? null
	}

	function closure(mouseState) {

		/////////////////////////////
		// setup or teardown state //
		/////////////////////////////

		if (mouseState.isHover) {
			rotation_state.isHovering = !!s.scrolling_ring_state.isHovering;	// show highlight around ring

			// hover

			update_thumb();
		} else {
			if (mouseState.isUp) {

				// end rotate

				update_thumb();
			} else if (mouseState.isDown) {
				const mouseAngle = computed_mouseAngle();

				// begin rotate

				if (!!mouseAngle) {
					rotation_state.priorAngle = mouseAngle;
					rotation_state.referenceAngle = mouseAngle;
					update_thumb();
				}
			}
			cursor_closure();
		}
	}

	// && (s.scrolling_ring_state.isHovering || rotation_state.isActive)

</script>

<div name={name} style='
	position: absolute;
	width: {breadth}px;
	height: {breadth}px;
	zindex: {ZIndex.frontmost};
	top: {center.y - radius}px;
	left: {center.x - radius}px;'>
	<svg class='svg-scroll-arc' 
		viewBox='{-offset} {-offset} {breadth} {breadth}'>
		{#if cluster_map.shown < 2}
			<path stroke={color} fill=transparent d={cluster_map.single_svgPath}/>
		{:else}
			{#each cluster_map.main_svgPaths as mainPath}
				<path stroke={color} fill=transparent d={mainPath}/>
			{/each}
			{#each cluster_map.outer_svgPaths as outerPath}
				<path stroke={color} fill=transparent d={outerPath}/>
			{/each}
		{/if}
	</svg>
	{#if (cluster_map.shown < cluster_map.total)}
		<Button name='thumb-responder'
			element_state={thumb_state}
			center={thumb_center}
			height={thumb_size}
			width={thumb_size}
			closure={closure}>
			<svg class='svg-thumb' style='position:absolute; top=0px; left=0px;'
				viewBox='0 0 {thumb_size} {thumb_size}'>
				<path stroke={color} fill={k.color_background} d={thumb_svgPath}/>
			</svg>
		</Button>
	{/if}
</div>
