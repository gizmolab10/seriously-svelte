<script>
	import { onMount } from 'svelte';
	let dotsTitle = '';
	let browseTitle = '';
	let itemsTitle = '';
	let showingItems = true;
	let showingBrowse = false;
	let showingDots = false;
	let dots;
	let items;
	let browse;

	const updateTitles = () => {
		dotsTitle = showingDots ? 'How the <b>Dots</b> work' : 'Dots';
		browseTitle = showingBrowse ? '<b>Browsing</b> (changing which item is selected)' : 'Browsing';
		itemsTitle = showingItems ? 'When an item is <b>selected</b>' : 'Selection';
	}	

	const showItems = () => {
		showingItems = true;
		showingBrowse = false;
		showingDots = false;
		updateTitles();
	};

	const showBrowse = () => {
		showingItems = false;
		showingBrowse = true;
		showingDots = false;
		updateTitles();
	};

	const showDots = () => {
		showingItems = false;
		showingBrowse = false;
		showingDots = true;
		updateTitles();
	};

	onMount(() => {
		import('/src/lib/svelte/help/HelpItems.svelte').then(module => {
			items = module.default;
		});
		import('/src/lib/svelte/help/HelpBrowse.svelte').then(module => {
			browse = module.default;
		});
		import('/src/lib/svelte/help/HelpDots.svelte').then(module => {
			dots = module.default;
		});
		updateTitles();
	});
</script>

<div class='buttons-container'>
	<button class:selected={showingItems} on:click={showItems}>{@html itemsTitle}</button>
	<button class:selected={showingBrowse} on:click={showBrowse}>{@html browseTitle}</button>
	<button class:selected={showingDots} on:click={showDots}>{@html dotsTitle}</button>
</div>
{#if showingItems && items}
	<svelte:component this={items} />
{/if}
{#if showingBrowse && browse}
	<svelte:component this={browse} />
{/if}
{#if showingDots && dots}
	<svelte:component this={dots} />
{/if}

<style>
	button {
		height: 20px;
		border: 1px solid;
		border-radius: 0.5em;
		color: #b64b1d;
	}
	.selected {
		background-color: #def;
		color: black;
	}
	.buttons-container {
		display: flex;
		gap: 15px;
		margin-top: 20px;
		margin-bottom: 20px;
		justify-content: center;
	}
</style>
