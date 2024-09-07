<script lang='ts'>
	import { k, g, u, ux, Rect, Size, Point, debug, ZIndex } from '../../ts/common/Global_Imports';
	import { onMount, Timer_Type, Mouse_Timer, Mouse_State } from '../../ts/common/Global_Imports';
	import { s_mouse_location } from '../../ts/state/Reactive_State';
	export let detectHit_closure: () => {flag: boolean} | null = null;
	export let height = k.default_buttonSize;
	export let width = k.default_buttonSize;
	export let closure = (mouse_state) => {};
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
	const mouse_state = ux.mouse_state_forName(name);	// persist across destroy/recreate
	const mouse_timer = ux.mouse_timer_forName(name);	// persist across destroy/recreate
	const mouse_responder_number = g.next_mouse_responder_number;
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
	
	$: {	// hover
		if (!!mouse_button && !!$s_mouse_location) {
			let isHit = false;
			if (!detectHit_closure) {			// is mouse inside this element's bounding rect
				isHit = Rect.rect_forElement_contains(mouse_button, $s_mouse_location);
			} else {							// if this element's hover shape is not its bounding rect
				isHit = detectHit_closure();	// use hover shape
			}
			if (mouse_state.isHover != isHit) {
				mouse_state.isHover = isHit;
				mouse_state.isOut = !isHit;		// called far too often
				closure(Mouse_State.hover(null, mouse_button, isHit));	// pass a null event
			}
		}
	}

	function reset() {	// tear down
		mouse_timer.reset();
		mouse_state.clicks = 0;
	}

	function downState(isDown: boolean, isDouble: boolean = false, isLong: boolean = false): Mouse_State {
		const state = mouse_state.copy;
		state.isUp = !isDown && !isDouble && !isLong;
		state.element = mouse_button;
		state.isDouble = isDouble;
		state.isLong = isLong;
		state.isHover = false;
		state.isDown = isDown;
		state.event = event;
		return state;
	}

	function handle_pointerUp(event) {
		if (detect_mouseUp) {// && (!!mouse_timer.mouse_longClick_timer)) {

			// tear down timers and call closure

			reset();
			closure(Mouse_State.up(event, mouse_button));
			debug.log_action(`RESPONDER up ${mouse_responder_number}`);
		}
	}
	
	function handle_pointerDown(event) {
		if (detect_mouseDown && mouse_state.clicks == 0) {

			// call down closure

			closure(downState(true));
		}
		mouse_state.clicks += 1;
		if (detect_doubleClick) {

			// setup timer to call double-click closure

			mouse_timer.setTimeout(Timer_Type.double, () => {
				if (mouse_state.clicks == 2) {
					reset();
					closure(downState(false, true, false));
				}
			});
		}
		if (detect_longClick) {

			// setup timer to call long-click closure

			mouse_timer.setTimeout(Timer_Type.long, () => {
				reset();
				closure(downState(false, false, true));
			});
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
	bind:this={mouse_button}
	style={style}>
	<slot></slot>
</div>
