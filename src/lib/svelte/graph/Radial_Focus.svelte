<script lang='ts'>
	import { c, k, ux, w, Size, Point, debug, colors, signals, svgPaths, Svelte_Wrapper } from '../../ts/common/Global_Imports';
	import { w_background_color, w_ancestry_focus, w_ancestries_grabbed } from '../../ts/common/Stores';
	import { w_color_trigger, w_s_title_edit, w_thing_fontFamily } from '../../ts/common/Stores';
	import { T_Tool, T_Layer, T_Element, T_SvelteComponent } from '../../ts/common/Enumerations';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import Widget_Title from '../widget/Widget_Title.svelte';
	import { onMount } from 'svelte';
	const height = k.row_height + 1;
	const fontSize = `{k.font_size}px`;
	const es_title = ux.s_element_for($w_ancestry_focus, T_Element.radial_focus, k.empty);
	let svg_strokeColor = 'transparent';
	let svg_fillColor = 'transparent';
	let color = colors.default_forThings;
	let origin_ofWidget = Point.zero;
	let center_ofBorder = Point.zero;
	let origin_ofTitle = Point.zero;
	let size_ofBorder = Size.zero;
	let svg_dasharray = k.empty;
	let width_ofTitle = 0;
	let focus;

	//////////////////////////////////
	//								//
	//	mimic a Widget				//
	//	ignores rebuild & recreate	//
	//								//
	//////////////////////////////////

	onMount(() => {
		const handle_reposition = signals.handle_reposition_widgets(2, (received_ancestry) => {
			layout();
		});
		return () => { handle_reposition.disconnect(); };
	});

	function handle_mouse_state(s_mouse: S_Mouse): boolean { return false; }
	
	$: {
		if (!!focus) {
			new Svelte_Wrapper(focus, handle_mouse_state, $w_ancestry_focus.hid, T_SvelteComponent.widget);
		}
	}

	$: {
		const _ = $w_ancestry_focus + $w_s_title_edit + $w_ancestries_grabbed;
		update_svg();
	}

	$: {
		const _ = $w_ancestry_focus;
		layout();
	}

	$: {
		const _ = $w_color_trigger;
		color = $w_ancestry_focus?.thing?.color;
		update_svg();
	}

	function debug_closure(s_mouse) {
		debug.log_radial(` ${s_mouse.descriptionFor('FOCUS')}`);
	}

	function layout() {
		width_ofTitle = ($w_ancestry_focus?.thing?.width_ofTitle ?? 0);
		const x = -7.5 - (width_ofTitle / 2);
		const y = -11;
		origin_ofTitle = new Point(19, -2);
		origin_ofWidget = w.center_ofGraphSize.offsetByXY(x, y);
		size_ofBorder = new Size(width_ofTitle - 6, k.row_height);
		center_ofBorder = new Point(width_ofTitle + 15, height).dividedInHalf;
	}

	function update_svg() {
		const focus = $w_ancestry_focus;
		const grabbed = focus?.isGrabbed ?? false;
		const editing = focus?.isEditing ?? false;
		svg_dasharray = editing ? '1.8,1' : k.empty;
		svg_strokeColor = grabbed ? color : 'transparent';
		svg_fillColor = grabbed ? $w_background_color : 'transparent';
	}

</script>

<div class='radial-focus'
	bind:this = {focus}
	style='
		position : absolute;
		height : {height}px;
		width : {width_ofTitle + 15}px;
		top : {origin_ofWidget.y}px;
		z-index : {T_Layer.widgets};
		left : {origin_ofWidget.x}px;'>
		<Mouse_Responder
			height = {height}
			center = {center_ofBorder}
			zindex = {T_Layer.widgets}
			cursor = {k.cursor_default}
			width = {width_ofTitle + 15}
			name = 'radial-focus-border'
			handle_isHit = {() => false}
			handle_mouse_state = {debug_closure}>
			<svg
				class='radial-focus-svg'
				style='
					height : {height}px;
					position : absolute;
					width : {width_ofTitle + 15}px;'>
				<path
					stroke-width = '0.8'
					stroke = {svg_strokeColor}
					class = 'radial-focus-path'
					fill = {$w_background_color}
					stroke-dasharray = {svg_dasharray}
					d = {svgPaths.oblong(center_ofBorder, size_ofBorder)}/>
			</svg>
		</Mouse_Responder>
	<div class='radial-focus-title'
		style='
			top : 3px;
			left : -11px;
			position : absolute;
			background-color : {$w_background_color};'>
		<Widget_Title
			ancestry = {$w_ancestry_focus}
			origin = {origin_ofTitle}
			name = {es_title.name}
			fontSize = {fontSize}/>
	</div>
</div>