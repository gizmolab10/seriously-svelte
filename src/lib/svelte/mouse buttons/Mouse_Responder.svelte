<script lang='ts'>
	import { k, s, u, Rect, Size, Point, Mouse_State, ZIndex, onMount } from '../../ts/common/Global_Imports';
	import { s_mouse_location } from '../../ts/state/Reactive_State';
	export let detectHit_closure: () => {flag: boolean} | null = null;
	export let height = k.default_buttonSize;
	export let width = k.default_buttonSize;
	export let closure = (mouseState) => {};
	export let detect_doubleClick = true;
	export let detect_longClick = true;
	export let detect_mouseDown = true;
	export let detect_mouseUp = true;
	export let position = 'absolute';
	export let zindex = ZIndex.dots;
	export let center: Point | null;
	export let cursor = 'pointer';
	export let align_left = true;
	export let name = 'generic';
	const mouseState = s.mouseState_forName(name);	// persist across destroy/recreate
	let mouse_doubleClick_timer;
	let mouse_longClick_timer;
	let style = k.empty;
	let mouse_button;

	//////////////////////////////////////////
	//										//
	//	handles: click counts, moves & up	//
	//										//
	//	requires: center, width, height,	//
	//		closure & name					//
	//										//
	//	mutates three ts state classes:		//
	//		UX_State, Mouse_State &			//
	//		Element_State					//
	//										//
	//////////////////////////////////////////

	onMount(() => {
		setupStyle();
		if (!!mouse_button) {
			mouse_button.addEventListener('pointerup', handle_pointerUp);
			mouse_button.addEventListener('pointerdown', handle_pointerDown);
			return () => {
				mouse_button.removeEventListener('pointerup', handle_pointerUp);
				mouse_button.removeEventListener('pointerdown', handle_pointerDown);
			}
		}
	});

	$: {
		const _ = center;
		setupStyle();
	}

	$: {	// movement
		if (!!mouse_button && !!$s_mouse_location) {
			let isHit = false;
			if (!detectHit_closure) {			// is mouse inside this element's bounding rect
				isHit = Rect.rect_forElement_contains(mouse_button, $s_mouse_location);
			} else {						// if this element's hover shape is not its bounding rect
				isHit = detectHit_closure();	// let container component decide
			}
			if (mouseState.isHover != isHit) {
				mouseState.isHover = isHit;
				mouseState.isOut = !isHit;
				closure(Mouse_State.hover(null, mouse_button, isHit));	// pass a null event
			}
		}
	}

	function reset() {
		clearTimeout(mouse_doubleClick_timer);
		clearTimeout(mouse_longClick_timer);
		mouse_doubleClick_timer = null;
		mouse_longClick_timer = null;
		mouseState.clicks = 0;
	}

	function handle_pointerUp(event) {
		if (detect_mouseUp) {

			// teardown long timer and call closure
		
			closure(Mouse_State.up(event, mouse_button));
			clearTimeout(mouse_longClick_timer);
			mouse_longClick_timer = null;
		}
	}
	
	function handle_pointerDown(event) {
		if (detect_mouseDown && mouseState.clicks == 0) {

			// call down closure

			closure(Mouse_State.down(event, mouse_button));
		}
		mouseState.clicks += 1;
		if (detect_longClick && !mouse_longClick_timer) {

			// setup timer to call long-click closure

			mouse_longClick_timer = setTimeout(() => {
				closure(Mouse_State.long(event, mouse_button));
				reset();
			}, k.threshold_longClick);
		}
		if (detect_doubleClick && !mouse_doubleClick_timer) {

			// setup timer to call double-click closure

			mouse_doubleClick_timer = setTimeout(() => {
				closure(Mouse_State.clicks(event, mouse_button, mouseState.clicks));
				reset();
			}, k.threshold_doubleClick);
		}
	}

	function setupStyle() {
		style = `cursor: ${cursor}; width: ${width}px; height: ${height}px; position: ${position}; z-index: ${zindex};`;
		if (!!center) {
			const x = center.x - width / 2;
			const horizontal = align_left ? `left: ${x}` : `right: ${-x}`;
			style = `${style} ${horizontal}px; top: ${center.y - height / 2}px;`;
		}
	}

</script>

<div class='mouse-responder' id={name}
	style={style}
	bind:this={mouse_button}>
	<slot></slot>
</div>
