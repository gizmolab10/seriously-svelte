<script lang='ts'>
	import { s_hierarchy, s_thing_fontFamily } from '../../ts/state/Svelte_Stores';
	import { k, u, Size, Point, svgPaths } from '../../ts/common/Global_Imports';
	export let accept: string = k.empty;
	export let multiple = k.empty;		// can be set to 'multiple'
	export let left = 0;
	const label = 'import';
	const labelWidth = u.getWidthOf(label);
	let file_input: HTMLInputElement;

	function handle_selection(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target?.files;
		setTimeout( async () => {
			for (const file of files) {
				await get(s_hierarchy).fetch_fromFile(file);
			}
			target.value = k.empty;		// allow re-selection of the same file
		}, 1);
	}

</script>

<style>

	.open-button:hover {
		color: white;
		background-color: black;
	}

</style>

<div
	style='
		left: {left}px;
		position: absolute;'>
	<input
		{multiple}
		type='file'
		id='file-input'
		accept={accept}
		class='file-input'
		style='display: none;'
		bind:this={file_input}
		on:change={handle_selection}
	/>
	<button
		class='open-button'
		aria-label={label}
		on:click={() => {
			file_input.click();
		}}
		style='
			left: {left}px;
			font-size: 0.8em;
			border-width: 1px;
			border-radius: 1em;
			font-family: {$s_thing_fontFamily};'>
		<span class='button-label'>{label}</span>
	</button>
</div>
