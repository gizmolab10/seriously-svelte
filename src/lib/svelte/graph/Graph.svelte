<script lang='ts'>
	import { noop, Rect, Size, Point, Thing, ZIndex, Layout, editor, Signals, onMount, onDestroy, PersistID, persistLocal } from '../../ts/common/GlobalImports';
	import { constants, Predicate, ButtonID, LineRect, dbDispatch, handleSignalOfKind } from '../../ts/common/GlobalImports';
	import { idHere, lineGap, idEditing, idsGrabbed, graphRect, windowSize, grephOffset, popupViewID } from '../../ts/managers/State';
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
		const delta = new Point(event.deltaX, event.deltaY);
		const origin = $grephOffset;
		const newOrigin = new Point(origin.x, origin.y).offsetBy(delta.multipliedBy(-1));
		setGrephOffset(newOrigin);
	});

	function setGrephOffset(origin: Point) {
		$grephOffset = origin;
		persistLocal.writeToKey(PersistID.origin, origin);
		updateOrigin();
	}

	function updateOrigin() {
		if (here) {
			const rect = new Rect($graphRect.origin, $graphRect.size);
			const graphCenter = rect.center;
			const drawnSize = here.visibleProgenySize;
			const mysteryTriangleOffset = new Point(40, 7);
			const mysteryChildrenOffset = new Point(-18, 312);
			const progenyOffset = drawnSize.asPoint.multipliedBy(-1/2);
			triangleOrigin = graphCenter.offsetBy($grephOffset).offsetBy(progenyOffset).offsetBy(mysteryTriangleOffset);
			childrenOrigin = triangleOrigin.offsetByY(-drawnSize.height * 4).offsetBy(mysteryChildrenOffset);
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
				case 'c': setGrephOffset(new Point()); break;
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
					top: {triangleOrigin.y + $grephOffset.y - 22};'>
				<circle cx='15' cy='15' r='14' stroke='blue' fill={constants.backgroundColor}/>
			</svg>
		{/if}
		<FatTriangleButton here={here} origin={triangleOrigin.offsetByY($grephOffset.y - 15)}/>
	{/if}
{/key}
