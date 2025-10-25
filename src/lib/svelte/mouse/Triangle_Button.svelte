<script lang='ts'>
	import { S_Mouse, S_Element } from '../../ts/common/Global_Imports';
	import { k, x, svgPaths } from '../../ts/common/Global_Imports';
	import SVG_D3 from '../draw/SVG_D3.svelte';
	import Button from './Button.svelte';
	export let handle_s_mouse: (result: S_Mouse) => boolean;
	export let hover_closure: (flag: boolean) => boolean;
	export let s_triangle = S_Element.empty();
	export let detect_autorepeat = false;
	export let detect_longClick = false;
	export let extraPath = null;
	export let name = k.empty;
	export let strokeColor;
	export let center;
	export let angle;
	export let size;
	const { w_items: w_grabbed } = x.si_grabs;
	let fillColor = 'white';
	let extraColor = 'white';
	let trianglePath = svgPaths.fat_polygon(size, angle);

	$: $w_grabbed, setFillColor(false);
	
	$: {
		trianglePath = svgPaths.fat_polygon(size, angle);
		setFillColor(false);
	}

	function setFillColor(isFilled) {
		if (!!hover_closure) {
			[fillColor, extraColor] = hover_closure(isFilled);
		}
	}

	function closure(s_mouse) {
		if (s_mouse.hover_didChange) {
			setFillColor(!s_mouse.isOut);
		} else {
			handle_s_mouse(s_mouse);
		}
	}

</script>

<Button
	detect_autorepeat={detect_autorepeat}
	detect_longClick={detect_longClick}
	s_button={s_triangle}
	border_thickness=0
	closure={closure}
	center={center}
	height={size}
	width={size}
	name={name}>
	<SVG_D3 name='triangle'
		svgPath={trianglePath}
		stroke={strokeColor}
		fill={fillColor}
		height={size}
		width={size}
	/>
	{#if extraPath}
		<SVG_D3 name='triangleInside'
			svgPath={extraPath}
			stroke={extraColor}
			fill={extraColor}
			height={size}
			width={size}
		/>
	{/if}
	<slot/>
</Button>
