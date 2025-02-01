<script lang='ts'>
	import { S_Element, Svelte_Wrapper, T_SvelteComponent } from '../../ts/common/Global_Imports';
	import { k, u, ux, Rect, Point, T_Layer } from '../../ts/common/Global_Imports';
	import { s_thing_fontFamily } from '../../ts/state/S_Stores';
	import Identifiable from '../../ts/data/basis/Identifiable';
	import type { Handle_Result } from '../../ts/common/Types';
	import Mouse_Responder from './Mouse_Responder.svelte';
	import { onMount } from 'svelte';
	export let background_color = k.color_background;
	export let closure = Handle_Result<S_Mouse>;
	export let border_color = k.color_default;
	export let height = k.default_buttonSize;
	export let width = k.default_buttonSize;
	export let s_element: S_Element;
	export let padding = '0px 6px 1px 6px';
	export let color = k.color_default;
	export let position = 'absolute';
	export let zindex = T_Layer.dots;
	export let border_thickness = 1;
	export let center = Point.zero;
	export let style = k.empty;
	export let name = k.empty;
	let border = k.empty;
	let element: HTMLElement;
	let currentStyle = style;
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
		color = s_element.stroke;
		background_color = s_element.fill;
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
				border-radius:${height / 2}px;
				cursor:${s_element.cursor};
				font-family:${$s_thing_fontFamily};
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

<Mouse_Responder
	name={name}
	width={width}
	height={height}
	zindex={zindex}
	center={center}
	mouse_closure={button_closure}>
	<button class='button' id={'button-for-' + name} style={currentStyle}>
		<slot></slot>
	</button>
</Mouse_Responder>
