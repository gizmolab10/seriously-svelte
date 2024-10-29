<script lang='ts'>
	import { s_color_thing, s_graph_type, s_grabbed_ancestries, s_showing_tools_ancestry } from '../../ts/state/Reactive_State';
	import { g, k, u, ux, show, Rect, Size, Point, Thing, debug, ZIndex, IDTool } from '../../ts/common/Global_Imports';
	import { dbDispatch, Svelte_Wrapper, AlterationType, SvelteComponentType } from '../../ts/common/Global_Imports';
	import { onMount, signals, svgPaths, Direction, Graph_Type, ElementType } from '../../ts/common/Global_Imports';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import Tooltip from '../kit/Tooltip.svelte';
	import SVGD3 from '../kit/SVGD3.svelte';
	export let center = Point.zero;
	export let name = k.empty;
    export let ancestry;
	const radius = k.dot_size;
	const diameter = radius * 2;
	const element_state = ux.elementState_forName(name);		// survives onDestroy, created by widget
	let dragWrapper!: Svelte_Wrapper;
	let svg_isRelated_path = k.empty;
	let svg_tinyDots_path = k.empty;
	let svg_dragDot_path = k.empty;
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
			const invert_flag = blink_flag && $s_showing_tools_ancestry && !!ancestry && ancestry.canConnect_toToolsAncestry;
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
			element_state.set_forHovering(ancestry.thing?.color, 'pointer');
		}
	}

	$: {
		if (!!thing && thing.id == $s_color_thing?.split(k.generic_separator)[0]) {
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
		if ($s_graph_type == Graph_Type.rings) {
			svg_dragDot_path = svgPaths.circle_atOffset(size, size - 1);
		} else {
			svg_dragDot_path = svgPaths.oval(size, false);
		}
		updateExtraSVGPaths();
	}

	function updateExtraSVGPaths() {
		svg_isRelated_path = svg_tinyDots_path = null;
		if (!!thing) {
			const count = thing.parents.length;		
			if (count > 1) {
				svg_tinyDots_path = svgPaths.ellipses(6, 0.5, false, count, size / 2);
			}
			if (thing.hasRelated) {
				svg_isRelated_path = svgPaths.circle_atOffset(size, 3, new Point(-4.5, 0));
			}
		}
	}

	function updateColors_forHovering(isOut) {
		if (!g.isAny_rotation_active) {
			isHovering = !isOut;
			const usePointer = (!ancestry.isGrabbed || $s_graph_type == Graph_Type.rings) && ancestry.hasChildRelationships && !g.isAny_rotation_active;
			const cursor = usePointer ? 'pointer' : 'normal';
			if (!!element_state && !!thing) {
				element_state.set_forHovering(thing.color, cursor);
				element_state.isOut = isOut;
			}
			redraws += 1;
		}
	}

	function hover_long_up_closure(mouse_state) {
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
			mouse_state_closure={hover_long_up_closure}>
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
							svg_path={svg_dragDot_path}
							fill={element_state.fill}
							stroke={thing?.color}
						/>
						{#if show.tinyDots}
							{#if svg_tinyDots_path}
								<SVGD3 name={'drag-inside-' + name + '-svg'}
									width={size}
									height={size}
									svg_path={svg_tinyDots_path}
									fill={element_state.stroke}
									stroke={element_state.stroke}
								/>
							{/if}
							{#if svg_isRelated_path}
								<SVGD3 name={'drag-related-' + name + '-svg'}
									width={size}
									height={size}
									svg_path={svg_isRelated_path}
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
