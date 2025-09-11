<script lang="ts">
	import { w_search_text, w_search_filter, w_search_state, w_thing_fontFamily } from '../../ts/managers/Stores';
	import { T_Search_Filter, T_Search, T_Control, T_Preference } from '../../ts/common/Global_Imports';
	import { e, h, k, u, ux, Thing, Point, colors, svgPaths } from '../../ts/common/Global_Imports';
	import Close_Button from '../buttons/Close_Button.svelte';
	import { search } from '../../ts/managers/Search';
	import Segmented from '../mouse/Segmented.svelte';
	import Button from '../buttons/Button.svelte';
	export let width: number;
	export let left: number;
	const left_widths = [18, 102];
	const size_big = k.height.dot * 1.4;
	const right_widths = [10, 10.5, 130];
	const lefts = u.cumulativeSum(left_widths);
	const rights = u.cumulativeSum(right_widths);

</script>

<div class='search-controls' style='left: {left}px; position: absolute;'>
	<Segmented name='search-filter'
		width={80}
		origin={new Point(4, 1)}
		height={ k.height.button}
		selected={[$w_search_filter]}
		titles={[T_Search_Filter.title, T_Search_Filter.trait]}
		handle_selection={(titles) => ux.handle_choiceOf_t_graph('filter', titles)}/>
	<input class='search-input'
		id='search'
		type='text'
		autocomplete='off'
		bind:value={$w_search_text}
		placeholder={'enter ' + $w_search_filter + ' text'}
		style='
			top: 1px;
			left: 88px;
			color: blue;
			font-size: 12px;
			width: {width}px;
			padding-left: 6px;
			border-radius: 4px;
			position: absolute;
			background-color: white;
			border: 1px solid lightgray;
			height: {k.height.button - 2}px;
			font-family: {$w_thing_fontFamily};'/>
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
