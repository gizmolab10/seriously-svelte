<script lang='ts'>
	import { k, u, Thing, Point, ZIndex, onMount, signals, svgPaths, dbDispatch, transparentize } from '../../ts/common/GlobalImports';
	import { s_graphRect, s_necklace_angle, s_mouse_location, s_necklace_priorAngle, s_user_graphOffset } from '../../ts/state/State';
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
	const ringOrigin = center.offsetBy(Point.square(radius + thickness).negated);
	const scalableRingPath = svgPaths.ring(Point.square(radius), radius + thickness, thickness);
	let borderColor = k.empty;
	let colorStyles = k.empty;
	let cursorStyle = k.empty;
	let fillColor = k.empty;
	let transparency = 0.97;
	let isHovering = false;
	let border = k.empty;
	let rebuilds = 0;
	let ringButton;

	$: { handle_mouse_movedTo($s_mouse_location); }
	function angleFor(offset: Point): number { return center.distanceTo(offset).angle; }

	function handle_mouse_up(event) {
		$s_necklace_priorAngle = null;
	}

	onMount(() => {
		updateColors();
		return setupChangesHandler();
	});

	function handle_mouse_down(event) {
		if (hitTest($s_mouse_location)) {
			$s_necklace_priorAngle = angleFor($s_mouse_location);
		}
	}

	function setupChangesHandler() {
		const handleChanges = signals.hangle_thingChanged(0, thing.id, (value: any) => {
			updateColors();
			rebuilds += 1;
		});
		return () => { handleChanges.disconnect(); };
	}

	function updateColors() {
		fillColor = transparentize(color, transparency);
		// colorStyles = `background-color: ${transparentize(borderColor, 0.15)}; color: ${k.color_background}`;
		// cursorStyle = isHovering ? 'cursor: pointer' : k.empty;
		// borderColor = isHovering ? color : k.color_background;
		// border = `${borderStyle} ${borderColor}`;
	};
 
	function hitTest(mouseLocation): boolean {
		if (mouseLocation) {
			const mainOffset = $s_graphRect.origin.offsetBy($s_user_graphOffset);
			const locationInWindow = mainOffset.offsetBy(center);
			const offCenter = locationInWindow.distanceTo(mouseLocation);
			const radial = offCenter.magnitude;
			if (radial.isBetween(radius, radius + thickness)) {
				return true;
			}
		}
		return false;
	}

	function handle_mouse_movedTo(mouseLocation) {
		const hit = hitTest(mouseLocation);
		const angle = $s_necklace_priorAngle;
		if (!angle) {		// hover
			transparency = hit ? 0.9 : 0.97;
		} else {							// rotate
			transparency = 0.9;
			const mouseAngle = angleFor(mouseLocation);
			const rotation = u.normalized_angle(mouseAngle - angle);
			if (!Math.abs(rotation) < 0.05) {
				$s_necklace_angle = u.normalized_angle($s_necklace_angle + rotation);
				$s_necklace_priorAngle = mouseAngle;
				signals.signal_rebuildGraph_fromFocus();
			}
			if (!$s_necklace_priorAngle) {
				console.log('UP');
			}
		}
		updateColors();
		rebuilds += 1;
	}
			// {colorStyles};
			// {cursorStyle};
			// border:{border};

</script>

{#key rebuilds}
	<div class= 'ring-button'
		on:blur={u.ignore}
		on:focus={u.ignore}
		bind:this={ringButton}
		on:mouseup={handle_mouse_up}
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
