<script lang='ts'>
	import { run } from 'svelte/legacy';

	import { c, k, u, ux, show, Rect, Size, Point, Thing, debug, layout, signals } from '../ts/common/Global_Imports';
	import { svgPaths, databases, Svelte_Wrapper, T_Alteration, T_SvelteComponent } from '../ts/common/Global_Imports';
	import { w_t_countDots, w_color_trigger, w_ancestries_grabbed } from '../ts/common/Stores';
	import { T_Layer, T_Tool, T_Graph, T_Element } from '../ts/common/Global_Imports';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import { w_background_color } from '../ts/common/Stores';
	import SVGD3 from '../kit/SVGD3.svelte';
	import { onMount } from 'svelte';
	interface Props {
		points_right?: boolean;
		name?: any;
		ancestry: any;
	}

	let { points_right = true, name = k.empty, ancestry }: Props = $props();
	const size = k.dot_size;
	const capture_size = size;
	const es_drag = $state(ux.s_element_forName(name));		// survives onDestroy, created by widget
	let center = $state(ancestry.g_widget.center_ofDrag);
	let svgPathFor_ellipses = $state(k.empty);
	let svgPathFor_related = $state(k.empty);
	let svgPathFor_dragDot = $state(k.empty);
	let dragWrapper!: Svelte_Wrapper = $state();
    let thing = $state(ancestry.thing);
	let isGrabbed = $state(false);
	let isHovering = $state(true);
	let mouse_click_timer;
	let drag_rebuilds = $state(0);
	let redraws = $state(0);
	let left = 0;
	let top = 0;
	let dotDrag = $state();

	svgPaths_update();
	updateColors_forHovering(true);

	function handle_context_menu(event) { event.preventDefault(); }		// no default context menu on right-click

    onMount(() => {
        const handle_altering = signals.handle_altering((blink_flag) => {
			const invert_flag = blink_flag && !!ancestry && ancestry.canConnect_toToolsAncestry;
			es_drag.isInverted = invert_flag;
			svgPaths_updateExtra();
        });
		const handle_reposition = signals.handle_reposition_widgets(2, (received_ancestry) => {
			if (!!dotDrag) {
				center = ancestry.g_widget.center_ofDrag;
				debug.log_reposition(`dotDrag [. . .] c: (${center.x.asInt()}, ${center.y.asInt()}) ${ancestry.title}`);
				drag_rebuilds += 1;
			}
		});
		return () => { handle_reposition.disconnect(); handle_altering.disconnect(); };
	});
	
;




	function handle_mouse_state(s_mouse: S_Mouse): boolean {
		return false;
	}

	function svgPaths_update() {
		if (layout.inRadialMode) {
			svgPathFor_dragDot = svgPaths.circle_atOffset(size, size - 1);
		} else {
			svgPathFor_dragDot = svgPaths.oval(size, false);
		}
		svgPaths_updateExtra();
	}

	function svgPaths_updateExtra() {
		svgPathFor_related = svgPathFor_ellipses = null;
		if (!!thing) {
			const count = thing.parents.length;		
			if (count > 1 && show.parent_dots) {
				svgPathFor_ellipses = svgPaths.ellipses(6, 0.5, false, count, size / 2);
			}
			if (thing.hasRelated && show.related_dots) {
				const x = (layout.inRadialMode ? 3.2 : 4.5) * (points_right ? -1 : 1);
				svgPathFor_related = svgPaths.circle_atOffset(size, 3, Point.x(x));
			}
		}
	}

	function updateColors_forHovering(isOut) {
		if (!ux.isAny_rotation_active) {
			isHovering = !isOut;
			const usePointer = (!ancestry.isGrabbed || layout.inRadialMode) && ancestry.hasChildRelationships && !ux.isAny_rotation_active;
			const cursor = usePointer ? 'pointer' : 'normal';
			if (!!es_drag && !!thing) {
				es_drag.set_forHovering(thing.color, cursor);
				es_drag.isOut = isOut;
			}
			redraws += 1;
		}
	}

	function handle_up_long_hover(s_mouse) {
		if (!ux.isAny_rotation_active) {
			if (s_mouse.isHover) {
				updateColors_forHovering(s_mouse.isOut);
			} else if (s_mouse.isLong) {
				ancestry?.becomeFocus();
			} else if (s_mouse.isUp) {
				const shiftKey = s_mouse.event?.shiftKey ?? false
				ancestry?.handle_singleClick_onDragDot(shiftKey);
			}
		}
	}

	run(() => {
		const _ = $w_t_countDots;
		svgPaths_update();
	});
	run(() => {
		if (!!ancestry) {
			thing = ancestry.thing;
		}
	});
	run(() => {
		if (!!thing && thing.id == $w_color_trigger?.split(k.generic_separator)[0]) {
			updateColors_forHovering(true);
		}
	});
	run(() => {
		if (!!dotDrag) {
			dragWrapper = new Svelte_Wrapper(dotDrag, handle_mouse_state, ancestry.hid, T_SvelteComponent.drag);
			es_drag.set_forHovering(ancestry.thing?.color, 'pointer');
		}
	});
	run(() => {
		const _ = $w_ancestries_grabbed;
		const grabbed = ancestry.isGrabbed;
		if (isGrabbed != grabbed) {
			isGrabbed = grabbed;
			updateColors_forHovering(!isHovering);
		}
	});
</script>

{#key drag_rebuilds}
	{#if es_drag}
		<Mouse_Responder
			center={center}
			name={es_drag.name}
			width={capture_size}
			height={capture_size}
			detect_longClick={true}
			handle_mouse_state={handle_up_long_hover}>
			<button class={name}
				bind:this={dotDrag}
				id={name}
				style='
					border:none;
					cursor:pointer;
					width:{size}px;
					height:{size}px;
					color:transparent;
					position:absolute;
					z-index:{T_Layer.dots};
					background-color:transparent;'>
				{#key redraws}
					<div id={'div-for-' + name}
						style='
							top:0px;
							left:0px;
							width:{size}px;
							height:{size}px;
							color:transparent;
							position:absolute;
							z-index:{T_Layer.dots};'>
						{#key $w_background_color}
							<SVGD3 name={'svg-' + name}
								width={size}
								height={size}
								stroke={thing?.color}
								svgPath={svgPathFor_dragDot}
								fill={debug.lines ? 'transparent' : es_drag.fill}
							/>
						{/key}
						{#if svgPathFor_ellipses}
							<SVGD3 name={'svg-inside-' + name}
								width={size}
								height={size}
								fill={es_drag.stroke}
								stroke={es_drag.stroke}
								svgPath={svgPathFor_ellipses}
							/>
						{/if}
						{#if svgPathFor_related}
							<SVGD3 name={'svg-related-' + name}
								width={size}
								height={size}
								stroke={thing?.color}
								fill={$w_background_color}
								svgPath={svgPathFor_related}
							/>
						{/if}
					</div>
				{/key}
			</button>
		</Mouse_Responder>
	{/if}
{/key}
