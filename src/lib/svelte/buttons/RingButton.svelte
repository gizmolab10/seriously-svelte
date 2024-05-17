<script lang='ts'>
	import { k, u, Thing, Point, ZIndex, onMount, signals, svgPaths, dbDispatch, transparentize } from '../../ts/common/GlobalImports';
	import { s_necklace_angle, s_mouse_location } from '../../ts/state/State';
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
	let transparency = 0.97;
	let scalablePath = svgPaths.ring(Point.square(radius), radius + thickness, thickness);
	let borderColor = transparentize(color, transparency);
	let fillColor = transparentize(color, transparency);
	let border = `${borderStyle} ${borderColor}`;
	let dragStart: Point | null = null;
	let angle = $s_necklace_angle;
	let colorStyles = k.empty;
	let cursorStyle = k.empty;
	let isHovering = false;
	let rebuilds = 0;
	let ringButton;

	onMount(() => {
		updateColors();
		const handleChanges = signals.hangle_thingChanged(0, thing.id, (value: any) => {
			updateColors();
			rebuilds += 1;
		});
		return () => {
			handleChanges.disconnect();
		};
	});

	$: { handle_mouse_movedTo($s_mouse_location); }

	function pointForEvent(event) { return new Point(event.clientX, event.clientY); }

	function handle_mouse_up(event) {
		dragStart = null;
	}

	function handle_mouse_down(event) {
		dragStart = pointForEvent(event);
	}

	function handle_mouse_movedTo(mouseLocation) {
		if (!!dragStart) {
			const vector = dragStart.distanceTo(mouseLocation);
			if (!vector.almostZero(1)) {
				dragStart = mouseLocation;
				angle += vector.angle;
				$s_necklace_angle = angle;
				console.log(u.degrees_of(angle));
				signals.signal_rebuildGraph_fromFocus();
			}
		} else {
			// hover
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
			top: {center.y - radius - thickness}px;
			left: {center.x - radius - thickness}px;'>
		<svg class= 'svg-ring-button' fill={fillColor} viewBox={viewBox}><path d={scalablePath}></svg>
	</div>
{/key}
