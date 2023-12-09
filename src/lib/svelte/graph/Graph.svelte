<script lang='ts'>
	import { k, Rect, Size, Point, Thing, ZIndex, Signals, onDestroy, graphEditor, PersistID, persistLocal, updateGraphRect } from '../../ts/common/GlobalImports';
	import { debug, DebugOption, Predicate, ButtonID, LineRect, dbDispatch, handleSignalOfKind } from '../../ts/common/GlobalImports';
	import { id_here, dot_size, row_height, line_stretch, id_editing, ids_grabbed, graphRect, user_graphOffset, id_popupView } from '../../ts/managers/State';
	import RootRevealDot from './RootRevealDot.svelte';
	import Circle from '../kit/Circle.svelte';
	import Children from './Children.svelte';
	import Debug from './Debug.svelte';
	let center_ofFirstReveal = new Point();
	let rightCenter = new Point();
	let center = new Point();
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
			const offset = $user_graphOffset;
			const newOffset = new Point(offset.x + offsetX, offset.y + offsetY);
			user_graphOffset_setTo(newOffset);
		}
	});

	async function handleKeyDown(event) {
		if ($id_editing)			{ return; } // let Title component consume the events
		if (event.key == undefined)	{ alert('no key for ' + event.type); return; }
		if (event.type == 'keydown') {
			const key = event.key;
			switch (key) {
				case 'c': user_graphOffset_setTo(new Point()); break;
				case '?': $id_popupView = ButtonID.help; break;
				case ']':
				case '[': dbDispatch.nextDB(key == ']'); break;
				default:  await graphEditor.handleKeyDown(event); break; // editor-specific key values
			}
		}
	}

	function user_graphOffset_setTo(origin: Point) {
		persistLocal.writeToKey(PersistID.origin, origin);
		$user_graphOffset = origin;
		updateOrigins();
	}
	
	$: {
		if ($dot_size > 0) {
			updateOrigins();
		}
	}
	
	$: {
		if (here == null || here.id != $id_here) {			
			here = dbDispatch.db.hierarchy.thing_getForID($id_here);
			updateOrigins();
		}
		if (here) { // can sometimes be null TODO: WHY?
			let grabbed = $ids_grabbed.includes(here.id);
			if (grabbed != isGrabbed) {
				isGrabbed = grabbed;
			}
		}
	}

	function updateOrigins() {
		if (here) {
			updateGraphRect();
			const userCenter = $graphRect.center.offsetBy($user_graphOffset);
			const halfChildren = here.visibleProgeny_halfSize.asPoint.negated;
			center = userCenter.offsetByX(halfChildren.x);
			const toChildren = $graphRect.origin.offsetByY(here.visibleProgeny_height).negated;
			if (k.leftJustifyGraph) {
				center.x = 25;
			}
			rightCenter = center.offsetBy(toChildren);
			center_ofFirstReveal = rightCenter.offsetBy(new Point(($dot_size / -15) - 6, here.visibleProgeny_height - 7));
		}
	}

</script>

<svelte:document on:keydown={handleKeyDown}/>
{#if here}
	<Children thing={here} rightCenter={rightCenter}/>
	{#if debug.colors}
		<Debug center={center} size={here.visibleProgeny_size}/>
	{/if}
	{#if isGrabbed}
		<Circle radius={$dot_size / 1.5} center={rightCenter} color={here.color} thickness=1/>
	{/if}
	<RootRevealDot here={here} center={center_ofFirstReveal}/>
{/if}