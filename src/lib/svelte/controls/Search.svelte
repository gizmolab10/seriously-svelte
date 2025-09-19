<script lang="ts">
	import { T_Search, T_Layer, T_Control, T_Preference, T_Search_Filter } from '../../ts/common/Global_Imports';
	import { e, h, k, p, u, ux, Thing, Point, colors, svgPaths } from '../../ts/common/Global_Imports';
	import { w_search_results_found, w_show_search_controls } from '../../ts/managers/Stores';
	import { w_search_filter, w_search_state } from '../../ts/managers/Stores';
	import { w_thing_fontFamily } from '../../ts/managers/Stores';
	import Close_Button from '../mouse/Close_Button.svelte';
	import Segmented from '../mouse/Segmented.svelte';
	import { search } from '../../ts/managers/Search';
	import Button from '../mouse/Button.svelte';
	export let width: number;
	export let left: number;
	export let top: number;
	const size_big = k.height.dot * 1.4;
	const right_widths = [10, 10.5, 66, 33, 60];
	const rights = u.cumulativeSum(right_widths);
	const widths = rights.map((right, index) => width - right);
	let input: HTMLInputElement;

	function handle_input(event) {
		const text = input.value;
		if (!!text) {
			p.write_key(T_Preference.search_text, text);
		}
		search.search_for(text.toLowerCase());
	}

</script>

<div class='search-controls'
	style='
		top: {top}px;
		left: {left}px;
		position: absolute;
		z-index: {T_Layer.frontmost};'>
	{#if $w_show_search_controls}
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
				height: {k.height.button + 2}px;
				font-family: {$w_thing_fontFamily};
				width: {widths[$w_search_results_found == 0 ? 3 : 4]}px;'/>
			{#if $w_search_results_found > 0}
				<div class='search-results-found'
					style='
						top: 4px;
						font-size: 12px;
						text-align: center;
						position: absolute;
						left: {widths[2] - 2}px;
						width: {right_widths[2]}px;
						font-family: {$w_thing_fontFamily};'>
					{$w_search_results_found} match{$w_search_results_found == 1 ? '' : 'es'}
				</div>
			{/if}
	{/if}
	{#if $w_search_state === T_Search.off}
		<Button
			border_thickness={0}
			width={size_big - 1}
			height={size_big - 1}
			name={T_Control.search}
			center={new Point(widths[0], 11)}
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
			origin={new Point(widths[1], 0.5)}/>
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
