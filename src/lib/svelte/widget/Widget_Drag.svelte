<script lang='ts'>
	import { T_Layer, T_Graph, T_Signal, T_Alteration, T_Component } from '../../ts/common/Global_Imports';
	import { c, e, k, u, ux, show, grabs, debug, layout, signals } from '../../ts/common/Global_Imports';
	import { Rect, Size, Point, Thing, S_Element, S_Component } from '../../ts/common/Global_Imports';
	import { w_show_countDots_ofType, w_thing_color } from '../../ts/managers/Stores';
	import { svgPaths, databases, components } from '../../ts/common/Global_Imports';
	import { w_s_alteration, w_background_color } from '../../ts/managers/Stores';
	import { w_s_title_edit, w_ancestry_focus } from '../../ts/managers/Stores';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import SVG_D3 from '../draw/SVG_D3.svelte';
	import { onMount } from 'svelte';
	export let s_drag!: S_Element;
	export let pointsNormal = true;
	const size = k.height.dot;
	const capture_size = size;
    const ancestry = s_drag.ancestry;
	const g_widget = ancestry.g_widget;
	const { w_items: w_grabbed } = grabs.s_grabbed_ancestries;
	let fill_color = debug.lines ? 'transparent' : s_drag.fill;
	let svg_outline_color = s_drag.svg_outline_color;
	let center = g_widget.center_ofDrag;
	let ellipsis_color = s_drag.stroke;
	let svgPathFor_ellipses = k.empty;
	let svgPathFor_related = k.empty;
	let svgPathFor_dragDot = k.empty;
	let s_component: S_Component;
    let thing = ancestry.thing;
	let color = thing?.color;
	let isHovering = false;
	let mouse_click_timer;
	let left = 0;

	update_svgPaths();
	update_colors();

	s_component = signals.handle_signals_atPriority([T_Signal.alteration], 0, ancestry, T_Component.drag, (t_signal, value): S_Component | null => {
		s_drag.isInverted = !!invert && !!ancestry && ancestry.alteration_isAllowed;
		update_colors();
	});

	signals.handle_signals_atPriority([T_Signal.reposition], 2, ancestry, T_Component.drag, (t_signal, value): S_Component | null => {
		center = g_widget.center_ofDrag;
	});

	onMount(() => { return () => s_component.disconnect(); });

	function handle_context_menu(event) { u.grab_event(event); }		// no default context menu on right-click
	function handle_s_mouse(s_mouse: S_Mouse): boolean { return false; }

	$: {
		const _ = $w_show_countDots_ofType;
		update_svgPaths();
	}

	$: {
		const _ = `${$w_thing_color}:::${$w_background_color}:::${$w_grabbed?.map(a => a.titles.join(',')).join('-')}`;
		update_colors();
	}

	function update_svgPaths() {
		if (ux.inRadialMode) {
			svgPathFor_dragDot = svgPaths.circle_atOffset(size, size - 1);
		} else {
			svgPathFor_dragDot = svgPaths.oval(size, false);
		}
		update_svgPathsExtra();
	}

	function update_colors() {
		if (!ux.isAny_rotation_active && !!s_drag && !!thing) {
			const usePointer = (!ancestry.isGrabbed || ux.inRadialMode) && ancestry.hasChildren;
			const cursor = usePointer ? 'pointer' : 'normal';
			s_drag.isOut = !isHovering != ancestry.isGrabbed;
			s_drag.set_forHovering(thing.color, cursor);
			color = thing.color;
			ellipsis_color = s_drag.stroke;
			svg_outline_color = s_drag.svg_outline_color;
			fill_color = debug.lines ? 'transparent' : s_drag.fill;
			debug.log_colors(`DRAG ${ancestry.title}${s_drag.isInverted ? ' INVERTED' : ''}`)
		}
	}

	function update_svgPathsExtra() {
		svgPathFor_related = svgPathFor_ellipses = null;
		if (!!thing) {
			const count = thing.parents.length;		
			if (count > 1 && show.parent_dots) {
				svgPathFor_ellipses = svgPaths.ellipses(6, 0.8, false, count, size / 2);
			}
			if (thing.hasRelated && show.related_dots) {
				const x = (ux.inRadialMode ? 5.2 : 4.5) * (pointsNormal ? -1 : 1);
				svgPathFor_related = svgPaths.circle_atOffset(size, 3, Point.x(x));
			}
		}
	}

	function handle_up_long_hover(s_mouse) {
		if (!ux.isAny_rotation_active) {
			if (s_mouse.isHover) {
				isHovering = !s_mouse.isOut;
				update_colors();
			} else if (s_mouse.isLong) {
				ancestry?.becomeFocus();
			} else if (s_mouse.isUp && !!ancestry) {
				const shiftKey = s_mouse.event?.shiftKey ?? false
				e.handle_singleClick_onDragDot(shiftKey, ancestry);
			}
		}
	}

</script>

{#if s_drag}
	<Mouse_Responder
		center={center}
		width={capture_size}
		height={capture_size}
		name={s_component.id}
		detect_longClick={true}
		handle_s_mouse={handle_up_long_hover}>
		<button class={name}
			id={s_component.id}
			style='
				border:none;
				cursor:pointer;
				width:{size}px;
				height:{size}px;
				color:transparent;
				position:absolute;
				z-index:{T_Layer.dots};
				background-color:transparent;'>
			<div id={'div-for-' + name}
				style='
					top:0px;
					left:0px;
					width:{size}px;
					height:{size}px;
					color:transparent;
					position:absolute;
					z-index:{T_Layer.dots};'>
				<SVG_D3 name={'svg-' + name}
					width={size}
					height={size}
					fill={fill_color}
					stroke={svg_outline_color}
					svgPath={svgPathFor_dragDot}/>
				{#if svgPathFor_ellipses}
					<SVG_D3 name={'svg-ellipsis-' + name}
						width={size}
						height={size}
						fill={ellipsis_color}
						stroke={ellipsis_color}
						svgPath={svgPathFor_ellipses}/>
				{/if}
				{#if svgPathFor_related}
					<SVG_D3 name={'svg-related-' + name}
						width={size}
						height={size}
						stroke={color}
						fill={$w_background_color}
						svgPath={svgPathFor_related}/>
				{/if}
			</div>
		</button>
	</Mouse_Responder>
{/if}
