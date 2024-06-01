<script lang='ts'>
	import { k, s, u, Thing, Point, ZIndex, signals, svgPaths, MouseData, dbDispatch, transparentize } from '../../ts/common/GlobalImports';
	import { s_thing_changed, s_ancestry_focus, s_ring_angle, s_cluster_arc_radius } from '../../ts/state/ReactiveState';
	import { s_graphRect, s_user_graphOffset, s_mouse_location, s_mouse_up_count } from '../../ts/state/ReactiveState';
	import MouseButton from './MouseButton.svelte';
	export let cursor_closure = () => {};
	export let zindex = ZIndex.panel;
	export let center = Point.zero;
	export let color = 'k.empty';
	export let name = 'k.empty';
	export let ring_width = 0;
	export let thing: Thing;
	export let radius = 0;
	const outer_radius = radius + ring_width;
	const borderStyle = '1px solid';
	const diameter = outer_radius * 2;
	const ringState = s.ringState_forName(name);
	const viewBox = `${-ring_width}, ${-ring_width}, ${diameter}, ${diameter}`;
	const ringOrigin = center.distanceFrom(Point.square(outer_radius));
	const svg_ringPath = svgPaths.ring(Point.square(radius), outer_radius, ring_width);
	let rebuilds = 0
	let ringButton;

	$: {
		if ($s_ancestry_focus.thing.id == $s_thing_changed.split(k.genericSeparator)[0]) {
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
			ringState.isHovering = determine_isHovering();
			cursor_closure();
			if (ringState.radiusOffset != null) {				// resize
				const distance = Math.max(k.cluster_inside_radius * 4, from_center.magnitude);
				const movement = distance - $s_cluster_arc_radius - ringState.radiusOffset;
				if (Math.abs(movement) > 5) {
					sendSignal = true;
					$s_cluster_arc_radius += movement;
				}
			}
			if (ringState.priorAngle != null) {					// rotate
				const mouseAngle = from_center.angle;
				const delta = mouseAngle.add_angle_normalized(-ringState.priorAngle);
				if (Math.abs(delta) >= Math.PI / 90) {			// minimum two degree changes
					sendSignal = true;
					ringState.priorAngle = mouseAngle;
					$s_ring_angle = mouseAngle.add_angle_normalized(-ringState.startAngle);
				}
			}
			if (sendSignal) {
				rebuilds += 1;
				signals.signal_rebuildGraph_fromFocus();		// destroys this component (variables wiped)
			}
		}
	}

	function closure(mouseData: MouseData) {

		/////////////////////////////
		// setup or teardown state //
		/////////////////////////////

		ringState.isHovering = determine_isHovering();
		if (!mouseData.isHover) {
			const from_center = distance_fromCenter_of($s_mouse_location);
			if (mouseData.isDouble) {

				// begin resize

				ringState.radiusOffset = from_center.magnitude - $s_cluster_arc_radius;
				rebuilds += 1;
			} else if (mouseData.isUp) {

				// end rotate and resize

				ringState.reset();
				rebuilds += 1;
			} else if (ringState.isHovering) {
				const mouseAngle = from_center.angle;

				// begin rotate

				ringState.priorAngle = mouseAngle;
				ringState.startAngle = mouseAngle.add_angle_normalized(-$s_ring_angle);
				rebuilds += 1;
				
			}
			cursor_closure();
		} else if (!ringState.startAngle && !ringState.radiusOffset) {

			// hover

			rebuilds += 1;
		}
	}

	function distance_fromCenter_of(location?: Point): Point | null {
		if (!!location) {
			const mainOffset = $s_graphRect.origin.offsetBy($s_user_graphOffset);
			return mainOffset.offsetBy(center).distanceTo(location);
		}
		return null
	}
 
	function determine_isHovering(): boolean {
		const vector = distance_fromCenter_of($s_mouse_location);
		const distance = vector.magnitude;
		if (!!distance && distance.isBetween(radius, outer_radius)) {
			return true;
		}
		return false;
	}

</script>

{#key rebuilds}
	<div class='ring-button' bind:this={ringButton}>
		<MouseButton
			name={name}
			center={center}
			zindex={zindex}
			width={diameter}
			height={diameter}
			closure={closure}
			detect_longClick={false}
			cursor={ringState.cursor}
			hover_closure={determine_isHovering}>
			<svg
				viewBox={viewBox}
				class= 'svg-ring-button'
				fill={transparentize(color, ringState.fill_transparency)}
				stroke={transparentize(color, ringState.stroke_transparency)}>
				<path d={svg_ringPath}>
			</svg>
		</MouseButton>
	</div>
{/key}
