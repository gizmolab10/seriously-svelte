<script lang='ts'>
	import { k, s, u, Rect, Size, Point, ZIndex, onMount, MouseData } from '../../ts/common/GlobalImports';
	import { s_mouse_location } from '../../ts/state/Stores';
	export let hover_closure: () => {flag: boolean} | null = null;
	export let closure = (mouseData) => {};
	export let cursor = k.cursor_default;
	export let detect_doubleClick = true;
	export let detect_longClick = true;
	export let detect_mouseDown = true;
	export let detect_mouseUp = true;
	export let position = 'absolute';
	export let zindex = ZIndex.dots;
	export let center = new Point();
	export let align_left = true;
	export let name = 'generic';
	export let height = 16;
	export let width = 16;
	let mouse;
	let style = k.empty;
	let mouse_longClick_timer;
	let mouse_doubleClick_timer;

	//////////////////////////////////////////
	// IMPORTANT:	   can HANG if...		//
	// containment hierarchy includes Mouse //
	//		perhaps due to contention		//
	// 		over mouse move events			//
	//////////////////////////////////////////

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

	$: {	// movement
		if (!!mouse && !!$s_mouse_location) {
			const vagueHit = u.rect_forElement_contains(mouse, $s_mouse_location);
			const wasHit = s.mouseHit_forName(name);
			let isHit = vagueHit;
			if (!!hover_closure) {
				isHit = hover_closure();	// ask containing component
			}
			if (isHit != wasHit) {
				s.setMouseHit_forName(name, isHit);
				closure(MouseData.hover(null, mouse, isHit));	// use null event
			}
		}
	}

	function handle_pointerUp(event) {
		if (detect_mouseUp) {

			// teardown timers and call closure
		
			closure(MouseData.up(event, mouse));
			clearTimeout(mouse_doubleClick_timer);
			clearTimeout(mouse_longClick_timer);
			mouse_doubleClick_timer = null;
			mouse_longClick_timer = null;
		}
	}
	
	function handle_pointerDown(event) {
		if (detect_mouseDown && s.mouseClickCount_forName(name) == 0) {

			// call down closure

			closure(MouseData.down(event, mouse));
		}
		s.incrementMouseClickCount_forName(name);
		if (detect_longClick && !mouse_longClick_timer) {

			// setup timer to call long-click closure

			mouse_longClick_timer = setTimeout(() => {
				closure(MouseData.long(event, mouse));
				s.setMouseClickCount_forName(name, 0);
				mouse_longClick_timer = null;
			}, k.threshold_longClick);
		}
		if (detect_doubleClick && !mouse_doubleClick_timer) {

			// setup timer to call double-click closure

			mouse_doubleClick_timer = setTimeout(() => {
				closure(MouseData.clicks(event, mouse, s.mouseClickCount_forName(name)));
				s.setMouseClickCount_forName(name, 0);
				mouse_doubleClick_timer = null;
			}, k.threshold_doubleClick);
		}
	}

	function setupStyle() {
		const x = center.x - width / 2;
		const horizontal = align_left ? `left: ${x}` : `right: ${-x}`;
		style = `
			${horizontal}px;
			cursor: ${cursor};
			width: ${width}px;
			height: ${height}px;
			position: ${position};
			top: ${center.y - height / 2}px;`.removeWhiteSpace();
	}

</script>

<div
	id={name}
	class='mouse'
	style={style}
	bind:this={mouse}>
	<slot></slot>
</div>
