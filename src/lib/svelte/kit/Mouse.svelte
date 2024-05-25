<script lang='ts'>
	import { s, k, u, Rect, Size, Point, ZIndex, onMount, MouseData } from '../../ts/common/GlobalImports';
	import { s_mouse_location } from '../../ts/state/Stores';
	export let closure = (mouseData) => {};
	export let detect_doubleClick = true;
	export let detect_longClick = true;
	export let detect_mouseDown = true;
	export let detect_mouseUp = true;
	export let position = 'absolute';
	export let center = new Point();
	export let align_left = true;
	export let cursor = 'normal';
	export let name = 'generic';
	export let style = k.empty;
	export let height = 16;
	export let width = 16;
	let mouse;
	let mouse_style = style;
	let mouse_longClick_timer;
	let mouse_doubleClick_timer;
	let mouse_priorLocation = Point.zero;

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
		if (!!mouse && !!$s_mouse_location && mouse_priorLocation != $s_mouse_location) {
			mouse_priorLocation = $s_mouse_location;
			const isHovering = u.hitTestFor(mouse, $s_mouse_location);
			closure(MouseData.hover(null, mouse, isHovering));
		}
	}

	function handle_pointerUp(event) {
		if (detect_mouseUp) {
			closure(MouseData.up(event, mouse));
			clearTimeout(mouse_doubleClick_timer);
			clearTimeout(mouse_longClick_timer);
			mouse_doubleClick_timer = null;
			mouse_longClick_timer = null;
		}
	}
	
	function handle_pointerDown(event) {
		if (detect_mouseDown && s.mouseClickCount_forName(name) == 0) {
			closure(MouseData.down(event, mouse));
		}
		s.incrementMouseClickCount_forName(name);
		if (detect_longClick && !mouse_longClick_timer) {
			mouse_longClick_timer = setTimeout(() => {
				closure(MouseData.long(event, mouse));
				s.setMouseClickCount_forName(name, 0);
				clearTimeout(mouse_longClick_timer);
				mouse_longClick_timer = null;
			}, k.threshold_longClick);
		}
		if (detect_doubleClick && !mouse_doubleClick_timer) {
			mouse_doubleClick_timer = setTimeout(() => {
				closure(MouseData.clicks(event, mouse, s.mouseClickCount_forName(name)));
				s.setMouseClickCount_forName(name, 0);
				clearTimeout(mouse_doubleClick_timer);
				mouse_doubleClick_timer = null;
			}, k.threshold_doubleClick);
		}
	}

	function setupStyle() {
		const x = center.x - width / 2;
		const horizontal = align_left ? `left: ${x}` : `right: ${-x}`;
		mouse_style = `${style}
			${horizontal}px;
			cursor: ${cursor};
			width: ${width}px;
			height: ${height}px;
			position: ${position};
			top: ${center.y - height / 2}px;`;
	}

</script>

<div class='mouse' id={name}
	style={mouse_style}
	bind:this={mouse}>
	<slot></slot>
</div>
