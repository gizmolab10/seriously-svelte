<script lang='ts'>
	import { w_background_color, w_graph_rect, w_user_graph_offset } from '../../ts/common/Stores';
	import { k, u, ux, Rect, Point, colors, T_Layer } from '../../ts/common/Global_Imports';
	import { w_ancestries_grabbed, w_ancestries_expanded } from '../../ts/common/Stores';
	import { w_thing_fontFamily, w_control_key_down } from '../../ts/common/Stores';
	import { S_Element, Svelte_Wrapper } from '../../ts/common/Global_Imports';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	export let es_button: S_Element = S_Element.empty();
	export let closure: (result: S_Mouse) => boolean;
	export let font_size = k.font_size.common;
	export let border_color = colors.border;
	export let origin: Point | null = null;
	export let center: Point | null = null;
	export let padding = '0px 6px 1px 6px';
	export let detect_longClick = false;
	export let height = k.height.button;
	export let width = k.height.button;
	export let border_thickness = 0.5;
	export let color = colors.default;
	export let position = 'absolute';
	export let zindex = T_Layer.dots;
	export let style = k.empty;
	export let name = k.empty;
	let border = k.empty;
	let element: HTMLElement;
	let computed_style = style;
	let buttonWrapper: Svelte_Wrapper;

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
		const _ = `${$w_graph_rect}
			${$w_user_graph_offset}
			${$w_background_color}
			${es_button.isDisabled}
			${es_button.isInverted}
			${es_button.isGrabbed}
			${es_button.isEditing}
			${$w_control_key_down}
			${es_button.isOut}
			${es_button.fill}`;
		recompute_style();
	}

	function handle_s_mouse(s_mouse: S_Mouse) {
		if (s_mouse.isHover) {		// NOT the same as isHovering
			if (!!es_button) {
				es_button.isOut = s_mouse.isOut;
			}
		}
		if (!!closure) {
			closure(s_mouse);		// so container can adjust behavior or appearance
		}
		recompute_style();
	}
	
	function recompute_style() {
		color = es_button.stroke;
		if (style.length == 0) {
			border_color = colors.border;
			border = border_thickness == 0 ? 'none' : `${border_thickness}px solid ${border_color}`;
			computed_style=`
				left:0px;
				display: flex;
				color:${color};
				width:${width}px;
				border:${border};
				z-index:${zindex};
				padding:${padding};
				height:${height}px;
				text-align: center;
				align-items: center;
				position:${position};
				justify-content: center;
				font-size:${font_size}px;
				cursor:${es_button.cursor};
				border-radius:${height / 2}px;
				font-family:${$w_thing_fontFamily};
				background-color:${es_button.fill};
			`.removeWhiteSpace();
		}
	}

</script>

{#key $w_background_color}
	<Mouse_Responder
		name={name}
		width={width}
		height={height}
		zindex={zindex}
		origin={origin}
		center={center}
		position={position}
		handle_s_mouse={handle_s_mouse}
		detect_longClick={detect_longClick}>
		<button
			class='button'
			style={computed_style}
			id={'button-for-' + name}>
			<slot/>
		</button>
	</Mouse_Responder>
{/key}
