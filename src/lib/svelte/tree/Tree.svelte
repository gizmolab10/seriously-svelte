<script lang='ts'>
	import { g, k, u, Rect, Size, Point, Thing, ZIndex, debug, signals, Ancestry } from '../../ts/common/GlobalImports';
	import { s_id_popupView, s_ancestry_editingTools, s_user_graphOffset } from '../../ts/state/ReactiveState';
	import { IDButton, onMount, debugReact, dbDispatch, Predicate } from '../../ts/common/GlobalImports';
	import { s_ancestry_focus, s_graphRect, s_show_details } from '../../ts/state/ReactiveState';
	import { IDPersistant, IDSignal, persistLocal } from '../../ts/common/GlobalImports';
	import DotRevealFocus from '../buttons/DotRevealFocus.svelte';
	import EditingTools from '../widget/EditingTools.svelte';
	import TreeChildren from './TreeChildren.svelte';
	import Widget from '../widget/Widget.svelte';
	import { h } from '../../ts/db/DBDispatch';
	import Circle from '../kit/Circle.svelte';
	import Box from '../kit/Box.svelte';
	let origin_ofFirstReveal = Point.zero;
	let origin_ofChildren = Point.zero;
	let childrenSize = Point.zero;
	let offsetX_ofFirstReveal = 0;
	let graphRect: Rect;
	let greenRect: Rect;
	let blueRect: Rect;
	let redRect: Rect;
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
		if (graphRect != $s_graphRect) {
			graphRect = $s_graphRect;
			height = graphRect.size.height;
			width = graphRect.size.width;
			left = graphRect.origin.x;
			top = graphRect.origin.y;
			updateOrigins();
		}
		if (focus == null || focus.id != $s_ancestry_focus) {
			focus = !$s_ancestry_focus ? h.root : h.thing_forAncestry($s_ancestry_focus);
			offsetX_ofFirstReveal = k.show_titleAtTop ? 0 : 3 + focus?.titleWidth / 2;
			updateOrigins();
			rebuilds += 1;
		}
	}

	function rectTo_firstReveal(): Rect {
		const offset = new Point(101, 85);
		const extent = origin_ofFirstReveal.offsetBy(offset);
		return Rect.createExtentRect(graphRect.origin, extent);
	}

	function rectOfChildren(): Rect {
		const delta = new Point(9, -2);
		const origin = graphRect.origin.offsetBy(delta).offsetBy(origin_ofChildren);
		return new Rect(origin, $s_ancestry_focus.visibleProgeny_size.expandedByX(3));
	}

	function updateOrigins() {
		const focusAncestry = $s_ancestry_focus;
		if (focusAncestry && graphRect) {
			childrenSize = focusAncestry.visibleProgeny_size;
			const offsetX = 15 + ($s_show_details ? -k.width_details : 0) - (childrenSize.width / 2) - (k.dot_size / 2.5) + offsetX_ofFirstReveal;
			const offsetY = -1 - graphRect.origin.y;
			origin_ofFirstReveal = graphRect.center.offsetByXY(offsetX, offsetY);
			if (g.device_isMobile) {
				origin_ofFirstReveal.x = 25;
			}
			const toChildren = new Point(-41.2 + k.line_stretch - (k.dot_size / 2) + offsetX_ofFirstReveal, (k.dot_size / 2) -(childrenSize.height / 2) - 4);
			origin_ofChildren = origin_ofFirstReveal.offsetBy(toChildren);
			debugReact.log_origins(origin_ofChildren.x + ' updateOrigins');
			blueRect = graphRect.dividedInHalf;
			redRect = rectTo_firstReveal();
			greenRect = rectOfChildren();
		}
	}

</script>

{#if $s_ancestry_focus}
	{#key rebuilds}
		<div class='tree'
			style='transform: translate({$s_user_graphOffset.x}px, {$s_user_graphOffset.y}px);'
			on:keyup={u.ignore}
			on:keydown={u.ignore}
			on:keypress={u.ignore}
			on:click={() => { $s_id_popupView = null; }}>
			{#if debug.colors}
				<Box rect={redRect} color=red/>
				<Box rect={blueRect} color={k.color_default}/>
				<Box rect={greenRect} color=green half={true}/>
			{/if}
			{#if !k.show_titleAtTop}
				<Widget ancestry={$s_ancestry_focus} origin={origin_ofFirstReveal.offsetByXY(-23 - offsetX_ofFirstReveal, -9)}/>
			{:else}
				{#if $s_ancestry_focus.isGrabbed}
					<Circle radius=10 center={origin_ofFirstReveal.offsetByXY(-1, 1)} color={focus.color} thickness=1/>
				{/if}
				<DotRevealFocus ancestry={$s_ancestry_focus} center={origin_ofFirstReveal.offsetByXY(-3, 0)}/>
			{/if}
			{#if $s_ancestry_focus.isExpanded}
				<TreeChildren ancestry={$s_ancestry_focus} origin={origin_ofChildren}/>
			{/if}
		</div>
		<EditingTools/>
	{/key}
{/if}
