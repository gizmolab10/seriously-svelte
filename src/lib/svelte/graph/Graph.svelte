<script>
	import { Rect, Size, Point, Thing, Layout, editor, Signals, onDestroy, Predicate, ButtonID, dbDispatch, handleSignalOfKind } from '../../ts/common/GlobalImports';
	import { popupViewID, idEditing, idHere } from '../../ts/managers/State';
	import FatTriangleButton from '../kit/FatTriangleButton.svelte';
	import Children from './Children.svelte';
	let childrenOrigin = new Point();
	let point = new Point(25, -10);
	let toggleDraw = false;
	let here = Thing;
	let listener;

	$: { here = dbDispatch.db.hierarchy.getThing_forID($idHere); }
	onDestroy( () => {signalHandler.disconnect(); });

	const signalHandler = handleSignalOfKind(Signals.childrenOf, (idThing) => {
		if (here && idThing == here.id) {
			point = new Point(25, -10);
			toggleDraw = !toggleDraw;
		}
	})

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

	// <div style='position: fixed; left-padding=100px'>
	// </div>
</script>

<svelte:document on:keydown={handleKeyDown} />
{#key toggleDraw, here}
	{#if here}
		<Children thing={here} origin={point}/>
		<FatTriangleButton color={here.color} origin={childrenOrigin.offsetBy(new Point(-8, 21))}/>
	{/if}
{/key}
