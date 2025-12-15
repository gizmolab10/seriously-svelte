<script lang='ts'>
	import { e, k, s, u, x, hits, show, debug, colors, radial } from '../../ts/common/Global_Imports';
	import { T_Drag, T_Layer, T_Signal, T_Hit_Target } from '../../ts/common/Global_Imports';
	import { signals, elements, controls, svgPaths } from '../../ts/common/Global_Imports';
	import { Point, S_Element, S_Component } from '../../ts/common/Global_Imports';
	import { onMount, onDestroy } from 'svelte';
	import SVG_D3 from '../draw/SVG_D3.svelte';
	export let points_right = true;
	export let s_drag!: S_Element;
	const size = k.height.dot;
	const capture_size = size;
	const { w_count_mouse_up } = e;
	const { w_thing_color } = colors;
    const ancestry = s_drag.ancestry;
	const g_widget = ancestry.g_widget;
	const { w_background_color } = colors;
	const { w_s_hover, w_dragging } = hits;
	const { w_show_countDots_ofType } = show;
	const { w_items: w_grabbed } = x.si_grabs;
	const { w_ancestry_focus, w_ancestry_forDetails } = s;
	let mouse_up_count = $w_count_mouse_up;
	let fill_color = debug.lines ? 'transparent' : s_drag.fill;
	let svg_outline_color = s_drag.svg_outline_color;
	let element: HTMLElement | null = null;
	let center = g_widget.center_ofDrag;
	let parents_color = s_drag.stroke;
	let svgPathFor_ellipses = k.empty;
	let svgPathFor_related = k.empty;
	let svgPathFor_dragDot = k.empty;
	let s_component: S_Component;
    let thing = ancestry.thing;
	let color = thing?.color;
	let isHovering = false;

	update_svgPaths();
	update_colors();

	s_component = signals.handle_signals_atPriority([T_Signal.alteration], 0, ancestry, T_Hit_Target.drag, (t_signal, value): S_Component | null => {
		s_drag.isInverted = !!ancestry && ancestry.alteration_isAllowed;
		update_colors();
	});

	onMount(() => {
		if (!!element) {
			s_drag.set_html_element(element);
		}
		return () => s_component.disconnect();
	});

	onDestroy(() => {
		hits.delete_hit_target(s_drag);
	});

	$: {
		const _ = $w_show_countDots_ofType;
		update_svgPaths();
	}

	$: {
		const _ = `${$w_thing_color}
			:::${$w_background_color}
			:::${$w_ancestry_focus?.id}
			:::${$w_s_hover?.id ?? 'null'}
			:::${$w_ancestry_forDetails?.id}
			:::${u.descriptionBy_titles($w_grabbed)}`;
		update_colors();
	}

	$: if (mouse_up_count != $w_count_mouse_up) {
		mouse_up_count = $w_count_mouse_up;
		if ($w_s_hover?.id === s_drag.id && !!ancestry && !radial.isDragging && (!$w_dragging || $w_dragging === T_Drag.none)) {
			e.handle_singleClick_onDragDot(false, ancestry);
		}
	}

	$: wrapper_style = `
		position: absolute;
		width: ${capture_size}px;
		height: ${capture_size}px;
		cursor: pointer;
		left: ${center.x - capture_size / 2}px;
		top: ${center.y - capture_size / 2}px;
	`.removeWhiteSpace();

	function update_hovering() {
		const isAncestry_presented = $w_ancestry_forDetails.equals(ancestry);
		s_drag.isHovering = isHovering != (ancestry.isGrabbed && !isAncestry_presented);
	}

	function update_svgPaths() {
		svgPathFor_dragDot = svgPaths.oval(size, false);
		update_svgPathsExtra();
	}

	function update_colors() {
		if (!elements.isDragging && !!s_drag && !!thing) {
			const usePointer = (!ancestry.isGrabbed || controls.inRadialMode) && ancestry.hasChildren;
			const cursor = usePointer ? 'pointer' : 'normal';
			color = thing.color;
			s_drag.set_forHovering(color, cursor);
			svg_outline_color = s_drag.svg_outline_color;
			fill_color = debug.lines ? 'transparent' : s_drag.fill;
			parents_color = s_drag.stroke;
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

</script>

{#if s_drag}
	<div class='drag-responder'
		style={wrapper_style}
		bind:this={element}>
		<button class={name}
			id={s_component.id}
			style='
				border:none;
				cursor:pointer;
				width:{size}px;
				height:{size}px;
				color:transparent;
				position:absolute;
				z-index:{T_Layer.dot};
				background-color:transparent;'>
			<div id={'div-for-' + name}
				style='
					left:0px;
					top:0.3px;
					width:{size}px;
					height:{size}px;
					color:transparent;
					position:absolute;
					z-index:{T_Layer.dot};'>
				<SVG_D3 name={'svg-' + name}
					width={size}
					height={size}
					fill={fill_color}
					stroke={svg_outline_color}
					svgPath={svgPathFor_dragDot}/>
				{#if svgPathFor_ellipses}
					<SVG_D3 name={'svg-parents-' + name}
						width={size}
						height={size}
						fill={parents_color}
						stroke={parents_color}
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
	</div>
{/if}
