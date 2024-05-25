<script lang='ts'>
	import { e, k, u, Thing, Point, ZIndex, onMount, signals, svgPaths, MouseData, dbDispatch, transparentize } from '../../ts/common/GlobalImports';
	import { s_thing_changed, s_ancestry_focus, s_ring_angle, s_cluster_arc_radius } from '../../ts/state/State';
	import { s_graphRect, s_user_graphOffset, s_mouse_location, s_mouse_up_count } from '../../ts/state/State';
	import Mouse from '../kit/Mouse.svelte';
	export let zindex = ZIndex.dots;
	export let center = Point.zero;
	export let color = 'k.empty';
	export let name = k.empty;
	export let thickness = 0;
	export let thing: Thing;
	export let radius = 0;
	const bold = 0.95;
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

	$: {	// follow mouse movement
		const from_center = distance_fromCenter_of($s_mouse_location);
		if (!!from_center) {
			let sendSignal = false;
			if (e.ring_radiusOffset != null) {					// expand / shrink
				const movement = from_center.magnitude - $s_cluster_arc_radius - e.ring_radiusOffset;
				if (movement) {
					sendSignal = true;
					$s_cluster_arc_radius += movement;
				}
			}
			if (e.ring_priorAngle != null) {					// rotate
				const mouseAngle = from_center.angle;
				const delta = mouseAngle.add_angle_normalized(-e.ring_priorAngle);
				if (Math.abs(delta) >= Math.PI / 90) {			// minimum two degree changes
					sendSignal = true;
					e.ring_priorAngle = mouseAngle;
					$s_ring_angle = mouseAngle.add_angle_normalized(-e.ring_startAngle);
				}
			}
			if (!!sendSignal) {
				e.ring_cursor = 'move';
				signals.signal_rebuildGraph_fromFocus();		// destroys this component (variables wiped)
			}
		}
	}

	function closure(mouseData: MouseData) {
		const from_center = distance_fromCenter_of($s_mouse_location);
		const priorTransparency = transparency;
		const hit = hitTest(from_center);
		if (!mouseData.isHover) {
			if (mouseData.isDouble) {
				e.ring_cursor = 'move';
				e.ring_radiusOffset = from_center.magnitude - $s_cluster_arc_radius;
			} else if (mouseData.isUp) {
				e.ring_cursor = 'normal';
				transparency = hit ? bold : faint;
				e.clearRingData();
			} else {
				if (hitTest(from_center)) {
					e.ring_cursor = 'move';
					const mouseAngle = from_center.angle;
					e.ring_priorAngle = mouseAngle;
					e.ring_startAngle = mouseAngle.add_angle_normalized(-$s_ring_angle);
				}
			}
			transparency = faint;
		} else if (!e.ring_startAngle && !e.ring_radiusOffset) {
			e.ring_cursor = hit ? 'pointer' : 'normal';
			transparency = hit ? bold : faint;
		}
		if (transparency != priorTransparency) {
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
 
	function hitTest(from_center?: Point): boolean {
		if (!!from_center) {
			const radial = from_center.magnitude;
			if (radial.isBetween(radius, radius + thickness)) {
				return true;
			}
		}
		return false;
	}

</script>

{#key rebuilds}
	<Mouse
		center={center}
		width={diameter}
		height={diameter}
		closure={closure}
		name='ring-button'
		cursor={e.ring_cursor}
		detect_longClick={false}>
		<svg class= 'svg-ring-button' fill={fillColor} viewBox={viewBox}><path d={svg_ringPath}></svg>
	</Mouse>
{/key}
