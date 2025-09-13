<script lang="ts">
	import { T_Search_Filter, T_Search, T_Control, T_Preference } from '../../ts/common/Global_Imports';
	import { e, h, k, p, u, ux, Thing, Point, colors, svgPaths } from '../../ts/common/Global_Imports';
	import { w_search_filter, w_search_state, w_search_isActive } from '../../ts/managers/Stores';
	import { w_thing_fontFamily } from '../../ts/managers/Stores';
	import Close_Button from '../mouse/Close_Button.svelte';
	import Segmented from '../mouse/Segmented.svelte';
	import { search } from '../../ts/managers/Search';
	import Button from '../mouse/Button.svelte';
	export let width: number;
	export let left: number;
	const y_center = 10.5;
	const left_widths = [18, 102];
	const size_big = k.height.dot * 1.4;
	const right_widths = [10, 10.5, 96];
	const lefts = u.cumulativeSum(left_widths);
	const rights = u.cumulativeSum(right_widths);
	let input: HTMLInputElement;

	function handle_input(event) {
		const text = input.value;
		console.log('text', text);
		if (!!text) {
			p.write_key(T_Preference.search_text, text);
		}
		search.search_for(text.toLowerCase());
	}

</script>

<div class='search-controls' style='left: {left}px; position: absolute;'>
	{#if $w_search_isActive}
		<Segmented name='search-filter'
			width={80}
			origin={new Point(4, 1)}
			height={ k.height.button}
			selected={[$w_search_filter]}
			titles={[T_Search_Filter.title, T_Search_Filter.trait]}
			handle_selection={(titles) => ux.handle_choiceOf_t_graph('filter', titles)}/>
		<input class='search-input'
			id='search'
			type='search'
			bind:this={input}
			autocomplete='off'
			on:input={handle_input}
			bind:value={search.search_text}
			placeholder={'enter ' + $w_search_filter + ' text'}
			style='
				top: 1px;
				left: 88px;
				color: blue;
				font-size: 12px;
				padding-left: 6px;
				border-radius: 6px;
				position: absolute;
				background-color: white;
				border: 1px solid lightgray;
				width: {width - rights[2]}px;
				height: {k.height.button + 2}px;
				font-family: {$w_thing_fontFamily};'/>
	{/if}
	{#if $w_search_state === T_Search.off}
		<Button
			width={size_big}
			height={size_big}
			border_thickness={0}
			name={T_Control.search}
			center={new Point(width - rights[0], y_center)}
			s_button={ux.s_control_forType(T_Control.search)}
			closure={(s_mouse) => e.handle_s_mouseFor_t_control(s_mouse, T_Control.search)}>
			🔍
		</Button>
	{:else}
		<Close_Button
			name='end-search'
			align_left={true}
			size={size_big + 1}
			stroke_width={0.25}
			closure={() => search.deactivate()}
			origin={new Point(width - rights[1], -0.5)}/>
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
