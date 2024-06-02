<script lang='ts'>
	import { k, s, u, Rect, Size, Point, MouseData, ZIndex, onMount } from '../../ts/common/GlobalImports';
	import { s_mouse_location } from '../../ts/state/ReactiveState';
	export let hover_closure: () => {flag: boolean} | null = null;
	export let height = k.default_buttonSize;
	export let width = k.default_buttonSize;
	export let closure = (mouseData) => {};
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
	const mouseState = s.mouseState_forName(name);
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
	//		UXState, MouseData &			//
	//		ButtonAppearance				//
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
			const isElementHit = u.rect_forElement_contains(mouse_button, $s_mouse_location);
			const wasHit = mouseState.hit;
			let isHit = isElementHit;
			if (!!hover_closure) {
				isHit = hover_closure();	// ask containing component
			}
			if (isHit != wasHit) {
				mouseState.hit = isHit;
				closure(MouseData.hover(null, mouse_button, isHit));	// use null event
			}
		}
	}

	function handle_pointerUp(event) {
		if (detect_mouseUp) {

			// teardown timers and call closure
		
			closure(MouseData.up(event, mouse_button));
			clearTimeout(mouse_doubleClick_timer);
			clearTimeout(mouse_longClick_timer);
			mouse_doubleClick_timer = null;
			mouse_longClick_timer = null;
		}
	}
	
	function handle_pointerDown(event) {
		if (detect_mouseDown && mouseState.clicks == 0) {

			// call down closure

			closure(MouseData.down(event, mouse_button));
		}
		mouseState.clicks += 1;
		if (detect_longClick && !mouse_longClick_timer) {

			// setup timer to call long-click closure

			mouse_longClick_timer = setTimeout(() => {
				closure(MouseData.long(event, mouse_button));
				mouse_longClick_timer = null;
				mouseState.clicks = 0;
			}, k.threshold_longClick);
		}
		if (detect_doubleClick && !mouse_doubleClick_timer) {

			// setup timer to call double-click closure

			mouse_doubleClick_timer = setTimeout(() => {
				closure(MouseData.clicks(event, mouse_button, mouseState.clicks));
				mouse_doubleClick_timer = null;
				mouseState.clicks = 0;
			}, k.threshold_doubleClick);
		}
	}

	function setupStyle() {
		style = `cursor: ${cursor}; width: ${width}px; height: ${height}px; position: ${position};`;
		if (!!center) {
			const x = center.x - width / 2;
			const horizontal = align_left ? `left: ${x}` : `right: ${-x}`;
			style = `${style} ${horizontal}px; top: ${center.y - height / 2}px;`;
		}
	}

</script>

<div id={name}
	style={style}
	bind:this={mouse_button}>
	<slot></slot>
</div>
