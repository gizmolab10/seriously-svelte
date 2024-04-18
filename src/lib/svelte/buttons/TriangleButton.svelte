<script>
	import { k, u, Size, Thing, Point, ZIndex, svgPaths, Direction, dbDispatch } from "../../ts/common/GlobalImports";
	import { s_paths_grabbed } from '../../ts/state/State';
	import SVGD3 from '../kit/SVGD3.svelte';
	export let fillColors_closure = null;
	export let cursor = 'pointer';
	export let extraPath = null;
	export let strokeColor;
	export let direction;
	export let click_closure;
	export let center;
	export let size;
	export let id;
	let svgPath = svgPaths.fat_polygon(size, direction);
	let extraColor = k.color_background;
	let fillColor = k.color_background;
	let isListening = false;
	let isTiming = false;
	let button = null;
	let clickTimer;

	function handle_mouse_out(event) { setFillColor(false); }
	function handle_mouse_over(event) { setFillColor(true); }

    function handle_click(event, isLong) {

	}

	function clearTimer() {
		isTiming = false;
		clearTimeout(clickTimer);
	}

	function setFillColor(isFilled) {
		if (!!fillColors_closure) {
			[fillColor, extraColor] = fillColors_closure(isFilled);
		}
	}
	
	$: {
		svgPath = svgPaths.fat_polygon(size, direction);
		setFillColor(false);
	}

	$: {
		const _ = $s_paths_grabbed;
		setFillColor(false);
	}

	$: {
		// if mouse is held down, timeout will fire
		// if not, handle_click will fire
		if (!!button && !isListening) {
			isListening = true;
			button.addEventListener('pointerup', (event) => { clearTimer(); });
			button.addEventListener('pointerdown', (event) => {
				clearTimer();
				isTiming = true;
				clickTimer = setTimeout(() => {
					if (isTiming) {
						clearTimer();
						click_closure(event, true);
					}
				}, k.threshold_longClick);
			});
		}
	}

</script>

<button id={id}
	bind:this={button}
	on:blur={u.ignore}
	on:focus={u.ignore}
	on:mouseout={handle_mouse_out}
	on:mouseover={handle_mouse_over}
	on:click={(event) => handle_click(event, false)}
	style='
		width: 20px;
		height: 20px;
		border: none;
		display: block;
		cursor: {cursor};
		background: none;
		position: absolute;
		top: {center.y + 2 - (size / 2)}px;
		left: {center.x + 3 - (size / 2)}px;
	'>
	<SVGD3 name='triangle'
		width={size}
		height={size}
		fill={fillColor}
		svgPath={svgPath}
		stroke={strokeColor}
	/>
	{#if extraPath}
		<SVGD3 name='triangleInside'
			width={size}
			height={size}
			fill={extraColor}
			stroke={extraColor}
			svgPath={extraPath}
		/>
	{/if}
</button>
