<script lang='ts'>
	import { k, u, ux, Rect, Point, colors, T_Layer } from '../../ts/common/Global_Imports';
	import { w_thing_fontFamily, w_background_color } from '../../ts/common/Stores';
	import { S_Element, Svelte_Wrapper } from '../../ts/common/Global_Imports';
	import Identifiable from '../../ts/runtime/Identifiable';
	import type { Handle_Result } from '../../ts/common/Types';
	import Mouse_Responder from './Mouse_Responder.svelte';
	import { onMount } from 'svelte';
	export let background_color = $w_background_color;
	export let closure = Handle_Result<S_Mouse>;
	export let border_color = colors.default;
	export let height = k.size.button;
	export let width = k.size.button;
	export let padding = '0px 6px 1px 6px';
	export let color = colors.default;
	export let position = 'absolute';
	export let zindex = T_Layer.dots;
	export let es_button: S_Element;
	export let border_thickness = 1;
	export let center = Point.zero;
	export let isToggle = false;
	export let style = k.empty;
	export let name = k.empty;
	let border = k.empty;
	let currentStyle = style;
	let element: HTMLElement;
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

	update_currentStyle();	// call during instantiate
	
	function update_currentStyle() {
		color = es_button.stroke;
		background_color = es_button.fill;
		if (style.length == 0) {
			border = border_thickness == 0 ? 'none' : `${border_thickness}px solid ${border_color}`;
			currentStyle=`
				left:0px;
				color:${color};
				width:${width}px;
				border:${border};
				z-index:${zindex};
				padding:${padding};
				height:${height}px;
				position:${position};
				cursor:${es_button.cursor};
				border-radius:${height / 2}px;
				font-family:${$w_thing_fontFamily};
				background-color:${background_color};
			`.removeWhiteSpace();
		}
	}

	function button_closure(s_mouse: S_Mouse) {
		closure(s_mouse);		// so container can adjust behavior or appearance
		if (s_mouse.isHover) {	// NOT the same as isHovering
			update_currentStyle();
		}
	}

</script>

{#key $w_background_color}
	<Mouse_Responder
		name={name}
		width={width}
		height={height}
		zindex={zindex}
		center={center}
		detect_longClick={true}
		handle_mouse_state={button_closure}>
		<button class='button' id={'button-for-' + name} style={currentStyle}>
			<slot></slot>
		</button>
	</Mouse_Responder>
{/key}
