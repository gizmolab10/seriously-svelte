<script lang='ts'>
	import { s_mouse_location, s_mouse_up_count, s_cluster_arc_radius } from '../../ts/state/Reactive_State';
	import { g, k, s, u, Point, ZIndex, onMount, Cluster_Map } from '../../ts/common/Global_Imports';
	import { ArcPart } from '../../ts/common/Enumerations';
	import Button from '../mouse buttons/Button.svelte';
	export let scrolling_ring_name = k.empty;
	export let cursor_closure = () => {};
	export let cluster_map: Cluster_Map;
	export let center = Point.zero;
	export let color = 'red';
	const name = cluster_map.cluster_title;
	const offset = k.necklace_widget_padding;
	const thumb_state = cluster_map.thumb_state;
	const thumb_size = cluster_map.thumb_radius * 2;
	const rotation_state = s.rotationState_forName(name);
	const scrolling_ring_state = s.rotationState_forName(scrolling_ring_name);
	let radius = $s_cluster_arc_radius + offset;
	const breadth = radius * 2;
	let mouse_up_count = 0;
	let rebuilds = 0

	onMount(() => {
		thumb_state.color_background = color;
	})

	// draws the "talking" scroll bar
	// uses cluster map for svg, which also has total and shown
	//
	// drawn by scrolling ring, which is drawn by clusters graph
	// CHANGE: drawn by clusters (which is drawn by clusters graph)?

	$: {
		if (mouse_up_count != $s_mouse_up_count) {
			mouse_up_count = $s_mouse_up_count;
			rotation_state.reset();
			rebuilds += 1;
		}
	}

	$: {

		////////////////////////////////////
		// detect movement & adjust state //
		////////////////////////////////////

		const _ = $s_mouse_location;
		const from_center = u.vector_ofOffset_fromGraphCenter_toMouseLocation(center);	// use store, to react
		if (!!from_center) {
			// rotation_state.isHovering = isHit();	// show highlight around ring
			cursor_closure();
			if (rotation_state.priorAngle != null) {				// rotate
				const mouseAngle = from_center.angle;
				const delta = mouseAngle.add_angle_normalized(-rotation_state.priorAngle);	// subtract to find difference
				if (Math.abs(delta) >= Math.PI / 90) {			// minimum two degree changes
					rotation_state.priorAngle = mouseAngle;
					const angle = mouseAngle.add_angle_normalized(-rotation_state.referenceAngle);
					adjustIndex_forAngle(angle);
					rebuilds += 1;
				}
			}
		}
	}

	function closure(mouseState) {

		/////////////////////////////
		// setup or teardown state //
		/////////////////////////////

		if (mouseState.isHover) {
			rotation_state.isHovering = !!scrolling_ring_state.isHovering;	// show highlight around ring

			// hover

			rebuilds += 1;
		} else {
			const from_center = u.vector_ofOffset_fromGraphCenter_toMouseLocation(center);
			if (mouseState.isUp) {

				// end rotate

				rebuilds += 1;
			} else if (mouseState.isDown) {
				const mouseAngle = from_center.angle;

				// begin rotate

				rotation_state.priorAngle = mouseAngle;
				rotation_state.referenceAngle = mouseAngle;
				rebuilds += 1;
			}
			cursor_closure();
		}
	}

	function adjustIndex_forAngle(angle) {

	}

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
			<path stroke={k.color_background} fill={k.color_background} d={cluster_map.gap_svgPath}/>
			{#each cluster_map.outer_svgPaths as outerPath}
				<path stroke={color} fill=transparent d={outerPath}/>
			{/each}
			{#each cluster_map.fork_svgPaths as forkPath}
				<path stroke={color} fill=transparent d={forkPath}/>
			{/each}
		{/if}
	</svg>
	{#if (cluster_map.shown < cluster_map.total) && scrolling_ring_state.isHovering}
		<Button name='thumb-responder'
			center={cluster_map.thumb_center}
			element_state={thumb_state}
			height={thumb_size}
			width={thumb_size}
			closure={closure}>
			<svg class='svg-thumb' style='position:absolute; top=0px; left=0px;'
				viewBox='0 0 {thumb_size} {thumb_size}'>
				<path stroke={color} fill={k.color_background} d={cluster_map.thumb_svgPath}/>
			</svg>
		</Button>
	{/if}
</div>
