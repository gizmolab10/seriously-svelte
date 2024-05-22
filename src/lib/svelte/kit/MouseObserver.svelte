<script lang='ts'>
	import { g, k, u, Rect, Size, Point, ZIndex, onMount } from '../../ts/common/GlobalImports';
	import { s_mouse_location } from '../../ts/state/State';
	export let mouse_click_closure = (event, isLong) => {};
	export let hover_closure = (flag) => {};
	export let position = 'absolute';
	export let center = new Point();
	export let name = k.empty;
	export let height = 16;
	export let width = 16;
	let mouse_observer;
	let mouse_longClick_timer;
	let mouse_location = Point.zero;

	onMount(() => {
		// if mouse is held down, timeout will fire
		// if not, handle_mouse_click will fire
		if (!!mouse_observer) {
			function handle_pointer_up(event) { clearTimer(); }
			function handle_pointer_down(event) {
				clearTimer();
				mouse_longClick_timer = setTimeout(() => {
					if (mouse_longClick_timer) {
						clearTimer();
						mouse_click_closure(event, true);
					}
				}, k.threshold_longClick);
			}
			mouse_observer.addEventListener('pointerup', handle_pointer_up);
			mouse_observer.addEventListener('pointerdown', handle_pointer_down);
			return () => {
				mouse_observer.removeEventListener('pointerup', handle_pointer_up);
				mouse_observer.removeEventListener('pointerdown', handle_pointer_down);
			}
		}
	})

	$: {
		if (!!mouse_observer && mouse_location != $s_mouse_location) {
			mouse_location = $s_mouse_location
			const isHovering = u.hitTestFor(mouse_observer, mouse_location);
			hover_closure(isHovering);
		}
	}

	function clearTimer() {
		clearTimeout(mouse_longClick_timer);
		mouse_longClick_timer = null;
	}

	function handle_mouse_click(event) {
		if (!mouse_longClick_timer) {
			mouse_click_closure(event, false);
		}
	}

</script>

<div class='mouse-observer' id={name}
	on:click={handle_mouse_click}
	bind:this={mouse_observer}
	style='
		width: {width}px;
		height: {height}px;
		position: {position};
		top: {center.y - height / 2}px;
		left: {center.x - width / 2}px;'>
	<slot></slot>
</div>
