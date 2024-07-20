<script lang='ts'>
	import { g, k, s, u, Rect, Point, ZIndex, onMount, Cluster_Map, Orientation, transparentize } from '../../ts/common/Global_Imports';
	import { s_ring_angle, s_mouse_up_count, s_mouse_location, s_cluster_arc_radius } from '../../ts/state/Reactive_State';
	import Mouse_Responder from '../mouse buttons/Mouse_Responder.svelte';
	import { ArcPart } from '../../ts/common/Enumerations';
	export let cursor_closure = () => {};
	export let cluster_map: Cluster_Map;
	export let center = Point.zero;
	export let color = 'red';
	const offset = k.necklace_widget_padding;
	const radius = $s_cluster_arc_radius + offset;
	const breadth = radius * 2;
	const thumb_size = cluster_map.thumb_radius * 2;
	const rotation_state = s.rotationState_forName(name);
	const viewBox=`${-offset} ${-offset} ${breadth} ${breadth}`;
	const thumb_element_state = cluster_map.thumb_element_state;
	let ring_color = transparentize(color, s.scrolling_ring_state.stroke_transparency * 0.9);
	let thumb_svgPath = cluster_map.thumb_svgPath;
	let thumb_center = cluster_map.thumb_center;
	let title_origin = Point.zero;
	let label_title = k.empty;
	let mouse_up_count = 0;

	onMount(() => {
		thumb_element_state.color_background = ring_color;
	})

	function update_thumb() {
		thumb_svgPath = cluster_map.thumb_svgPath;
		thumb_center = cluster_map.thumb_center;
		layout_title();
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

	function layout_title() {
		label_title = cluster_map?.cluster_title;
		const size = cluster_map?.label_tip.abs.asSize;
		const titleRect = new Rect(center.offsetBy(cluster_map?.label_tip), size.multipliedBy(1/2));
		title_origin = title_origin_for(titleRect);
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
					cluster_map.adjust_indexFor_mouse_angle(mouseAngle);
				}
			}
		}
		update_thumb();
	}

	function computed_mouseAngle(): number | null {
		return u.vector_ofOffset_fromGraphCenter_toMouseLocation(center)?.angle ?? null
	}

	function title_origin_for(rect: Rect): Point {
		const lines = label_title.split('<br>');
		const m = multiplier();
		const y = k.dot_size * m.y;
		const x = u.getWidthOf(lines[0]) * m.x;
		return rect.center.offsetByXY(x, y);
	}

	function multiplier(): Point {
		const orientation = cluster_map?.label_tip.orientation_ofVector;
		const common = -0.5;
		switch (orientation) {
			case Orientation.up:	return new Point(common, -1.5);
			case Orientation.left:	return new Point(-0.75, common);
			case Orientation.down:	return new Point(common, -1.5);
			default:				return new Point(-0.25, common);
		}
		
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
	<svg class='svg-scroll-arc' viewBox={viewBox}>
		<path stroke={ring_color} fill=transparent d={cluster_map.arc_map.arc_svgPath}/>
	</svg>
	{#if (cluster_map.isPaging)}
		<Mouse_Responder name='thumb-responder'
			center={thumb_center}
			height={thumb_size}
			width={thumb_size}>
			<svg class='svg-thumb-arc' viewBox={viewBox}>
				<path stroke={ring_color} fill=transparent d={cluster_map.thumb_map.arc_svgPath}/>
			</svg>
		</Mouse_Responder>
	{/if}
</div>
<div class='cluster-label'
	style='
		background-color: {k.color_background};
		left: {title_origin.x}px;
		top: {title_origin.y}px;
		white-space: nowrap;
		text-align: center;
		position: absolute;
		font-family: Arial;
		font-size: 0.5em;
		color: {color};'>
	{@html label_title}
</div>
