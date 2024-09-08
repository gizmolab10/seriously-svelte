<script lang='ts'>
	import { s_thing_changed, s_cluster_mode, s_ancestries_grabbed, s_ancestry_showingTools } from '../../ts/state/Reactive_State';
	import { g, k, u, ux, Rect, Size, Point, Thing, debug, ZIndex, IDTool, onMount } from '../../ts/common/Global_Imports';
	import { signals, svgPaths, Direction, ElementType, dbDispatch } from '../../ts/common/Global_Imports';
	import { Svelte_Wrapper, AlterationType, SvelteComponentType } from '../../ts/common/Global_Imports';
	import Mouse_Responder from '../mouse buttons/Mouse_Responder.svelte';
	import Tooltip from '../kit/Tooltip.svelte';
	import SVGD3 from '../kit/SVGD3.svelte';
	import Box from '../kit/Box.svelte';
	export let center = Point.zero;
	export let name = k.empty;
    export let ancestry;
	const radius = k.dot_size;
	const diameter = radius * 2;
	const element_state = ux.elementState_forName(name);		// survives onDestroy, created by widget
	let dragWrapper!: Svelte_Wrapper;
	let isRelatedSVGPath = k.empty;
	let tinyDotsSVGPath = k.empty;
	let dragDotSVGPath = k.empty;
	let isGrabbed = false;
	let isHovering = true;
	let size = k.dot_size;
	let mouse_click_timer;
    let thing!: Thing;
	let rebuilds = 0;
	let redraws = 0;
	let left = 0;
	let top = 0;
	let dotDrag;

	function handle_context_menu(event) { event.preventDefault(); }		// no default context menu on right-click

    onMount(() => {
		if (!!ancestry) {
			thing = ancestry.thing;
		}
		updateSVGPaths();
		updateColors_forHovering(true);
        const handleAltering = signals.handle_altering((blink_flag) => {
			const invert_flag = blink_flag && $s_ancestry_showingTools && !!ancestry && ancestry.canConnect_toToolsAncestry;
			element_state.isInverted = invert_flag;
			updateExtraSVGPaths();
        });
		return () => {
			handleAltering.disconnect();
		};
	});

	$: {
		if (!!dotDrag) {
			dragWrapper = new Svelte_Wrapper(dotDrag, handle_mouse_state, ancestry.idHashed, SvelteComponentType.drag);
			element_state.set_forHovering(ancestry.thing.color, 'pointer');
		}
	}

	$: {
		if (!!thing && thing.id == $s_thing_changed?.split(k.generic_separator)[0]) {
			updateColors_forHovering(true);
		}
	}

	$: {
		const _ = $s_ancestries_grabbed;
		const grabbed = ancestry.isGrabbed;
		if (isGrabbed != grabbed) {
			isGrabbed = grabbed;
			updateColors_forHovering(!isHovering);
		}
	}

	function updateSVGPaths() {
		if ($s_cluster_mode) {
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

	function updateColors_forHovering(isOut) {
		if (!g.isAny_rotation_active) {
			isHovering = !isOut;
			const usePointer = (!ancestry.isGrabbed || s_cluster_mode) && ancestry.hasChildRelationships && !g.isAny_rotation_active;
			const cursor = usePointer ? 'pointer' : 'normal';
			if (!!element_state && !!thing) {
				element_state.set_forHovering(thing.color, cursor);
				element_state.isOut = isOut;
			}
			redraws += 1;
		}
	}

	function closure(mouse_state) {
		if (!g.isAny_rotation_active) {
			if (mouse_state.isHover) {
				updateColors_forHovering(mouse_state.isOut);
			} else if (mouse_state.isLong) {
				ancestry?.becomeFocus();
			} else if (mouse_state.isUp) {
				const shiftKey = mouse_state.event?.shiftKey ?? false
				ancestry?.handle_singleClick_onDragDot(shiftKey);
			}
		}
	}

	function handle_mouse_state(mouse_state: Mouse_State): boolean {
		return false;
	}

</script>

{#key rebuilds}
	{#if element_state}
		<Mouse_Responder
			width={size}
			height={size}
			center={center}
			name={element_state.name}
			mouse_state_closure={closure}>
			<button class='drag'
				bind:this={dotDrag}
				id={'drag-for-' + name}
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
					<div id={'drag-inner-div-for-' + name}
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
							fill={element_state.fill}
							stroke={thing?.color}
						/>
						{#if g.show_tinyDots}
							{#if tinyDotsSVGPath}
								<SVGD3 name={'svg-drag-inside-' + name}
									width={size}
									height={size}
									svg_path={tinyDotsSVGPath}
									fill={element_state.stroke}
									stroke={element_state.stroke}
								/>
							{/if}
							{#if isRelatedSVGPath}
								<SVGD3 name={'svg-drag-related-' + name}
									width={size}
									height={size}
									svg_path={isRelatedSVGPath}
									fill={k.color_background}
									stroke={thing?.color}
								/>
							{/if}
						{/if}
					</div>
				{/key}
			</button>
		</Mouse_Responder>
	{/if}
{/key}
