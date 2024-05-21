<script lang='ts'>
	import { g, k, u, Rect, Size, Point, ZIndex, onMount, onDestroy } from '../../ts/common/GlobalImports';
	import { s_mouse_location } from '../../ts/state/State';
	export let mouse_click_closure = (event, isLong) => {};
	export let background_color = 'transparent';
	export let hover_closure = (flag) => {};
	export let position = 'absolute';
	export let center = new Point();
	export let cursor = 'pointer';
	export let border = 'none';
	export let style = k.empty;
	export let name = k.empty;
	export let color = 'gray';
	export let height = 16;
	export let width = 16;
	let mouseLocation = Point.zero;
	let mouse_click_timer;
	let unsubscribe;
	let button;

	onDestroy(() => { unsubscribe(); })

	onMount(() => {
		// if mouse is held down, timeout will fire
		// if not, handle_mouse_click will fire
		if (!!button) {
			function handle_pointer_up(event) { clearTimer(); }
			function handle_pointer_down(event) {
				clearTimer();
				mouse_click_timer = setTimeout(() => {
					if (mouse_click_timer) {
						clearTimer();
						mouse_click_closure(event, true);
					}
				}, k.threshold_longClick);
			}
			button.addEventListener('pointerup', handle_pointer_up);
			button.addEventListener('pointerdown', handle_pointer_down);
			unsubscribe = () => {
				button.removeEventListener('pointerup', handle_pointer_up);
				button.removeEventListener('pointerdown', handle_pointer_down);
			}
		}
	})

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

</script>

<button class='button' id={name}
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
