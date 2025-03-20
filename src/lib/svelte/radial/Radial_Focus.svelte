<script lang='ts'>
	import { c, k, ux, w, Size, Point, debug, signals, svgPaths } from '../../ts/common/Global_Imports';
	import { w_color_trigger, w_s_title_edit, w_thing_fontFamily } from '../../ts/common/Stores';
	import { w_ancestry_focus, w_ancestries_grabbed } from '../../ts/common/Stores';
	import { T_Tool, T_Layer, T_Element } from '../../ts/common/Global_Imports';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import Widget_Title from '../widget/Widget_Title.svelte';
	import { onMount } from 'svelte';
	const height = k.row_height + 10;
	const fontSize = `{k.font_size}px`;
	const es_title = ux.s_element_for($w_ancestry_focus, T_Element.radial_focus, k.empty);
	let svg_strokeColor = 'transparent';
	let svg_fillColor = 'transparent';
	let color = k.thing_color_default;
	let origin_ofWidget = Point.zero;
	let center_ofBorder = Point.zero;
	let origin_ofTitle = Point.zero;
	let svg_dasharray = '';
	let width_ofTitle = 0;

	//////////////////////////////////
	//								//
	//	mimic a Widget				//
	//	ignores rebuild & recreate	//
	//								//
	//////////////////////////////////


	onMount(() => {
		const handle_reposition = signals.handle_reposition_widgets(2, (received_ancestry) => {
			update();
		});
		return () => { handle_reposition.disconnect(); };
	});

	$: {
		const _ = $w_ancestry_focus + $w_s_title_edit + $w_ancestries_grabbed;
		update_svg();
	}

	$: {
		const _ = $w_ancestry_focus;
		update();
	}

	$: {
		const _ = $w_color_trigger;
		color = $w_ancestry_focus?.thing?.color;
		update_svg();
	}

	function debug_closure(s_mouse) {
		debug.log_radial(` ${s_mouse.descriptionFor('FOCUS')}`);
	}

	function update() {
		width_ofTitle = ($w_ancestry_focus?.thing?.titleWidth ?? 0);
		const x = -6 - (width_ofTitle / 2);
		const y = 1 - k.dot_size;
		origin_ofTitle = Point.x(14);
		origin_ofWidget = w.center_ofGraphSize.offsetByXY(x, y);
		center_ofBorder = new Point(width_ofTitle + 19, height).dividedInHalf;
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
		position : absolute;
		height : {height}px;
		width : {width_ofTitle}px;
		top : {origin_ofWidget.y}px;
		z-index : {T_Layer.backmost};
		left : {origin_ofWidget.x}px;'>
		<Mouse_Responder
			height = {height}
			width = {width_ofTitle}
			center = {center_ofBorder}
			zindex = {T_Layer.backmost}
			cursor = {k.cursor_default}
			name = 'radial-focus-border'
			handle_isHit = {() => false}
			handle_mouse_state = {debug_closure}>
			{#key color}
				<svg
					class='radial-focus-svg'
					style='
						top : -2.7px;
						left : -13px;
						height : {height}px;
						position : absolute;
						width : {width_ofTitle + 40}px;'>
					<path
						stroke-width = '0.8'
						fill = {svg_fillColor}
						stroke = {svg_strokeColor}
						class = 'radial-focus-path'
						stroke-dasharray = {svg_dasharray}
						d = {svgPaths.oblong(center_ofBorder, new Size(width_ofTitle - 6, k.row_height))}/>
				</svg>
			{/key}
		</Mouse_Responder>
	<div class='radial-focus-title'
		style='
			top : 3px;
			left : -11px;
			position :  absolute;'>
		<Widget_Title
			ancestry = {$w_ancestry_focus}
			origin = {origin_ofTitle}
			name = {es_title.name}
			fontSize = {fontSize}/>
	</div>
</div>