<script lang='ts'>
	import { s_thing_color, s_ancestry_focus, s_thing_fontFamily } from '../../ts/state/S_Stores';
	import { g, k, ux, w, Size, Point, debug, T_Tool, T_Layer, } from '../../ts/common/Global_Imports';
	import { svgPaths, T_Element, Radial_Geometry } from '../../ts/common/Global_Imports';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import Title_Editor from '../widget/Title_Editor.svelte';
	const element_state = ux.element_state_for($s_ancestry_focus, T_Element.focus, T_Tool.none);
	const height = k.row_height + 10;
	let centerOffset = Point.zero;
	let focus_origin = Point.zero;
	let color = k.thing_color_default;
	let titleWidth = 0;

	$: {
		titleWidth = 10 + ($s_ancestry_focus?.thing?.titleWidth ?? 0);
		const offsetX = -titleWidth / 2;
		focus_origin = w.center_ofGraphSize.offsetByXY(offsetX, 1 - k.dot_size);
		centerOffset = new Point(titleWidth + 25, height).dividedInHalf;
	}

	$: {
		const _ = $s_thing_color;
		color = $s_ancestry_focus?.thing?.color;
	}

	function debug_closure(mouse_state) {
		debug.log_radial(` ${mouse_state.descriptionFor('FOCUS')}`);
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
			isHit_closure={() => false}
			mouse_state_closure={debug_closure}
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
			position: absolute;'>
		<Title_Editor
			ancestry={$s_ancestry_focus}
			fontSize={k.font_size}px/>
	</div>
</div>