<script lang='ts'>
	import { Element_State, Svelte_Wrapper, SvelteComponentType } from '../../ts/common/Global_Imports';
	import { k, u, ux, Rect, Point, ZIndex } from '../../ts/common/Global_Imports';
	import { s_thing_fontFamily } from '../../ts/state/Svelte_Stores';
	import type { Handle_Result } from '../../ts/common/Types';
	import Mouse_Responder from './Mouse_Responder.svelte';
	import Identifiable from '../../ts/basis/Identifiable';
	import { onMount } from 'svelte';
	export let background_color = k.color_background;
	export let closure = Handle_Result<Mouse_State>;
	export let height = k.default_buttonSize;
	export let width = k.default_buttonSize;
	export let element_state: Element_State;
	export let border_color = k.color_default;
	export let position = 'absolute';
	export let zindex = ZIndex.dots;
	export let border_thickness = 1;
	export let center = Point.zero;
	export let color = k.color_default;
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
	//	container owns Element_State:	//
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
		color = element_state.stroke;
		background_color = element_state.fill;
		if (style.length == 0) {
			border = border_thickness == 0 ? 'none' : `${border_thickness}px solid ${border_color}`;
			currentStyle=`
				left:0px;
				color:${color};
				width:${width}px;
				border:${border};
				z-index:${zindex};
				height:${height}px;
				position:${position};
				padding:0px 6px 1px 6px;
				border-radius:${height / 2}px;
				cursor:${element_state.cursor};
				font-family: {$s_thing_fontFamily};
				background-color:${background_color};
			`.removeWhiteSpace();
		}
	}

	function hover_closure(mouse_state: Mouse_State) {
		closure(mouse_state);		// so container can behave or look differently
		if (mouse_state.isHover) {	// NOT the same as isHovering
			update_currentStyle();
		}
	}

</script>

<Mouse_Responder
	name={name}
	width={width}
	height={height}
	center={center}
	mouse_state_closure={hover_closure}>
	<button class='button' id={'button-for-' + name} style={currentStyle}>
		<slot></slot>
	</button>
</Mouse_Responder>
