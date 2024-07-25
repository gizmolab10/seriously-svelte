<script lang='ts'>
	import { s_graphRect, s_mouse_location, s_mouse_up_count, s_user_graphOffset } from '../../ts/state/Reactive_State';
	import { k, s, u, Rect, Thing, Point, ZIndex, signals, svgPaths, dbDispatch } from '../../ts/common/Global_Imports';
	import { Svelte_Wrapper, Clusters_Geometry, SvelteComponentType } from '../../ts/common/Global_Imports';
	import { s_thing_changed, s_ancestry_focus, s_cluster_arc_radius } from '../../ts/state/Reactive_State';
	import Mouse_Responder from '../mouse buttons/Mouse_Responder.svelte';
	import Identifiable from '../../ts/data/Identifiable';
	import Paging_Arc from './Paging_Arc.svelte';
	export let radius = 0;
	export let thing: Thing;
	export let ring_width = 0;
	export let name = k.empty;
	export let color = k.empty;
	export let center = Point.zero;
	export let zindex = ZIndex.panel;
	export let cursor_closure = () => {};
	const outer_radius = radius + ring_width;
	const diameter = outer_radius * 2;
	const borderStyle = '1px solid';
	const geometry = s.clusters_geometry;
	const ringOrigin = center.distanceFrom(Point.square(outer_radius));
	const viewBox = `${-ring_width}, ${-ring_width}, ${diameter}, ${diameter}`;
	const svg_ringPath = svgPaths.ring(Point.square(radius), outer_radius, ring_width);
	let mouse_up_count = $s_mouse_up_count;
	let pagingWrapper!: Svelte_Wrapper;
	let pagingRing;
	let rebuilds = 0

	// draw the paging ring, cluster labels and scroll bars
	// uses two ringState's for configuring angles and hover

	$: {
		if ($s_ancestry_focus.thing.id == $s_thing_changed.split(k.generic_separator)[0]) {
			rebuilds += 1;
		}
	}

	$: {
		if (!!pagingRing) {
			pagingWrapper = new Svelte_Wrapper(pagingRing, handle_mouseData, Identifiable.newID(), SvelteComponentType.ring);
		}
	}

	function closure(mouseState) {

		/////////////////////////////
		// setup or teardown state //
		/////////////////////////////

		if (mouseState.isHover) {
			console.log('paging ring hover')
			s.paging_ring_state.isHovering = !mouseState.isOut;	// show thumb

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

</script>

{#key rebuilds}
	<div class='paging-ring' bind:this={pagingRing}>
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
					<Paging_Arc
						color={color}
						center={center}
						cluster_map={cluster_map}/>
				{/if}
			{/each}
		</div>
	</div>
{/key}
