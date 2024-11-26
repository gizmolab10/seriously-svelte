<script lang='ts'>
	import { s_graphRect, s_hierarchy, s_show_details, s_device_isMobile,  } from '../../ts/state/Svelte_Stores';
	import { g, k, u, ux, show, Rect, Size, Point, Thing, ZIndex, debug } from '../../ts/common/Global_Imports';
	import { signals, IDSignal, IDControl, Ancestry, dbDispatch } from '../../ts/common/Global_Imports';
	import { s_id_popupView, s_focus_ancestry, s_user_graph_offset } from '../../ts/state/Svelte_Stores';
	import { Predicate, IDPersistent, ElementType, persistLocal } from '../../ts/common/Global_Imports';
	import Tree_Children from './Tree_Children.svelte';
	import Widget from '../widget/Widget.svelte';
	import Circle from '../kit/Circle.svelte';
	import { onMount } from 'svelte';
	const revealState = ux.element_state_for($s_focus_ancestry, ElementType.reveal, 'tree');
	const focusState = ux.element_state_for($s_focus_ancestry, ElementType.focus, 'tree');
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
		if (!focus || focus.id != $s_focus_ancestry) {
			focus = !$s_focus_ancestry ? $s_hierarchy.root : $s_hierarchy.thing_forAncestry($s_focus_ancestry);
			offsetX_ofFirstReveal = 3 + focus?.titleWidth / 2;
			updateOrigins();
			rebuilds += 1;
		}
	}

	function rectOfChildren(): Rect {
		const delta = new Point(9, -2);
		const origin = graphRect.origin.offsetBy(delta).offsetBy(origin_ofChildren);
		return new Rect(origin, $s_focus_ancestry.visibleProgeny_size.expandedByX(3));
	}

	function updateOrigins() {
		const focusAncestry = $s_focus_ancestry;
		if (!!focusAncestry && !!graphRect) {
			childrenSize = focusAncestry.visibleProgeny_size;
			const offsetX = 15 + ($s_show_details ? -k.width_details : 0) - (childrenSize.width / 2) - (k.dot_size / 2.5) + offsetX_ofFirstReveal;
			const offsetY = -1 - graphRect.origin.y;
			origin_ofFirstReveal = graphRect.center.offsetByXY(offsetX, offsetY);
			if ($s_device_isMobile) {
				origin_ofFirstReveal.x = 25;
			}
			const toChildren = new Point(-42.2 + k.line_stretch - (k.dot_size / 2) + offsetX_ofFirstReveal, (k.dot_size / 2) -(childrenSize.height / 2) - 4.5);
			origin_ofChildren = origin_ofFirstReveal.offsetBy(toChildren);
			debug.log_origins(origin_ofChildren.x + ' updateOrigins');
		}
	}

</script>

{#if $s_focus_ancestry}
	{#key rebuilds}
		<div class='tree'
			style='transform:translate({$s_user_graph_offset.x}px, {$s_user_graph_offset.y}px);'>
			<Widget name={focusState.name} ancestry={focusState.ancestry} origin={origin_ofFirstReveal.offsetByXY(-21.5 - offsetX_ofFirstReveal, -5)}/>
			{#if $s_focus_ancestry.isExpanded}
				<Tree_Children ancestry={focusState.ancestry} origin={origin_ofChildren}/>
			{/if}
		</div>
	{/key}
{/if}
