<script lang='ts'>
	import { g, k, u, ux, show, Rect, Size, Point, Thing, debug, signals } from '../../ts/common/Global_Imports';
	import { T_Line, T_Layer, T_Signal, G_Widget, T_Control, T_Element } from '../../ts/common/Global_Imports';
	import { w_graph_rect, w_hierarchy, w_show_details, w_ancestry_focus } from '../../ts/state/S_Stores';
	import { w_id_popupView, w_device_isMobile, w_user_graph_offset } from '../../ts/state/S_Stores';
	import { Predicate, Ancestry, databases } from '../../ts/common/Global_Imports';
	import Tree_Children from './Tree_Children.svelte';
	import Widget from '../widget/Widget.svelte';
	import Circle from '../kit/Circle.svelte';
	import { onMount } from 'svelte';
	const s_reveal = ux.s_element_for($w_ancestry_focus, T_Element.reveal, 'tree');
	const s_focus = ux.s_element_for($w_ancestry_focus, T_Element.focus, 'tree');
	let origin_ofFirstReveal = Point.zero;
	let origin_ofChildren = Point.zero;
	let origin_ofWidget = Point.zero;
	let childrenSize = Point.zero;
	let offsetX_ofFirstReveal = 0;
	let g_widget!: G_Widget;
	let graphRect: Rect;
	let rebuilds = 0;
	let height = 0;
	let width = 0;
	let left = 0;
	let top = 0;
	
	onMount(() => {
		const handler = signals.handle_relayoutAndRecreate_widgets(0, (ancestry) => {
			if (!ancestry || (!!$w_ancestry_focus && $w_ancestry_focus == ancestry)) {
				updateOrigins();
			}
		});
		return () => { handler.disconnect() };
	});

	$: {
		const _ = $w_device_isMobile;
		updateOrigins();
		rebuilds += 1;
	}
	
	$: {
		const focus = !!$w_ancestry_focus ? $w_ancestry_focus.thing : $w_hierarchy.root;
		offsetX_ofFirstReveal = focus?.titleWidth / 2 - 2;
		updateOrigins();
		rebuilds += 1;
	}
	
	$: {
		if (graphRect != $w_graph_rect) {
			graphRect = $w_graph_rect;
			height = graphRect.size.height;
			width = graphRect.size.width;
			left = graphRect.origin.x;
			top = graphRect.origin.y;
			updateOrigins();
		}
	}

	function rectOfChildren(): Rect {
		const delta = new Point(9, -2);
		const origin = graphRect.origin.offsetBy(delta).offsetBy(origin_ofChildren);
		return new Rect(origin, $w_ancestry_focus.visibleProgeny_size.expandedByX(3));
	}

	function updateOrigins() {
		const focusAncestry = $w_ancestry_focus;
		if (!!focusAncestry && !!graphRect) {
			childrenSize = focusAncestry.visibleProgeny_size;
			const offsetY = -1 - graphRect.origin.y;
			const child_offsetY = (k.dot_size / 2) -(childrenSize.height / 2) - 4;
			const child_offsetX = -37 + k.line_stretch - (k.dot_size / 2) + offsetX_ofFirstReveal;
			const offsetX = 15 + ($w_show_details ? -k.width_details : 0) - (childrenSize.width / 2) - (k.dot_size / 2.5) + offsetX_ofFirstReveal;
			origin_ofFirstReveal = graphRect.center.offsetByXY(offsetX, offsetY);
			if ($w_device_isMobile) {
				origin_ofFirstReveal.x = 25;
			}
			origin_ofChildren = origin_ofFirstReveal.offsetByXY(child_offsetX, child_offsetY);
			origin_ofWidget = origin_ofFirstReveal.offsetByXY(-21.5 - offsetX_ofFirstReveal, -5);
			g_widget = new G_Widget(T_Line.flat, Rect.zero, origin_ofChildren, focusAncestry, null);
			debug.log_origins(origin_ofChildren.x + ' updateOrigins');
		}
	}

</script>

{#if $w_ancestry_focus}
	{#key rebuilds}
		<div class = 'tree'
			style = 'transform:translate({$w_user_graph_offset.x}px, {$w_user_graph_offset.y}px);'>
			<Widget
				origin = {origin_ofWidget}
				width = {g_widget.widget_width}
				name = {g_widget.es_widget.name}
				ancestry = {g_widget.widget_ancestry}/>
			{#if $w_ancestry_focus.isExpanded}
				<Tree_Children
					origin = {origin_ofChildren}
					ancestry = {$w_ancestry_focus}/>
			{/if}
		</div>
	{/key}
{/if}
