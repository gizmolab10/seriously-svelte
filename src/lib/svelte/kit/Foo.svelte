<script lang="ts">
	export let items: string[] = ['child', 'parent', 'related'];
	export let selected: string = items[0];
	export let height: number = 20;
	export let width: number = 190;
	export let left: number = 9;
	export let top: number = 9;

	function select(item: string) {
		selected = item;
		console.log('selected', selected);
		// Optionally, dispatch an event here if you want to notify parent
	}
</script>

<div
	class="pill-group"
	style="
		transform: translateX(-50%);
		height: {height}px;
		position: absolute;
		top: {top}px;
		left: 50%;
	"
>
	{#each items as item, idx}
		<button
			class="pill {selected === item ? 'selected' : ''} {idx === 0 ? 'left' : idx === items.length - 1 ? 'right' : ''}"
			on:click={() => select(item)}
			type="button"
		>
			{item}
		</button>
	{/each}
</div>

<style>
	.pill-group {
		border: 2px solid #ccc;
		background: #f8f1e3;
		border-radius: 999px;
		display: inline-flex;
		overflow: hidden;
	}

	.pill {
		transition: background 0.2s, color 0.2s;
		justify-content: center;
		background: transparent;
		font-family: inherit;
		align-items: center;
		white-space: nowrap;
		position: relative;
		width: fit-content;
		padding: 1px 8px;
		font-size: 0.9em;
		max-width: none;
		cursor: pointer;
		outline: none;
		display: flex;
		min-width: 0;
		height: 100%;
		border: none;
		color: #222;
		flex: none;
		top: -1px;
	}

	.pill.selected {
		background: #b7d6e7;
	}

	.pill:not(:last-child) {
		border-right: 0.5px solid black;
	}

	.pill:hover {
		background: black;
		color: white;
	}
</style>
