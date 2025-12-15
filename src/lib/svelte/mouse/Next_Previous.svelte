<script lang='ts'>
	import { Point, S_Mouse, S_Element, T_Request, T_Direction, T_Action, T_Hit_Target } from '../../ts/common/Global_Imports';
	import { e, k, hits, colors, elements, svgPaths } from '../../ts/common/Global_Imports';
	import Identifiable from '../../ts/runtime/Identifiable';
	import { onMount, onDestroy } from 'svelte';
	export let closure: (column: number) => any;
	export let origin = Point.zero;
	export let has_title = false;
	export let name = k.empty;
	export let size = 24;
	const { w_s_hover, w_autorepeating_target } = hits;
	const base_titles = [T_Direction.previous, T_Direction.next];
	$: row_titles = has_title ? [name, ...base_titles] : base_titles;
	let button_elements: HTMLElement[] = [];
	let s_elements: S_Element[] = [];
	let autorepeat_events: (MouseEvent | null)[] = []; // Capture events for each button

	onMount(() => {
		row_titles.forEach((title, index) => {
			const s_element = elements.s_element_for(new Identifiable(`next-prev-${name}-${title}`), T_Hit_Target.button, title);
			s_elements[index] = s_element;
			if (button_elements[index]) {
				s_element.set_html_element(button_elements[index]);
			}
			s_element.handle_s_mouse = (s_mouse: S_Mouse): boolean => {
				return handle_s_mouse(s_mouse, index);
			};
			// Set up autorepeat for each button (always enabled for next-previous)
			s_element.detect_autorepeat = true;
			s_element.autorepeat_callback = () => {
				if (autorepeat_events[index]) {
					closure(index);
				}
			};
			s_element.autorepeat_id = index;
		});
	});

	onDestroy(() => {
		s_elements.forEach(s => hits.delete_hit_target(s));
	});

	$: index_forHover = s_elements.findIndex(s => s.isEqualTo($w_s_hover));
	$: isAutorepeating = (index: number) => s_elements[index]?.isEqualTo($w_autorepeating_target) ?? false;

	function handle_s_mouse(s_mouse: S_Mouse, index: number): boolean {
		if (s_mouse.isDown && s_mouse.event) {
			// Capture event for autorepeat callback
			autorepeat_events[index] = s_mouse.event;
			// Autorepeat is handled centrally by Hits.ts
		} else if (s_mouse.isUp) {
			autorepeat_events[index] = null;
			// Autorepeat stop is handled centrally by Hits.ts
		}
		return true;
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
			bind:this={button_elements[index]}
			class:held={isAutorepeating(index)}
			style='
				padding: 0;
				border: none;
				position:relative;
				width: {size - 5}px;
				height: {size + 5}px;
				background-color: transparent;'>
			<svg class='svg-glow-button-path'
				viewBox='0 0 {size} {size}'>
				<path
					stroke-width='0.75'
					stroke={colors.border}
					d={svgPaths.path_for(title, size + 3)}
					fill={index_forHover === index ? colors.hover_special_blend('black') : 'white'}/>
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
