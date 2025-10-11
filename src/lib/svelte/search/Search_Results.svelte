<script lang="ts">
	import { w_search_results_changed, w_search_show_controls } from '../../ts/managers/Stores';
	import { w_rect_ofGraphView, w_search_state, w_separator_color } from '../../ts/managers/Stores';
	import { k, u, elements, x, Thing, colors, T_Search } from '../../ts/common/Global_Imports';
	import { search } from '../../ts/ux/UX_Search';
	import { derived } from 'svelte/store';
	const { w_index: results_index } = x.si_found;
	let element: HTMLDivElement;
	let results: Thing[] = [];
	
	$: $w_search_results_changed, results = x.si_found.items;

	$: {
		const row = $results_index;
		let selected_row: HTMLElement | null = null;
		if (row !== null && !!element) {
			selected_row = element.children[row] as HTMLElement;
		}
		elements.element_set_focus_to(element);
		selected_row?.scrollIntoView({ block: 'nearest' });
	}

	function handle_row_selected(event: MouseEvent, index: number) {
		const prior_row = $results_index;
		if (prior_row !== null && prior_row === index) {
			search.deactivate_focus_and_grab();
		} else {
			search.selected_row = event.shiftKey ? null : index;
			u.grab_event(event);
		}
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
	<ul bind:this={element}>
		{#key `${$w_separator_color}:::${$results_index}:::${$w_search_results_changed}`}
			{#each results as result, index}
				<li class:selected={$results_index === index} style='color: {result.color}'
					on:mousedown={(event) => handle_row_selected(event, index)}>
					<span>{@html highlightMatch(result.title, search.search_text)}</span>
				</li>
			{/each}
		{/key}
	</ul>
</div>

<style>
	.search-results {
		outline: none !important;
		position: absolute;
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
		background-color: lightblue;
	}
	li:hover {
		background-color: #eee;
	}
</style>
