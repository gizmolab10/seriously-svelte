<script lang='ts'>
	import { SvelteWrapper, Clusters_Geometry, transparentize, SvelteComponentType } from '../../ts/common/GlobalImports';
	import { k, s, u, Rect, Thing, Point, ZIndex, signals, svgPaths, dbDispatch } from '../../ts/common/GlobalImports';
	import { s_graphRect, s_mouse_location, s_mouse_up_count, s_user_graphOffset } from '../../ts/state/ReactiveState';
	import { s_thing_changed, s_ancestry_focus, s_cluster_arc_radius } from '../../ts/state/ReactiveState';
	import Mouse_Responder from '../mouse buttons/Mouse_Responder.svelte';
	import { scrolling_ringState } from '../../ts/state/Rotate_State';
	import { necklace_ringState } from '../../ts/state/Expand_State';
	import Cluster_ScrollArc from './Cluster_ScrollArc.svelte';
	import Identifiable from '../../ts/data/Identifiable';
	import Cluster_Label from './Cluster_Label.svelte';
	import Divider_line from './Divider_line.svelte';
	export let radius = 0;
	export let thing: Thing;
	export let ring_width = 0;
	export let name = k.empty;
	export let color = k.empty;
	export let center = Point.zero;
	export let zindex = ZIndex.panel;
	export let cursor_closure = () => {};
	export let geometry!: Clusters_Geometry;
	const outer_radius = radius + ring_width;
	const diameter = outer_radius * 2;
	const borderStyle = '1px solid';
	const dividerColor = transparentize(color, 0.8);
	const ringOrigin = center.distanceFrom(Point.square(outer_radius));
	const viewBox = `${-ring_width}, ${-ring_width}, ${diameter}, ${diameter}`;
	const svg_ringPath = svgPaths.ring(Point.square(radius), outer_radius, ring_width);
	let mouse_up_count = $s_mouse_up_count;
	let scrollingWrapper: SvelteWrapper;
	let scrollingRing;
	let rebuilds = 0

	// draw the scrolling ring, cluster labels and scroll bars
	// uses two ringState's for configuring angles and hover

	$: {
		if ($s_ancestry_focus.thing.id == $s_thing_changed.split(k.genericSeparator)[0]) {
			rebuilds += 1;
		}
	}

	$: {
		if (!!scrollingRing) {
			scrollingWrapper = new SvelteWrapper(scrollingRing, handle_mouseData, Identifiable.newID(), SvelteComponentType.ring);
		}
	}

	$: {
		if (mouse_up_count != $s_mouse_up_count) {
			mouse_up_count = $s_mouse_up_count;
			scrolling_ringState.reset();
			rebuilds += 1;
		}
	}

	$: {

		////////////////////////////////////
		// detect movement & adjust state //
		////////////////////////////////////

		const _ = $s_mouse_location;
		const from_center = u.distance_ofOffset_fromGraphCenter_toMouseLocation(center);	// use store, to react
		if (!!from_center) {
			scrolling_ringState.isHovering = isHit();	// show highlight around ring
			cursor_closure();
			rebuilds += 1;
		}
	}

	function closure(mouseState) {

		/////////////////////////////
		// setup or teardown state //
		/////////////////////////////

		if (mouseState.isHover) {
			const okayToHover = !!scrolling_ringState.referenceAngle || !!necklace_ringState.referenceAngle || !!necklace_ringState.radiusOffset;
			scrolling_ringState.isHovering = okayToHover && !mouseState.isOut;	// show highlight around ring

			// hover

			rebuilds += 1;
		} else if (isHit()) {
			const from_center = u.distance_ofOffset_fromGraphCenter_toMouseLocation(center);
			if (mouseState.isUp) {

				// end rotate

				rebuilds += 1;
			} else if (mouseState.isDown) {
				const mouseAngle = from_center.angle;

				// begin rotate

				rebuilds += 1;
				
			}
			cursor_closure();
		}
	}
 
	function isHit(): boolean {
		const vector = u.distance_ofOffset_fromGraphCenter_toMouseLocation(center);
		const distance = vector.magnitude;
		if (!!distance && distance.isBetween(radius, outer_radius)) {
			return true;
		}
		return false;
	}

	function handle_mouseData(mouseData: Mouse_State) {
		if (isHit()) {
			closure(mouseData);
		}
	}

			// <svg
			// 	viewBox={viewBox}
			// 	class='svg-scrolling-ring'
			// 	fill={transparentize(color, scrolling_ringState.fill_transparency)}
			// 	stroke={transparentize(color, 0.98)}>
			// 	<path d={svg_ringPath}/>
			// </svg>

</script>

{#key rebuilds}
	<div class='scrolling-ring' bind:this={scrollingRing}>
		<Mouse_Responder
			name={name}
			center={center}
			zindex={zindex}
			width={diameter}
			height={diameter}
			closure={closure}
			detect_longClick={false}
			detectHit_closure={isHit}
			cursor={scrolling_ringState.cursor}>
		</Mouse_Responder>
		<div class='lines-and-arcs'>
			{#each geometry.cluster_map as cluster_map}
				{#if cluster_map.shown > 0}
					<Cluster_Label cluster_map={cluster_map} center={center} color={color}/>
					{#if cluster_map.shown > 1}
						<Cluster_ScrollArc
							center={center}
							cluster_map={cluster_map}
							color={transparentize(color, scrolling_ringState.stroke_transparency * 0.7)}/>
					{/if}
				{/if}
			{/each}
		</div>
	</div>
{/key}
