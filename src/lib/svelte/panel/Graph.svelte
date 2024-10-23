<script lang='ts'>
	import { s_device_isMobile, s_user_graphOffset, s_showing_tools_ancestry } from '../../ts/state/Reactive_State';
	import { g, k, Rect, Point, debug, ZIndex, onMount, signals } from '../../ts/common/Global_Imports';
	import { s_graphRect, s_show_rings, s_focus_ancestry } from '../../ts/state/Reactive_State';
	import Editing_Tools from '../widget/Editing_Tools.svelte';
	import Rings_Graph from '../rings/Rings_Graph.svelte';
	import Tree_Graph from '../tree/Tree_Graph.svelte';
	let draggableRect: Rect | null = null;
	let initialTouch: Point | null = null;
	let toolsOffset = Point.zero;
	let style = k.empty;
	let rebuilds = 0;
	let draggable;

	subscribeTo_events();
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
			subscribeTo_events();
			update_toolsOffset();
			update_style();
		}, 1);
	}

	function handle_touch_end(event: TouchEvent) {
		initialTouch = null;
	}

	function update_toolsOffset() {
		if ($s_show_rings) {
			toolsOffset = new Point(31, -545.3);
		} else {
			toolsOffset = new Point(0, -18.3);
		}
	}

	function handle_touch_start(event: TouchEvent) {
		const quantity = event.touches.length;
		switch (quantity) {
			case 1: break;
			case 2:
				const touch = event.touches[0];
				initialTouch = { x: touch.clientX, y: touch.clientY };
				debug.log_action(` ${quantity} touches GRAPH`);
		}
	}

	function handle_wheel(event) {
		event.preventDefault();
		if (!g.device_isMobile) {
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

	function subscribeTo_events() {
		if (draggable) {
			draggable.removeEventListener('touchend', handle_touch_end);
			draggable.removeEventListener('touchmove', handle_touch_move);
			draggable.removeEventListener('touchstart', handle_touch_start);
			if (g.device_isMobile) {
				debug.log_action(`  mobile subscribeGRAPH`);
				draggable.addEventListener('touchend', handle_touch_end, { passive: false });
				draggable.addEventListener('touchmove', handle_touch_move, { passive: false });
				draggable.addEventListener('touchstart', handle_touch_start, { passive: false });
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

	function handle_touch_move(event: TouchEvent) {
		const quantity = event.touches.length;
		switch (quantity) {
			case 1: break;
			case 2:
				event.preventDefault();
				if (initialTouch && draggable) {
					const touch = event.touches[0];
					const deltaX = touch.clientX - initialTouch.x;
					const deltaY = touch.clientY - initialTouch.y;
					draggable.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
					debug.log_action(` touch GRAPH`);
				}
				break;
		}
	}

</script>

{#key $s_focus_ancestry, rebuilds}
	{#if g.device_isMobile}
		<div class='mobile-draggable'
			bind:this={draggable}
			style={style}>
			{#if $s_show_rings}
				<Rings_Graph/>
			{:else}
				<Tree_Graph/>
			{/if}
			{#if $s_showing_tools_ancestry?.isVisible}
				<Editing_Tools offset={toolsOffset}/>
			{/if}
		</div>
	{:else}
		<div class='desktop-draggable'
			on:wheel={handle_wheel}
			bind:this={draggable}
			style={style}>
			{#if $s_show_rings}
				<Rings_Graph/>
			{:else}
				<Tree_Graph/>
			{/if}
			{#if $s_showing_tools_ancestry?.isVisible}
				<Editing_Tools offset={toolsOffset}/>
			{/if}
		</div>
	{/if}
{/key}