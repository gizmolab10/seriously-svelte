<script lang='ts'>
	import { k, u, x, Rect, Point, colors, T_Layer, layout, elements } from '../../ts/common/Global_Imports';
	import { w_s_hover, w_thing_fontFamily, w_control_key_down } from '../../ts/managers/Stores';
	import { S_Mouse, S_Element, S_Component } from '../../ts/common/Global_Imports';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	export let s_button: S_Element = S_Element.empty();
	export let closure: (result: S_Mouse) => boolean;
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
	export let zindex = T_Layer.dots;
	export let style = k.empty;
	export let name = k.empty;
	const { w_rect_ofGraphView, w_user_graph_offset } = layout;
	const { w_background_color } = colors;
	let buttonComponent: S_Component;
	let computed_style = style;
	let element: HTMLElement;
	let border = k.empty;

	//////////////////////////////////////
	//									//
	//	adds: border_thickness & style	//
	//									//
	//	container owns S_Element:	//
	//	  (stroke, fill & cursor)		//
	//	  calls closure to update it	//
	//									//
	//	owns a Mouse_Responder: state	//
	//	  is passed up to the container	//
	//	  through a closure				//
	//									//
	//////////////////////////////////////

	recompute_style();

	$: {
		const _ = `
			${s_button.isHovering}
			${$w_user_graph_offset}
			${$w_rect_ofGraphView}
			${$w_background_color}
			${$w_control_key_down}
			${s_button.isDisabled}
			${s_button.isInverted}
			${s_button.isGrabbed}
			${s_button.isEditing}
			${s_button.fill}
			${$w_s_hover}`;
		recompute_style();
	}

	function handle_s_mouse(s_mouse: S_Mouse) {
		if (s_mouse.hover_didChange) {
			if (!!s_button) {
				s_button.isHovering = s_mouse.isHovering;
			}
		}
		if (!!closure) {
			closure(s_mouse);		// so container can adjust behavior or appearance
		}
		recompute_style();
	}
	
	function recompute_style() {
		color = s_button.stroke;
		if (style.length == 0) {
			border_color = colors.border;
			const border_attributes = border_thickness == 0 ? 'none' : `${border_thickness}px solid ${border_color}`;
			border = `border:${border_attributes}`;
			computed_style=`
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

{#key $w_background_color, computed_style}
	<Mouse_Responder
		name={name}
		width={width}
		height={height}
		zindex={zindex}
		origin={origin}
		center={center}
		position={position}
		handle_s_mouse={handle_s_mouse}
		detect_longClick={detect_longClick}
		detect_autorepeat={detect_autorepeat}>
		<button class='button'
			style={computed_style}
			id={'button-for-' + name}>
			<slot/>
		</button>
	</Mouse_Responder>
{/key}
