<script lang="ts">
	import { w_search_results_changed, w_search_result_row, w_show_search_controls } from '../../ts/managers/Stores';
	import { w_search_state, w_separator_color } from '../../ts/managers/Stores';
	import { u, ux, Thing,colors, T_Search } from '../../ts/common/Global_Imports';
	import { search } from '../../ts/managers/Search';
	let element: HTMLDivElement;
	let results: Thing[] = [];

	$: $w_search_results_changed, results = search.results;
	$: $w_search_result_row, ux.element_set_focus_to(element);

	function handle_row_selected(event: MouseEvent, index: number) {
		u.grab_event(event);
		search.set_result_row(index);
	}

	function highlightMatch(title: string, searchText: string) {
		if (!searchText) return title;
		const parts = title.toLowerCase().split(searchText.toLowerCase());
		if (parts.length === 1) return title;
		let lastIndex = 0;
		let result = '';
		for (let i = 0; i < parts.length - 1; i++) {
			const part = parts[i];
			lastIndex += part.length;
			result += title.slice(lastIndex - part.length, lastIndex);
			const match = title.slice(lastIndex, lastIndex + searchText.length);
			result += `<span style='background-color: ${$w_separator_color}'>${match}</span>`;
			lastIndex += searchText.length;
		}
		result += title.slice(lastIndex);
		return result;
	}

</script>

<div class='search-results' 
	tabindex='0'>
	{#key `${$w_separator_color}:::${$w_search_result_row}:::${$w_search_results_changed}`}
		<ul bind:this={element}>
			{#each results as result, index}
				<li class:selected={$w_search_result_row === index} style='color: {result.color}'
					on:mousedown={(event) => handle_row_selected(event, index)}>
					<span>{@html highlightMatch(result.title, search.search_text)}</span>
				</li>
			{/each}
		</ul>
	{/key}
</div>

<style>
	.search-results {
		overflow: hidden; /* Prevent content from spilling outside */
		outline: none !important;
		position: absolute;
		padding-top: 8px;
        z-index: 100;
		height: 100%;
		width: 100%;
	}
	ul {
		list-style: none;
		outline: none;
		width: 100%;
		padding: 0;
		margin: 0;
	}
	li {
		box-sizing: border-box;
		white-space: nowrap;
		padding: 0 12px;
		cursor: pointer;
		width: 100%;
	}
	li span {
		text-overflow: ellipsis;
		display: inline-block;
		overflow: hidden;
		max-width: 100%;
	}
	li.selected,
	li.selected:hover {
		background-color: #ccc;
	}
	li:hover {
		background-color: #eee;
	}
</style>
