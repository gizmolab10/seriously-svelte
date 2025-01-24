<script lang='ts'>
	import { s_graphRect, s_hierarchy, s_details_show, s_device_isMobile,  } from '../../ts/state/S_Stores';
	import { g, k, u, ux, show, Rect, Size, Point, Thing, T_Layer, debug } from '../../ts/common/Global_Imports';
	import { s_id_popupView, s_ancestry_focus, s_user_graph_offset } from '../../ts/state/S_Stores';
	import { signals, T_Signal, T_Control, Ancestry, databases } from '../../ts/common/Global_Imports';
	import { Predicate, T_Element, preferences } from '../../ts/common/Global_Imports';
	import Tree_Children from './Tree_Children.svelte';
	import Widget from '../widget/Widget.svelte';
	import Circle from '../kit/Circle.svelte';
	import { onMount } from 'svelte';
	const revealState = ux.element_state_for($s_ancestry_focus, T_Element.reveal, 'tree');
	const focusState = ux.element_state_for($s_ancestry_focus, T_Element.focus, 'tree');
	let origin_ofFirstReveal = Point.zero;
	let origin_ofChildren = Point.zero;
	let childrenSize = Point.zero;
	let offsetX_ofFirstReveal = 0;
	let graphRect: Rect;
	let rebuilds = 0;
	let height = 0;
	let width = 0;
	let left = 0;
	let top = 0;
	
	onMount(() => {
		const handler = signals.handle_relayoutWidgets(0, (ancestry) => { updateOrigins(); });
		return () => { handler.disconnect() };
	});

	$: {
		const _ = $s_device_isMobile;
		updateOrigins();
		rebuilds += 1;
	}
	
	$: {
		if (graphRect != $s_graphRect) {
			graphRect = $s_graphRect;
			height = graphRect.size.height;
			width = graphRect.size.width;
			left = graphRect.origin.x;
			top = graphRect.origin.y;
			updateOrigins();
		}
	}
	
	$: {
		const focus = !!$s_ancestry_focus ? $s_ancestry_focus.thing : $s_hierarchy.root;
		offsetX_ofFirstReveal = 3 + focus?.titleWidth / 2;
		updateOrigins();
		rebuilds += 1;
	}

	function rectOfChildren(): Rect {
		const delta = new Point(9, -2);
		const origin = graphRect.origin.offsetBy(delta).offsetBy(origin_ofChildren);
		return new Rect(origin, $s_ancestry_focus.visibleProgeny_size.expandedByX(3));
	}

	function updateOrigins() {
		const focusAncestry = $s_ancestry_focus;
		if (!!focusAncestry && !!graphRect) {
			childrenSize = focusAncestry.visibleProgeny_size;
			const offsetX = 15 + ($s_details_show ? -k.width_details : 0) - (childrenSize.width / 2) - (k.dot_size / 2.5) + offsetX_ofFirstReveal;
			const offsetY = -1 - graphRect.origin.y;
			origin_ofFirstReveal = graphRect.center.offsetByXY(offsetX, offsetY);
			if ($s_device_isMobile) {
				origin_ofFirstReveal.x = 25;
			}
			const toChildren = new Point(-42.2 + k.line_stretch - (k.dot_size / 2) + offsetX_ofFirstReveal, (k.dot_size / 2) -(childrenSize.height / 2) - 4);
			origin_ofChildren = origin_ofFirstReveal.offsetBy(toChildren);
			debug.log_origins(origin_ofChildren.x + ' updateOrigins');
		}
	}

</script>

{#if $s_ancestry_focus}
	{#key rebuilds}
		<div class='tree'
			style='transform:translate({$s_user_graph_offset.x}px, {$s_user_graph_offset.y}px);'>
			<Widget name={focusState.name} ancestry={$s_ancestry_focus} origin={origin_ofFirstReveal.offsetByXY(-21.5 - offsetX_ofFirstReveal, -5)}/>
			{#if $s_ancestry_focus.isExpanded}
				<Tree_Children ancestry={$s_ancestry_focus} origin={origin_ofChildren}/>
			{/if}
		</div>
	{/key}
{/if}
