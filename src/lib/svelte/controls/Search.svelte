<script lang="ts">
	import { e, k, u, ux, Point, colors, layout, svgPaths } from '../../ts/common/Global_Imports';
	import { T_Filter, T_Search, T_Control } from '../../ts/common/Global_Imports';
	import { w_t_filter, w_t_search } from '../../ts/managers/Stores';
	import Close_Button from '../buttons/Close_Button.svelte';
	import Segmented from '../mouse/Segmented.svelte';
	import Button from '../buttons/Button.svelte';
	export let y_center: number;
	export let width: number;
	export let left: number;
	const left_widths = [18, 102];
	const right_widths = [10, 10.5, 130];
	const size_big = k.height.dot * 1.4;
	const lefts = u.cumulativeSum(left_widths);
	const rights = u.cumulativeSum(right_widths);
	const input_width = width - rights[2];
</script>

<div class="search">
	<div class='search-button'>
		{#if $w_t_search == T_Search.enter}
			<Segmented
				width={80}
				name='filter'
				selected={[$w_t_filter]}
				height={ k.height.button}
				origin={new Point(lefts[0], 1)}
				titles={[T_Filter.title, T_Filter.trait, T_Filter.tags]}
				handle_selection={(titles) => layout.handle_mode_selection('filter', titles)}/>
			<input class='search-input'
				type='text'
				placeholder={'enter ' + $w_t_filter + ' text'}
				style='
					top: 1px;
					font-size: 12px;
					left: {lefts[1]}px;
					position: absolute;
					width: {input_width}px;
					background-color: white;
					height: {k.height.button - 2}px;
					border: 1px solid lightgray;'/>
		{/if}
		{#if $w_t_search == T_Search.clear}
			<Button
				width={size_big}
				height={size_big}
				name={T_Control.search}
				center={new Point(width - rights[0], y_center)}
				s_button={ux.s_control_forType(T_Control.search)}
				closure={(s_mouse) => e.handle_s_mouseFor_t_control(s_mouse, T_Control.search)}>
				s
			</Button>
		{:else}
			<Close_Button
				name='end-search'
				align_left={true}
				size={size_big + 1}
				stroke_width={0.25}
				origin={Point.x(width - rights[1])}
				closure={() => $w_t_search = T_Search.clear}/>
		{/if}
	</div>
</div>

<style>
	.search-input::placeholder {
		color: gray;
	}
</style>
