<script lang='ts'>
	import { Rect, Size, Point, Thing, ZIndex, Layout, editor, Signals, onMount, constants, onDestroy, Predicate, ButtonID, LineRect, dbDispatch, handleSignalOfKind } from '../../ts/common/GlobalImports';
	import { idHere, idsGrabbed, idEditing, widgetHeight, popupViewID } from '../../ts/managers/State';
	import FatTriangleButton from '../kit/FatTriangleButton.svelte';
	import Children from './Children.svelte';
	let childrenOrigin = new Point();
	let triangleOrigin = new Point();
	let origin = new Point(25, -10);
	let lineRects: LineRect[] = [];
	let isGrabbed = false;
	let here = Thing;

	onMount( () => { updateLineRects(); });

	onDestroy( () => {
		lineRects = [];
		signalHandler.disconnect();
	});

	const signalHandler = handleSignalOfKind(Signals.childrenOf, (idThing) => {
		if (here && idThing == here.id) {
			origin = new Point(25, -10);
			updateLineRects();
		}
	});
	
	$: {
		here = dbDispatch.db.hierarchy.getThing_forID($idHere);
		updateLineRects();
		let grabbed = $idsGrabbed.includes(here.id);
		if (grabbed != isGrabbed) {
			isGrabbed = grabbed;
		}
	}

	function updateLineRects() {
		if (here) {
			const yOffset = ($widgetHeight * here.children.length / 2) - 19;
			childrenOrigin = origin.offsetBy(new Point(1, yOffset));
			triangleOrigin = childrenOrigin.offsetBy(new Point(-7, 22));
			lineRects = new Layout().lineRects(here, childrenOrigin) ?? [];
		}
	}

	function description() {
		let strings: Array<string> = [];
		for (const lineRect of lineRects) {
			strings.push(lineRect.origin.verbose);
			strings.push(lineRect.extent.verbose);
			strings.push(lineRect.size.verbose);
		}
		return strings.join(', ');
	}

	async function handleKeyDown(event) {
		let grab = dbDispatch.db.hierarchy.grabs.furthestGrab(true);
		if ($idEditing)			{ return; } // let Title component consume the events
		if (event.key == undefined)	{ alert('no key for ' + event.type); return; }
		if (!grab) {
			grab = dbDispatch.db.hierarchy.root;
			grab?.becomeHere();
			grab?.grabOnly(); // to update crumbs and dots
		}
		if (event.type == 'keydown') {
			const key = event.key.toLowerCase();
			const OPTION = event.altKey;
			const SHIFT = event.shiftKey;
			switch (key) {
				case ' ':						await editor.thing_redraw_remoteAddChildTo(grab); break;
				case '?':						$popupViewID = ButtonID.help; break;
				case 'd':						await editor.thing_redraw_remoteDuplicate(grab); break;
				case 'r':						break; // restart app
				case 't':						alert('PARENT-CHILD SWAP'); break;
				case 'tab':					await editor.thing_redraw_remoteAddChildTo(grab.firstParent); break; // Title also makes this call
				case 'delete':
				case 'backspace':		await editor.grabs_redraw_remoteDelete(); break;
				case 'arrowup':			await editor.furthestGrab_redraw_remoteMoveUp(true, SHIFT, OPTION); break;
				case 'arrowdown':		await editor.furthestGrab_redraw_remoteMoveUp(false, SHIFT, OPTION); break;
				case 'arrowright':	await editor.thing_redraw_remoteMoveRight(grab, true, OPTION); break;
				case 'arrowleft':		await editor.thing_redraw_remoteMoveRight(grab, false, OPTION); break;
				case 'enter':				grab.startEdit(); break;
			}
		}
	}

</script>

<svelte:document on:keydown={handleKeyDown} />
{#if here}
	<Children thing={here} lineRects={lineRects}/>
	{#if isGrabbed}
		<svg width='30' height='30'
			style='z-index: {ZIndex.highlights};
				position: absolute;
				left: {triangleOrigin.x - 7};
				top: {triangleOrigin.y - 7};'>
			<circle cx='15' cy='15' r='14' stroke='blue' fill={constants.backgroundColor} />
		</svg>
	{/if}
	<FatTriangleButton here={here} origin={triangleOrigin}/>
{/if}
