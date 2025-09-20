<script lang='ts'>
	import { k, ux, Point, T_Layer, T_Search_Filter } from '../../ts/common/Global_Imports';
	import { w_search_filter } from '../../ts/managers/Stores';
	import Segmented from '../mouse/Segmented.svelte';
	export let zindex = T_Layer.graph;
	export let width = 137;
	export let top = 0;
	const back_up = -5;
	const left_width = 40;

</script>

<div class='search-filters' style='
	left: 3px;
	top: {top}px;
	height: 50px;
	z-index: {zindex};
	position: absolute;
	background-color: transparent;'>
	<Segmented name='search-filter'
		width={80}
		origin={new Point(4, 1)}
		height={ k.height.button}
		selected={[$w_search_filter]}
		titles={[T_Search_Filter.title, T_Search_Filter.trait]}
		handle_selection={(titles) => ux.handle_choiceOf_t_graph('filter', titles)}/>
</div>