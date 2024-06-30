<script lang='ts'>
	import { Element_State, Svelte_Wrapper, SvelteComponentType } from '../../ts/common/Global_Imports';
	import { g, k, s, u, Rect, Point, ZIndex, onMount } from '../../ts/common/Global_Imports';
	import Mouse_Responder from './Mouse_Responder.svelte';
	import Identifiable from '../../ts/data/Identifiable';
	export let background_color = k.color_background;
	export let height = k.default_buttonSize;
	export let width = k.default_buttonSize;
	export let closure = (mouseState) => {};
	export let element_state: Element_State;
	export let position = 'absolute';
	export let border_thickness = 1;
	export let zindex = ZIndex.dots;
	export let center = Point.zero;
	export let color = 'black';
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

	onMount(() => { update_currentStyle(); })
	
	function update_currentStyle() {
		color = element_state.stroke;
		background_color = element_state.fill;
		if (style.length == 0) {
			border = border_thickness == 0 ? 'none' : `solid ${border_thickness}px`;
			currentStyle=`
				color:${color};
				border:${border};
				width:${width}px;
				z-index:${zindex};
				height:${height}px;
				position:${position};
				cursor:${element_state.cursor};
				border-radius:${height / 2}px;
				background-color:${background_color};
			`.removeWhiteSpace()
		}
	}

	function button_closure(mouseState: Mouse_State) {
		closure(mouseState);		// so container can behave or look differently
		if (mouseState.isHover) {	// NOT the same as isHovering
			update_currentStyle();
		}
	}

</script>

<Mouse_Responder
	name={name}
	width={width}
	height={height}
	center={center}
	closure={button_closure}>
	<button class='button' id={'button-for-' + name} style={currentStyle}>
		<slot></slot>
	</button>
</Mouse_Responder>
