<script lang="ts">
	import { w_search_text, w_results_token, w_selected_row, w_background_color } from '../../ts/managers/Stores';
	import { colors, T_Search } from '../../ts/common/Global_Imports';
	import { search } from '../../ts/managers/Search';
	let element: HTMLDivElement;
	let results: Thing[] = [];

	$: {
		const _ = $w_results_token;
		results = search.results;
	}

	function handle_row_selected(event: MouseEvent, index: number) {
		event.preventDefault();
    	$w_selected_row = index;
		element?.focus();
	}

	function handle_key_down(event: KeyboardEvent) {
		switch (event.key.toLowerCase()) {
			case 'arrowup':		event.preventDefault(); next_row(false); break;
			case 'arrowdown':	event.preventDefault(); next_row(true); break;
		}
	}

	function next_row(up: boolean) {
		const row = $w_selected_row;
		if (row !== null) {
			const count = results.length;	// stupid, but it works
			$w_selected_row = row.increment(up, count);
			element?.focus();
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
			result += `<span style='background-color: ${colors.separator}'>${match}</span>`;
			lastIndex += searchText.length;
		}
		result += title.slice(lastIndex);
		return result;
	}

</script>

<div class='search-results' 
	on:keydown={handle_key_down}
	bind:this={element}
	tabindex='0'>
	{#key `${$w_background_color}:::${$w_selected_row}:::${$w_results_token}`}
		<ul>
			{#each results as result, index}
				<li class:selected={$w_selected_row === index}
					on:mousedown={(event) => handle_row_selected(event, index)}>
					{@html highlightMatch(result.title, $w_search_text)}
				</li>
			{/each}
		</ul>
	{/key}
</div>

<style>
	.search-results {
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
		padding: 0;
		margin: 0;
	}
	li {
		padding-right: 100px;
		white-space: nowrap;
		padding-left: 12px;
		cursor: pointer;
	}
	li:hover {
		background-color: #eee;
	}
	li.selected,
	li.selected:hover {
		background-color: pink;
	}
</style>
