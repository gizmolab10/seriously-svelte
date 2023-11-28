<script lang='ts'>
	import { k, Rect, Size, Point, Thing, ZIndex, Signals, onDestroy, graphEditor, PersistID, persistLocal, updateGraphRect } from '../../ts/common/GlobalImports';
	import { debug, DebugOption, Predicate, ButtonID, LineRect, dbDispatch, handleSignalOfKind } from '../../ts/common/GlobalImports';
	import { id_here, line_gap, id_editing, ids_grabbed, graphRect, user_graphOffset, id_popupView } from '../../ts/managers/State';
	import RootRevealDot from './RootRevealDot.svelte';
	import Circle from '../kit/Circle.svelte';
	import Children from './Children.svelte';
	import Box from '../kit/Box.svelte';
	let origin_ofFirstReveal = new Point();
	let origin_ofChildren = new Point();
	let isGrabbed = false;
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

	function user_graphOffset_setTo(origin: Point) {
		persistLocal.writeToKey(PersistID.origin, origin);
		$user_graphOffset = origin;
		updateOrigins();
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

	function updateOrigins() {
		if (here) {
			updateGraphRect();
			const mysteryOffset = new Point(16, 46);
			const userCenter = $graphRect.center.offsetBy($user_graphOffset);
			const halfChildren = here.visibleProgeny_halfSize.asPoint.negated;
			origin_ofFirstReveal = userCenter.offsetBy(halfChildren).offsetBy(mysteryOffset);
			if (k.leftJustifyGraph) {
				origin_ofFirstReveal.x = 25;
			}
			const toChildren = new Point(-16, halfChildren.y + 8);
			origin_ofChildren = origin_ofFirstReveal.offsetBy(toChildren);
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
{#key origin_ofChildren}
	{#if here}
		<div style='overflow: hidden; top:{$graphRect.origin.x}px;'>
			<Children thing={here} origin={origin_ofChildren}/>
			{#if debug.hasOption(DebugOption.colors)}
				<Box rect={$graphRect.dividedInHalf} color=blue/>
				<Box rect={rectTo_firstReveal()} color=red/>
				<Box rect={rectOfChildren()} color=green/>
			{/if}
			{#if isGrabbed}
				<Circle radius=14 center={origin_ofFirstReveal.offsetBy(new Point(6, 7))} color={here.color} thickness=1/>
			{/if}
			<RootRevealDot here={here} origin={origin_ofFirstReveal}/>
		</div>
	{/if}
{/key}
