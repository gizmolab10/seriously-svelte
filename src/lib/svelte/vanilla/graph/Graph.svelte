<script lang='ts'>
	import { k, Rect, Size, Point, Thing, ZIndex, Signals, onDestroy, graphEditor, PersistID, persistLocal, updateGraphRect } from '../../../ts/common/GlobalImports';
	import { id_here, graphRect, dot_size, id_editing, ids_grabbed, line_stretch, user_graphOffset, id_popupView } from '../../../ts/managers/State';
	import { debug, DebugOption, Predicate, ButtonID, dbDispatch, handleSignalOfKind } from '../../../ts/common/GlobalImports';
	import FocusRevealDot from './FocusRevealDot.svelte';
	import Circle from '../../kit/Circle.svelte';
	import Children from './Children.svelte';
	import Box from '../../kit/Box.svelte';
	let origin_ofFirstReveal = new Point();
	let origin_ofChildren = new Point();
	let childrenSize = new Point();
	let size_graphRect = Size;
	let isGrabbed = false;
	let greenRect: Rect;
	let blueRect: Rect;
	let redRect: Rect;
	let here;

	onDestroy( () => { signalHandler.disconnect(); });
	function ignore(event) {}

	const signalHandler = handleSignalOfKind(Signals.childrenOf, (idThing) => {
		if (here && (idThing == null || idThing == here.id)) {
			updateOrigins();
		}
	});

	window.addEventListener('wheel', (event: WheelEvent) => {
		const canScroll = k.allowHorizontalScrolling;
		const offsetX = canScroll ? -event.deltaX : 0;
		const offsetY = -event.deltaY;
		if (Math.abs(offsetX) > 1 || Math.abs(offsetY) > 1) {
			const offset = $user_graphOffset;
			const newOffset = new Point(offset.x + offsetX, offset.y + offsetY);
			user_graphOffset_setTo(newOffset);
		}
	});

	async function globalHandleKeyDown(event) {
		if ($id_editing)			{ return; } // let Title component consume the events
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
		persistLocal.writeToKey(PersistID.origin, origin);
		$user_graphOffset = origin;
		updateOrigins();
	}
	
	$: {
		if ($dot_size > 0) {
			updateOrigins();
		}
	}
	
	$: {
		if (here == null || here.id != $id_here) {			
			here = dbDispatch.db.hierarchy.thing_getForID($id_here);
			updateOrigins();
		}
		if (here) { // can sometimes be null TODO: WHY?
			let grabbed = $ids_grabbed.includes(here.id);
			if (grabbed != isGrabbed) {
				isGrabbed = grabbed;
			}
		}
	}

	function updateOrigins() {
		if (here) {
			debug.log_react(`GRAPH updateOrigins ${here.description}`);
			updateGraphRect();
			const userCenter = $graphRect.center.offsetBy($user_graphOffset);
			childrenSize = here.visibleProgeny_size.asPoint;
			const mysteryOffset = new Point(-childrenSize.x - 2, -(childrenSize.y / 2) - 31);
			origin_ofFirstReveal = userCenter.offsetBy(mysteryOffset);
			if (k.leftJustifyGraph) {
				origin_ofFirstReveal.x = 25;
			}
			const toChildren = new Point(-36 + $line_stretch - ($dot_size / 2), 1 + ($dot_size / 2) - (childrenSize.y / 2));
			origin_ofChildren = origin_ofFirstReveal.offsetBy(toChildren);
			blueRect = $graphRect.dividedInHalf;
			redRect = rectTo_firstReveal();
			greenRect = rectOfChildren();
		}
	}

	function rectTo_firstReveal(): Rect {
		const mysteryOffset = new Point(108, 92);
		const extent = origin_ofFirstReveal.offsetBy(mysteryOffset);
		return Rect.createExtentRect($graphRect.origin, extent);
	}

	function rectOfChildren(): Rect {
		const delta = new Point(9, -2);
		const origin = $graphRect.origin.offsetBy(delta).offsetBy(origin_ofChildren);
		return new Rect(origin, here.visibleProgeny_size.expandedByX(4));
	}

</script>

<svelte:document on:keydown={globalHandleKeyDown}/>
{#if here}
	<div class='graph'
		style='
			position: fixed;
			overflow: hidden;
			z-index: {ZIndex.panel};
			top:{$graphRect.origin.y}px;
			left: {$graphRect.origin.x}px;
			width: {$graphRect.size.width}px;
			height: {$graphRect.size.height}px;'
		on:keyup={ignore}
		on:keydown={ignore}
		on:keypress={ignore}
		on:click={() => { $id_popupView = null; }}>
		<Children thing={here} origin={origin_ofChildren}/>
		{#if debug.colors}
			<Box rect={redRect} color=red/>
			<Box rect={blueRect} color=blue/>
			<Box rect={greenRect} color=green half={true}/>
		{/if}
		{#if isGrabbed}
			<Circle radius={10} center={origin_ofFirstReveal.offsetBy(new Point(7, 6))} color={here.color} thickness=1/>
		{/if}
		<FocusRevealDot here={here} center={origin_ofFirstReveal.offsetByY(-1)}/>
	</div>
{/if}