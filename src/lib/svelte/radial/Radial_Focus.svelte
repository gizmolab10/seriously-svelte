<script lang='ts'>
	import { w_thing_color, w_s_title_edit, w_thing_fontFamily } from '../../ts/common/Stores';
	import { c, k, ux, w, Size, Point, debug, svgPaths } from '../../ts/common/Global_Imports';
	import { T_Tool, T_Layer, T_Element, G_RadialGraph } from '../../ts/common/Global_Imports';
	import { w_ancestry_focus, w_ancestries_grabbed } from '../../ts/common/Stores';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import W_Title_Editor from '../widget/W_Title_Editor.svelte';
	const es_title = ux.s_element_for($w_ancestry_focus, T_Element.title, k.empty);
	const height = k.row_height + 10;
	let svg_strokeColor = 'transparent';
	let svg_fillColor = 'transparent';
	let color = k.thing_color_default;
	let origin_ofWidget = Point.zero;
	let center_ofBorder = Point.zero;
	let origin_ofTitle = Point.zero;
	let svg_dasharray = '';
	let width_ofTitle = 0;

	$: {
		const _ = $w_ancestry_focus + $w_s_title_edit + $w_ancestries_grabbed;
		update_svg();
	}

	$: {
		const _ = $w_thing_color;
		color = $w_ancestry_focus?.thing?.color;
		update_svg();
	}

	$: {
		width_ofTitle = ($w_ancestry_focus?.thing?.titleWidth ?? 0);
		const x = -6 - (width_ofTitle / 2);
		origin_ofTitle = Point.x(11);
		center_ofBorder = new Point(width_ofTitle + 19, height).dividedInHalf;
		origin_ofWidget = new Point(x, 1 - k.dot_size).offsetBy(w.center_ofGraphSize);
	}

	function debug_closure(s_mouse) {
		debug.log_radial(` ${s_mouse.descriptionFor('FOCUS')}`);
	}

	function update_svg() {
		const focus = $w_ancestry_focus;
		const grabbed = focus?.isGrabbed ?? false;
		const editing = focus?.isEditing ?? false;
		svg_dasharray = editing ? '1.8,1' : k.empty;
		svg_fillColor = grabbed ? 'white' : 'transparent';
		svg_strokeColor = grabbed ? color : 'transparent';
	}

</script>

<div class='radial-focus'
	style='
		height:{height}px;
		position: absolute;
		width:{width_ofTitle}px;
		top:{origin_ofWidget.y}px;
		z-index: {T_Layer.backmost};
		left: {origin_ofWidget.x}px;'>
		<Mouse_Responder
			height={height}
			width={width_ofTitle}
			zindex={T_Layer.backmost}
			cursor={k.cursor_default}
			handle_isHit={() => false}
			name='radial-focus-border'
			handle_mouse_state={debug_closure}
			center={center_ofBorder}>
			{#key color}
				<svg
					class='radial-focus-svg'
					style='
						top: -2.7px;
						left: -13px;
						height:{height}px;
						position: absolute;
						width:{width_ofTitle + 40}px;'>
					<path
						stroke-width='0.8'
						fill={svg_fillColor}
						stroke={svg_strokeColor}
						class='radial-focus-path'
						stroke-dasharray={svg_dasharray}
						d={svgPaths.oblong(center_ofBorder, new Size(width_ofTitle - 6, k.row_height))}/>
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
			origin = {origin_ofTitle}
			fontSize={k.font_size}px
			name={es_title.name}/>
	</div>
</div>