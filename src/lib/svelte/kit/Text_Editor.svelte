<script lang='ts'>
	import { g, k, debug, ZIndex, dbDispatch, Seriously_Range } from '../../ts/common/Global_Imports';
	export let handle_textChange = (text: string) => {};
	export let original_text = k.empty;
	export let color = k.color_default;
	export let left = 0;
	let selectionRange = new Seriously_Range(0, 0);
	let cursorStyle = 'cursor: pointer';
	let padding = `0px 0px 0px 0px`;
	let bound_text = original_text;
	let mouse_click_timer;
	let isEditing = false;
	let clickCount = 0;
	let input = null;

	function handleFocus(flag) { g.isEditing_text = flag; }
	var hasChanges = () => { return original_text != bound_text; }
	function handle_mouse_up() { clearTimeout(mouse_click_timer); }

	function handle_input(event) {
		const text = event.target.value;
		if (!!text) {
			bound_text = text;
			handle_textChange(text);
		}
	};

	function handle_key_down(event) {
		switch (event.key) {	
			case 'Enter': input.blur(); break;
		}
	}

</script>

<style lang='scss'>
	input:focus {
		outline: none;
	}
</style>

{#key original_text}
	<input
		type='text'
		name='text'
		class='text'
		bind:this={input}
		on:input={handle_input}
		bind:value={bound_text}
		on:keydown={handle_key_down}
		on:blur={handleFocus(false)}
		on:focus={handleFocus(true)}
		style='
			top: 1px;
			width: 100px;
			border: none;
			{cursorStyle};
			outline: none;
			left: {left}px;
			color: {color};
			white-space: pre;
			position: absolute;
			padding: {padding};
			position: absolute;
			z-index: {ZIndex.text};
			{k.prevent_selection_style};
			font-family: Times New Roman;
			outline-color: {k.color_background};
		'/>
{/key}