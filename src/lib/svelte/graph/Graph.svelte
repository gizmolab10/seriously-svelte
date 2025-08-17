<script lang='ts'>
	import { e, h, k, ux, Rect, Point, debug, layout, signals, colors, S_Component } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Graph, T_Signal, T_Startup, T_Control, T_Component } from '../../ts/common/Global_Imports';
	import { w_t_startup, w_ancestry_focus, w_device_isMobile, w_popupView_id } from '../../ts/managers/Stores';
	import { w_thing_fontFamily, w_dragging_active, w_ancestries_expanded } from '../../ts/managers/Stores';
	import { w_graph_rect, w_show_graph_ofType, w_user_graph_offset } from '../../ts/managers/Stores';
	import Tree_Preferences from './Tree_Preferences.svelte';
	import Identifiable from '../../ts/runtime/Identifiable';
	import Radial_Graph from '../graph/Radial_Graph.svelte';
	import Tree_Graph from '../graph/Tree_Graph.svelte';
	import Rubberband from '../draw/Rubberband.svelte';
	import Button from '../buttons/Button.svelte';
	import { onMount } from 'svelte';
	const size_big = k.height.button + 4;
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
		const _ = $w_graph_rect.description + $w_t_startup + $w_show_graph_ofType
		update_style();
	}

	$:	{
		const _ = $w_show_graph_ofType + $w_ancestry_focus?.id + $w_ancestries_expanded?.map(a => a.id).join(',')
		grand_layout_andReattach();
	}

	function grand_layout_andReattach() {
		if (!!h && h.hasRoot) {
			layout.grand_layout();
			debug.log_draw(`GRAPH grand_layout_andReattach`);
			reattachments += 1;
		}
	}
	
	function handle_mouseDown(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('button, input, .widget, .mouse-responder')) {
			rubberbandComponent.handleMouseDown(event);
			event.preventDefault();
			event.stopPropagation();
		}
	}
		
	function update_style() {
		draggableRect = $w_graph_rect;
		style=`
			top:0px;
			overflow: hidden;
			touch-action: none;
			position: absolute;
			pointer-events: auto;
			z-index: ${T_Layer.graph};
			width: ${draggableRect.size.width}px;
			height: ${draggableRect.size.height}px;
		`.removeWhiteSpace();
		debug.log_draw(`GRAPH update_style`);
		reattachments += 1;
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
			<Rubberband
				bounds={draggableRect}
				color={colors.rubberband}
				bind:this={rubberbandComponent}
				strokeWidth={k.thickness.rubberband}
			/>
		</div>
		{#if $w_show_graph_ofType == T_Graph.tree}
			<Tree_Preferences top={0} width={117} zindex={T_Layer.frontmost}/>
		{/if}
		<div class='bottom-controls'
			style='
				left:0px;
				position:absolute;
				top:{draggableRect.size.height - 28}px;'>
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
				origin={Point.x(draggableRect.size.width - 29)}
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