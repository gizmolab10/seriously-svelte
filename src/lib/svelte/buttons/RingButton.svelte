<script lang='ts'>
	import { k, u, Thing, Point, ZIndex, onMount, signals, svgPaths, dbDispatch, transparentize } from '../../ts/common/GlobalImports';
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
	let colorStyles = k.empty;
	let cursorStyle = k.empty;
	let isHovering = false;
	let rebuilds = 0;

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

	function handle_mouse_move(event) {
		const color = borderColor; // thing.color
		border = `${borderStyle} ${color}`;
	}

	function updateColors() {
		colorStyles = `background-color: ${transparentize(borderColor, 0.15)}; color: ${k.color_background}`;
		cursorStyle = isHovering ? 'cursor: pointer' : k.empty;
		borderColor = isHovering ? color : k.color_background;
		border = `${borderStyle} ${borderColor}`;
	};

	function handle_mouse_click(event) {
		if (dbDispatch.db.hasData) {
			ancestry.grabOnly();
			if (ancestry.becomeFocus()) {
				signals.signal_rebuildGraph_fromFocus();
			}
		}
	}
			// {colorStyles};
			// {cursorStyle};
			// border:{border};

</script>

{#key rebuilds}
	<div class= 'ring-button'
		on:blur={u.ignore}
		on:focus={u.ignore}
		on:click={handle_mouse_click}
		on:mousemove={handle_mouse_move}
		style='
			position: absolute;
			width: {diameter}px;
			height: {diameter}px;
			top: {center.y - radius - thickness}px;
			left: {center.x - radius - thickness}px;'>
		<svg fill={fillColor} viewBox={viewBox}><path d={scalablePath}></svg>
	</div>
{/key}
