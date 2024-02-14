<script lang='ts'>
	import { s_title_editing, s_path_here, s_graphRect, s_dot_size, s_showDetails, s_title_atTop, s_paths_grabbed } from '../../ts/managers/State';
	import { s_id_popupView, s_line_stretch, s_path_toolsCluster, s_user_graphOffset } from '../../ts/managers/State';
	import { dbDispatch, PersistID, IDSignal, persistLocal, graphRect_update } from '../../ts/common/GlobalImports';
	import { k, u, Path, Rect, Size, Point, Thing, ZIndex, debug, signals } from '../../ts/common/GlobalImports';
	import { onMount, onDestroy, debugReact, Predicate, IDButton } from '../../ts/common/GlobalImports';
	import ToolsCluster from '../widget/ToolsCluster.svelte';
	import FocusRevealDot from './FocusRevealDot.svelte';
	import Widget from '../widget/Widget.svelte';
	import Circle from '../kit/Circle.svelte';
	import Children from './Children.svelte';
	import Box from '../kit/Box.svelte';
	let origin_ofFirstReveal = new Point();
	let origin_ofChildren = new Point();
	let childrenSize = new Point();
	let focusOffsetX = 0;
	let graphRect: Rect;
	let greenRect: Rect;
	let blueRect: Rect;
	let redRect: Rect;
	let toggle = true;
	let height = 0;
	let width = 0;
	let left = 0;
	let top = 0;
	let here;

	// onMount(() => { ;})
	onDestroy( () => { relayout_signalHandler.disconnect(); });
	
	const relayout_signalHandler = signals.handle_relayout((path) => {
		if (here) {
			updateOrigins();
		}
	});

	function handleWheel(event) {
		const canScroll = k.allowHorizontalScrolling;
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
				default:  await k.hierarchy.handleKeyDown(event); break;
			}
		}
	}

	function s_user_graphOffset_setTo(origin: Point) {
		if ($s_user_graphOffset != origin) {
			persistLocal.writeToKey(PersistID.origin, origin);
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
		if ($s_dot_size > 0) {
			updateOrigins();
		}
	}
	
	$: {
		if (here == null || here.id != $s_path_here) {
			const h = k.hierarchy;
			here = !$s_path_here ? h.root : h.thing_getForPath($s_path_here);
			focusOffsetX = $s_title_atTop ? 0 : here?.titleWidth / 2
			console.log(`GRAPH s_path_here ${here.title}`)
			updateOrigins();
			toggle = !toggle;	// also cause entire graph to be replaced
		}
	}

	function updateOrigins() {
		if (here) {
			childrenSize = $s_path_here.visibleProgeny_size.asPoint;
			const mysteryX = ($s_showDetails ? -92 : 8) - (childrenSize.x / 2) - focusOffsetX;
			const mysteryY = -k.bandHeightAtTop - ($s_title_atTop ? k.titleHeightAtTop : 0);
			const mysteryOffset = new Point(mysteryX, mysteryY);
			origin_ofFirstReveal = graphRect.center.offsetBy(mysteryOffset);
			if (k.leftJustifyGraph) {
				origin_ofFirstReveal.x = 25;
			}
			const toChildren = new Point(-43 + $s_line_stretch - ($s_dot_size / 2) + focusOffsetX, ($s_dot_size / 2) - (childrenSize.y / 2) - 5);
			origin_ofChildren = origin_ofFirstReveal.offsetBy(toChildren);
			blueRect = graphRect.dividedInHalf;
			redRect = rectTo_firstReveal();
			greenRect = rectOfChildren();
		}
	}

	function rectTo_firstReveal(): Rect {
		const mysteryOffset = new Point(101, 85);
		const extent = origin_ofFirstReveal.offsetBy(mysteryOffset);
		return Rect.createExtentRect(graphRect.origin, extent);
	}

	function rectOfChildren(): Rect {
		const delta = new Point(9, -2);
		const origin = graphRect.origin.offsetBy(delta).offsetBy(origin_ofChildren);
		return new Rect(origin, $s_path_here.visibleProgeny_size.expandedByX(3));
	}

</script>

<svelte:document on:keydown={globalHandleKeyDown}/>
{#if here}
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
				{#if $s_title_atTop}
					{#if $s_path_here.isGrabbed}
						<Circle radius=10 center={origin_ofFirstReveal} color={here.color} thickness=1/>
					{/if}
					<FocusRevealDot here={here} path={$s_path_here} center={origin_ofFirstReveal.offsetBy(new Point(-12, -11))}/>
				{:else}
					<Widget thing={here} path={$s_path_here} origin={origin_ofFirstReveal.offsetBy(new Point(-19 - focusOffsetX, -9))}/>
				{/if}
				<Children path={$s_path_here} origin={origin_ofChildren}/>
			</div>
			<ToolsCluster/>
		{/key}
	</div>
{/if}
