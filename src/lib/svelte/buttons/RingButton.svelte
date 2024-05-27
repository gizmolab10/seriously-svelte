<script lang='ts'>
	import { k, s, u, Thing, Point, ZIndex, onMount, signals, svgPaths, Mouse, dbDispatch, transparentize } from '../../ts/common/GlobalImports';
	import { s_thing_changed, s_ancestry_focus, s_ring_angle, s_cluster_arc_radius } from '../../ts/state/Stores';
	import { s_graphRect, s_user_graphOffset, s_mouse_location, s_mouse_up_count } from '../../ts/state/Stores';
	import MouseButton from '../buttons/MouseButton.svelte';
	export let zindex = ZIndex.panel;
	export let center = Point.zero;
	export let color = 'k.empty';
	export let name = k.empty;
	export let thickness = 0;
	export let thing: Thing;
	export let radius = 0;
	const bold = 0.97;
	const faint = 0.98;
	const borderStyle = '1px solid';
	const diameter = (radius + thickness) * 2;
	const viewBox = `${-thickness}, ${-thickness}, ${diameter}, ${diameter}`;
	const ringOrigin = center.distanceFrom(Point.square(radius + thickness));
	const svg_ringPath = svgPaths.ring(Point.square(radius), radius + thickness, thickness);
	let transparency = faint;
	let fillColor = k.empty;
	let rebuilds = 0
	let ringButton;

	onMount(() => { updateColors(); });
	
	function updateColors() {
		fillColor = transparentize(color, transparency);
		rebuilds += 1;
	}

	$: {
		if ($s_ancestry_focus.thing.id == $s_thing_changed.split(k.genericSeparator)[0]) {
			updateColors();
		}
	}

	$: {

		//////////////////
		// adjust state //
		//////////////////

		const from_center = distance_fromCenter_of($s_mouse_location);	// use store, to react
		if (!!from_center) {
			let sendSignal = false;
			if (s.ring_radiusOffset != null) {					// expand / shrink
				const distance = Math.max(k.cluster_inside_radius * 4, from_center.magnitude);
				const movement = distance - $s_cluster_arc_radius - s.ring_radiusOffset;
				if (movement) {
					sendSignal = true;
					$s_cluster_arc_radius += movement;
				}
			}
			if (s.ring_priorAngle != null) {					// rotate
				const mouseAngle = from_center.angle;
				const delta = mouseAngle.add_angle_normalized(-s.ring_priorAngle);
				if (Math.abs(delta) >= Math.PI / 90) {			// minimum two degree changes
					sendSignal = true;
					s.ring_priorAngle = mouseAngle;
					$s_ring_angle = mouseAngle.add_angle_normalized(-s.ring_startAngle);
				}
			}
			if (sendSignal) {
				s.ring_cursor = 'move';
				signals.signal_rebuildGraph_fromFocus();		// destroys this component (variables wiped)
			}
		}
	}

	function closure(mouseData: Mouse) {

		/////////////////////////////
		// setup or teardown state //
		/////////////////////////////
		
		let refresh = false;
		const hit = isOnRing();
		const priorTransparency = transparency;
		if (!mouseData.isHover) {
			const from_center = distance_fromCenter_of($s_mouse_location);
			if (mouseData.isDouble) {

				// begin expand / shrink

				s.ring_radiusOffset = from_center.magnitude - $s_cluster_arc_radius;
				s.ring_cursor = 'move';
			} else if (mouseData.isUp) {

				// end

				transparency = hit ? bold : faint;
				s.ring_cursor = k.cursor_default;
				s.resetRingState();
				refresh = true;
			} else {
				if (hit) {

					// begin rotate

					const mouseAngle = from_center.angle;
					s.ring_priorAngle = mouseAngle;
					s.ring_startAngle = mouseAngle.add_angle_normalized(-$s_ring_angle);
					s.ring_cursor = 'move';
				}
			}
			transparency = faint;
		} else if (!s.ring_startAngle && !s.ring_radiusOffset) {

			// hover

			transparency = hit ? bold : faint;
			s.ring_cursor = hit ? 'pointer' : k.cursor_default;
		}
		if (refresh || (transparency != priorTransparency)) {
			updateColors();
		}
	}

	function distance_fromCenter_of(location?: Point): Point | null {
		if (!!location) {
			const mainOffset = $s_graphRect.origin.offsetBy($s_user_graphOffset);
			return mainOffset.offsetBy(center).distanceTo(location);
		}
		return null
	}
 
	function isOnRing(from_center?: Point = null): boolean {
		const vector = from_center ?? distance_fromCenter_of($s_mouse_location);
		const distance = vector.offsetEquallyBy(10).magnitude;
		if (!!distance && distance.isBetween(radius, radius + thickness)) {
			return true;
		}
		return false;
	}

</script>

{#key rebuilds}
	<MouseButton
		center={center}
		zindex={zindex}
		width={diameter}
		height={diameter}
		closure={closure}
		name='ring-button'
		cursor={s.ring_cursor}
		detect_longClick={false}
		hover_closure={isOnRing}>
		<svg class= 'svg-ring-button'
			fill={fillColor}
			viewBox={viewBox}>
			<path d={svg_ringPath}>
		</svg>
	</MouseButton>
{/key}
