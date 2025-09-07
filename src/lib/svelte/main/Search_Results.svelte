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
	{#each results as result}
		{result.title}
	{/each}
</div>

<style>
	.search {
		position: absolute;
		height: 100%;
		width: 100%;
		left: 8px;
		top: 8px;
	}
</style>
