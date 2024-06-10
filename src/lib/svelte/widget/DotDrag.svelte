<script>
	import { s_thing_changed, s_layout_asClusters, s_ancestries_grabbed, s_ancestry_editingTools } from '../../ts/state/ReactiveState';
	import { k, s, u, Rect, Size, Point, Thing, debug, ZIndex, IDTool, onMount } from '../../ts/common/GlobalImports';
	import { signals, svgPaths, Direction, ElementType, dbDispatch } from '../../ts/common/GlobalImports';
	import { createPopper, SvelteWrapper, AlterationType } from '../../ts/common/GlobalImports';
	import MouseResponder from '../mouse buttons/MouseResponder.svelte';
	import Tooltip from '../kit/Tooltip.svelte';
	import SVGD3 from '../kit/SVGD3.svelte';
	import Box from '../kit/Box.svelte';
	export let center = Point.zero;
	export let subtype = k.empty;
	export let name = k.empty;
    export let ancestry;
	const radius = k.dot_size;
	const diameter = radius * 2;
	const elementState = s.elementState_for(ancestry, ElementType.drag, subtype);	// survives onDestroy
	let isAltering = false;
	let isGrabbed = false;
	let isHovering = true;
	let size = k.dot_size;
	let mouse_click_timer;
	let isRelatedSVGPath;
	let tinyDotsSVGPath;
	let dragDotSVGPath;
	let rebuilds = 0;
	let redraws = 0;
	let left = 0;
	let top = 0;
	let tooltip;
	let popper;
	let button;
    let thing;

	function handle_context_menu(event) { event.preventDefault(); }		// no default context menu on right-click

    onMount(() => {
		if (!!ancestry) {
			thing = ancestry.thing;
		}
		updateSVGPaths();
		updateColors_forHovering(false);
		popper = createPopper(button, tooltip, { placement: 'bottom' });
        const handleAltering = signals.handle_altering((state) => {
			const applyFlag = $s_ancestry_editingTools && !!ancestry && ancestry.things_canAlter_asParentOf_toolsAncestry;
			isAltering = applyFlag ? !!state : false;
			updateExtraSVGPaths();
        });
		return () => {
			handleAltering.disconnect();
		};
	});

	$: {
		if (thing?.id == $s_thing_changed.split(k.genericSeparator)[0]) {
			updateColors_forHovering(false);
			rebuilds += 1;
		}
	}

	$: {
		const grabbed = ancestry?.isGrabbed;
		if (isGrabbed != grabbed) {
			isGrabbed = grabbed;
		}
	}

	function updateSVGPaths() {
		if ($s_layout_asClusters) {
			dragDotSVGPath = svgPaths.circle_atOffset(size, size - 1);
		} else {
			dragDotSVGPath = svgPaths.oval(size, false);
		}
		updateExtraSVGPaths();
	}

	function updateExtraSVGPaths() {
		isRelatedSVGPath = tinyDotsSVGPath = null;
		if (!!thing) {
			const count = thing.parents.length;		
			if (count > 1) {
				tinyDotsSVGPath = svgPaths.ellipses(6, 0.5, false, count, size / 2);
			}
			if (thing.hasRelated) {
				isRelatedSVGPath = svgPaths.circle_atOffset(size, 3, new Point(-4.5, 0));
			}
		}
	}

	function updateColors_forHovering(isHovering) {
		const usePointer = (!ancestry.isGrabbed || s_layout_asClusters) && ancestry.hasChildRelationships ;
		const cursor = usePointer ? 'pointer' : k.cursor_default;
		elementState.set_forHovering(thing.color, cursor);
		elementState.isOut = !isHovering;
		redraws += 1;
	}

	function closure(mouseState) {
		if (mouseState.isHover) {
			updateColors_forHovering(!mouseState.isOut);
		} else if (mouseState.isUp) {
			ancestry?.handle_singleClick_onDragDot(mouseState.event.shiftKey);
		}
	}

	// <Tooltip color={elementState.stroke} bind:this={tooltip}>This is a drag dot</Tooltip>
	// on:contextmenu={handle_context_menu}

</script>

{#key rebuilds}
	<MouseResponder
		width={size}
		height={size}
		center={center}
		closure={closure}
		name={elementState.name}>
		<button class='button'
			id={'button-for-' + name}
			style='
				border:none;
				cursor:pointer;
				width:{size}px;
				height:{size}px;
				color:transparent;
				position:absolute;
				z-index:{ZIndex.dots};
				background-color:transparent;'>
			{#key redraws}
				<div id={'inner-div-for-' + name}
					style='
						top:0px;
						left:0px;
						width:{size}px;
						height:{size}px;
						color:transparent;
						position:absolute;
						z-index:{ZIndex.dots};'>
					<SVGD3 name={'svg-drag-' + name}
						width={size}
						height={size}
						svg_path={dragDotSVGPath}
						fill={elementState.fill}
						stroke={thing?.color}
					/>
					{#if tinyDotsSVGPath}
						<SVGD3 name={'svg-dot-inside-' + name}
							width={size}
							height={size}
							svg_path={tinyDotsSVGPath}
							fill={elementState.stroke}
							stroke={elementState.stroke}
						/>
					{/if}
					{#if isRelatedSVGPath}
						<SVGD3 name={'svg-dot-related-' + name}
							width={size}
							height={size}
							svg_path={isRelatedSVGPath}
							fill={k.color_background}
							stroke={thing?.color}
						/>
					{/if}
				</div>
			{/key}
		</button>
	</MouseResponder>
{/key}
