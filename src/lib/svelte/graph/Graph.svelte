<script lang='ts'>
	import { e, h, k, u, ux, Rect, Point, debug, layout, signals, colors, S_Component } from '../../ts/common/Global_Imports';
	import { w_graph_rect, w_show_graph_ofType, w_user_graph_offset, w_depth_limit } from '../../ts/managers/Stores';
	import { T_Layer, T_Graph, T_Signal, T_Startup, T_Control, T_Component } from '../../ts/common/Global_Imports';
	import { w_t_startup, w_device_isMobile, w_popupView_id } from '../../ts/managers/Stores';
	import { w_ring_rotation_angle, w_ring_rotation_radius } from '../../ts/managers/Stores';
	import { w_thing_fontFamily, w_dragging_active } from '../../ts/managers/Stores';
	import { w_ancestry_focus, w_s_title_edit } from '../../ts/managers/Stores';
	import Identifiable from '../../ts/runtime/Identifiable';
	import Radial_Graph from '../graph/Radial_Graph.svelte';
	import Tree_Graph from '../graph/Tree_Graph.svelte';
	import Rubberband from '../draw/Rubberband.svelte';
	import Button from '../mouse/Button.svelte';
	import { onMount } from 'svelte';
	const size_big = k.height.button + 4;
	const { w_items: w_expanded } = ux.si_expanded;
	let actual_content_rect = layout.user_offset_rect_ofDrawnGraph;
	let draggableRect = $w_graph_rect;
	let rubberbandComponent: any;
	let reattachments = 0;
	let style = k.empty;
	let draggable;

	//////////////////////////////////////////////
	//											//
	//	reattaches components on/changes to:	//
	//											//
	//		signal_rebuildGraph					//
	//		w_ancestry_focus					//
	//											//
	//	SHOULD only reposition for:				//
	//											//
	//		w_user_graph_offset					//
	//		w_graph_rect						//
	//											//
	//////////////////////////////////////////////
	
	onMount(() => {
		update_style();
	});
	
	$:	{
		const _ = `${$w_graph_rect.description}:::${$w_t_startup}:::${$w_show_graph_ofType}`;
		update_style();
	}

	$:	{
		const _ = `${$w_show_graph_ofType}:::${$w_ancestry_focus?.titles.join(',')}:::${u.description_byTitles($w_expanded)}`;
		grand_layout_andReattach();
	}

	$: {
		const _ = `${$w_user_graph_offset.description}:::${$w_graph_rect.description}:::${$w_depth_limit}:::${$w_s_title_edit?.t_edit}:::${$w_ring_rotation_angle}:::${$w_ring_rotation_radius}`;
		actual_content_rect = layout.user_offset_rect_ofDrawnGraph;
	}

	function grand_layout_andReattach() {
		if (!!h && h.hasRoot) {
			layout.grand_layout();
			debug.log_draw(`GRAPH grand_layout_andReattach`);
			actual_content_rect = layout.user_offset_rect_ofDrawnGraph;
			reattachments += 1;
		}
	}
	
	function handle_mouseDown(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('button, input, .widget, .mouse-responder')) {
			rubberbandComponent.handleMouseDown(event);
			u.grab_event(event);
		}
	}
		
	function update_style() {
		draggableRect = $w_graph_rect;
		const root = document.documentElement;
		root.style.setProperty('--graph-x', `${draggableRect.origin.x}px`);
		root.style.setProperty('--graph-y', `${draggableRect.origin.y}px`);
		style=`
			overflow: hidden;
			touch-action: none;
			position: absolute;
			pointer-events: auto;
			z-index: ${T_Layer.graph};
			width: ${draggableRect.size.width}px;
			height: ${draggableRect.size.height}px;
		`.removeWhiteSpace();
	}	

</script>

{#key reattachments}
	{#if $w_t_startup == T_Startup.ready}
		<div class='draggable'
			style={style}
			bind:this={draggable}
			on:mousedown={handle_mouseDown}
			class:rubberband-active={$w_dragging_active}>
			{#if $w_show_graph_ofType == T_Graph.radial}
				<Radial_Graph/>
			{:else}
				<Tree_Graph/>
			{/if}
			{#if debug.graph}
				<div class='debug-graph-content'
					style='
						position: absolute;
						border: 4px dashed lightblue;
						z-index: ${T_Layer.frontmost};
						background-color: transparent;
						top: {actual_content_rect.origin.y}px;
						left: {actual_content_rect.origin.x}px;
						width: {actual_content_rect.size.width}px;
						height: {actual_content_rect.size.height}px;
					'>
				</div>
			{/if}
			<Rubberband
				bounds={draggableRect}
				bind:this={rubberbandComponent}
				strokeWidth={k.thickness.rubberband}
			/>
		</div>
		<div class='bottom-controls'
			style='
				position:absolute;
				top:{draggableRect.size.height - 34}px;'>
			<Button
				width=75
				height={size_big}
				origin={Point.x(8)}
				name={T_Control.builds}
				s_button={ux.s_control_forType(T_Control.builds)}
				closure={(s_mouse) => e.handle_s_mouseFor_t_control(s_mouse, T_Control.builds)}>
				<span style='font-family: {$w_thing_fontFamily};'>
					{'build ' + k.build_number}
				</span>
			</Button>
			<Button
				width={size_big}
				height={size_big}
				name={T_Control.help}
				origin={Point.x(draggableRect.size.width - 34)}
				s_button={ux.s_control_forType(T_Control.help)}
				closure={(s_mouse) => e.handle_s_mouseFor_t_control(s_mouse, T_Control.help)}>
				<span
					style='
						top:2px;
						left:6.5px;
						position:absolute;'>
					?
				</span>
			</Button>
		</div>
	{/if}
{/key}

<style>

	:global(body.rubberband-active) {
		cursor: crosshair !important;
		user-select: none !important;
		-ms-user-select: none !important;
		-moz-user-select: none !important;
		-webkit-user-select: none !important;
	}
</style>