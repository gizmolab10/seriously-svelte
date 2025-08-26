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
</script>

<div class='search' style='left: {left}px; position: absolute;'>
	<Segmented name='filter'
		width={80}
		selected={[$w_t_filter]}
		height={ k.height.button}
		origin={new Point(22, 1)}
		titles={[T_Filter.title, T_Filter.trait, T_Filter.tags]}
		handle_selection={(titles) => layout.handdle_choiceOf_t_graph('filter', titles)}/>
	<input class='search-input'
		type='text'
		placeholder={'enter ' + $w_t_filter + ' text'}
		style='
			top: 1px;
			left: 124px;
			font-size: 12px;
			width: {width}px;
			border-radius: 4px;
			position: absolute;
			background-color: white;
			border: 1px solid lightgray;
			height: {k.height.button - 2}px;'/>
</div>

<style>
	.search-input::placeholder {
		color: lightblue;
	}
	.search-input:focus::placeholder {
		color: transparent;
	}
	.search-input:focus {
		outline: none;
		border: 1px dashed blue !important;
	}
</style>
