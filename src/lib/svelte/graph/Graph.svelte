<script lang='ts'>
	import { dbDispatch, PersistID, SignalKind, persistLocal, graphRect_update } from '../../ts/common/GlobalImports';
	import { s_line_stretch, s_showDetails, s_user_graphOffset, s_id_popupView } from '../../ts/managers/State';
	import { ignore, onMount, onDestroy, debugReact, Predicate, ButtonID } from '../../ts/common/GlobalImports';
	import { k, Path, Rect, Size, Point, Thing, ZIndex, debug, signals } from '../../ts/common/GlobalImports';
	import { s_title, s_path_here, s_graphRect, s_dot_size, s_paths_grabbed } from '../../ts/managers/State';
	import FocusRevealDot from './FocusRevealDot.svelte';
	import Circle from '../kit/Circle.svelte';
	import Children from './Children.svelte';
	import Box from '../kit/Box.svelte';
	let origin_ofFirstReveal = new Point();
	let origin_ofChildren = new Point();
	let childrenSize = new Point();
	let greenRect: Rect;
	let blueRect: Rect;
	let redRect: Rect;
	let toggle = true;
	let height = 0;
	let width = 0;
	let left = 0;
	let top = 0;
	let here;

	onDestroy( () => { relayout_signalHandler.disconnect(); });
	
	const relayout_signalHandler = signals.handle_relayout((path) => {
		if (here) {
			updateOrigins();
		}
	});

	function handleWheel(event){
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
		if ($s_title)		{ return; } // let Title component consume the events
		if (event.key == undefined)	{ alert('no key for ' + event.type); return; }
		if (event.type == 'keydown') {
			const key = event.key;
			switch (key) {
				case 'c': s_user_graphOffset_setTo(new Point()); break;
				case '?': $s_id_popupView = ButtonID.help; break;
				case ']':
				case '[': dbDispatch.nextDB(key == ']'); break;
				default:  await dbDispatch.db.hierarchy.handleKeyDown(event); break;
			}
		}
	}

	function s_user_graphOffset_setTo(origin: Point) {
		if ($s_user_graphOffset != origin) {
			persistLocal.writeToKey(PersistID.origin, origin);
			$s_user_graphOffset = origin;
			// debugReact.log_origins(`GRAPH $s_user_graphOffset ${here.description}`);
			updateOrigins();
			toggle = !toggle;	// rebuild entire graph
		}
	}
	
	$: {
		if ($s_graphRect) {
			height = $s_graphRect.size.height;
			width = $s_graphRect.size.width;
			left = $s_graphRect.origin.x;
			top = $s_graphRect.origin.y;
			updateOrigins();
		}
	}
	
	$: {
		if ($s_dot_size > 0) {
			// debugReact.log_origins(`GRAPH $s_dot_size ${here.description}`);
			updateOrigins();
		}
	}
	
	$: {
		if (here == null || here.id != $s_path_here) {
			const h = dbDispatch.db.hierarchy;
			here = !$s_path_here ? h.root : h.thing_getForPath($s_path_here);
			// debugReact.log_origins(`GRAPH $s_path_here ${here.description}`);
			updateOrigins();
			toggle = !toggle;	// also cause entire graph to be replaced
		}
	}

	function updateOrigins() {
		if (here) {
			childrenSize = $s_path_here.visibleProgeny_size.asPoint;
			const mysteryOffset = new Point(($s_showDetails ? -92 : 8) - (childrenSize.x / 2), -85);
			origin_ofFirstReveal = $s_graphRect.center.offsetBy(mysteryOffset);
			if (k.leftJustifyGraph) {
				origin_ofFirstReveal.x = 25;
			}
			const toChildren = new Point(-43 + $s_line_stretch - ($s_dot_size / 2), ($s_dot_size / 2) - (childrenSize.y / 2) - 5);
			origin_ofChildren = origin_ofFirstReveal.offsetBy(toChildren);
			blueRect = $s_graphRect.dividedInHalf;
			redRect = rectTo_firstReveal();
			greenRect = rectOfChildren();
		}
	}

	function rectTo_firstReveal(): Rect {
		const mysteryOffset = new Point(101, 85);
		const extent = origin_ofFirstReveal.offsetBy(mysteryOffset);
		return Rect.createExtentRect($s_graphRect.origin, extent);
	}

	function rectOfChildren(): Rect {
		const delta = new Point(9, -2);
		const origin = $s_graphRect.origin.offsetBy(delta).offsetBy(origin_ofChildren);
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
		<div class='graph' key={toggle}
			style='transform: translate({$s_user_graphOffset.x}px, {$s_user_graphOffset.y}px);'
			on:keyup={ignore}
			on:keydown={ignore}
			on:keypress={ignore}
			on:click={() => { $s_id_popupView = null; }}>
			{#if debug.colors}
				<Box rect={redRect} color=red/>
				<Box rect={blueRect} color=blue/>
				<Box rect={greenRect} color=green half={true}/>
			{/if}
			{#if $s_path_here.isGrabbed}
				<Circle radius={10} center={origin_ofFirstReveal} color={here.color} thickness=1/>
			{/if}
			<FocusRevealDot here={here} path={$s_path_here} center={origin_ofFirstReveal.offsetBy(new Point(-12, -11))}/>
			<Children thing={here} path={$s_path_here} origin={origin_ofChildren}/>
		</div>
	</div>
{/if}