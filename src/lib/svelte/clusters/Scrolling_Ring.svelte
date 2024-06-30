<script lang='ts'>
	import { Svelte_Wrapper, Clusters_Geometry, transparentize, SvelteComponentType } from '../../ts/common/Global_Imports';
	import { s_graphRect, s_mouse_location, s_mouse_up_count, s_user_graphOffset } from '../../ts/state/Reactive_State';
	import { k, s, u, Rect, Thing, Point, ZIndex, signals, svgPaths, dbDispatch } from '../../ts/common/Global_Imports';
	import { s_thing_changed, s_ancestry_focus, s_cluster_arc_radius } from '../../ts/state/Reactive_State';
	import Mouse_Responder from '../mouse buttons/Mouse_Responder.svelte';
	import { necklace_ringState } from '../../ts/state/Expansion_State';
	import Scrolling_Arc from './Scrolling_Arc.svelte';
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
	const scrolling_ring_state = s.rotationState_forName(name);
	const ringOrigin = center.distanceFrom(Point.square(outer_radius));
	const viewBox = `${-ring_width}, ${-ring_width}, ${diameter}, ${diameter}`;
	const svg_ringPath = svgPaths.ring(Point.square(radius), outer_radius, ring_width);
	let mouse_up_count = $s_mouse_up_count;
	let scrollingWrapper: Svelte_Wrapper;
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
			scrollingWrapper = new Svelte_Wrapper(scrollingRing, handle_mouseData, Identifiable.newID(), SvelteComponentType.ring);
		}
	}

	function closure(mouseState) {

		/////////////////////////////
		// setup or teardown state //
		/////////////////////////////

		if (mouseState.isHover) {
			const okayToHover = !necklace_ringState.referenceAngle && !necklace_ringState.radiusOffset;
			scrolling_ring_state.isHovering = okayToHover && !mouseState.isOut;	// show highlight around ring

			// hover

			rebuilds += 1;
			cursor_closure();
		}
	}
 
	function isHit(): boolean {
		const vector = u.vector_ofOffset_fromGraphCenter_toMouseLocation(center);
		const distance = vector.magnitude;
		if (!!distance && distance.isBetween(0, outer_radius)) {
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
			// 	fill={transparentize(color, scrolling_ring_state.fill_transparency)}
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
			cursor={k.cursor_default}>
		</Mouse_Responder>
		<div class='scroll-arcs'>
			{#each geometry.cluster_maps as cluster_map}
				{#if cluster_map.shown > 0}
					<Cluster_Label cluster_map={cluster_map} center={center} color={color}/>
					<Scrolling_Arc
						center={center}
						cluster_map={cluster_map}
						scrolling_ring_name={name}
						color={transparentize(color, scrolling_ring_state.stroke_transparency * 0.7)}/>
				{/if}
			{/each}
		</div>
	</div>
{/key}
