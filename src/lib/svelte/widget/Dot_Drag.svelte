<script lang='ts'>
	import { s_thing_color, s_graph_type, s_grabbed_ancestries, s_ancestry_showing_tools } from '../../ts/state/Svelte_Stores';
	import { g, k, u, ux, show, Rect, Size, Point, Thing, debug, ZIndex, IDTool } from '../../ts/common/Global_Imports';
	import { dbDispatch, Svelte_Wrapper, AlterationType, SvelteComponentType } from '../../ts/common/Global_Imports';
	import { signals, svgPaths, Direction, Graph_Type, ElementType } from '../../ts/common/Global_Imports';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import SVGD3 from '../kit/SVGD3.svelte';
	import { onMount } from 'svelte';
	export let center = Point.zero;
	export let name = k.empty;
    export let ancestry;
	const radius = k.dot_size;
	const diameter = radius * 2;
	const element_state = ux.element_state_forName(name);		// survives onDestroy, created by widget
	let dragWrapper!: Svelte_Wrapper;
	let svgPathFor_related = k.empty;
	let svgPathFor_tinyDots = k.empty;
	let svgPathFor_dragDot = k.empty;
    let thing = ancestry.thing;
	let isGrabbed = false;
	let isHovering = true;
	let size = k.dot_size;
	let mouse_click_timer;
	let rebuilds = 0;
	let redraws = 0;
	let left = 0;
	let top = 0;
	let dotDrag;

	updateSVGPaths();
	updateColors_forHovering(true);

	function handle_context_menu(event) { event.preventDefault(); }		// no default context menu on right-click

    onMount(() => {
        const handleAltering = signals.handle_altering((blink_flag) => {
			const invert_flag = blink_flag && $s_ancestry_showing_tools && !!ancestry && ancestry.canConnect_toToolsAncestry;
			element_state.isInverted = invert_flag;
			updateExtraSVGPaths();
        });
		return () => { handleAltering.disconnect(); };
	});

	$: {
		if (!!ancestry) {
			thing = ancestry.thing;
		}
	};

	$: {
		if (!!dotDrag) {
			dragWrapper = new Svelte_Wrapper(dotDrag, handle_mouse_state, ancestry.idHashed, SvelteComponentType.drag);
			element_state.set_forHovering(ancestry.thing?.color, 'pointer');
		}
	}

	$: {
		if (!!thing && thing.id == $s_thing_color?.split(k.generic_separator)[0]) {
			updateColors_forHovering(true);
		}
	}

	$: {
		const _ = $s_grabbed_ancestries;
		const grabbed = ancestry.isGrabbed;
		if (isGrabbed != grabbed) {
			isGrabbed = grabbed;
			updateColors_forHovering(!isHovering);
		}
	}

	function updateSVGPaths() {
		if (g.showing_radial) {
			svgPathFor_dragDot = svgPaths.circle_atOffset(size, size - 1);
		} else {
			svgPathFor_dragDot = svgPaths.oval(size, false);
		}
		updateExtraSVGPaths();
	}

	function updateExtraSVGPaths() {
		svgPathFor_related = svgPathFor_tinyDots = null;
		if (!!thing) {
			const count = thing.parents.length;		
			if (count > 1) {
				svgPathFor_tinyDots = svgPaths.ellipses(6, 0.5, false, count, size / 2);
			}
			if (thing.hasRelated) {
				svgPathFor_related = svgPaths.circle_atOffset(size, 3, new Point(-4.5, 0));
			}
		}
	}

	function updateColors_forHovering(isOut) {
		if (!g.isAny_rotation_active) {
			isHovering = !isOut;
			const usePointer = (!ancestry.isGrabbed || g.showing_radial) && ancestry.hasChildRelationships && !g.isAny_rotation_active;
			const cursor = usePointer ? 'pointer' : 'normal';
			if (!!element_state && !!thing) {
				element_state.set_forHovering(thing.color, cursor);
				element_state.isOut = isOut;
			}
			redraws += 1;
		}
	}

	function up_long_hover_clusure(mouse_state) {
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
			detect_longClick={true}
			name={element_state.name}
			mouse_state_closure={up_long_hover_clusure}>
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
						<SVGD3 name={'drag-' + name + '-svg'}
							width={size}
							height={size}
							svgPath={svgPathFor_dragDot}
							fill={element_state.fill}
							stroke={thing?.color}
						/>
						{#if show.tiny_dots}
							{#if svgPathFor_tinyDots}
								<SVGD3 name={'drag-inside-' + name + '-svg'}
									width={size}
									height={size}
									svgPath={svgPathFor_tinyDots}
									fill={element_state.stroke}
									stroke={element_state.stroke}
								/>
							{/if}
							{#if svgPathFor_related}
								<SVGD3 name={'drag-related-' + name + '-svg'}
									width={size}
									height={size}
									svgPath={svgPathFor_related}
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
