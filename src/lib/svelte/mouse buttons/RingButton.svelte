<script lang='ts'>
	import { k, s, u, Thing, Point, ZIndex, signals, svgPaths, Mouse, dbDispatch, transparentize } from '../../ts/common/GlobalImports';
	import { s_thing_changed, s_ancestry_focus, s_ring_angle, s_cluster_arc_radius } from '../../ts/state/Stores';
	import { s_graphRect, s_user_graphOffset, s_mouse_location, s_mouse_up_count } from '../../ts/state/Stores';
	import MouseButton from './MouseButton.svelte';
	export let zindex = ZIndex.panel;
	export let center = Point.zero;
	export let color = 'k.empty';
	export let name = k.empty;
	export let thickness = 0;
	export let thing: Thing;
	export let radius = 0;
	const bold = 0.93;
	const faint = 0.98;
	const borderStyle = '1px solid';
	const diameter = (radius + thickness) * 2;
	const viewBox = `${-thickness}, ${-thickness}, ${diameter}, ${diameter}`;
	const ringOrigin = center.distanceFrom(Point.square(radius + thickness));
	const svg_ringPath = svgPaths.ring(Point.square(radius), radius + thickness, thickness);
	const ringState = s.ringState_forName(name);
	let rebuilds = 0
	let ringButton;
	
	function updateColors() {
		rebuilds += 1;
	}

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
			if (ringState.radiusOffset != null) {					// resize
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
				ringState.transparency = bold;
				ringState.cursor = 'move';
				ringState.isHit = true;
				rebuilds += 1;
				signals.signal_rebuildGraph_fromFocus();		// destroys this component (variables wiped)
			}
		}
	}

	function closure(mouseData: Mouse) {

		/////////////////////////////
		// setup or teardown state //
		/////////////////////////////

		const hit = hover_closure();
		if (!mouseData.isHover) {
			const from_center = distance_fromCenter_of($s_mouse_location);
			if (mouseData.isDouble) {

				// begin resize

				ringState.isHit = true;
				ringState.cursor = 'move';
				ringState.transparency = bold;
				ringState.radiusOffset = from_center.magnitude - $s_cluster_arc_radius;
				rebuilds += 1;
			} else if (mouseData.isUp) {

				// end rotate and resize

				ringState.reset();
				rebuilds += 1;
			} else if (hit) {
				const mouseAngle = from_center.angle;

				// begin rotate

				ringState.isHit = true;
				ringState.cursor = 'move';
				ringState.transparency = bold;
				ringState.priorAngle = mouseAngle;
				ringState.startAngle = mouseAngle.add_angle_normalized(-$s_ring_angle);
				rebuilds += 1;
				
			}
		} else if (!ringState.startAngle && !ringState.radiusOffset) {

			// hover

			ringState.transparency = hit ? bold : faint;
			ringState.cursor = hit ? 'pointer' : k.cursor_default;
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
 
	function hover_closure(): boolean {
		const vector = distance_fromCenter_of($s_mouse_location);
		const distance = vector.magnitude;
		if (!!distance && distance.isBetween(radius, radius + thickness)) {
			return true;
		}
		return false;
	}

</script>

{#key rebuilds}
	<MouseButton
		name={name}
		center={center}
		zindex={zindex}
		width={diameter}
		height={diameter}
		closure={closure}
		cursor={ringState.cursor}
		detect_longClick={false}
		hover_closure={hover_closure}>
		<svg
			viewBox={viewBox}
			class= 'svg-ring-button'
			fill={transparentize(color, ringState.transparency)}
			stroke={transparentize(color, ringState.isHit ? 0.8 : 1)}>
			<path d={svg_ringPath}>
		</svg>
	</MouseButton>
{/key}
