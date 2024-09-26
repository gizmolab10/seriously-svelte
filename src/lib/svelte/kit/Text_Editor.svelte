<script lang='ts'>
	import { g, k, debug, ZIndex, dbDispatch, Seriously_Range } from '../../ts/common/Global_Imports';
	export let handle_textChange = (text: string) => {};
	export let original_text = k.empty;
	export let color = k.color_default;
	export let width = k.width_details - 30;
	export let height = 200;
	export let left = 0;
	export let top = 0;
	let selectionRange = new Seriously_Range(0, 0);
	let cursorStyle = 'cursor: text';
	let padding = `3px 5px 3px 5px`;
	let bound_text = original_text;
	let isEditing = false;
	let textarea = null;

	function handle_mousedown(event: MouseEvent) { 
		g.isEditing_text = true;
		console.log((flag ? 'is' : 'is not') + ' editing')
	}

	function handle_keydown(event: KeyboardEvent) {
		const exit = event.key == 'Enter' && !event.shiftKey;
		if (exit) {
			event.preventDefault();
			textarea.value = bound_text;
			textarea.blur();
			setTimeout(() => {
				g.isEditing_text = false;
			}, 10);
		} else {
			setTimeout(() => {
				const text = event.target.value;
				if (!!text) {
					bound_text = text;
					handle_textChange(text);
				}
			}, 1);
		}
	}

</script>

<style lang='scss'>
	textarea:focus {
		outline: none;
		border: 0.5px dashed black;
	}
	textarea:blur {
		outline: none;
		border: 0.5px solid black;
	}
</style>

{#key original_text}
	<textarea
		type='text'
		name='text'
		wrap='soft'
		class='text'
		bind:this={textarea}
		bind:value={bound_text}
		on:keydown={handle_keydown}
		on:mousedown={handle_mousedown}
		style='
			resize: none;
			top: {top}px;
			{cursorStyle};
			left: {left}px;
			color: {color};
			width: {width}px;
			height: {height}px;
			position: absolute;
			padding: {padding};
			overflow-x: hidden;
			vertical-align: top;
			white-space: normal;
			z-index: {ZIndex.text};
			overflow-wrap: break-word;
			{k.prevent_selection_style};
			font-family: Times New Roman;
			border-radius: {k.row_height / 2}px;
		'/>
{/key}