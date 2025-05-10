<script lang='ts'>
	import { c, k, u, ux, show, Rect, Size, Point, Thing, debug } from '../../ts/common/Global_Imports';
	import { E_Layer, E_Graph, E_Alteration, E_SvelteComponent } from '../../ts/common/Global_Imports';
	import { w_e_countDots, w_thing_color, w_ancestries_grabbed } from '../../ts/common/Stores';
	import { layout, signals, svgPaths, databases } from '../../ts/common/Global_Imports';
	import { w_s_alteration, w_background_color } from '../../ts/common/Stores';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import SVG_D3 from '../kit/SVG_D3.svelte';
	import { onMount } from 'svelte';
	export let points_right = true;
	export let name = k.empty;
    export let ancestry;
	const size = k.height.dot;
	const capture_size = size;
	const es_drag = ux.s_element_forName(name);		// created by widget
	let fill_color = debug.lines ? 'transparent' : es_drag.fill;
	let center = ancestry.g_widget.center_ofDrag;
	let ellipsis_color = es_drag.stroke;
	let svgPathFor_ellipses = k.empty;
	let svgPathFor_related = k.empty;
	let svgPathFor_dragDot = k.empty;
    let thing = ancestry.thing;
	let color = thing?.color;
	let isHovering = false;
	let mouse_click_timer;
	let left = 0;
	let top = 0;
	let dotDrag;

	svgPaths_update();
	colors_update();
	function handle_context_menu(event) { event.preventDefault(); }		// no default context menu on right-click
	function handle_s_mouse(s_mouse: S_Mouse): boolean { return false; }

	$: $w_e_countDots, svgPaths_update();
	$: $w_background_color, $w_thing_color, $w_ancestries_grabbed, colors_update();

    onMount(() => {
		es_drag.set_forHovering(thing?.color, 'pointer');
        const handle_altering = signals.handle_altering((s_alteration) => {
			const isInverted = !!s_alteration && !!ancestry && ancestry.alteration_isAllowed;
			es_drag.isInverted = isInverted;
			colors_update();
        });
		const handle_reposition = signals.handle_reposition_widgets(2, (received_ancestry) => {
			if (!!dotDrag) {
				center = ancestry.g_widget.center_ofDrag;
			}
		});
		return () => { handle_reposition.disconnect(); handle_altering.disconnect(); };
	});

	function svgPaths_update() {
		if (layout.inRadialMode) {
			svgPathFor_dragDot = svgPaths.circle_atOffset(size, size - 1);
		} else {
			svgPathFor_dragDot = svgPaths.oval(size, false);
		}
		svgPaths_updateExtra();
	}

	function colors_update() {
		if (!ux.isAny_rotation_active && !!es_drag && !!thing) {
			const usePointer = (!ancestry.isGrabbed || layout.inRadialMode) && ancestry.hasChildren;
			const cursor = usePointer ? 'pointer' : 'normal';
			es_drag.set_forHovering(thing.color, cursor);
			es_drag.isOut = !isHovering;
			color = thing.color;
			ellipsis_color = es_drag.stroke;
			fill_color = debug.lines ? 'transparent' : es_drag.fill;
		}
	}

	function svgPaths_updateExtra() {
		svgPathFor_related = svgPathFor_ellipses = null;
		if (!!thing) {
			const count = thing.parents.length;		
			if (count > 1 && show.parent_dots) {
				svgPathFor_ellipses = svgPaths.ellipses(6, 0.5, false, count, size / 2);
			}
			if (thing.hasRelated && show.related_dots) {
				const x = (layout.inRadialMode ? 5.2 : 4.5) * (points_right ? -1 : 1);
				svgPathFor_related = svgPaths.circle_atOffset(size, 3, Point.x(x));
			}
		}
	}

	function handle_up_long_hover(s_mouse) {
		if (!ux.isAny_rotation_active) {
			if (s_mouse.isHover) {
				isHovering = !s_mouse.isOut;
				colors_update();
			} else if (s_mouse.isLong) {
				ancestry?.becomeFocus();
			} else if (s_mouse.isUp) {
				const shiftKey = s_mouse.event?.shiftKey ?? false
				ancestry?.handle_singleClick_onDragDot(shiftKey);
			}
		}
	}

</script>

{#if es_drag}
	<Mouse_Responder
		center={center}
		name={es_drag.name}
		width={capture_size}
		height={capture_size}
		detect_longClick={true}
		handle_s_mouse={handle_up_long_hover}>
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
				z-index:{E_Layer.dots};
				background-color:transparent;'>
			<div id={'div-for-' + name}
				style='
					top:0px;
					left:0px;
					width:{size}px;
					height:{size}px;
					color:transparent;
					position:absolute;
					z-index:{E_Layer.dots};'>
				<SVG_D3 name={'svg-' + name}
					width={size}
					height={size}
					stroke={color}
					fill={fill_color}
					svgPath={svgPathFor_dragDot}/>
				{#if svgPathFor_ellipses}
					<SVG_D3 name={'svg-inside-' + name}
						width={size}
						height={size}
						fill={ellipsis_color}
						stroke={ellipsis_color}
						svgPath={svgPathFor_ellipses}/>
				{/if}
				{#if svgPathFor_related}
					<SVG_D3 name={'svg-related-' + name}
						width={size}
						height={size}
						stroke={color}
						fill={$w_background_color}
						svgPath={svgPathFor_related}/>
				{/if}
			</div>
		</button>
	</Mouse_Responder>
{/if}
