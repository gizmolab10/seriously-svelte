<script lang='ts'>
	import { k, g, u, ux, Rect, Size, Point, debug, T_Layer } from '../../ts/common/Global_Imports';
	import { T_Timer, Mouse_Timer, S_Mouse } from '../../ts/common/Global_Imports';
	import { w_mouse_location, w_thing_fontFamily } from '../../ts/state/S_Stores';
	import type { Handle_Result } from '../../ts/common/Types';
	import { onMount } from 'svelte';
	export let handle_isHit: () => {flag: boolean} | null = null;
	export let handle_mouse_state = Handle_Result<S_Mouse>;
	export let height = k.default_buttonSize;
	export let width = k.default_buttonSize;
	export let origin: Point | null = null;
	export let center: Point | null = null;
	export let detect_doubleClick = false;
	export let detect_longClick = false;
	export let detect_mouseDown = true;
	export let detect_mouseUp = true;
	export let position = 'absolute';
	export let zindex = T_Layer.dots;
	export let font_size = '0.9em';
	export let cursor = 'pointer';
	export let align_left = true;
	export let name = 'generic';
	const s_mouse = ux.s_mouse_forName(name);	// persist across destroy/recreate
	const mouse_timer = ux.mouse_timer_forName(name);	// persist across destroy/recreate
	const mouse_responder_number = g.next_mouse_responder_number;
	let mouse_isDown = false;
	let responding_element;
	let style = k.empty;

	//////////////////////////////////////////////////////////////
	//															//
	//	handles mouse: down, up, double, long & hover			//
	//	requires: center or origin (one must remain null),		//
	//		 width, height, closure & name						//
	//															//
	//	handle_isHit: caller can override hit geometry & logic	//
	//	handle_mouse_state: mouse info relevant to caller		//
	//															//
	//////////////////////////////////////////////////////////////

	onMount(() => {
		setupStyle();
		if (!!responding_element) {
			responding_element.addEventListener('pointerup', handle_pointerUp);
			responding_element.addEventListener('pointerdown', handle_pointerDown);
			return () => {
				responding_element.removeEventListener('pointerup', handle_pointerUp);
				responding_element.removeEventListener('pointerdown', handle_pointerDown);
			}
		}
	});

	$: {
		const _ = center;
		setupStyle();
	}
	
	$: {	// hover
		const mouse_location = $w_mouse_location;
		if (!!responding_element && !!mouse_location) {
			let isHit = false;
			if (!!handle_isHit) {
				isHit = handle_isHit();				// used when this element's hover shape is not its bounding rect
			} else {					
				isHit = Rect.rect_forElement_containsPoint(responding_element, mouse_location);		// use bounding rect
			}
			if (s_mouse.isHover == isHit) {
				handle_mouse_state(S_Mouse.move(null, responding_element, mouse_isDown, isHit));		// pass a null event
			} else {
				s_mouse.isHover =  isHit;
				s_mouse.isOut   = !isHit;												// TODO: called far too often
				handle_mouse_state(S_Mouse.hover(null, responding_element, isHit));					// pass a null event
			}
		}
	}

	function reset() {	// tear down
		s_mouse.clicks = 0;
		mouse_timer.reset();
	}

	function create_state(isDown: boolean, isDouble: boolean = false, isLong: boolean = false): S_Mouse {
		const state = u.copyObject(s_mouse);
		state.isUp = !isDown && !isDouble && !isLong;
		state.element = responding_element;
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
			handle_mouse_state(S_Mouse.up(event, responding_element));
			debug.log_action(` up ${mouse_responder_number} RESPONDER`);
		}
	}
	
	function handle_pointerDown(event) {
		if (detect_mouseDown && s_mouse.clicks == 0) {
			handle_mouse_state(create_state(true));
		}
		s_mouse.clicks += 1;
		if (detect_doubleClick) {
			mouse_timer.setTimeout(T_Timer.double, () => {
				if (mouse_timer.hasTimer && s_mouse.clicks == 2) {
					reset();
					handle_mouse_state(create_state(false, true, false));
				}
			});
		}
		if (detect_longClick) {
			mouse_timer.setTimeout(T_Timer.long, () => {
				if (mouse_timer.hasTimer) {
					reset();
					handle_mouse_state(create_state(false, false, true));
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
			font-family: ${$w_thing_fontFamily};
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
	bind:this={responding_element}
	style={style}>
	<slot></slot>
</div>
