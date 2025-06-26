<script lang='ts'>
	import { k, Point, colors } from '../../ts/common/Global_Imports';
	import { w_background_color } from '../../ts/common/Stores';
	export let handle_selection: ((types: string[]) => void) | null = null;
	export let border_color: string = colors.border;
	export let selected_color: string = '#b7d6e7';
	export let height: number = k.button_height;
	export let allow_multiple: boolean = false;
	export let hover_color: string = 'black';
	export let font_size = k.font_size.small;
	export let allow_none: boolean = false;
	export let origin: Point = Point.zero;
	export let name: string = k.empty;
	export let titles: string[] = [];
	export let selected: string[];
	export let width = 0;

	function button_name(title: string) { return `pill-${name}-${title.replace(/\s+/g, '-').toLowerCase()}`; }

	$: $w_background_color, border_color = colors.border;
	$: selected, setSelected(selected);

	function select(title: string) {
		let selection = [...selected];
		const isSelected = selected.includes(title);
		if (!allow_multiple) {
			if (!isSelected) {
				selection = [title];
			} else if (allow_none) {
				selection = [];
			} else {
				const index = titles.indexOf(title).increment(true, titles.length);
				selection = [titles[index]];
			}
		} else if (isSelected) {
			selection = selected.filter(i => i !== title);
		} else {
			selection = [...selected, title];
		}
		handle_selection?.(selection);
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

<div style='
	position:absolute;
	left:{origin.x}px;
	width:{width}px;'>
	<div
		class='pill-group'
		style='
			--selected-color: {selected_color};
			--border-color: {border_color};
			--hover-color: {hover_color};
			transform: translateX(-50%);
			height: {height}px;
			position: absolute;
			top: {origin.y}px;
			left: 50%;'>
		{#each titles as title}
			<button
				class:selected={selected.includes(title)}
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
		border: 1px solid var(--border-color);
		background: transparent;
		border-radius: 999px;
		overflow: hidden;
		display: flex;
	}

	.pill {
		justify-content: center;
		padding-bottom: 2.2px;
		font-family: inherit;
		white-space: nowrap;
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
		background: var(--selected-color) !important;
	}

	.pill:not(:last-child) {
		border-right: 1px solid var(--border-color);
	}

	.pill:hover {
		background: black;
		color: white;
	}

</style>
