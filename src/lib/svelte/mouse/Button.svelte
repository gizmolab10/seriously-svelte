<script lang='ts'>
	import { e, g, k, s, hits, colors, elements, T_Timer } from '../../ts/common/Global_Imports';
	import { S_Mouse, S_Element, T_Layer, Point } from '../../ts/common/Global_Imports';
	import { onMount } from 'svelte';
	export let handle_s_mouse: (s_mouse: S_Mouse) => boolean;
	export let s_button: S_Element = S_Element.empty();
	export let font_size = k.font_size.common;
	export let border_color = colors.border;
	export let origin: Point | null = null;
	export let center: Point | null = null;
	export let padding = '0px 6px 1px 6px';
	export let detect_autorepeat = false;
	export let detect_longClick = false;
	export let height = k.height.button;
	export let width = k.height.button;
	export let border_thickness = 0.5;
	export let color = colors.default;
	export let position = 'absolute';
	export let zindex = T_Layer.dot;
	export let style = k.empty;
	export let name = k.empty;
	const { w_background_color } = colors;
	const s_mouse = elements.s_mouse_forName(name);
	const mouse_timer = e.mouse_timer_forName(name);	// Still needed for longClick
	const { w_s_hover, w_autorepeating_target } = hits;
	const { w_control_key_down, w_thing_fontFamily } = s;
	const { w_rect_ofGraphView, w_user_graph_offset } = g;
	let autorepeat_event: MouseEvent | null = null;		// Capture event for autorepeat callbacks
	let autorepeat_isFirstCall = true;					// Track if this is the first autorepeat callback (down) or subsequent (repeat)
	let wrapper_style = k.empty;
	let button_style = style;
	let element: HTMLElement;
	let border = k.empty;

	//////////////////////////////////////////
	//										//
	//	adds: border_thickness & style		//
	//										//
	//	container owns S_Element:			//
	//	  (stroke, fill & cursor)			//
	//	  calls intercept_handle_s_mouse	//
	//	  to update them					//
	//										//
	//////////////////////////////////////////

	onMount(() => {
		s_button.handle_s_mouse = intercept_handle_s_mouse;
		recompute_style();
		return () => {
			hits.delete_hit_target(s_button);
		};
	});

	// important for components with {#key} blocks
	$: if (!!element && !!s_button) {
		s_button.set_html_element(element);
	}

	// in case detect_autorepeat changes
	$: if (detect_autorepeat && !!s_button && !!element) {
		s_button.detect_autorepeat = true;
		s_button.autorepeat_callback = () => {
			if (!autorepeat_event) return;
			// First call is the initial down, subsequent calls are repeats
			const s_mouse_event = autorepeat_isFirstCall 
				? S_Mouse.down(autorepeat_event, element)
				: S_Mouse.repeat(autorepeat_event, element);
			autorepeat_isFirstCall = false; // Next call will be a repeat
			handle_s_mouse(s_mouse_event);
			recompute_style();
		};
		s_button.autorepeat_id = 0;
	} else if (!!s_button) {
		s_button.detect_autorepeat = false;
		s_button.autorepeat_callback = undefined;
	}

	recompute_style();

	$: {
		const _ = `${$w_user_graph_offset.description}
			:::${$w_rect_ofGraphView.description}
			:::${$w_s_hover?.id ?? 'null'}
			:::${$w_background_color}
			:::${$w_control_key_down}
			:::${s_button.isDisabled}
			:::${s_button.isInverted}
			:::${s_button.isGrabbed}
			:::${s_button.isEditing}
			:::${s_button.fill}`;
		recompute_style();
	}

	function reset() {
		s_mouse.clicks = 0;
		mouse_timer.reset();
		autorepeat_event = null;
		autorepeat_isFirstCall = true; // Reset for next autorepeat cycle
	}

	function intercept_handle_s_mouse(s_mouse: S_Mouse): boolean {
		if (!handle_s_mouse) {
			return false;
		}
		if (s_mouse.isDown && !!s_mouse.event) {
			if (detect_autorepeat) {
				// Autorepeat is handled centrally by Hits.ts
				// Capture the event and reset the first-call flag for this autorepeat cycle
				autorepeat_event = s_mouse.event;
				autorepeat_isFirstCall = true;
			} else {
				if (s_mouse.clicks == 0) {
					handle_s_mouse(s_mouse);
					recompute_style();
				}
				s_mouse.clicks += 1;
				if (detect_longClick) {
					mouse_timer.timeout_start(T_Timer.long, () => {
						if (mouse_timer.hasTimer_forID(T_Timer.long)) {
							reset();
							s_mouse.clicks = 0;
							handle_s_mouse(S_Mouse.long(s_mouse.event!, element));
							recompute_style();
						}
					});
				}
			}
			return true;
		} else if (s_mouse.isUp && !!s_mouse.event) {
			reset();
			handle_s_mouse(s_mouse);
			recompute_style();
			return true;
		}
		return false;
	}
	
	function recompute_style() {
		color = s_button.stroke;
		const align_left = true;
		if (wrapper_style.length == 0) {
			wrapper_style = `
				cursor: pointer;
				width: ${width}px;
				z-index: ${zindex};
				height: ${height}px;
				position: ${position};
				font-family: ${$w_thing_fontFamily};
			`.removeWhiteSpace();
			if (!origin && !center) {
				wrapper_style = `${wrapper_style} top: 0px; left: 0px;`;
			} else {
				const x = origin?.x ?? center?.x - width / 2;
				const y = origin?.y ?? center?.y - height / 2;
				const alignment = align_left ? 'left: ' : 'right: ';
				wrapper_style = `${wrapper_style} ${alignment}${x}px; top: ${y}px;`;
			}
		}
		if (style.length == 0) {
			border_color = colors.border;
			const border_attributes = border_thickness == 0 ? 'none' : `${border_thickness}px solid ${border_color}`;
			border = `border:${border_attributes}`;
			button_style=`
				top:0px;
				left:0px;
				${border};
				display: flex;
				color:${color};
				width:${width}px;
				z-index:${zindex};
				padding:${padding};
				height:${height}px;
				text-align: center;
				align-items: center;
				position:${position};
				justify-content: center;
				font-size:${font_size}px;
				cursor:${s_button.cursor};
				border-radius:${height / 2}px;
				background-color:${s_button.fill};
				font-family:${$w_thing_fontFamily};
			`.removeWhiteSpace();
		}
	}

</script>

{#key $w_background_color, button_style}
	<div class='button-wrapper'
		style={wrapper_style}
		bind:this={element}
		name={name}>
		<button class='button'
			style={button_style}
			name={'button-for-' + name}>
			<slot/>
		</button>
	</div>
{/key}
