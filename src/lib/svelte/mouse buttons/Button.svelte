<script lang='ts'>
	import { g, k, s, u, Point, ZIndex, onMount, ElementState } from '../../ts/common/GlobalImports';
	import Mouse_Responder from './Mouse_Responder.svelte';
	export let background_color = k.color_background;
	export let height = k.default_buttonSize;
	export let width = k.default_buttonSize;
	export let closure = (mouseState) => {};
	export let elementState: ElementState;
	export let position = 'absolute';
	export let border_thickness = 1;
	export let zindex = ZIndex.dots;
	export let center = Point.zero;
	export let color = 'black';
	export let style = k.empty;
	export let name = k.empty;
	let currentStyle = style;
	let border = k.empty;

	//////////////////////////////////////
	//									//
	//	adds: border_thickness & style	//
	//									//
	//	container owns ElementState:	//
	//	  (stroke, fill & cursor)		//
	//	  calls closure to update it	//
	//									//
	//	owns a Mouse_Responder: state	//
	//	  is passed to the container	//
	//									//
	//////////////////////////////////////

	onMount(() => { update(); })
	$: { update(); }
	
	function update() {
		color = elementState.stroke;
		background_color = elementState.fill;
		if (style.length == 0) {
			border = border_thickness == 0 ? 'none' : `solid ${border_thickness}px`;
			currentStyle=`
				color:${color};
				border:${border};
				width:${width}px;
				z-index:${zindex};
				height:${height}px;
				position:${position};
				cursor:${elementState.cursor};
				border-radius:${height / 2}px;
				background-color:${background_color};
			`.removeWhiteSpace()
		}
	}

	function button_closure(mouseState) {
		closure(mouseState);
		if (mouseState.isHover) {	// NOT the same as isHovering
			update();
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
