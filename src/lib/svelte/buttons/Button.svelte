<script lang='ts'>
	import { g, k, u, Rect, Size, Point, ZIndex, onMount } from '../../ts/common/GlobalImports';
	import { s_mouse_location } from '../../ts/state/State';
	export let mouse_click_closure = (event, isLong) => {};
	export let background_color = 'transparent';
	export let hover_closure = (flag) => {};
	export let position = 'absolute';
	export let center = new Point();
	export let cursor = 'pointer';
	export let style = k.empty;
	export let border = 'none';
	export let color = 'gray';
	export let height = 16;
	export let width = 16;
	let mouseLocation = Point.zero;
	let isListening = false;
	let mouse_click_timer;
	let button;

	$: {
		const isHovering = u.hitTestFor(button, $s_mouse_location);
		hover_closure(isHovering);
	}

	function clearTimer() {
		clearTimeout(mouse_click_timer);
		mouse_click_timer = null;
	}

	function handle_mouse_click(event) {
		if (!mouse_click_timer) {
			mouse_click_closure(event, false);
		}
	}

	$: {
		// if mouse is held down, timeout will fire
		// if not, handle_mouse_click will fire
		if (!!button && !isListening) {
			isListening = true;
			const foo = button.addEventListener('pointerup', (event) => {
				clearTimer();
			});
			button.addEventListener('pointerdown', (event) => {
				clearTimer();
				mouse_click_timer = setTimeout(() => {
					if (mouse_click_timer) {
						clearTimer();
						mouse_click_closure(event, true);
					}
				}, k.threshold_longClick);
			});
		}
	}

</script>

<button class='button'
	bind:this={button}
	on:click={handle_mouse_click}
	style='
		color: {color};
		cursor: {cursor};
		border: {border};
		width: {width}px;
		height: {height}px;
		position: {position};
		z-index: {ZIndex.dots};
		top: {center.y - height / 2}px;
		left: {center.x - width / 2}px;
		background-color: {background_color};'>
	<slot></slot>
</button>
