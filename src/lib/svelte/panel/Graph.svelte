<script lang='ts'>
	import { g, k, Rect, Point, debug, ZIndex, onMount, signals } from '../../ts/common/Global_Imports';
	import { s_graphRect, s_show_rings, s_focus_ancestry } from '../../ts/state/Reactive_State';
	import { s_device_isMobile, s_user_graphOffset } from '../../ts/state/Reactive_State';
	import Rings_Graph from '../rings/Rings_Graph.svelte';
	import Tree_Graph from '../tree/Tree_Graph.svelte';
	let initialTouch: Point | null = null;
	let currentTouch: Point | null = null;
	let draggableRect: Rect | null = null;
	let style = k.empty;
	let rebuilds = 0;
	let draggable;

	onMount(() => {
		subscribeTo_events();
		update_style();
		const handler = signals.handle_rebuildGraph(1, (ancestry) => {
			debug.log_mount(` rebuild GRAPH`);
			rebuilds += 1;
		});
		return () => { handler.disconnect() };
	});

	$: { draggableRect = $s_device_isMobile ? $s_graphRect : $s_graphRect.atZero_forX; }

	$: {
		const _ = $s_device_isMobile;
		setTimeout(() => {
			subscribeTo_events();
			update_style();
		}, 1);
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

	function handle_touch_end(event: TouchEvent) {
		initialTouch = null;
		currentTouch = null;
	}

	function handle_touch_move(event: TouchEvent) {
		const quantity = event.touches.length;
		switch (quantity) {
			case 1: break;
			case 2:
				event.preventDefault();
				if (initialTouch && draggable) {
					const touch = event.touches[0];
					currentTouch = { x: touch.clientX, y: touch.clientY };
					const deltaX = currentTouch.x - initialTouch.x;
					const deltaY = currentTouch.y - initialTouch.y;
					draggable.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
					debug.log_action(` touch GRAPH`);
				}
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
				rebuilds += 1;
			}
		}
	}

	function subscribeTo_events() {
		if (draggable) {
			draggable.removeEventListener('touchstart', handle_touch_start);
			draggable.removeEventListener('touchmove', handle_touch_move);
			draggable.removeEventListener('touchend', handle_touch_end);
			if (g.device_isMobile) {
				debug.log_action(`  mobile subscribeGRAPH`);
				draggable.addEventListener('touchstart', handle_touch_start, { passive: false });
				draggable.addEventListener('touchmove', handle_touch_move, { passive: false });
				draggable.addEventListener('touchend', handle_touch_end, { passive: false });
			}
		}
	}

	function update_style() {
		style=`
			left: 0px;
			verflow: hidden;
			position: absolute;
			touch-action: none;
			pointer-events: auto;
			z-index: ${ZIndex.backmost};
			top:${draggableRect.origin.y - 9}px;
			height: ${draggableRect.size.height}px;
			width: ${draggableRect.size.width - 13}px;`
	}

</script>

{#key $s_focus_ancestry, rebuilds}
	{#if g.device_isMobile}
		<div id='draggable'
			bind:this={draggable}
			style={style}>
			{#if $s_show_rings}
				<Rings_Graph/>
			{:else}
				<Tree_Graph/>
			{/if}
		</div>
	{:else}
		<div id='draggable'
			bind:this={draggable}
			on:wheel={handle_wheel}
			style={style}>
			{#if $s_show_rings}
				<Rings_Graph/>
			{:else}
				<Tree_Graph/>
			{/if}
		</div>
	{/if}
{/key}