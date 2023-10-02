<script>
	import { onMount } from 'svelte';
	let dotsTitle = '';
	let selectionTitle = '';
	let focusTitle = '';
	let browseTitle = '';
	let showingDots = false;
	let showingSelection = true;
	let showingFocus = false;
	let showingBrowse = false;
	let dots;
	let selection;
	let focus;
	let browse;

	const updateTitles = () => {
		dotsTitle = showingDots ? 'How the <b>Dots</b> work' : 'Dots';
		browseTitle = showingBrowse ? '<b>Browsing</b> (changing which item is selected)' : 'Browse';
		selectionTitle = showingSelection ? 'When a item is <b>selected</b>' : 'Select';
		focusTitle = showingFocus ? 'Changing the <b>Focus</b>' : 'Focus';
	}

	const showDots = () => {
		showingDots = true;
		showingSelection = false;
		showingFocus = false;
		showingBrowse = false;
		updateTitles();
	};
	
	const showSelection = () => {
		showingDots = false;
		showingSelection = true;
		showingFocus = false;
		showingBrowse = false;
		updateTitles();
	};
	
	const showFocus = () => {
		showingDots = false;
		showingSelection = false;
		showingFocus = true;
		showingBrowse = false;
		updateTitles();
	};

	const showBrowse = () => {
		showingDots = false;
		showingSelection = false;
		showingFocus = false;
		showingBrowse = true;
		updateTitles();
	};

	onMount(() => {
		import('/src/lib/svelte/help/HelpBrowse.svelte').then(module => {
			browse = module.default;
		});
		import('/src/lib/svelte/help/HelpSelection.svelte').then(module => {
			selection = module.default;
		});
		import('/src/lib/svelte/help/HelpFocus.svelte').then(module => {
			focus = module.default;
		});
		import('/src/lib/svelte/help/HelpDots.svelte').then(module => {
			dots = module.default;
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
