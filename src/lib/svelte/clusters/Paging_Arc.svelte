<script lang='ts'>
	import { s_mouse_location, s_mouse_up_count, s_ancestry_focus, s_rotation_ring_radius } from '../../ts/state/Reactive_State';
	import { g, k, u, ux, Rect, Size, Point, ZIndex, onMount, Cluster_Map, Orientation } from '../../ts/common/Global_Imports';
	import { ElementType, Svelte_Wrapper, transparentize, SvelteComponentType } from '../../ts/common/Global_Imports';
	import Mouse_Responder from '../mouse buttons/Mouse_Responder.svelte';
	import { ArcPart } from '../../ts/common/Enumerations';
	import Identifiable from '../../ts/data/Identifiable';
	export let cursor_closure = () => {};
	export let cluster_map: Cluster_Map;
	export let center = Point.zero;
	export let color = 'red';
	const offset = k.rotation_ring_widget_padding;
	const radius = $s_rotation_ring_radius + offset;
	const breadth = radius * 2;
	const viewBox=`${-offset} ${-offset} ${breadth} ${breadth}`;
	const name = ux.name_from($s_ancestry_focus, ElementType.arc, cluster_map?.cluster_title ?? 'not mapped');
	const thumb_size = (cluster_map?.paging_radius ?? 0) * 2;
	const paging_arc_state = ux.rotationState_forName(name);
	const paging_ring_state = ux.paging_ring_state;
	const thumb_name = `thumb-${name}`;
	let pagingArc;
	let rebuilds = 0;
	let label_title = k.empty;
	let title_origin = Point.zero;
	let pagingArcWrapper!: Svelte_Wrapper;
	let mouse_up_count = $s_mouse_up_count;
	let origin = center.offsetBy(Point.square(-radius));
	let transparency_multiplier = (ux.rotation_ring_state.isHighlighted ? 0.9 : 0.8);	// dim arcs when rotation ring highlighted: hover/rotate/expand
	let arc_color = transparentize(color, paging_ring_state.stroke_transparency * transparency_multiplier);
	let thumb_color = transparentize(color, paging_arc_state.stroke_transparency * transparency_multiplier);

	// draws the [paging] arc and thumb slider
	// uses paging_map for svg, which also has total and shown
	//
	// drawn by paging ring, which is drawn by clusters graph
	// CHANGE: drawn by clusters (which is drawn by clusters graph)?

	$: {
		if (!!pagingArc) {
			pagingArcWrapper = new Svelte_Wrapper(pagingArc, handle_mouse_state, -1, SvelteComponentType.thumb);
		}
	}

	$: {
		if (mouse_up_count != $s_mouse_up_count) {
			mouse_up_count = $s_mouse_up_count;
			paging_arc_state.reset();
			layout_title();
		}
	}

	$: {
		const _ = k.empty + ($s_mouse_location?.description ?? k.empty);			// use store, to react
		handle_mouse_moved();
	}

	function handle_mouse_state(mouse_state: Mouse_State): boolean { return thumb_isHit(); }

	function update_thumb_color() {
		thumb_color = transparentize(color, paging_arc_state.stroke_transparency * 0.8);
	}

	function computed_mouse_angle(): number | null {
		return u.vector_ofOffset_fromGraphCenter_toMouseLocation(center)?.angle ?? null
	}
 
	function thumb_isHit(): boolean {
		if (!!cluster_map) {
			const ring_origin = center.offsetBy(Point.square(-$s_rotation_ring_radius));
			const vector = u.vector_ofOffset_fromGraphCenter_toMouseLocation(ring_origin);
			return vector.isContainedBy_path(cluster_map.thumb_map.arc_svgPath);
		}
		return false;
	}

	function layout_title() {
		if (!!cluster_map) {
			label_title = cluster_map.cluster_title;
			const size = cluster_map.label_tip.abs.asSize;
			const titleRect = new Rect(center.offsetBy(cluster_map.label_tip), size.multipliedBy(1/2));
			title_origin = title_origin_for(titleRect);
		}
	}

	function title_origin_for(rect: Rect): Point {
		const lines = label_title.split('<br>');
		const m = multiplier();
		const y = k.dot_size * m.y;
		const x = u.getWidthOf(lines[0]) * m.x;
		return rect.center.offsetByXY(x, y);
	}

	function multiplier(): Point {
		if (!!cluster_map) {
			const orientation = cluster_map.label_tip.orientation_ofVector;
			const common = -0.5;
			switch (orientation) {
				case Orientation.up:	return new Point(common, -1.5);
				case Orientation.left:	return new Point(-0.75, common);
				case Orientation.down:	return new Point(common, -1.5);
				default:				return new Point(-0.25, common);
			}
		}
		return Point.zero;
	}

	function mouse_state_closure(mouse_state) {

		/////////////////////////////
		// setup or teardown state //
		/////////////////////////////

		if (cluster_map.isPaging) {
			if (mouse_state.isHover) {
	
				// hover

				paging_arc_state.isHovering = thumb_isHit();	// show highlight around ring
				update_thumb_color();
			} else if (mouse_state.isUp) {
	
				// end rotate
	
				update_thumb_color();
			} else if (mouse_state.isDown) {
	
				// begin rotate
	
				const mouse_angle = computed_mouse_angle();
				if (!!mouse_angle) {
					console.log(`down ${mouse_angle.degrees_of(0)}`);
					paging_arc_state.lastRotated_angle = mouse_angle;
					paging_arc_state.basis_angle = mouse_angle;
					update_thumb_color();
				}			
			}
			cursor_closure();
		}
	}

	function handle_mouse_moved() {

		////////////////////////////////////
		// detect movement & adjust state //
		////////////////////////////////////

		if (!!paging_arc_state.lastRotated_angle) {									// rotate
			console.log(`paging`);
			cursor_closure();
			if (!!cluster_map) {
				const mouse_angle = computed_mouse_angle();
				if (!!mouse_angle) {
					const delta = Math.abs(mouse_angle - paging_arc_state.lastRotated_angle);	// subtract to find difference
					if (delta >= (Math.PI / 90)) {									// minimum two degree changes
						console.log(`move ${mouse_angle.degrees_of(0)}`);
						paging_arc_state.lastRotated_angle = mouse_angle;
						cluster_map.adjust_paging_index_forMouse_angle(mouse_angle);
						console.log(`paging ${mouse_angle.degrees_of(0)}`)
						rebuilds += 1;
					}
				}
			}
		}
		layout_title();
	}

</script>

{#if !!cluster_map && cluster_map.shown > 1}
	<div class='paging-arc' bind:this={pagingArc} style='z-index:{ZIndex.paging};'>
		<Mouse_Responder
			name={name}
			center={center}
			width={breadth}
			height={breadth}
			zindex={ZIndex.panel}
			detect_longClick={false}
			cursor={k.cursor_default}
			closure={mouse_state_closure}
			detectHit_closure={thumb_isHit}>
			<svg class='svg-paging-arc' viewBox={viewBox}>
				<path stroke={arc_color} fill=transparent d={cluster_map.paging_map.arc_svgPath}/>
				{#if (cluster_map.isPaging)}
					{#key rebuilds}
						<path fill={thumb_color} d={cluster_map.thumb_map.arc_svgPath}/>
					{/key}
				{/if}
			</svg>
		</Mouse_Responder>
	</div>
{/if}
<div class='cluster-label'
	style='
		background-color: {k.color_background};
		left: {title_origin.x}px;
		top: {title_origin.y}px;
		white-space: nowrap;
		font-family: Arial;
		text-align: center;
		position: absolute;
		font-size: 0.5em;
		color: {color};'>
	{@html label_title}
</div>
