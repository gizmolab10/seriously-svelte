<script lang='ts'>
	import { w_thing_color, w_ancestry_focus, w_thing_fontFamily } from '../../ts/state/S_Stores';
	import { g, k, ux, w, Size, Point, debug, T_Tool, T_Layer, } from '../../ts/common/Global_Imports';
	import { svgPaths, T_Element, G_Radial } from '../../ts/common/Global_Imports';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import W_Title_Editor from '../widget/W_Title_Editor.svelte';
	const s_element = ux.s_element_for($w_ancestry_focus, T_Element.focus, T_Tool.none);
	const s_title = ux.s_element_for($w_ancestry_focus, T_Element.title, k.empty);
	const height = k.row_height + 10;
	let centerOffset = Point.zero;
	let focus_origin = Point.zero;
	let color = k.thing_color_default;
	let titleWidth = 0;

	$: {
		titleWidth = 10 + ($w_ancestry_focus?.thing?.titleWidth ?? 0);
		const offsetX = -titleWidth / 2;
		focus_origin = w.center_ofGraphSize.offsetByXY(offsetX, 1 - k.dot_size);
		centerOffset = new Point(titleWidth + 25, height).dividedInHalf;
	}

	$: {
		const _ = $w_thing_color;
		color = $w_ancestry_focus?.thing?.color;
	}

	function debug_closure(s_mouse) {
		debug.log_radial(` ${s_mouse.descriptionFor('FOCUS')}`);
	}

</script>

<div class='radial-focus'
	style='
		height:{height}px;
		position: absolute;
		width:{titleWidth}px;
		top:{focus_origin.y}px;
		z-index: {T_Layer.backmost};
		left: {focus_origin.x}px;'>
		<Mouse_Responder
			height={height}
			width={titleWidth}
			name='radial-focus-border'
			zindex={T_Layer.backmost}
			cursor={k.cursor_default}
			handle_isHit={() => false}
			handle_mouse_state={debug_closure}
			center={centerOffset.offsetByX(-13)}>
			{#key color}
				<svg
					class='radial-focus-svg'
					style='
						top: -2.7px;
						left: -13px;
						height:{height}px;
						position: absolute;
						width:{titleWidth + 40}px;'>
					<path
						fill='white'
						stroke={color}
						class='radial-focus-path'
						d={svgPaths.oblong(centerOffset, new Size(titleWidth - 6, k.row_height))}/>
				</svg>
			{/key}
		</Mouse_Responder>
	<div class='radial-focus-title'
		style='
			top:3px;
			left:-11px;
			position: absolute;'>
		<W_Title_Editor
			ancestry={$w_ancestry_focus}
			fontSize={k.font_size}px
			name={s_title.name}/>
	</div>
</div>