<script lang='ts'>
	import { k, Point } from '../../ts/common/Global_Imports';
	export let handle_selection: ((types: string[]) => void) | null = null;
	export let height: number = k.button_height;
	export let allow_multiple: boolean = false;
	export let font_size = k.font_size.small;
	export let allow_none: boolean = false;
	export let origin: Point = Point.zero;
	export let name: string = k.empty;
	export let titles: string[] = [];
	export let selected: string[];
	export let width = 0;

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

<div style='left:{origin.x}px; width:{width}px; position:absolute;'>
<div
	class='pill-group'
	style='
		transform: translateX(-50%);
		height: {height}px;
		position: absolute;
		top: {origin.y}px;
		left: 50%;'>
	{#each titles as title}
		<button
			class:selected={isSelected(title)}
			style='font-size:{font_size}px;'
			on:click={() => select(title)}
			id={button_name(title)}
			type='button'
			class='pill'>
			{title}
		</button>
	{/each}
</div>
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
		font-family: inherit;
		white-space: nowrap;
		padding-bottom: 2.2px;
		position: relative;
		width: fit-content;
		padding-right: 8px;
		background: white;
		padding-left: 8px;
		max-width: none;
		cursor: pointer;
		outline: none;
		display: flex;
		min-width: 0;
		height: 100%;
		border: none;
		color: #222;
		flex: none;
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
