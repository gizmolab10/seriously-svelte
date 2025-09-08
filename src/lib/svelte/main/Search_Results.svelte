<script lang="ts">
	import { w_search_text, w_results_token, w_selected_row, w_background_color } from '../../ts/managers/Stores';
	import { colors, T_Search } from '../../ts/common/Global_Imports';
	import { search } from '../../ts/managers/Search';
	let results = [];

	$: {
		const _ = $w_results_token;
		results = search.results;
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

{#key $w_background_color}
	<div class='search-results'>
		<ul>
			{#each results as result, index}
				<li 
					on:mousedown={() => $w_selected_row = index}
					class:selected={$w_selected_row === index}
				>{@html highlightMatch(result.title, $w_search_text)}</li>
			{/each}
		</ul>
	</div>
{/key}

<style>
	.search-results {
		position: absolute;
		padding-top: 8px;
		height: 100%;
		width: 100%;
	}
	ul {
		list-style: none;
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
		background-color: lightblue;
	}
</style>
