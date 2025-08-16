<script lang="ts">
	import { e, k, u, ux, Point, colors, layout, svgPaths } from '../../ts/common/Global_Imports';
	import { T_Filter, T_Search, T_Control } from '../../ts/common/Global_Imports';
	import { w_t_filter, w_t_search } from '../../ts/managers/Stores';
	import Segmented from '../mouse/Segmented.svelte';
	import Button from '../buttons/Button.svelte';
	export let input_width: number;
	export let y_center: number;
	export let left: number;
	const widths = [left, 18, 90];
	const size_big = k.height.button + 4;
	const lefts = u.cumulativeSum(widths);
</script>

<div class="search">
	<div class='search-button'>
		<Button
			width={size_big}
			height={size_big}
			name={T_Control.search}
			center={new Point(lefts[0], y_center)}
			s_button={ux.s_control_forType(T_Control.search)}
			closure={(s_mouse) => e.handle_s_mouseFor_t_control(s_mouse, T_Control.search)}>
			{$w_t_search != T_Search.clear ? 'X' : 's'}
		</Button>
		{#if $w_t_search == T_Search.enter}
			<Segmented
				width={80}
				name='filter'
				selected={[$w_t_filter]}
				origin={Point.x(lefts[1])}
				titles={[T_Filter.titles, T_Filter.tags]}
				handle_selection={(titles) => layout.handle_mode_selection('filter', titles)}/>
			<input class='search-input'
				type='text'
				placeholder='search'
				style='
					top: 1px;
					font-size: 12px;
					left: {lefts[2]}px;
					position: absolute;
					width: {input_width}px;
					background-color: white;
					border: 1px solid lightgray;'/>
		{/if}
	</div>
</div>

<style>
	.search-input::placeholder {
		color: gray;
	}
</style>
