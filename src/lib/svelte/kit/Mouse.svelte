<script lang='ts'>
	import { g, k, u, Rect, Size, Point, ZIndex, onMount, MouseData } from '../../ts/common/GlobalImports';
	import { s_mouse_location } from '../../ts/state/State';
	export let mouse_click_closure = (mouseDataå) => {};
	export let hover_closure = (flag) => {};
	export let detect_mouseDown = false;
	export let detect_longClick = false;
	export let position = 'absolute';
	export let center = new Point();
	export let name = k.empty;
	export let height = 16;
	export let width = 16;
	let clickCount = 0;
	let mouse;
	let mouse_click_timer;
	let mouse_longClick_timer;
	let mouse_location = Point.zero;

	onMount(() => {
		if (!!mouse) {
			mouse.addEventListener('pointerup', handle_pointerUp);
			mouse.addEventListener('pointerdown', handle_pointerDown);
			return () => {
				mouse.removeEventListener('pointerup', handle_pointerUp);
				mouse.removeEventListener('pointerdown', handle_pointerDown);
			}
		}
	});

	$: {
		if (!!mouse && !!$s_mouse_location && mouse_location != $s_mouse_location) {
			mouse_location = $s_mouse_location
			const isHovering = u.hitTestFor(mouse, mouse_location);
			hover_closure(isHovering);
		}
	}

	function handle_pointerUp(event) {
		if (!mouse_click_timer && !mouse_longClick_timer && clickCount == 0) {
			mouse_click_closure(MouseData.up(event));
		}
	}
	
	function handle_pointerDown(event) {
		if (detect_mouseDown && clickCount == 0) {
			mouse_click_closure(MouseData.down(event));
		}
		clickCount++;
		if (!mouse_click_timer && !mouse_longClick_timer) {
			mouse_click_timer = setTimeout(() => {
				signal_done(MouseData.clicks(event, clickCount));
			}, k.threshold_doubleClick);
			if (detect_longClick) {
				mouse_longClick_timer = setTimeout(() => {
					signal_done(MouseData.long(event));
				}, k.threshold_longClick);
			}
		}
	}

	function signal_done(mouseData: MouseData) {
		mouse_click_closure(mouseData);
		clearTimers();
		clearClicks();
	}

	function clearClicks() {
		clickCount = 0;
		clearTimeout(mouse_click_timer);	// clear all previous timers
	}

	function clearTimers() {
		clearTimeout(mouse_longClick_timer);
		clearTimeout(mouse_click_timer);
		mouse_longClick_timer = null;
		mouse_click_timer = null;
	}

</script>

<div class='mouse-observer' id={name}
	bind:this={mouse}
	style='
		width: {width}px;
		height: {height}px;
		position: {position};
		top: {center.y - height / 2}px;
		left: {center.x - width / 2}px;'>
	<slot></slot>
</div>
