<script lang='ts'>
	import { k, u, ux, Rect, Point, colors, T_Layer } from '../../ts/common/Global_Imports';
	import { w_thing_fontFamily, w_background_color } from '../../ts/common/Stores';
	import { S_Element, Svelte_Wrapper } from '../../ts/common/Global_Imports';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import type { Handle_Result } from '../../ts/common/Types';
	import Identifiable from '../../ts/runtime/Identifiable';
	export let es_button: S_Element = S_Element.empty();
	export let closure: Handle_Result<S_Mouse>;
	export let border_color = colors.default;
	export let font_size = k.font_size.thing;
	export let origin: Point | null = null;
	export let center: Point | null = null;
	export let padding = '0px 6px 1px 6px';
	export let border_thickness = 0.5;
	export let color = colors.default;
	export let height = k.size.button;
	export let width = k.size.button;
	export let position = 'absolute';
	export let zindex = T_Layer.dots;
	export let isToggle = false;
	export let style = k.empty;
	export let name = k.empty;
	let border = k.empty;
	let element: HTMLElement;
	let computedStyletyle = style;
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

	update_computedStyletyle();
	$: es_button.fill, es_button.isOut, $w_background_color, update_computedStyletyle();
	
	function update_computedStyletyle() {
		// console.log(`button ${es_button.description}`);
		color = es_button.stroke;
		if (style.length == 0) {
			border = border_thickness == 0 ? 'none' : `${border_thickness}px solid ${border_color}`;
			computedStyletyle=`
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

	function handle_s_mouse(s_mouse: S_Mouse) {
		if (!!closure) {
			closure(s_mouse);		// so container can adjust behavior or appearance
		}
		if (s_mouse.isHover) {		// NOT the same as isHovering
			update_computedStyletyle();
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
		detect_longClick={true}
		handle_s_mouse={handle_s_mouse}>
		<button
			class='button'
			id={'button-for-' + name}
			style={computedStyletyle}>
			<slot></slot>
		</button>
	</Mouse_Responder>
{/key}
