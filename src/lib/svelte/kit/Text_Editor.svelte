<script lang='ts'>
	import { k, u, ux, debug, colors, E_Layer, databases } from '../../ts/common/Global_Imports';
	import { w_thing_fontFamily, w_background_color } from '../../ts/common/Stores';
	export let handle_textChange = (label: string, text: string) => {};
	export let color = colors.default_forThings;
	export let width = k.width_details - 40;
	export let original_text = k.empty;
	export let label = k.empty;
	export let height = 200;
	export let left = 0;
	export let top = 0;
	let textarea = null;
	let bound_text = original_text;
	let cursorStyle = 'cursor: text';
	let label_left = (k.width_details - 28 - u.getWidthOf(label) * 0.7) / 2;

	function handle_focus(event: Event) { ux.isEditing_text = true; }
	function handle_keyup(event: KeyboardEvent) { handle_key(false, event); }
	function handle_keydown(event: KeyboardEvent) { handle_key(true, event); }
	function handle_blur(event: Event) {
		handle_textChange(label, null);
		ux.isEditing_text = false;
	}

	function handle_key(down: boolean, event: KeyboardEvent) {

		// ignore down and !exit because textarea value is not [yet] altered until key up
		// ignore up and exit so altered text is ignored (result won't include an extraneous RETURN)
		
		const exit = event.key == 'Enter' && !event.shiftKey;
		if (down && exit) {
			event.preventDefault();
			textarea.blur();
			textarea.value = bound_text;
		} else if (!down && !exit) {
			const text = textarea.value;
			if (!!text || text == k.empty) {
				bound_text = text;
				handle_textChange(label, text);
			}
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

<div class={label}
	style='
		top: {top}px;
		left: {left}px;
		position: absolute;'>
	<textarea
		id={label}
		type='text'
		name='text'
		wrap='soft'
		class='text'
		bind:this={textarea}
		on:blur={handle_blur}
		bind:value={bound_text}
		on:focus={handle_focus}
		on:keyup={handle_keyup}
		on:keydown={handle_keydown}
		style='
			resize: none;
			padding: 6px;
			{cursorStyle};
			color: {color};
			width: {width}px;
			height: {height}px;
			overflow-x: hidden;
			vertical-align: top;
			white-space: normal;
			z-index: {E_Layer.text};
			overflow-wrap: break-word;
			{k.prevent_selection_style};
			font-family: {$w_thing_fontFamily};
			border-radius: {k.height.row / 2}px;
		'/>
	<div style='
		top: -8px;
		color: gray;
		padding: 0px 3px;
		position: absolute;
		left: {label_left}px;
		font-size: {k.font_size.small}px;
		background-color: {$w_background_color}'>
		{label}
	</div>
</div>
