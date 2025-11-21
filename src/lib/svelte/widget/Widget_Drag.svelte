<script lang='ts'>
	import { e, k, s, u, x, show, debug, colors, signals, elements, controls } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Signal, T_Component } from '../../ts/common/Global_Imports';
	import { Point, S_Element, S_Component } from '../../ts/common/Global_Imports';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import { svgPaths } from '../../ts/common/Global_Imports';
	import SVG_D3 from '../draw/SVG_D3.svelte';
	import { onMount } from 'svelte';
	export let points_right = true;
	export let s_drag!: S_Element;
	const size = k.height.dot;
	const { w_s_hover } = s;
	const capture_size = size;
	const { w_thing_color } = colors;
    const ancestry = s_drag.ancestry;
	const g_widget = ancestry.g_widget;
	const { w_background_color } = colors;
	const { w_show_countDots_ofType } = show;
	const { w_items: w_grabbed } = x.si_grabs;
	const { w_ancestry_focus, w_ancestry_forDetails } = s;
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
		s_drag.isInverted = !!ancestry && ancestry.alteration_isAllowed;
		update_colors();
	});

	onMount(() => { return () => s_component.disconnect(); });

	function handle_context_menu(event) { u.consume_event(event); }		// no default context menu on right-click

	$: {
		const _ = $w_show_countDots_ofType;
		update_svgPaths();
	}

	$: {
		const _ = `${$w_thing_color}
			:::${$w_background_color}
			:::${$w_ancestry_focus?.id}
			:::${$w_ancestry_forDetails?.id}
			:::${$w_s_hover?.description ?? 'null'}
			:::${u.descriptionBy_titles($w_grabbed)}`;
		update_colors();
	}

	function update_hovering() {
		const isAncestry_presented = $w_ancestry_forDetails.equals(ancestry);
		s_drag.isHovering = isHovering != (ancestry.isGrabbed && !isAncestry_presented);
	}

	function update_svgPaths() {
		if (controls.inRadialMode) {
			svgPathFor_dragDot = svgPaths.circle_atOffset(size, size - 1);
		} else {
			svgPathFor_dragDot = svgPaths.oval(size, false);
		}
		update_svgPathsExtra();
	}

	function update_colors() {
		if (!elements.isAny_rotation_active && !!s_drag && !!thing) {
			const usePointer = (!ancestry.isGrabbed || controls.inRadialMode) && ancestry.hasChildren;
			const cursor = usePointer ? 'pointer' : 'normal';
			color = thing.color;
			s_drag.set_forHovering(color, cursor);
			svg_outline_color = s_drag.svg_outline_color;
			fill_color = debug.lines ? 'transparent' : s_drag.fill;
			ellipsis_color = s_drag.stroke;
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
				const x = (controls.inRadialMode ? 5.2 : 4.5) * (points_right ? -1 : 1);
				svgPathFor_related = svgPaths.circle_atOffset(size, 3, Point.x(x));
			}
		}
	}

	function handle_s_mouse(s_mouse) {
		if (!elements.isAny_rotation_active) {
			if (s_mouse.hover_didChange) {
				s_drag.isHovering = s_mouse.isHovering;
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
		handle_s_mouse={handle_s_mouse}>
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
