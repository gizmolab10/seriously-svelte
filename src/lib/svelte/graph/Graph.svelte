<script lang='ts'>
	import { Rect, Size, Point, Thing, ZIndex, Layout, editor, Signals, onMount, onDestroy } from '../../ts/common/GlobalImports';
	import { constants, Predicate, ButtonID, LineRect, dbDispatch, handleSignalOfKind } from '../../ts/common/GlobalImports';
	import { idHere, lineGap, idEditing, idsGrabbed, popupViewID, graphOffsetY } from '../../ts/managers/State';
	import FatTriangleButton from '../kit/FatTriangleButton.svelte';
	import Children from './Children.svelte';
	let triangleOrigin = new Point();
	let isGrabbed = false;
	let here;

	onDestroy( () => { signalHandler.disconnect(); });
	
	function updateOrigin() {
		if (here) {
			triangleOrigin = new Point(19, (here.halfVisibleProgenyHeight) + 7);
			$graphOffsetY = 0;
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
		let grab = dbDispatch.db.hierarchy.grabs.furthestGrab(true);
		if ($idEditing)			{ return; } // let Title component consume the events
		if (event.key == undefined)	{ alert('no key for ' + event.type); return; }
		if (!grab) {
			const root = dbDispatch.db.hierarchy.root;
			root?.becomeHere();
			root?.grabOnly(); // to update crumbs and dots
			grab = root;
		}
		if (event.type == 'keydown') {
			switch (event.key.toLowerCase()) {
				case 'r':		break; // restart app
				case 'enter':	grab?.startEdit(); break;
				case '/':		grab?.becomeHere(); break;
				case ']':		dbDispatch.nextDB(true); break;
				case '[':		dbDispatch.nextDB(false); break;
				case 't':		alert('PARENT-CHILD SWAP'); break;
				case '?':		$popupViewID = ButtonID.help; break;
				default:		await editor.handleKeyDown(event); break;
			}
		}
	}

</script>

<svelte:document on:keydown={handleKeyDown} />
{#if here}
	<Children thing={here} origin={new Point(0, $graphOffsetY + 4)}/>
	{#if isGrabbed}
		<svg width='30' height='30'
			style='z-index: {ZIndex.highlights};
				position: absolute;
				left: {triangleOrigin.x - 8};
				top: {triangleOrigin.y + $graphOffsetY - 22};'>
			<circle cx='15' cy='15' r='14' stroke='blue' fill={constants.backgroundColor}/>
		</svg>
	{/if}
	<FatTriangleButton here={here} origin={triangleOrigin.offsetByY($graphOffsetY - 15)}/>
{/if}
