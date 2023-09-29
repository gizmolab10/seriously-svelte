<script lang='ts'>
	import { Rect, Size, Point, Thing, ZIndex, Layout, editor, Signals, onMount, constants, onDestroy } from '../../ts/common/GlobalImports';
	import { Predicate, ButtonID, LineRect, dbDispatch, handleSignalOfKind } from '../../ts/common/GlobalImports';
	import { idHere, idsGrabbed, idEditing, lineGap, popupViewID } from '../../ts/managers/State';
	import FatTriangleButton from '../kit/FatTriangleButton.svelte';
	import Children from './Children.svelte';
	let triangleOrigin = new Point();
	let isGrabbed = false;
	let here;

	onDestroy( () => { signalHandler.disconnect(); });
	
	function updateTriangleOrigin() {
		if (here) {
			const originOffset = new Point(19, -2);					// TODO: center of screen minus children size width over two
			const origin = new Point(0, here.childrenHeight / 2);
			triangleOrigin = origin.offsetBy(originOffset);
		}
	}

	const signalHandler = handleSignalOfKind(Signals.childrenOf, (idThing) => {
		if (here && (idThing == null || idThing == here.id)) {
			updateTriangleOrigin();
		}
	});
	
	$: {
		if (here == null || here.id != $idHere) {			
			here = dbDispatch.db.hierarchy.getThing_forID($idHere);
			updateTriangleOrigin();
		}
		if (here) { // can sometimes be null !!!!!! ????????
			let grabbed = $idsGrabbed.includes(here.id);
			if (grabbed != isGrabbed) {
				isGrabbed = grabbed;
			}
		}
	}

	async function handleKeyDown(event) {
		const grab = dbDispatch.db.hierarchy.grabs.furthestGrab(true);
		if ($idEditing)			{ return; } // let Title component consume the events
		if (event.key == undefined)	{ alert('no key for ' + event.type); return; }
		if (!grab) {
			const root = dbDispatch.db.hierarchy.root;
			root?.becomeHere();
			root?.grabOnly(); // to update crumbs and dots
		}
		if (event.type == 'keydown') {
			const key = event.key.toLowerCase();
			const COMMAND = event.metaKey;
			const OPTION = event.altKey;
			const SHIFT = event.shiftKey;
			switch (key) {
				case ' ':			await editor.thing_redraw_remoteAddChildTo(grab); break;
				case '?':			$popupViewID = ButtonID.help; break;
				case 'd':			await editor.thing_redraw_remoteDuplicate(grab); break;
				case 'r':			break; // restart app
				case 't':			alert('PARENT-CHILD SWAP'); break;
				case 'tab':			await editor.thing_redraw_remoteAddChildTo(grab.firstParent); break; // Title also makes this call
				case 'delete':
				case 'backspace':	await editor.grabs_redraw_remoteDelete(); break;
				case 'arrowup':		await editor.furthestGrab_redraw_remoteMoveUp(true, SHIFT, OPTION, COMMAND); break;
				case 'arrowdown':	await editor.furthestGrab_redraw_remoteMoveUp(false, SHIFT, OPTION, COMMAND); break;
				case 'arrowright':	await editor.thing_redraw_remoteMoveRight(grab, true, OPTION, COMMAND); break;
				case 'arrowleft':	await editor.thing_redraw_remoteMoveRight(grab, false, OPTION, COMMAND); break;
				case 'enter':		grab.startEdit(); break;
			}
		}
	}

</script>

<svelte:document on:keydown={handleKeyDown} />
{#if here}
	<Children thing={here} originX={0}/>
	{#if isGrabbed}
		<svg width='30' height='30'
			style='z-index: {ZIndex.highlights};
				position: absolute;
				left: {triangleOrigin.x - 8};
				top: {triangleOrigin.y - 17};'>
			<circle cx='15' cy='15' r='14' stroke='blue' fill={constants.backgroundColor}/>
		</svg>
	{/if}
	<FatTriangleButton here={here} origin={triangleOrigin.offsetBy(new Point(0, -10))}/>
{/if}
