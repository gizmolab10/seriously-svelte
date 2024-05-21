<script lang='ts'>
	import { g, k, u, Thing, Point, ZIndex, onMount, signals, svgPaths, dbDispatch, transparentize } from '../../ts/common/GlobalImports';
	import { s_graphRect, s_thing_changed, s_ring_angle, s_mouse_up_count, } from '../../ts/state/State';
	import { s_ancestry_focus, s_mouse_location, s_user_graphOffset } from '../../ts/state/State';
	export let zindex = ZIndex.dots;
	export let center = Point.zero;
	export let color = 'k.empty';
	export let name = k.empty;
	export let thickness = 0;
	export let thing: Thing;
	export let radius = 0;
	const borderStyle = '1px solid';
	const diameter = (radius + thickness) * 2;
	const viewBox = `${-thickness}, ${-thickness}, ${diameter}, ${diameter}`;
	const ringOrigin = center.distanceFrom(Point.square(radius + thickness));
	const scalableRingPath = svgPaths.ring(Point.square(radius), radius + thickness, thickness);
	let mouse_up_count = $s_mouse_up_count;
	let borderColor = k.empty;
	let colorStyles = k.empty;
	let cursorStyle = k.empty;
	let fillColor = k.empty;
	let transparency = 0.97;
	let isHovering = false;
	let border = k.empty;
	let rebuilds = 0;
	let ringButton;

	onMount(() => { updateColors(); });

	$: {
		if ($s_ancestry_focus.thing.id == $s_thing_changed.split(k.genericSeparator)[0]) {
			updateColors();
		}
	}

	function updateColors() {
		fillColor = transparentize(color, transparency);
		rebuilds += 1;
	}

	$: {
		const from_center = distance_fromCenter_of($s_mouse_location);
		handle_mouse_movedTo(from_center);
	}

	function distance_fromCenter_of(location?: Point): Point | null {
		if (!!location) {
			const mainOffset = $s_graphRect.origin.offsetBy($s_user_graphOffset);
			return mainOffset.offsetBy(center).distanceTo(location);
		}
		return null
	}

	$: {
		if (mouse_up_count != $s_mouse_up_count) {
			mouse_up_count = $s_mouse_up_count;
			g.ring_priorAngle = g.ring_startAngle = null;
		}
	}

	function handle_mouse_down(event) {
		const from_center = distance_fromCenter_of($s_mouse_location);
		if (hitTest(from_center)) {
			const mouseAngle = from_center.angle;
			g.ring_priorAngle = mouseAngle;
			g.ring_startAngle = mouseAngle.add_angle_normalized(-$s_ring_angle);
		}
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

	function handle_mouse_movedTo(from_center?: Point) {
		if (!!from_center) {
			if (g.ring_priorAngle == null) {					// hover
				const hit = hitTest(from_center);
				transparency = hit ? 0.9 : 0.97;
			} else {											// rotate
				transparency = 0.97;
				const mouseAngle = from_center.angle;
				const delta = mouseAngle.add_angle_normalized(-g.ring_priorAngle);
				if (Math.abs(delta) >= Math.PI / 90) {			// minimum two degree changes
					$s_ring_angle = mouseAngle.add_angle_normalized(-g.ring_startAngle);
					g.ring_priorAngle = mouseAngle;
					signals.signal_rebuildGraph_fromFocus();	// reinitializes all component variables
				}
			}
			updateColors();
		}
	}

</script>

{#key rebuilds}
	<div class= 'ring-button'
		on:blur={u.ignore}
		on:focus={u.ignore}
		bind:this={ringButton}
		on:mousedown={handle_mouse_down}
		style='
			position: absolute;
			width: {diameter}px;
			height: {diameter}px;
			top: {ringOrigin.y}px;
			left: {ringOrigin.x}px;'>
		<svg class= 'svg-ring-button' fill={fillColor} viewBox={viewBox}><path d={scalableRingPath}></svg>
	</div>
{/key}
