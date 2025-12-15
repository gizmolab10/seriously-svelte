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
	const { w_s_hover } = hits;
	const base_titles = [T_Direction.previous, T_Direction.next];
	const mouseTimer = e.mouse_timer_forName(`next-previous-${name}`);
	$: row_titles = has_title ? [name, ...base_titles] : base_titles;
	let button_elements: HTMLElement[] = [];
	let s_elements: S_Element[] = [];

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
		});
	});

	onDestroy(() => {
		s_elements.forEach(s => hits.delete_hit_target(s));
	});

	$: index_forHover = s_elements.findIndex(s => s.isEqualTo($w_s_hover));

	// stop autorepeat when hover leaves all buttons
	$: if (index_forHover === -1) {
		mouseTimer.autorepeat_stop();
	
	}

	function handle_s_mouse(s_mouse: S_Mouse, index: number): boolean {
		if (s_mouse.isDown) {
			mouseTimer.autorepeat_start(index, () => closure(index));
		} else if (s_mouse.isUp) {
			mouseTimer.autorepeat_stop();
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
			class:held={mouseTimer.isAutorepeating_forID(index)}
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
