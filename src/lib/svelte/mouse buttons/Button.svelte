<script lang='ts'>
	import { g, k, s, u, Point, ZIndex, onMount, ElementState } from '../../ts/common/GlobalImports';
	import MouseButton from './MouseButton.svelte';
	export let background_color = k.color_background;
	export let height = k.default_buttonSize;
	export let width = k.default_buttonSize;
	export let closure = (mouseState) => {};
	export let elementState: ElementState;
	export let dynamic_background = true;
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
	//	  container for MouseButton		//
	//									//
	//	adds: color, background_color,	//
	//	style, & border_thickness		//
	//									//
	//////////////////////////////////////

	onMount(() => { update(); })
	$: { update(); }
	
	function updateStyle() {
		if (style.length == 0) {
			border = border_thickness == 0 ? 'none' : `solid ${border_thickness}px`;
			currentStyle=`
				color:${color};
				cursor:pointer;
				border:${border};
				width:${width}px;
				z-index:${zindex};
				height:${height}px;
				position:${position};
				border-radius:${height / 2}px;
				background-color:${background_color};
			`.removeWhiteSpace()
		}
	}

	function update_fromState() {
		if (!elementState) {
			console.log('bad state of affairs');
		} else {
			color = elementState.stroke;
			if (dynamic_background) {
				background_color = elementState.fill;
			}
		}
	}
	
	function update() {
		update_fromState();
		updateStyle();
	}

	function button_closure(mouseState) {
		closure(mouseState);
		if (mouseState.isHover) {	// NOT the same as isHovering
			update();
		}
	}

</script>

<MouseButton
	name={name}
	width={width}
	height={height}
	center={center}
	closure={button_closure}>
	<button class='button' id={'button-for-' + name} style={currentStyle}>
		<slot></slot>
	</button>
</MouseButton>
