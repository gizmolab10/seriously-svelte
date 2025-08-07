<script lang='ts'>
	import { w_graph_rect, w_show_graph_ofType, w_user_graph_offset, w_thing_fontFamily } from '../../ts/common/Stores';
	import { S_Mouse, T_Layer, T_Graph, T_Startup, T_Control, T_Element } from '../../ts/common/Global_Imports';
	import { w_t_startup, w_ancestry_focus, w_device_isMobile, w_popupView_id } from '../../ts/common/Stores';
	import { c, h, k, ux, Rect, Point, debug, layout, signals } from '../../ts/common/Global_Imports';
	import Graph_Preferences from './Graph_Preferences.svelte';
	import Identifiable from '../../ts/runtime/Identifiable';
	import Radial_Graph from '../graph/Radial_Graph.svelte';
	import Tree_Graph from '../graph/Tree_Graph.svelte';
	import Button from '../buttons/Button.svelte';
	import { onMount } from 'svelte';
	const size_big = k.height.button + 4;
	let draggableRect = $w_graph_rect;
	let graph_reattachments = 0;
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
	/////////////////////////////////////////////
	
	onMount(() => {
		update_style();
		const handle_rebuild = signals.handle_rebuildGraph(1, (ancestry) => {
			layoutAnd_reattach();
		});
		return () => { handle_rebuild.disconnect(); };
	});
	
	$:	{
		const _ = $w_graph_rect + $w_t_startup + $w_show_graph_ofType
		update_style();
	}

	$:	{
		const _ = $w_show_graph_ofType + $w_device_isMobile + $w_ancestry_focus
		layoutAnd_reattach();
	}

	function layoutAnd_reattach() {
		if (!!h && h.hasRoot) {
			layout.grand_layout();
			graph_reattachments += 1;
		}
	}
		
	function update_style() {
		draggableRect = $w_graph_rect;
		style=`
			overflow: hidden;
			touch-action: none;
			position: absolute;
			pointer-events: auto;
			z-index: ${T_Layer.common};
			top:${draggableRect.origin.y}px;
			width: ${draggableRect.size.width}px;
			height: ${draggableRect.size.height}px;
		`.removeWhiteSpace();
		graph_reattachments += 1;
	}	

</script>

{#if $w_t_startup == T_Startup.ready}
	{#key graph_reattachments}
		<div
			style={style}
			class='draggable'
			bind:this={draggable}>
			<Graph_Preferences top={0} width={117} zindex={T_Layer.frontmost}/>
			{#if $w_show_graph_ofType == T_Graph.radial}
				<Radial_Graph/>
			{:else}
				<Tree_Graph/>
			{/if}
		</div>
		<div
			style='
				left:0px;
				position:absolute;
				top:{draggableRect.size.height + 12}px;'>
			<Button
				width=75
				height={size_big}
				origin={Point.x(14)}
				name={T_Control.builds}
				es_button={ux.s_control_forType(T_Control.builds)}
				closure={(s_mouse) => ux.handle_s_mouse_forControl_Type(s_mouse, T_Control.builds)}>
				<span style='font-family: {$w_thing_fontFamily};'>
					{'build ' + k.build_number}
				</span>
			</Button>
			<Button
				width={size_big}
				height={size_big}
				name={T_Control.help}
				origin={Point.x(draggableRect.size.width - 35)}
				es_button={ux.s_control_forType(T_Control.help)}
				closure={(s_mouse) => ux.handle_s_mouse_forControl_Type(s_mouse, T_Control.help)}>
				<span
					style='
						top:2px;
						left:6.5px;
						position:absolute;'>
					?
				</span>
			</Button>
		</div>
	{/key}
{/if}