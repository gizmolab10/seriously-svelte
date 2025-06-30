<script lang='ts'>
	import { k, Point, colors, svgPaths, S_Mouse, T_Request, T_Direction, T_Action, e, ux } from '../../ts/common/Global_Imports';
	import Buttons_Row from '../buttons/Buttons_Row.svelte';
	export let separator_thickness = k.thickness.separator.thick;
	export let closure: (column: number) => any;
	export let height = k.height.controls;
	export let has_seperator = false;
	export let origin = Point.zero;
	export let has_both_ends = true;
	export let has_title = false;
	export let has_gull_wings = true;
	export let name = k.empty;
	export let size = 24;
	const base_titles = [T_Direction.previous, T_Direction.next];
	$: row_titles = has_title ? [name, ...base_titles] : base_titles;
	let hoveredIndex = -1;
	
	// Use the existing Events system for autorepeat
	let heldButtonIndex = -1;
	let autorepeatTimer: NodeJS.Timeout | null = null;

	function startAutorepeat(index: number) {
		heldButtonIndex = index;
		closure(index); // Immediate action
		autorepeatTimer = setInterval(() => closure(index), k.autorepeat_interval);
	}

	function stopAutorepeat() {
		if (autorepeatTimer) {
			clearInterval(autorepeatTimer);
			autorepeatTimer = null;
		}
		heldButtonIndex = -1;
	}

</script>

<div
	class='{name}-next-previous'
	style='
		top: -7.5px;
		display:flex;
		position:absolute;
		left: {origin.x}px;
		flex-direction:row;
		align-items:center;'>
	{#each row_titles as title, index}
		<button
			class='{name}-{title}-button'
			class:held={heldButtonIndex === index}
			style='
				padding: 0;
				border: none;
				position:relative;
				width: {size - 5}px;
				height: {size + 5}px;
				background-color: transparent;'
			on:mousedown={() => startAutorepeat(index)}
			on:mouseup={stopAutorepeat}
			on:mouseleave={stopAutorepeat}
			on:mouseenter={() => hoveredIndex = index}>
			<svg
				class='svg-glow-button-path'
				viewBox='0 0 {size} {size}'>
				<path
					stroke-width='0.75'
					stroke={colors.border}
					d={svgPaths.path_for(title, size + 3)}
					fill={hoveredIndex === index ? 'black' : 'white'}/>
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
