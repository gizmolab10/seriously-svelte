<script lang='ts'>
	import { s_thing_changed, s_ancestry_focus, s_ring_angle, s_cluster_arc_radius } from '../../ts/state/ReactiveState';
	import { s_graphRect, s_user_graphOffset, s_mouse_location, s_mouse_up_count } from '../../ts/state/ReactiveState';
	import { k, s, u, Thing, Point, ZIndex, signals, svgPaths, dbDispatch } from '../../ts/common/GlobalImports';
	import { transparentize, SvelteWrapper, SvelteComponentType } from '../../ts/common/GlobalImports';
	import Mouse_Responder from '../mouse buttons/Mouse_Responder.svelte';
	import { necklace_ringState } from '../../ts/state/Expand_State';
	import Identifiable from '../../ts/data/Identifiable';
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
	const ringOrigin = center.distanceFrom(Point.square(outer_radius));
	const viewBox = `${-ring_width}, ${-ring_width}, ${diameter}, ${diameter}`;
	const svg_ringPath = svgPaths.ring(Point.square(radius), outer_radius, ring_width);
	let mouse_up_count = $s_mouse_up_count;
	let neckaceWrapper = SvelteWrapper;
	let necklaceRing;
	let rebuilds = 0

	$: {
		if ($s_ancestry_focus.thing.id == $s_thing_changed.split(k.genericSeparator)[0]) {
			rebuilds += 1;
		}
	}

	$: {
		if (!!necklaceRing) {
			neckaceWrapper = new SvelteWrapper(necklaceRing, handle_mouseData, Identifiable.newID(), SvelteComponentType.ring);
		}
	}

	$: {
		if (mouse_up_count != $s_mouse_up_count) {
			mouse_up_count = $s_mouse_up_count;
			necklace_ringState.reset();
			rebuilds += 1;
		}
	}

	$: {

		////////////////////////////////////
		// detect movement & adjust state //
		////////////////////////////////////

		const from_center = distance_fromCenter_of($s_mouse_location);	// use store, to react
		if (!!from_center) {
			let sendSignal = false;
			necklace_ringState.isHovering = isHit();	// show highlight around ring
			cursor_closure();
			if (necklace_ringState.radiusOffset != null) {				// resize
				const magnitude = from_center.magnitude
				const largest = k.cluster_inside_radius * 4;
				const smallest = k.cluster_inside_radius * 1.5;
				const distance = magnitude.force_between(smallest, largest);
				const movement = distance - $s_cluster_arc_radius - necklace_ringState.radiusOffset;
				if (Math.abs(movement) > 5) {
					sendSignal = true;
					$s_cluster_arc_radius += movement;
				}
			}
			if (necklace_ringState.priorAngle != null) {					// rotate
				let mouseAngle = from_center.angle;
				const delta = mouseAngle.add_angle_normalized(-necklace_ringState.priorAngle);
				if (Math.abs(delta) >= Math.PI / 90) {			// minimum two degree changes
					sendSignal = true;
					necklace_ringState.priorAngle = mouseAngle;
					$s_ring_angle = mouseAngle.add_angle_normalized(necklace_ringState.startAngle);
				}
			}
			if (sendSignal) {
				rebuilds += 1;
				signals.signal_relayoutWidgets_fromFocus();		// destroys this component (variables wiped)
			}
		}
	}

	function closure(mouseState) {

		/////////////////////////////
		// setup or teardown state //
		/////////////////////////////

		if (mouseState.isHover) {
			if (!necklace_ringState.startAngle && !necklace_ringState.radiusOffset) {
				necklace_ringState.isHovering = true;	// show highlight around ring
	
				// hover
	
				rebuilds += 1;
			}
		} else if (isHit()) {
			const from_center = distance_fromCenter_of($s_mouse_location);
			if (mouseState.isDouble) {

				// begin resize
				
				necklace_ringState.radiusOffset = from_center.magnitude - $s_cluster_arc_radius;
				rebuilds += 1;
			} else if (mouseState.isUp) {

				// end rotate and resize

				necklace_ringState.reset();
				rebuilds += 1;
			} else if (mouseState.isDown) {
				const mouseAngle = from_center.angle;

				// begin rotate

				necklace_ringState.priorAngle = mouseAngle;
				necklace_ringState.startAngle = mouseAngle.add_angle_normalized($s_ring_angle);
				rebuilds += 1;
				
			}
			cursor_closure();
		}
	}

	function distance_fromCenter_of(location?: Point): Point | null {
		if (!!location) {
			const mainOffset = $s_graphRect.origin.offsetBy($s_user_graphOffset);
			return mainOffset.offsetBy(center).distanceTo(location);
		}
		return null
	}
 
	function isHit(): boolean {
		const vector = distance_fromCenter_of($s_mouse_location);
		const distance = vector.magnitude;
		if (!!distance && distance.isBetween(radius, outer_radius)) {
			return true;
		}
		return false;
	}

	function handle_mouseData(mouseData: Mouse_State): boolean {
		if (!mouseData.isMove && isHit()) {
			closure(mouseData);
		}
	}

</script>

{#key rebuilds}
	<div class='neckace-ring' bind:this={necklaceRing}>
		<Mouse_Responder
			name={name}
			center={center}
			zindex={zindex}
			width={diameter}
			height={diameter}
			closure={closure}
			detect_longClick={false}
			detectHit_closure={isHit}
			cursor={necklace_ringState.cursor}>
			<svg
				viewBox={viewBox}
				class= 'svg-neckace-ring'
				fill={transparentize(color, necklace_ringState.fill_transparency)}
				stroke={transparentize(color, necklace_ringState.stroke_transparency)}>
				<path d={svg_ringPath}>
			</svg>
		</Mouse_Responder>
	</div>
{/key}
