<script lang='ts'>
	import { g, k, u, Path, Rect, Size, Point, Thing, ZIndex, debug, signals } from '../../ts/common/GlobalImports';
	import { IDButton, onMount, debugReact, dbDispatch, Predicate } from '../../ts/common/GlobalImports';
	import { s_path_focus, s_graphRect, s_show_details, s_paths_grabbed } from '../../ts/common/State';
	import { s_id_popupView, s_path_clusterTools, s_user_graphOffset } from '../../ts/common/State';
	import { IDPersistant, IDSignal, persistLocal } from '../../ts/common/GlobalImports';
	import DotRevealFocus from '../kit/DotRevealFocus.svelte';
	import ToolsCluster from '../widget/ToolsCluster.svelte';
	import Widget from '../widget/Widget.svelte';
	import Circle from '../kit/Circle.svelte';
	import Children from './Children.svelte';
	import Box from '../kit/Box.svelte';
	let origin_ofFirstReveal = new Point();
	let origin_ofChildren = new Point();
	let childrenSize = new Point();
	let offsetX_ofFirstReveal = 0;
	let graphRect: Rect;
	let greenRect: Rect;
	let blueRect: Rect;
	let redRect: Rect;
	let toggle = true;
	let focus: Thing;
	let height = 0;
	let width = 0;
	let left = 0;
	let top = 0;

	function rebuild() { toggle = !toggle; }
	
	onMount( () => {
		const handler = signals.handle_relayoutWidgets((path) => {
			updateOrigins();
		});
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
		if (focus == null || focus.id != $s_path_focus) {
			const h = g.hierarchy;
			focus = !$s_path_focus ? g.root : h.thing_forPath($s_path_focus);
			offsetX_ofFirstReveal = g.titleIsAtTop ? 0 : focus?.titleWidth / 2;
			updateOrigins();
			rebuild();
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
		return new Rect(origin, $s_path_focus.visibleProgeny_size.expandedByX(3));
	}

	function updateOrigins() {
		if (focus && graphRect) {
			childrenSize = $s_path_focus.visibleProgeny_size;
			const offsetX = 15 + ($s_show_details ? -k.width_details : 0) - (childrenSize.width / 2) - (k.dot_size / 2.5) + offsetX_ofFirstReveal;
			const offsetY = -1 - graphRect.origin.y;
			origin_ofFirstReveal = graphRect.center.offsetBy(new Point(offsetX, offsetY));
			if (u.device_isMobile) {
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

{#if focus}
	{#key toggle}
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
			{#if !g.titleIsAtTop}
				<Widget path={$s_path_focus} origin={origin_ofFirstReveal.offsetBy(new Point(-23 - offsetX_ofFirstReveal, -9))}/>
			{:else}
				{#if $s_path_focus.isGrabbed}
					<Circle radius=10 center={origin_ofFirstReveal.offsetBy(new Point(-1, 1))} color={focus.color} thickness=1/>
				{/if}
				<DotRevealFocus path={$s_path_focus} center={origin_ofFirstReveal.offsetBy(new Point(-3, 0))}/>
			{/if}
			{#if $s_path_focus.isExpanded}
				<Children path={$s_path_focus} origin={origin_ofChildren}/>
			{/if}
		</div>
		<ToolsCluster/>
	{/key}
{/if}
