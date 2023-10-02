<script>
	import { onMount } from 'svelte';

	let dots;
	let focus;
	let browse;
	let selection;
	let dotsTitle = '';
	let focusTitle = '';
	let browseTitle = '';
	let selectionTitle = '';
	let showingDots = false;
	let showingFocus = false;
	let showingBrowse = false;
	let showingSelection = true;

	const updateTitles = () => {
		dotsTitle = showingDots ? 'How the <b>Dots</b> work' : 'Dots';
		focusTitle = showingFocus ? 'Changing the <b>Focus</b>' : 'Focus';
		browseTitle = showingBrowse ? '<b>Browsing</b> (changing which item is <b>selected</b>)' : 'Browse';
		selectionTitle = showingSelection ? 'When a item is <b>selected</b>' : 'Select';
	}

	const showDots = () => {
		showingDots = true;
		showingFocus = false;
		showingBrowse = false;
		showingSelection = false;
		updateTitles();
	};
	
	const showSelection = () => {
		showingDots = false;
		showingFocus = false;
		showingBrowse = false;
		showingSelection = true;
		updateTitles();
	};
	
	const showFocus = () => {
		showingDots = false;
		showingFocus = true;
		showingBrowse = false;
		showingSelection = false;
		updateTitles();
	};

	const showBrowse = () => {
		showingDots = false;
		showingFocus = false;
		showingBrowse = true;
		showingSelection = false;
		updateTitles();
	};

	onMount(() => {
		import('/src/lib/svelte/help/HelpDots.svelte').then(module => {
			dots = module.default;
		});
		import('/src/lib/svelte/help/HelpFocus.svelte').then(module => {
			focus = module.default;
		});
		import('/src/lib/svelte/help/HelpBrowse.svelte').then(module => {
			browse = module.default;
		});
		import('/src/lib/svelte/help/HelpSelection.svelte').then(module => {
			selection = module.default;
		});
		updateTitles();
	});
</script>

<div class='buttons-container'>
	<button class:selected={showingSelection} on:click={showSelection}>{@html selectionTitle}</button>
	<button class:selected={showingBrowse} on:click={showBrowse}>{@html browseTitle}</button>
	<button class:selected={showingFocus} on:click={showFocus}>{@html focusTitle}</button>
	<button class:selected={showingDots} on:click={showDots}>{@html dotsTitle}</button>
</div>
{#if showingSelection && selection}
	<svelte:component this={selection} />
{/if}
{#if showingBrowse && browse}
	<svelte:component this={browse} />
{/if}
{#if showingDots && dots}
	<svelte:component this={dots} />
{/if}
{#if showingFocus && focus}
	<svelte:component this={focus} />
{/if}

<style>
	button {
		height: 20px;
		color: #b64b1d;
		border: 1px solid;
		border-radius: 0.5em;
	}
	.selected {
		color: black;
		background-color: #def;
	}
	.buttons-container {
		gap: 15px;
		display: flex;
		margin-top: 20px;
		margin-bottom: 20px;
		justify-content: center;
	}
</style>
