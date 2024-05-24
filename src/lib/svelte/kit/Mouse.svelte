<script lang='ts'>
	import { g, k, u, Rect, Size, Point, ZIndex, onMount, MouseData } from '../../ts/common/GlobalImports';
	import { s_mouse_location } from '../../ts/state/State';
	export let mouse_click_closure = (mouseData) => {};
	export let hover_closure = (isHovering) => {};
	export let detect_doubleClick = true;
	export let detect_longClick = true;
	export let detect_mouseDown = true;
	export let detect_mouseUp = true;
	export let position = 'absolute';
	export let center = new Point();
	export let align_left = true;
	export let style = k.empty;
	export let name = k.empty;
	export let height = 16;
	export let width = 16;
	let mouse;
	let clickCount = 0;
	let mouse_longClick_timer;
	let mouse_doubleClick_timer;
	let mouse_location = Point.zero;

	onMount(() => {
		setupStyle();
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
		const _ = center;
		setupStyle();
	}

	$: {
		if (!!mouse && !!$s_mouse_location && mouse_location != $s_mouse_location) {
			mouse_location = $s_mouse_location
			const isHovering = u.hitTestFor(mouse, mouse_location);
			hover_closure(isHovering);
		}
	}

	function handle_pointerUp(event) {
		if (detect_mouseUp) {
			mouse_click_closure(MouseData.up(mouse));
			clearTimeout(mouse_doubleClick_timer);
			clearTimeout(mouse_longClick_timer);
			mouse_doubleClick_timer = null;
			mouse_longClick_timer = null;
		}
	}
	
	function handle_pointerDown(event) {
		if (detect_mouseDown && clickCount == 0) {
			mouse_click_closure(MouseData.down(mouse));
		}
		clickCount++;
		if (detect_longClick && !mouse_longClick_timer) {
			mouse_longClick_timer = setTimeout(() => {
				mouse_click_closure(MouseData.long(mouse));
				clearTimeout(mouse_longClick_timer);
				mouse_longClick_timer = null;
				clickCount = 0;
			}, k.threshold_longClick);
		}
		if (detect_doubleClick && !mouse_doubleClick_timer) {
			mouse_doubleClick_timer = setTimeout(() => {
				mouse_click_closure(MouseData.clicks(mouse, clickCount));
				clearTimeout(mouse_doubleClick_timer);
				mouse_doubleClick_timer = null;
				clickCount = 0;
			}, k.threshold_doubleClick);
		}
	}

	function setupStyle() {
		const x = center.x - width / 2;
		style = `${style} 
			width: ${width}px;
			height: ${height}px;
			position: ${position};
			top: ${center.y - height / 2}px;`
		if (align_left) {
			style = `${style} left: ${x}px;`
		} else {
			style = `${style} right: ${-x}px;`
		}
	}

</script>

<div class='mouse-observer' id={name}
	bind:this={mouse}
	style={style}>
	<slot></slot>
</div>
