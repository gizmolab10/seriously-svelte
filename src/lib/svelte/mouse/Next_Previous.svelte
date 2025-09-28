<script lang='ts'>
	import { k, Point, colors, svgPaths, S_Mouse, T_Request, T_Direction, T_Action, e, ux } from '../../ts/common/Global_Imports';
	import Buttons_Row from '../mouse/Buttons_Row.svelte';
	import Mouse_Timer from '../../ts/signals/Mouse_Timer';
	export let closure: (column: number) => any;
	export let origin = Point.zero;
	export let has_title = false;
	export let name = k.empty;
	export let size = 24;
	const base_titles = [T_Direction.previous, T_Direction.next];
	const mouseTimer = e.mouse_timer_forName(`next-previous-${name}`);
	$: row_titles = has_title ? [name, ...base_titles] : base_titles;
	let index_forHover = -1;

	function autorepeat_stop() {
		mouseTimer.autorepeat_stop();
	}

	function autorepeat_start(index: number) {
		mouseTimer.autorepeat_start(index, () => closure(index));
	}

	function update_index_forHover(index: number) {
		index_forHover = index;
		if (index === -1) {
			mouseTimer.autorepeat_stop();	// if user drifts off button, won't get mouse up, so stop autorepeat
		}
	}

</script>

<div class='{name}-next-previous'
	style='
		top: -7.5px;
		display:flex;
		position:absolute;
		left: {origin.x}px;
		flex-direction:row;
		align-items:center;'>
	{#each row_titles as title, index}
		<button class='{name}-{title}-button'
			class:held={mouseTimer.isAutorepeating_forID(index)}
			style='
				padding: 0;
				border: none;
				position:relative;
				width: {size - 5}px;
				height: {size + 5}px;
				background-color: transparent;'
			on:mouseup={autorepeat_stop}
			on:mousedown={() => autorepeat_start(index)}
			on:mouseleave={() => update_index_forHover(-1)}
			on:mouseenter={() => update_index_forHover(index)}>
			<svg class='svg-glow-button-path'
				viewBox='0 0 {size} {size}'>
				<path
					stroke-width='0.75'
					stroke={colors.border}
					d={svgPaths.path_for(title, size + 3)}
					fill={index_forHover === index ? k.faint_hover : 'white'}/>
			</svg>
		</button>
	{/each}
</div>

<style>
	button.held {
		transform: scale(0.95);
		transition: transform 0.1s ease;
	}
</style>
