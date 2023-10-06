<script lang='ts'>
	import { noop, Rect, Size, Point, Thing, ZIndex, Layout, editor, Signals, onMount, onDestroy, PersistID, persistLocal } from '../../ts/common/GlobalImports';
	import { constants, Predicate, ButtonID, LineRect, dbDispatch, handleSignalOfKind } from '../../ts/common/GlobalImports';
	import { idHere, lineGap, idEditing, idsGrabbed, graphRect, windowSize, graphOffset, popupViewID } from '../../ts/managers/State';
	import FatTriangleButton from '../kit/FatTriangleButton.svelte';
	import Children from './Children.svelte';
	let triangleOrigin = new Point();
	let childrenOrigin = new Point();
	let isGrabbed = false;
	let here;

	onDestroy( () => { signalHandler.disconnect(); });

	const signalHandler = handleSignalOfKind(Signals.childrenOf, (idThing) => {
		if (here && (idThing == null || idThing == here.id)) {
			updateOrigin();
		}
	});

	window.addEventListener('wheel', (event: WheelEvent) => {
		const offset = $graphOffset;
		const delta = new Point(event.deltaX, event.deltaY);
		const newOffset = new Point(offset.x, offset.y).offsetBy(delta.multipliedBy(-1));
		setGraphOffset(newOffset);
	});

	function setGraphOffset(origin: Point) {
		$graphOffset = origin;
		persistLocal.writeToKey(PersistID.origin, origin);
		updateOrigin();
	}

	function updateOrigin() {
		if (here) {
			const mysteryChildrenOffset = new Point(-18, -48);
			const drawnSize = here.visibleProgenySize;
			const gCenter = new Rect($graphRect.origin, $graphRect.size).center;
			const tOffset = drawnSize.asPoint.multipliedBy(-1/2).offsetBy(new Point(0, 10));
			const tOrigin = gCenter.offsetBy($graphOffset).offsetBy(tOffset);
			const cOrigin = tOrigin.offsetBy(mysteryChildrenOffset);
			triangleOrigin = tOrigin;
			childrenOrigin = cOrigin;
		}
	}
	
	$: {
		if (here == null || here.id != $idHere) {			
			here = dbDispatch.db.hierarchy.getThing_forID($idHere);
			updateOrigin();
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
			const key = event.key.toLowerCase();
			switch (key) {
				case 'c': setGraphOffset(new Point()); break;
				case 'r': break; // restart app
				case 't': alert('PARENT-CHILD SWAP'); break;
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
