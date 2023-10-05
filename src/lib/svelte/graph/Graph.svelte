<script lang='ts'>
	import { noop, Rect, Size, Point, geometry, Thing, ZIndex, Layout, editor, Signals, onMount, onDestroy } from '../../ts/common/GlobalImports';
	import { constants, Predicate, ButtonID, LineRect, dbDispatch, handleSignalOfKind } from '../../ts/common/GlobalImports';
	import { idHere, lineGap, idEditing, idsGrabbed, popupViewID, graphOrigin } from '../../ts/managers/State';
	import FatTriangleButton from '../kit/FatTriangleButton.svelte';
	import Children from './Children.svelte';
	let triangleOrigin = new Point();
	let childrenOrigin = new Point();
	let isGrabbed = false;
	let here;

	onDestroy( () => { signalHandler.disconnect(); });
	
	function updateOrigin() {
		if (here) {
			const mysteryTriangleOffset = new Point(40, 7);
			const mysteryChildrenOffset = new Point(-18, -3);
			const progenyOffset = here.halfVisibleProgenySize.asPoint.multipliedBy(-1);
			triangleOrigin = geometry.graphCenter.offsetBy(progenyOffset).offsetBy(mysteryTriangleOffset);
			childrenOrigin = triangleOrigin.offsetByY(-here.halfVisibleProgenyHeight).offsetBy(mysteryChildrenOffset);
			noop();
		}
	}

	const signalHandler = handleSignalOfKind(Signals.childrenOf, (idThing) => {
		if (here && (idThing == null || idThing == here.id)) {
			updateOrigin();
		}
	});
	
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
{#if here}
	<Children thing={here} origin={childrenOrigin}/>
	{#if isGrabbed}
		<svg width='30' height='30'
			style='z-index: {ZIndex.highlights};
				position: absolute;
				left: {triangleOrigin.x - 8};
				top: {triangleOrigin.y + $graphOrigin.y - 22};'>
			<circle cx='15' cy='15' r='14' stroke='blue' fill={constants.backgroundColor}/>
		</svg>
	{/if}
	<FatTriangleButton here={here} origin={triangleOrigin.offsetByY($graphOrigin.y - 15)}/>
{/if}
