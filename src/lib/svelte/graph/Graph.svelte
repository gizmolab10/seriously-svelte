<script lang='ts'>
	import { s_title_editing, s_path_here, s_graphRect, s_show_details, s_paths_grabbed } from '../../ts/common/State';
	import { g, k, u, Path, Rect, Size, Point, Thing, ZIndex, debug, signals } from '../../ts/common/GlobalImports';
	import { IDButton, onDestroy, debugReact, dbDispatch, Predicate } from '../../ts/common/GlobalImports';
	import { s_id_popupView, s_path_toolsCluster, s_user_graphOffset } from '../../ts/common/State';
	import { IDPersistant, IDSignal, persistLocal } from '../../ts/common/GlobalImports';
	import FocusRevealDot from '../kit/FocusRevealDot.svelte';
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
	let height = 0;
	let width = 0;
	let left = 0;
	let top = 0;

	onDestroy(() => { relayout_signalHandler.disconnect(); });
	
	const relayout_signalHandler = signals.handle_relayoutWidgets((path) => {
		updateOrigins();
	});

	function handleWheel(event) {
		const canScroll = k.allow_HorizontalScrolling;
		const offsetX = canScroll ? -event.deltaX : 0;
		const offsetY = -event.deltaY;
		if (Math.abs(offsetX) > 1 || Math.abs(offsetY) > 1) {
			const offset = $s_user_graphOffset;
			const newOffset = new Point(offset.x + offsetX, offset.y + offsetY);
			s_user_graphOffset_setTo(newOffset);
		}
	};

	async function globalHandleKeyDown(event) {
		if ($s_title_editing)		{ return; } // let Title component consume the events
		if (event.key == undefined)	{ alert('no key for ' + event.type); return; }
		if (event.type == 'keydown') {
			const key = event.key;
			switch (key) {
				case 'c': s_user_graphOffset_setTo(new Point()); break;
				case '?': $s_id_popupView = IDButton.help; break;
				case ']':
				case '[': dbDispatch.nextDB(key == ']'); break;
				default:  await g.hierarchy.handleKeyDown(event); break;
			}
		}
	}

	function s_user_graphOffset_setTo(origin: Point) {
		if ($s_user_graphOffset != origin) {
			persistLocal.key_write(IDPersistant.origin, origin);
			$s_user_graphOffset = origin;
			updateOrigins();
			toggle = !toggle;	// rebuild entire graph
		}
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
		if (g.here == null || g.here.id != $s_path_here) {
			const h = g.hierarchy;
			g.here = !$s_path_here ? g.root : h.thing_getForPath($s_path_here);
			offsetX_ofFirstReveal = g.titleIsAtTop ? 0 : g.here?.titleWidth / 2;
			updateOrigins();
			toggle = !toggle;	// also cause entire graph to be replaced
		}
	}

	function updateOrigins() {
		if (g.here) {
			childrenSize = $s_path_here.visibleProgeny_size;
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

	function rectTo_firstReveal(): Rect {
		const offset = new Point(101, 85);
		const extent = origin_ofFirstReveal.offsetBy(offset);
		return Rect.createExtentRect(graphRect.origin, extent);
	}

	function rectOfChildren(): Rect {
		const delta = new Point(9, -2);
		const origin = graphRect.origin.offsetBy(delta).offsetBy(origin_ofChildren);
		return new Rect(origin, $s_path_here.visibleProgeny_size.expandedByX(3));
	}

</script>

<svelte:document on:keydown={globalHandleKeyDown}/>
{#if g.here}
	<div class='clipper' on:wheel={handleWheel}
		style='
			top:{top}px;
			left: {left}px;
			position: fixed;
			overflow: hidden;
			width: {width}px;
			height: {height}px;
			z-index: {ZIndex.panel};'>
		{#key toggle}
			<div class='graph'
				style='transform: translate({$s_user_graphOffset.x}px, {$s_user_graphOffset.y}px);'
				on:keyup={u.ignore}
				on:keydown={u.ignore}
				on:keypress={u.ignore}
				on:click={() => { $s_id_popupView = null; }}>
				{#if debug.colors}
					<Box rect={redRect} color=red/>
					<Box rect={blueRect} color=blue/>
					<Box rect={greenRect} color=green half={true}/>
				{/if}
				{#if !g.titleIsAtTop}
					<Widget thing={g.here} path={$s_path_here} origin={origin_ofFirstReveal.offsetBy(new Point(-23 - offsetX_ofFirstReveal, -9))}/>
				{:else}
					{#if $s_path_here.isGrabbed}
						<Circle radius=10 center={origin_ofFirstReveal.offsetBy(new Point(-1, 1))} color={g.here.color} thickness=1/>
					{/if}
					<FocusRevealDot here={g.here} path={$s_path_here} center={origin_ofFirstReveal.offsetBy(new Point(-3, 0))}/>
				{/if}
				{#if $s_path_here.isExpanded}
					<Children path={$s_path_here} origin={origin_ofChildren}/>
				{/if}
			</div>
			<ToolsCluster/>
		{/key}
	</div>
{/if}
