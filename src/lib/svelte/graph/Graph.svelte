<script lang='ts'>
	import { noop, Rect, Size, Point, Thing, ZIndex, Layout, editor, Signals, onMount, onDestroy, PersistID, persistLocal } from '../../ts/common/GlobalImports';
	import { idHere, lineGap, idEditing, idsGrabbed, graphRect, windowSize, graphOffset, popupViewID } from '../../ts/managers/State';
	import { constants, Predicate, ButtonID, LineRect, dbDispatch, handleSignalOfKind } from '../../ts/common/GlobalImports';
	import FatTriangleButton from '../kit/FatTriangleButton.svelte';
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
		const offset = $graphOffset;
		const delta = new Point(-event.deltaX, -event.deltaY);
		const newOffset = new Point(offset.x, offset.y).offsetBy(delta);
		setGraphOffset(newOffset);
	});

	function setGraphOffset(origin: Point) {
		persistLocal.writeToKey(PersistID.origin, origin);
		$graphOffset = origin;
		updateOrigins();
	}

	function updateOrigins() {
		if (here) {
			const gCenter = $graphRect.center.offsetBy($graphOffset);		// user-determined center
			const tOffset = here.halfVisibleProgenySize.asPoint.multipliedBy(-1);
			const tOrigin = gCenter.offsetBy(tOffset);
			triangleOrigin = gCenter.offsetBy(new Point(-here.visibleProgenyWidth * 0.69, -20));
			childrenOrigin = triangleOrigin.offsetBy(new Point(-18, tOffset.y - 7));
		}
	}
	
	$: {
		if (here == null || here.id != $idHere) {			
			here = dbDispatch.db.hierarchy.getThing_forID($idHere);
			updateOrigins();
		}
		if (here) { // can sometimes be null !!!!!! ????????
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
				case 'c': setGraphOffset(new Point()); break;
				case '?': $popupViewID = ButtonID.help; break;
				case ']':
				case '[': dbDispatch.nextDB(key == ']'); break;
				default:  await editor.handleKeyDown(event); break; // editor-specific key values
			}
		}
	}

</script>

<svelte:document on:keydown={handleKeyDown} />
{#key childrenOrigin}
	{#if here}
		<Children thing={here} origin={childrenOrigin}/>
		{#if isGrabbed}
			<svg width='30' height='30'
				style='z-index: {ZIndex.highlights};
					position: absolute;
					left: {triangleOrigin.x - 8};
					top: {triangleOrigin.y - 22};'>
				<circle cx='15' cy='15' r='14' stroke='blue' fill={constants.backgroundColor}/>
			</svg>
		{/if}
		<FatTriangleButton here={here} origin={triangleOrigin.offsetByY(-15)}/>
	{/if}
{/key}
