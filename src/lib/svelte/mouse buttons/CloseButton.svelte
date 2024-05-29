<script>
	import { u, Size, Point, ZIndex, svgPaths } from '../../ts/common/GlobalImports';
	import MouseButton from './MouseButton.svelte';
    import { s_id_popupView } from '../../ts/state/Stores';
	import SVGD3 from '../kit/SVGD3.svelte';
    export let name = 'generic close';
    export let size = 20;
	let fill = 'white';
	let stroke = 'black';
    const cross = svgPaths.x_cross(size, size / 6);
    const circle = svgPaths.circle_atOffset(size, size - 2);

	function closure(mouseData) {
		if (mouseData.isHover) {
			const isHovering = !mouseData.isOut;
			fill = isHovering ? 'black' : 'white';
			stroke = isHovering ? 'white' : 'black';
		} else if (mouseData.isUp) {
			$s_id_popupView = null;
		}
	}

</script>

<MouseButton
	name={name}
	width={size}
	height={size}
	cursor='pointer'
	closure={closure}
	align_left={false}
	center={new Point(0, size)}>
    <SVGD3 name='close'
		fill={fill}
		width={size}
		height={size}
		stroke='black'
		svg_path={circle}
	/>
    <SVGD3 name='closeInside'
		width={size}
		height={size}
		stroke={stroke}
		svg_path={cross}
	/>
</MouseButton>
