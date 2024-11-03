<script lang='ts'>
	import { s_device_isMobile, s_user_graphOffset, s_showing_tools_ancestry } from '../../ts/state/Reactive_State';
	import { g, k, Rect, Point, debug, ZIndex, onMount, signals, Graph_Type } from '../../ts/common/Global_Imports';
	import { s_graphRect, s_graph_type, s_focus_ancestry } from '../../ts/state/Reactive_State';
	import Editing_Tools from '../widget/Editing_Tools.svelte';
	import Rings_Graph from '../rings/Rings_Graph.svelte';
	import Tree_Graph from '../tree/Tree_Graph.svelte';
	let draggableRect: Rect | null = null;
	let toolsOffset = Point.zero;
	let style = k.empty;
	let rebuilds = 0;
	let draggable;

	update_toolsOffset();
	
	onMount(() => {
		update_style();
		const handler = signals.handle_rebuildGraph(1, (ancestry) => {
			update_toolsOffset();
			debug.log_mount(` rebuild GRAPH`);
			rebuilds += 1;
		});
		return () => { handler.disconnect() };
	});

	$: {
		draggableRect = $s_device_isMobile ? $s_graphRect : $s_graphRect.atZero_forX;
		debug.log_action(` draggable ${draggableRect.description}`);
		update_toolsOffset();
		update_style();
		rebuilds += 1;
	}

	$: {
		const _ = $s_device_isMobile;
		setTimeout(() => {
			update_toolsOffset();
			update_style();
		}, 1);
	}

	function update_toolsOffset() {
		if ($s_graph_type == Graph_Type.rings) {
			toolsOffset = new Point(31, -545.3);
		} else {
			toolsOffset = Point.y(-18.3);
		}
	}

	function desktop_wheel(event) {
		event.preventDefault();
		if (!$s_device_isMobile) {
			const userOffset = $s_user_graphOffset;
			const delta = new Point(-event.deltaX, -event.deltaY);
			if (!!userOffset && g.allow_HorizontalScrolling && delta.magnitude > 1) {
				debug.log_action(` wheel GRAPH`);
				g.graphOffset_setTo(userOffset.offsetBy(delta));
				update_toolsOffset();
				rebuilds += 1;
			}
		}
	}

	function update_style() {
		style=`
			left: 0px;
			overflow: hidden;
			position: absolute;
			touch-action: none;
			pointer-events: auto;
			z-index: ${ZIndex.backmost};
			top:${draggableRect.origin.y - 9}px;
			width: ${draggableRect.size.width}px;
			height: ${draggableRect.size.height}px;
		`.removeWhiteSpace();
	}

</script>

{#key $s_focus_ancestry, rebuilds}
	<div class='draggable'
		on:wheel={desktop_wheel}
		bind:this={draggable}
		style={style}>
		{#if $s_graph_type == Graph_Type.rings}
			<Rings_Graph/>
		{:else}
			<Tree_Graph/>
		{/if}
		{#if $s_showing_tools_ancestry?.isVisible}
			<Editing_Tools offset={toolsOffset}/>
		{/if}
	</div>
{/key}