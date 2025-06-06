<script lang='ts'>
	import type { Handle_Result } from '../../ts/common/Types';
	import k from '../../ts/common/Constants';
	export let handle_selection = Handle_Result<string> | null;
	export let allow_multiple: boolean = false;
	export let allow_none: boolean = false;
	export let name: string = k.empty;
	export let titles: string[] = [];
	export let selected: string[];
	export let height: number = 0;
	export let width: number = 0;
	export let left: number = 0;
	export let top: number = 0;

	function isSelected(title: string) { return selected.includes(title); }
	function button_name(title: string) { return `pill-${name}-${title.replace(/\s+/g, '-').toLowerCase()}`; }

	$: selected, setSelected(selected);

	function select(title: string) {
		let titles = [...selected];
		if (!allow_multiple) {
			titles = [title];
		} else if (isSelected(title)) {
			titles = selected.filter(i => i !== title);
		} else {
			titles = [...selected, title];
		}
		handle_selection?.(titles);
	}

	function setSelected(turnTheseOn: string[]) {
		for (const title of titles) {
			const element = document.getElementById(button_name(title));
			if (element) {
				const flag = turnTheseOn.includes(title);
				if (flag) {
					element.classList.add('selected');
				} else {
					element.classList.remove('selected');
				}
			}
		}
	}

</script>

<div
	class='pill-group'
	style='
		transform: translateX(-50%);
		height: {height}px;
		position: absolute;
		top: {top}px;
		left: 50%;'>
	{#each titles as title}
		<button
			class:selected={isSelected(title)}
			on:click={() => select(title)}
			id={button_name(title)}
			type='button'
			class='pill'>
			{title}
		</button>
	{/each}
</div>

<style>

	.pill-group {
		border: 0.5px solid black;
		background: transparent;
		border-radius: 999px;
		overflow: hidden;
		display: flex;
	}

	.pill {
		justify-content: center;
		background: transparent;
		font-family: inherit;
		align-titles: center;
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
		top: -0.5px;
	}

	.pill.selected {
		background: #b7d6e7 !important;
	}

	.pill:not(:last-child) {
		border-right: 0.5px solid black;
	}

	.pill:hover {
		background: black;
		color: white;
	}

</style>
