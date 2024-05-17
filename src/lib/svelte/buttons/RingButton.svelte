<script lang='ts'>
	import { k, u, Thing, Point, ZIndex, onMount, signals, svgPaths, dbDispatch, transparentize } from '../../ts/common/GlobalImports';
	import { s_graphRect, s_necklace_angle, s_mouse_location, s_necklace_dragStart, s_user_graphOffset } from '../../ts/state/State';
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
	let transparency = 0.97;
	let borderColor = transparentize(color, transparency);
	let fillColor = transparentize(color, transparency);
	let border = `${borderStyle} ${borderColor}`;
	let scalableLinePath = k.empty;
	let angle = $s_necklace_angle;
	let ringLineOrigin = center;
	let colorStyles = k.empty;
	let cursorStyle = k.empty;
	let isHovering = false;
	let rebuilds = 0;
	let ringButton;

	$: { handle_mouse_movedTo($s_mouse_location); }
	function handle_mouse_up(event) { $s_necklace_dragStart = null; }

	onMount(() => {
		updateColors();
		return setupChangesHandler();
	});

	function handle_mouse_down(event) {
		if (hitTest($s_mouse_location)) {
			$s_necklace_dragStart = $s_mouse_location;
		}
	}

	$: {
		const radial = new Point(radius + thickness, 0);
		const rotated = radial.rotate_by($s_necklace_angle);
		scalableLinePath = svgPaths.line(rotated);
	}

	function setupChangesHandler() {
		const handleChanges = signals.hangle_thingChanged(0, thing.id, (value: any) => {
			updateColors();
			rebuilds += 1;
		});
		return () => { handleChanges.disconnect(); };
	}
 
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
		if (!$s_necklace_dragStart) {
			transparency = hit ? 0.9 : 0.97;
			updateColors();
			rebuilds += 1;
		} else {
			const vector = $s_necklace_dragStart.distanceTo(mouseLocation);
			if (!vector.almostZero(1)) {
				angle += vector.angle;
				$s_necklace_angle = angle;
				$s_necklace_dragStart = mouseLocation;
				signals.signal_rebuildGraph_fromFocus();
			}
		}
	}

	function updateColors() {
		colorStyles = `background-color: ${transparentize(borderColor, 0.15)}; color: ${k.color_background}`;
		cursorStyle = isHovering ? 'cursor: pointer' : k.empty;
		borderColor = isHovering ? color : k.color_background;
		fillColor = transparentize(color, transparency);
		border = `${borderStyle} ${borderColor}`;
	};
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
		<div class= 'ring-line'
			style='
				position: absolute;
				top: {ringLineOrigin.y}px;
				left: {ringLineOrigin.x}px;'>
			<svg class= 'svg-ring-line' stroke=black><path d={scalableLinePath}></svg>
		</div>
{/key}
