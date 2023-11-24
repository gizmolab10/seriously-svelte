<script lang='ts'>
	import { Rect, Size, Point, Thing, ZIndex, Signals, onDestroy, graphEditor, PersistID, persistLocal, updateGraphRect } from '../../ts/common/GlobalImports';
	import { idHere, lineGap, idEditing, idsGrabbed, graphRect, user_graphOffset, popupViewID } from '../../ts/managers/State';
	import { k, Predicate, ButtonID, LineRect, dbDispatch, handleSignalOfKind } from '../../ts/common/GlobalImports';
	import RootRevealDot from './RootRevealDot.svelte';
	import Circle from '../kit/Circle.svelte';
	import Children from './Children.svelte';
	import Box from '../kit/Box.svelte';
	let origin_ofFirstReveal = new Point();
	let origin_ofChildren = new Point();
	let isGrabbed = false;
	let debugRect;
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

	function updateOrigins() {
		if (here) {
			updateGraphRect();
			const offsetFrom_firstReveal = here.halfVisibleProgenySize.asPoint.negated;
			const offsetTo_userCenter = $graphRect.center.offsetBy($user_graphOffset);
			const offsetTo_children = new Point(-16, offsetFrom_firstReveal.y - 7);
			origin_ofFirstReveal = offsetTo_userCenter.offsetBy(new Point(offsetFrom_firstReveal.x, -78));
			if (k.leftJustifyGraph) {
				origin_ofFirstReveal.x = 25;
			}
			origin_ofChildren = origin_ofFirstReveal.offsetBy(offsetTo_children);
			debugRect = new Rect(new Point(0, 39), origin_ofFirstReveal.offsetBy(new Point(-33, -85)).asSize); // $graphRect; // 
		}
	}
	
	$: {
		if (here == null || here.id != $idHere) {			
			here = dbDispatch.db.hierarchy.thing_getForID($idHere);
			updateOrigins();
		}
		if (here) { // can sometimes be null TODO: WHY?
			let grabbed = $idsGrabbed.includes(here.id);
			if (grabbed != isGrabbed) {
				isGrabbed = grabbed;
			}
		}
	}

	async function handleKeyDown(event) {
		if ($idEditing)			{ return; } // let Title component consume the events
		if (event.key == undefined)	{ alert('no key for ' + event.type); return; }
		if (event.type == 'keydown') {
			const key = event.key;
			switch (key) {
				case 'c': user_graphOffset_setTo(new Point()); break;
				case '?': $popupViewID = ButtonID.help; break;
				case ']':
				case '[': dbDispatch.nextDB(key == ']'); break;
				default:  await graphEditor.handleKeyDown(event); break; // editor-specific key values
			}
		}
	}

</script>

<svelte:document on:keydown={handleKeyDown}/>
{#key origin_ofChildren}
	{#if here}
		<div style='overflow: hidden; top:{$graphRect.origin.x}px;'>
			<Children thing={here} origin={origin_ofChildren}/>
			{#if isGrabbed}
				<Circle radius=14 center={origin_ofFirstReveal.offsetBy(new Point(6, -8))} color={here.color} thickness=1/>
			{/if}
			<RootRevealDot here={here} origin={origin_ofFirstReveal.offsetByY(-15)}/>
		</div>
	{/if}
{/key}
