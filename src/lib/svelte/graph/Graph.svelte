<script lang='ts'>
	import { path_here, graphRect, dot_size, path_editing, paths_grabbed, line_stretch, showDetails, user_graphOffset, id_popupView } from '../../ts/managers/State';
	import { k, Rect, Size, Point, Thing, ZIndex, debug, signals, onMount, onDestroy, debugReact, graphEditor } from '../../ts/common/GlobalImports';
	import { Predicate, ButtonID, dbDispatch, PersistID, SignalKind, persistLocal, graphRect_update } from '../../ts/common/GlobalImports';
	import FocusRevealDot from './FocusRevealDot.svelte';
	import Circle from '../kit/Circle.svelte';
	import Children from './Children.svelte';
	import Box from '../kit/Box.svelte';
	let origin_ofFirstReveal = new Point();
	let origin_ofChildren = new Point();
	let childrenSize = new Point();
	let isGrabbed = false;
	let greenRect: Rect;
	let blueRect: Rect;
	let redRect: Rect;
	let toggle = true;
	let height = 0;
	let width = 0;
	let left = 0;
	let top = 0;
	let here;

	function ignore(event) {}
	onMount( () => { debugReact.log_mount(`GRAPH ${here.description}`); });
	onDestroy( () => { rebuild_signalHandler.disconnect(); relayout_signalHandler.disconnect(); });
	
	const rebuild_signalHandler = signals.handle_rebuild((id) => {
		debugReact.log_layout(`GRAPH signal ${here.description}`);
		updateOrigins();
		toggle = !toggle;	// rebuild entire graph
	});

	const relayout_signalHandler = signals.handle_relayout((id) => {
		if (here) {
			updateOrigins();
		}
	});

	function handleWheel(event){
		const canScroll = k.allowHorizontalScrolling;
		const offsetX = canScroll ? -event.deltaX : 0;
		const offsetY = -event.deltaY;
		if (Math.abs(offsetX) > 1 || Math.abs(offsetY) > 1) {
			const offset = $user_graphOffset;
			const newOffset = new Point(offset.x + offsetX, offset.y + offsetY);
			user_graphOffset_setTo(newOffset);
		}
	};

	async function globalHandleKeyDown(event) {
		if ($path_editing)			{ return; } // let Title component consume the events
		if (event.key == undefined)	{ alert('no key for ' + event.type); return; }
		if (event.type == 'keydown') {
			const key = event.key;
			switch (key) {
				case 'c': user_graphOffset_setTo(new Point()); break;
				case '?': $id_popupView = ButtonID.help; break;
				case ']':
				case '[': dbDispatch.nextDB(key == ']'); break;
				default:  await graphEditor.handleKeyDown(event); break; // editor-specific key values
			}
		}
	}

	function user_graphOffset_setTo(origin: Point) {
		if ($user_graphOffset != origin) {
			persistLocal.writeToKey(PersistID.origin, origin);
			$user_graphOffset = origin;
			debugReact.log_origins(`GRAPH $user_graphOffset ${here.description}`);
			updateOrigins();
			toggle = !toggle;	// rebuild entire graph
		}
	}
	
	$: {
		if ($graphRect) {
			height = $graphRect.size.height;
			width = $graphRect.size.width;
			left = $graphRect.origin.x;
			top = $graphRect.origin.y;
			updateOrigins();
		}
	}
	
	$: {
		if ($dot_size > 0) {
			debugReact.log_origins(`GRAPH $dot_size ${here.description}`);
			updateOrigins();
		}
	}
	
	$: {
		if (here == null || here.id != $path_here) {
			const h = dbDispatch.db.hierarchy;
			here = !$path_here ? h.root : h.thing_getForPath($path_here);
			debugReact.log_origins(`GRAPH $path_here ${here.description}`);
			updateOrigins();
			toggle = !toggle;	// also cause entire graph to be replaced
		}
	}
	
	$: {
		if (here) { // can sometimes be null TODO: WHY?
			let grabbed = $paths_grabbed.filter(p => p.endsWithID(here.id)).length > 0;
			if (grabbed != isGrabbed) {
				isGrabbed = grabbed;
			}
		}
	}

	function updateOrigins() {
		if (here) {
			childrenSize = here.visibleProgeny_size.asPoint;
			const mysteryOffset = new Point(($showDetails ? -92 : 8) - (childrenSize.x / 2), -85);
			origin_ofFirstReveal = $graphRect.center.offsetBy(mysteryOffset);
			if (k.leftJustifyGraph) {
				origin_ofFirstReveal.x = 25;
			}
			const toChildren = new Point(-43 + $line_stretch - ($dot_size / 2), ($dot_size / 2) - (childrenSize.y / 2) - 5);
			origin_ofChildren = origin_ofFirstReveal.offsetBy(toChildren);
			blueRect = $graphRect.dividedInHalf;
			redRect = rectTo_firstReveal();
			greenRect = rectOfChildren();
		}
	}

	function rectTo_firstReveal(): Rect {
		const mysteryOffset = new Point(101, 85);
		const extent = origin_ofFirstReveal.offsetBy(mysteryOffset);
		return Rect.createExtentRect($graphRect.origin, extent);
	}

	function rectOfChildren(): Rect {
		const delta = new Point(9, -2);
		const origin = $graphRect.origin.offsetBy(delta).offsetBy(origin_ofChildren);
		return new Rect(origin, here.visibleProgeny_size.expandedByX(3));
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
			style='transform: translate({$user_graphOffset.x}px, {$user_graphOffset.y}px);'
			on:keyup={ignore}
			on:keydown={ignore}
			on:keypress={ignore}
			on:click={() => { $id_popupView = null; }}>
			{#if debug.colors}
				<Box rect={redRect} color=red/>
				<Box rect={blueRect} color=blue/>
				<Box rect={greenRect} color=green half={true}/>
			{/if}
			{#if isGrabbed}
				<Circle radius={10} center={origin_ofFirstReveal} color={here.color} thickness=1/>
			{/if}
			<FocusRevealDot here={here} path={$path_here} center={origin_ofFirstReveal.offsetBy(new Point(-12, -11))}/>
			<Children thing={here} path={$path_here} origin={origin_ofChildren}/>
		</div>
	</div>
{/if}