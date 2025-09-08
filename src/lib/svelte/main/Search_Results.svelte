<script lang="ts">
	import { w_results_token } from '../../ts/managers/Stores';
	import { T_Search } from '../../ts/common/Global_Imports';
	import { search } from '../../ts/managers/Search';
	let results = [];

	$: {
		const _ = $w_results_token;
		results = search.results;
	}
</script>

<div class="search">
	<ul>
		{#each results as result}
			<li>{result.title}</li>
		{/each}
	</ul>
</div>

<style>
	.search {
		position: absolute;
		height: 100%;
		width: 100%;
		top: 8px;
	}
	ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	li {
		padding-left: 12px;
	}
	li:hover {
		background-color: #eee;
	}
</style>
