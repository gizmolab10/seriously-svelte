<script lang='ts'>
	import { c, e, k, u, ux, Rect, Size, Point, debug } from '../../ts/common/Global_Imports';
	import { w_mouse_location, w_thing_fontFamily } from '../../ts/common/Stores';
	import { T_Layer, T_Timer, S_Mouse } from '../../ts/common/Global_Imports';
	import type { Handle_Result } from '../../ts/common/Types';
	import { onMount } from 'svelte';
	export let handle_isHit: () => {flag: boolean} | null = null;
	export let handle_s_mouse = Handle_Result<S_Mouse>;
	export let font_size = `${k.font_size.info}px`;
	export let origin: Point | null = null;
	export let center: Point | null = null;
	export let detect_doubleClick = false;
	export let detect_autorepeat = false;
	export let detect_longClick = false;
	export let height = k.height.button;
	export let detect_mouseDown = true;
	export let width = k.height.button;
	export let detect_mouseUp = true;
	export let position = 'absolute';
	export let zindex = T_Layer.dots;
	export let cursor = 'pointer';
	export let align_left = true;
	export let name = 'generic';
	const s_mouse = ux.s_mouse_forName(name);
	const mouse_timer = e.mouse_timer_forName(name);
	const mouse_responder_number = ux.next_mouse_responder_number;
	let style = k.empty;
	let bound_element;

	//////////////////////////////////////////////////////////////
	//															//
	//	required: width, height, name,							//
	//		handle_s_mouse closure (*),						//
	//  	center or origin (one must remain null)				//
	//  optional: handle_isHit closure (*)						//
	//															//
	//  (*)	handle_isHit: override for hit geometry & logic		//
	//	(*)	handle_s_mouse: mouse info relevant to caller:	//
	//		down, up, double, long & hover						//
	//															//
	//////////////////////////////////////////////////////////////

	onMount(() => {
		setupStyle();
		if (!!bound_element) {
			bound_element.addEventListener('pointerup', handle_pointerUp);
			bound_element.addEventListener('pointerdown', handle_pointerDown);
			return () => {
				bound_element.removeEventListener('pointerup', handle_pointerUp);
				bound_element.removeEventListener('pointerdown', handle_pointerDown);
			}
		}
	});

	$: origin?.description, center?.description, setupStyle();
	
	$: {	// hover
		const mouse_location = $w_mouse_location;
		if (!!bound_element && !!mouse_location) {
			let isHit = false;
			if (!!handle_isHit) {
				isHit = handle_isHit();				// used when this element's hover shape is not its bounding rect
			} else {					
				isHit = Rect.rect_forElement_containsPoint(bound_element, mouse_location);		// use bounding rect
			}
			if (s_mouse.isHover != isHit) {
				s_mouse.isHover  = isHit;
				s_mouse.isOut   = !isHit;
				handle_s_mouse(S_Mouse.hover(null, bound_element, isHit));					// pass a null event
				if (isHit) {
					reset();	// to support double click
				}
			}
		}
	}

	function reset() {	// tear down
		s_mouse.clicks = 0;
		mouse_timer.reset();
	}

	function create_s_mouse(isDown: boolean, isDouble: boolean = false, isLong: boolean = false, isRepeat: boolean = false, event: MouseEvent | null = null): S_Mouse {
		const state = u.copyObject(s_mouse);
		state.isUp = !isDown && !isDouble && !isLong && !isRepeat;
		state.isDown = isDown && !isRepeat;
		state.element = bound_element;
		state.isDouble = isDouble;
		state.isRepeat = isRepeat;
		state.isLong = isLong;
		state.isHover = false;
		state.event = event;
		return state;
	}

	function handle_pointerUp(event) {
		if (detect_mouseUp) {
			reset();
			handle_s_mouse(S_Mouse.up(event, bound_element));
		}
	}
	
	function handle_pointerDown(event) {
		if (detect_autorepeat) {

			// autorepeat overrides all other clicks

			mouse_timer.autorepeat_start(mouse_responder_number, () => {
				if (mouse_timer.hasTimer_forID(T_Timer.repeat)) {
					handle_s_mouse(create_s_mouse(false, false, false, true, event));
				}
			});
		} else {
			if (detect_mouseDown && s_mouse.clicks == 0) {
				handle_s_mouse(create_s_mouse(true, false, false, false, event));
			}
			s_mouse.clicks += 1;
			if (detect_doubleClick) {
				mouse_timer.timeout_start(T_Timer.double, () => {
					if (mouse_timer.hasTimer_forID(T_Timer.double) && s_mouse.clicks == 2) {
						reset();
						handle_s_mouse(create_s_mouse(false, true, false, false, event));
					}
				});
			}
			if (detect_longClick) {
				mouse_timer.timeout_start(T_Timer.long, () => {
					if (mouse_timer.hasTimer_forID(T_Timer.long)) {
						reset();
						s_mouse.clicks = 0;
						handle_s_mouse(create_s_mouse(false, false, true, false, event));
					}
				});
			}
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
			const alignment = align_left ? 'left: ' : 'right: ';
			style = `${style} ${alignment}${x}px; top: ${y}px;`;
		}
	}

</script>

<div class='mouse-responder' id={name}
	bind:this={bound_element}
	style={style}>
	<slot/>
</div>
