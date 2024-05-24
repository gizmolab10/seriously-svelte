<script lang='ts'>
	import { g, k, u, Rect, Size, Point, ZIndex, onMount, MouseData } from '../../ts/common/GlobalImports';
	import { s_mouse_location } from '../../ts/state/State';
	export let closure = (mouseData) => {};
	export let detect_doubleClick = true;
	export let detect_longClick = true;
	export let detect_mouseDown = true;
	export let detect_mouseUp = true;
	export let position = 'absolute';
	export let center = new Point();
	export let isHovering = false;
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
			const hit = u.hitTestFor(mouse, mouse_location);
			if (isHovering != hit) {
				isHovering = hit;
				closure(MouseData.hover(null, mouse, isHovering));
			}
		}
	}

	function handle_pointerUp(event) {
		if (detect_mouseUp) {
			closure(MouseData.up(event, mouse));
			clearTimeout(mouse_doubleClick_timer);
			clearTimeout(mouse_longClick_timer);
			mouse_doubleClick_timer = null;
			mouse_longClick_timer = null;
			clickCount = 0;
		}
	}
	
	function handle_pointerDown(event) {
		if (detect_mouseDown && clickCount == 0) {
			closure(MouseData.down(event, mouse));
		}
		clickCount++;
		if (detect_longClick && !mouse_longClick_timer) {
			mouse_longClick_timer = setTimeout(() => {
				closure(MouseData.long(event, mouse));
				clearTimeout(mouse_longClick_timer);
				mouse_longClick_timer = null;
				clickCount = 0;
			}, k.threshold_longClick);
		}
		if (detect_doubleClick && !mouse_doubleClick_timer) {
			mouse_doubleClick_timer = setTimeout(() => {
				closure(MouseData.clicks(event, mouse, clickCount));
				clearTimeout(mouse_doubleClick_timer);
				mouse_doubleClick_timer = null;
				clickCount = 0;
			}, k.threshold_doubleClick);
		}
	}

	function setupStyle() {
		const x = center.x - width / 2;
		const horizontal = align_left ? `left: ${x}` : `right: ${-x}`;
		style = `${style} 
			width: ${width}px;
			height: ${height}px;
			position: ${position};
			top: ${center.y - height / 2}px;
			${horizontal}px;`;
	}

</script>

<div class='mouse' id={name}
	bind:this={mouse}
	style={style}>
	<slot></slot>
</div>
