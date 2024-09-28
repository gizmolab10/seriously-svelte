<script lang='ts'>
	import { g, k, u, debug, ZIndex, dbDispatch } from '../../ts/common/Global_Imports';
	export let handle_textChange = (label: string, text: string) => {};
	export let width = k.width_details - 40;
	export let color = k.color_default;
	export let original_text = k.empty;
	export let label = k.empty;
	export let height = 200;
	export let left = 0;
	export let top = 0;
	let textarea = null;
	let bound_text = original_text;
	let cursorStyle = 'cursor: text';
	let label_left = (k.width_details - 28 - u.getWidthOf(label) * 0.7) / 2;

	function handle_blur(event: Event) {
		debug.log_edit(`BLUR ${label}`);
	}

	function handle_mousedown(event: MouseEvent) { 
		g.isEditing_text = true;
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
					handle_textChange(label, text);
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

<div
	style='
		top: {top}px;
		left: {left}px;
		position: absolute;'>
	<textarea
		type='text'
		name='text'
		wrap='soft'
		class='text'
		bind:this={textarea}
		on:blur={handle_blur}
		bind:value={bound_text}
		on:keydown={handle_keydown}
		on:mousedown={handle_mousedown}
		style='
			resize: none;
			padding: 8px;
			{cursorStyle};
			color: {color};
			width: {width}px;
			height: {height}px;
			overflow-x: hidden;
			vertical-align: top;
			white-space: normal;
			z-index: {ZIndex.text};
			overflow-wrap: break-word;
			{k.prevent_selection_style};
			font-family: Times New Roman;
			border-radius: {k.row_height / 2}px;
		'/>
	<div
	style='
		top: -8px;
		color: gray;
		font-size: 90%;
		padding: 0px 3px;
		position: absolute;
		left: {label_left}px;
		background-color: {k.color_background}'>
		{label}
	</div>
</div>
