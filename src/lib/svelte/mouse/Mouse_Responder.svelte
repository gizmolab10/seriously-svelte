<script lang='ts'>
	import { k, g, u, ux, Rect, Size, Point, debug, ZIndex } from '../../ts/common/Global_Imports';
	import { Timer_Type, Mouse_Timer, Mouse_State } from '../../ts/common/Global_Imports';
	import { s_mouse_location, s_thing_fontFamily } from '../../ts/state/Svelte_Stores';
	import type { Handle_Result } from '../../ts/common/Types';
	import { onMount } from 'svelte';
	export let isHit_closure: () => {flag: boolean} | null = null;
	export let mouse_state_closure = Handle_Result<Mouse_State>;
	export let height = k.default_buttonSize;
	export let width = k.default_buttonSize;
	export let origin: Point | null = null;
	export let center: Point | null = null;
	export let detect_doubleClick = false;
	export let detect_longClick = false;
	export let detect_mouseDown = true;
	export let detect_mouseUp = true;
	export let position = 'absolute';
	export let zindex = ZIndex.dots;
	export let font_size = '0.9em';
	export let cursor = 'pointer';
	export let align_left = true;
	export let name = 'generic';
	const mouse_state = ux.mouse_state_forName(name);	// persist across destroy/recreate
	const mouse_timer = ux.mouse_timer_forName(name);	// persist across destroy/recreate
	const mouse_responder_number = g.next_mouse_responder_number;
	let mouse_isDown = false;
	let mouse_button_div;
	let style = k.empty;

	//////////////////////////////////////////////////////////////
	//															//
	//	handles mouse: down, up, double, long & hover			//
	//	requires: center or origin (one must remain null),		//
	//		 width, height, closure & name						//
	//															//
	//	isHit_closure: caller can override hit geometry & logic	//
	//	mouse_state_closure: give caller relevant mouse info	//
	//															//
	//////////////////////////////////////////////////////////////

	onMount(() => {
		setupStyle();
		if (!!mouse_button_div) {
			mouse_button_div.addEventListener('pointerup', handle_pointerUp);
			mouse_button_div.addEventListener('pointerdown', handle_pointerDown);
			return () => {
				mouse_button_div.removeEventListener('pointerup', handle_pointerUp);
				mouse_button_div.removeEventListener('pointerdown', handle_pointerDown);
			}
		}
	});

	$: {
		const _ = center;
		setupStyle();
	}
	
	$: {	// hover
		const mouse_location = $s_mouse_location;
		if (!!mouse_button_div && !!mouse_location) {
			let isHit = false;
			if (!isHit_closure) {				// is mouse inside this element's bounding rect
				isHit = Rect.rect_forElement_containsPoint(mouse_button_div, mouse_location);
			} else {							// if this element's hover shape is not its bounding rect
				isHit = isHit_closure();		// use hover shape
			}
			if (mouse_state.isHover != isHit) {
				mouse_state.isHover = isHit;
				mouse_state.isOut = !isHit;		// TODO: called far too often
				mouse_state_closure(Mouse_State.hover(null, mouse_button_div, isHit));	// pass a null event
			} else {
				mouse_state_closure(Mouse_State.move(null, mouse_button_div, mouse_isDown, isHit));	// pass a null event
			}
		}
	}

	function reset() {	// tear down
		mouse_state.clicks = 0;
		mouse_timer.reset();
	}

	function create_state(isDown: boolean, isDouble: boolean = false, isLong: boolean = false): Mouse_State {
		const state = u.copyObject(mouse_state);
		state.isUp = !isDown && !isDouble && !isLong;
		state.element = mouse_button_div;
		state.isDouble = isDouble;
		state.isLong = isLong;
		state.isHover = false;
		state.isDown = isDown;
		mouse_isDown = isDown;
		state.event = event;
		return state;
	}

	function handle_pointerUp(event) {
		if (detect_mouseUp) {
			reset();
			mouse_state_closure(Mouse_State.up(event, mouse_button_div));
			debug.log_action(` up ${mouse_responder_number} RESPONDER`);
		}
	}
	
	function handle_pointerDown(event) {
		if (detect_mouseDown && mouse_state.clicks == 0) {
			mouse_state_closure(create_state(true));
		}
		mouse_state.clicks += 1;
		if (detect_doubleClick) {
			mouse_timer.setTimeout(Timer_Type.double, () => {
				if (mouse_timer.hasTimer && mouse_state.clicks == 2) {
					reset();
					mouse_state_closure(create_state(false, true, false));
				}
			});
		}
		if (detect_longClick) {
			mouse_timer.setTimeout(Timer_Type.long, () => {
				if (mouse_timer.hasTimer) {
					reset();
					mouse_state_closure(create_state(false, false, true));
					debug.log_action(` long ${mouse_responder_number} RESPONDER`);
				}
			});
		}
	}

	function setupStyle() {
		style = `
			width: ${width}px;
			z-index: ${zindex};
			height: ${height}px;
			position: ${position};
			font-size: ${font_size};
			font-family: ${$s_thing_fontFamily};
			`.removeWhiteSpace();
		if (!!cursor) {
			style = `${style} cursor: ${cursor};`;
		}
		if (!!origin || !!center) {
			const x = origin?.x ?? center?.x - width / 2;
			const y = origin?.y ?? center?.y - height / 2;
			const alignment = align_left ? `left: ` : `right: `;
			style = `${style} ${alignment}${x}px; top: ${y}px;`;
		}
	}

</script>

<div class='mouse-responder' id={name}
	bind:this={mouse_button_div}
	style={style}>
	<slot></slot>
</div>
