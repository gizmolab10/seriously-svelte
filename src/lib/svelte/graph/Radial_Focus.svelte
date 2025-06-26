<script lang='ts'>
	import { c, k, ux, Size, Point, debug, colors, layout, signals, svgPaths, Svelte_Wrapper } from '../../ts/common/Global_Imports';
	import { w_background_color, w_ancestry_focus, w_ancestries_grabbed } from '../../ts/common/Stores';
	import { w_thing_color, w_s_text_edit, w_thing_fontFamily } from '../../ts/common/Stores';
	import { T_Layer, T_Element, T_SvelteComponent } from '../../ts/common/Enumerations';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import Widget_Title from '../widget/Widget_Title.svelte';
	import { onMount } from 'svelte';
	const height = k.height.row + 1;
	let ancestry = $w_ancestry_focus;
	let es_title = ux.s_element_for(ancestry, T_Element.radial_focus, k.empty);
	let es_widget = ux.s_widget_forAncestry(ancestry);
	let background_color = es_widget.background_color;
	let svg_strokeColor = 'transparent';
	let svg_fillColor = 'transparent';
	let origin_ofWidget = Point.zero;
	let center_ofBorder = Point.zero;
	let size_ofBorder = Size.zero;
	let svg_dasharray = k.empty;
	let color = es_widget.color;
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
			layout_focus();
		});
		return () => { handle_reposition.disconnect(); };
	});

	function debug_closure(s_mouse) { debug.log_radial(` ${s_mouse.descriptionFor('FOCUS')}`); }
	function handle_s_mouse(s_mouse: S_Mouse): boolean { return false; }

	$: { const _ = $w_ancestry_focus; layout_focus();}
	
	$: {
		if (!!focus) {
			new Svelte_Wrapper(focus, handle_s_mouse, $w_ancestry_focus.hid, T_SvelteComponent.widget);
		}
	}

	$: {
		const _ = `${$w_thing_color} ${$w_ancestry_focus} ${$w_s_text_edit} ${$w_ancestries_grabbed.join(',')}`;
		update_colors();
		update_svg();
	}

	function update_colors() {
		ancestry = $w_ancestry_focus;
		es_widget = ux.s_widget_forAncestry(ancestry);
		background_color = es_widget.background_color;
		color = es_widget.color;
		svg_strokeColor = es_widget.shows_border ? color : 'transparent';
		svg_fillColor = es_widget.shows_border ? $w_background_color : 'transparent';
	}

	function layout_focus() {
		width_ofTitle = ($w_ancestry_focus?.thing?.width_ofTitle ?? 0);
		const x = -7.5 - (width_ofTitle / 2);
		const y = -11;
		origin_ofWidget = layout.center_ofGraphSize.offsetByXY(x, y);
		size_ofBorder = new Size(width_ofTitle - 6, k.height.row);
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
			handle_s_mouse = {debug_closure}>
			<svg
				class='radial-focus-svg'
				style='
					height : {height}px;
					position : absolute;
					width : {width_ofTitle + 15}px;'>
				<path
					stroke = {color}
					stroke-width = '0.8'
					fill = {background_color}
					class = 'radial-focus-path'
					stroke-dasharray = {svg_dasharray}
					d = {svgPaths.pill(center_ofBorder, size_ofBorder)}/>
			</svg>
		</Mouse_Responder>
	<div class='radial-focus-title'
		style='
			top : 3px;
			left : -11px;
			position : absolute;
			background-color : {background_color};'>
		<Widget_Title
			fontSize = {k.font_size.common}px
			es_title = {es_title}/>
	</div>
</div>