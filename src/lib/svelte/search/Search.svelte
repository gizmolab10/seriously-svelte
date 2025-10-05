<script lang='ts'>
	import { T_Search, T_Layer, T_Element, T_Preference, T_Search_Preference } from '../../ts/common/Global_Imports';
	import { w_search_state, w_search_preferences, w_search_results_found } from '../../ts/managers/Stores';
	import { w_graph_rect, w_show_details, w_thing_fontFamily } from '../../ts/managers/Stores';
	import { k, p, ux, Point, search, ux_common } from '../../ts/common/Global_Imports';
	import Segmented from '../mouse/Segmented.svelte';
	export let zindex = T_Layer.graph;
	export let width = 80;
	export let top = 0;
	const left_width = 180;
	const s_search = ux.s_element_for(null, T_Element.search, k.empty);
	let graph_width = $w_graph_rect.size.width - ($w_show_details ? 0 : 5);
	let search_width = graph_width - left_width;
	let input: HTMLInputElement;

	$: if (!!input) {
		s_search.html_element = input;				// so s_element_set_focus_to will work
	}

	$: {
		graph_width = $w_graph_rect.size.width + ($w_show_details ? 0 : 5);
		width = graph_width - left_width;
	}

	$: if ($w_search_state != T_Search.enter) {
		setTimeout(() => {
			ux.s_element_set_focus_to(s_search);	// so 'f' will not be added to the input
		}, 1);
	}

	function handle_input(event) {
		const text = input.value;
		if (!!text) {
			p.write_key(T_Preference.search_text, text);
		}
		search.search_for(text.toLowerCase());
	}

</script>

<div class='search-preferences' style='
	top: {top}px;
	height: 25px;
	z-index: {zindex};
	position: absolute;
	width: {graph_width}px;
	background-color: transparent;'>
	<Segmented name='search-filter'
		width={width}
		left={62}
		origin={new Point(-12, 1)}
		height={ k.height.button}
		selected={[$w_search_preferences]}
		titles={[T_Search_Preference.title, T_Search_Preference.trait]}
		handle_selection={(titles) => ux_common.handle_choiceOf_t_graph('filter', titles)}/>
	<input class='search-input'
		id='search'
		type='search'
		bind:this={input}
		autocomplete='off'
		on:input={handle_input}
		bind:value={search.search_text}
		placeholder={'enter ' + $w_search_preferences + ' text'}
		style='
			top: 1px;
			left: 94px;
			color: blue;
			font-size: 12px;
			padding-left: 6px;
			border-radius: 6px;
			position: absolute;
			width: {search_width}px;
			background-color: white;
			border: 1px solid lightgray;
			height: {k.height.button + 2}px;
			font-family: {$w_thing_fontFamily};'/>
	{#if $w_search_results_found > 0}
		<div class='search-results-found'
			style='
				top: 4px;
				width: 100px;
				font-size: 12px;
				text-align: center;
				position: absolute;
				left: {search_width + 84}px;
				font-family: {$w_thing_fontFamily};'>
			{$w_search_results_found} match{$w_search_results_found == 1 ? '' : 'es'}
		</div>
	{/if}
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
