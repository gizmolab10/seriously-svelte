<script lang='ts'>
	import { Rect, Size, Point, Thing, ZIndex, Signals, onDestroy, graphEditor, PersistID, persistLocal } from '../../ts/common/GlobalImports';
	import { idHere, lineGap, idEditing, idsGrabbed, graphRect, windowSize, graphOffset, popupViewID } from '../../ts/managers/State';
	import { k, Predicate, ButtonID, LineRect, dbDispatch, handleSignalOfKind } from '../../ts/common/GlobalImports';
	import RootRevealDot from './RootRevealDot.svelte';
	import Children from './Children.svelte';
	let triangleOrigin = new Point();
	let childrenOrigin = new Point();
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
			const offset = $graphOffset;
			const newOffset = new Point(offset.x + offsetX, offset.y + offsetY);
			graphOffset_setTo(newOffset);
		}
	});

	function graphOffset_setTo(origin: Point) {
		persistLocal.writeToKey(PersistID.origin, origin);
		$graphOffset = origin;
		updateOrigins();
	}

	function updateOrigins() {
		if (here) {
			const gCenter = $graphRect.center.offsetBy($graphOffset);		// user-determined center
			const tOffset = here.halfVisibleProgenySize.asPoint.multipliedBy(-1);
			const cOffset = new Point(-16, tOffset.y - 7);
			let tOrigin = gCenter.offsetBy(new Point(tOffset.x, -78));
			if (k.leftJustifyGraph) {
				tOrigin.x = 25;
			}
			triangleOrigin = tOrigin;
			childrenOrigin = tOrigin.offsetBy(cOffset);
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
				case 'c': graphOffset_setTo(new Point()); break;
				case '?': $popupViewID = ButtonID.help; break;
				case ']':
				case '[': dbDispatch.nextDB(key == ']'); break;
				default:  await graphEditor.handleKeyDown(event); break; // editor-specific key values
			}
		}
	}

</script>

<svelte:document on:keydown={handleKeyDown} />
{#key childrenOrigin}
	{#if here}
		<Children thing={here} origin={childrenOrigin}/>
		{#if isGrabbed}
			<svg width='28' height='28'
				style='z-index: {ZIndex.dots};
					position: absolute;
					left: {triangleOrigin.x - 7};
					top: {triangleOrigin.y - 21};'>
				<circle cx='14' cy='14' r='13' stroke={here.color} fill={k.backgroundColor}/>
			</svg>
		{/if}
		<RootRevealDot here={here} origin={triangleOrigin.offsetByY(-15)}/>
	{/if}
{/key}
