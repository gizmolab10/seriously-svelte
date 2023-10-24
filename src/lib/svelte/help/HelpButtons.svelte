<script>
	import { onMount } from 'svelte';

	let dots;
	let edit;
	let focus;
	let browse;
	let selection;
	let dotsTitle = '';
	let editTitle = '';
	let focusTitle = '';
	let browseTitle = '';
	let selectionTitle = '';
	let showingDots = false;
	let showingEdit = false;
	let showingFocus = false;
	let showingBrowse = false;
	let showingSelection = true;

	const updateTitles = () => {
		dotsTitle = showingDots ? 'How the <b>Dots</b> work' : 'Dots';
		editTitle = showingEdit ? 'How to <b>Edit</b> an item' : 'Edit';
		focusTitle = showingFocus ? 'Changing the <b>Focus</b>' : 'Focus';
		browseTitle = showingBrowse ? '<b>Browsing</b> to a nearby item' : 'Browse';
		selectionTitle = showingSelection ? 'When a item is <b>selected</b>' : 'Select';
	}

	const showDots = () => {
		showingDots = true;
		showingEdit = false;
		showingFocus = false;
		showingBrowse = false;
		showingSelection = false;
		updateTitles();
	};

	const showEdit = () => {
		showingDots = false;
		showingEdit = true;
		showingFocus = false;
		showingBrowse = false;
		showingSelection = false;
		updateTitles();
	};
	
	const showSelection = () => {
		showingDots = false;
		showingEdit = false;
		showingFocus = false;
		showingBrowse = false;
		showingSelection = true;
		updateTitles();
	};
	
	const showFocus = () => {
		showingDots = false;
		showingEdit = false;
		showingFocus = true;
		showingBrowse = false;
		showingSelection = false;
		updateTitles();
	};

	const showBrowse = () => {
		showingDots = false;
		showingEdit = false;
		showingFocus = false;
		showingBrowse = true;
		showingSelection = false;
		updateTitles();
	};

	onMount(() => {
		import('/src/lib/svelte/help/HelpDots.svelte').then(module => {
			dots = module.default;
		});
		import('/src/lib/svelte/help/HelpEdit.svelte').then(module => {
			edit = module.default;
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
	<button class:selected={showingEdit} on:click={showEdit}>{@html editTitle}</button>
	<button class:selected={showingDots} on:click={showDots}>{@html dotsTitle}</button>
</div>
{#if showingSelection && selection}
	<svelte:component this={selection} />
{/if}
{#if showingBrowse && browse}
	<svelte:component this={browse} />
{/if}
{#if showingFocus && focus}
	<svelte:component this={focus} />
{/if}
{#if showingEdit && edit}
	<svelte:component this={edit} />
{/if}
{#if showingDots && dots}
	<svelte:component this={dots} />
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
		margin-top: 10px;
		margin-bottom: 20px;
		justify-content: center;
	}
</style>
