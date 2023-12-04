<script lang='ts'>
	import { k, Rect, Size, Point, Thing, ZIndex, Signals, onDestroy, graphEditor, PersistID, persistLocal, updateGraphRect } from '../../ts/common/GlobalImports';
	import { debug, DebugOption, Predicate, ButtonID, LineRect, dbDispatch, handleSignalOfKind } from '../../ts/common/GlobalImports';
	import { id_here, dot_size, id_editing, ids_grabbed, graphRect, user_graphOffset, id_popupView } from '../../ts/managers/State';
	import RootRevealDot from './RootRevealDot.svelte';
	import Circle from '../kit/Circle.svelte';
	import Children from './Children.svelte';
	import Box from '../kit/Box.svelte';
	let origin_ofFirstReveal = new Point();
	let origin_ofChildren = new Point();
	let isGrabbed = false;
	let greenRect: Rect;
	let blueRect: Rect;
	let redRect: Rect;
	let here;

	onDestroy( () => { signalHandler.disconnect(); });

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

	async function handleKeyDown(event) {
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
		if ($user_graphOffset != null) {
			updateOrigins();
		}
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
			updateGraphRect();
			const mysteryOffset = new Point($dot_size, 20);
			const userCenter = $graphRect.center.offsetBy($user_graphOffset);
			const halfChildren = here.visibleProgeny_halfSize.asPoint.negated;
			origin_ofFirstReveal = userCenter.offsetBy(halfChildren).offsetBy(mysteryOffset);
			if (k.leftJustifyGraph) {
				origin_ofFirstReveal.x = 25;
			}
			const toChildren = new Point(-13, halfChildren.y - 2 + ($dot_size / 2));
			origin_ofChildren = origin_ofFirstReveal.offsetBy(toChildren);
			blueRect = $graphRect.dividedInHalf;
			redRect = rectTo_firstReveal();
			greenRect = rectOfChildren();
		}
	}

	function rectTo_firstReveal(): Rect {
		const mysteryOffset = new Point(-33, -31);
		const extent = origin_ofFirstReveal.offsetBy(mysteryOffset);
		return Rect.createRect($graphRect.origin, extent);
	}

	function rectOfChildren(): Rect {
		return new Rect(origin_ofChildren, here.visibleProgeny_size);
	}

</script>

<svelte:document on:keydown={handleKeyDown}/>
{#if here}
	<div style='overflow: hidden; top:{$graphRect.origin.x}px;'>
		<Children thing={here} origin={origin_ofChildren}/>
		{#if debug.colors}
			<Box rect={redRect} color=red/>
			<Box rect={blueRect} color=blue/>
			<Box rect={greenRect} color=green/>
		{/if}
		{#if isGrabbed}
			<Circle radius={$dot_size / 1.5} center={origin_ofFirstReveal.offsetBy(new Point(7, 9))} color={here.color} thickness=1/>
		{/if}
		<RootRevealDot here={here} origin={origin_ofFirstReveal}/>
	</div>
{/if}