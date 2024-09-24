<script lang='ts'>
	import { g, k, debug, ZIndex, dbDispatch, Seriously_Range } from '../../ts/common/Global_Imports';
	export let handle_textChange = (text: string) => {};
	export let original_text = k.empty;
	export let color = k.color_default;
	export let border = `1px solid black`;
	export let width = k.width_details - 30;
	export let height = 200;
	export let left = 0;
	export let top = 0;
	let selectionRange = new Seriously_Range(0, 0);
	let cursorStyle = 'cursor: pointer';
	let padding = `3px 5px 3px 5px`;
	let bound_text = original_text;
	let mouse_click_timer;
	let isEditing = false;
	let clickCount = 0;
	let input = null;

	var hasChanges = () => { return original_text != bound_text; }
	function handle_mouse_up() { clearTimeout(mouse_click_timer); }

	function handleFocus(flag) { 
		g.isEditing_text = flag;
		const style = flag ? 'dashed' : 'solid';
		border = `1px ${style} black`;
	}

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
	textarea:focus {
		outline: none;
		border: 1px dashed black;
	}
</style>

{#key original_text}
	<textarea
		type='text'
		name='text'
		class='text'
		bind:this={input}
		on:input={handle_input}
		bind:value={bound_text}
		on:keydown={handle_key_down}
		on:focus={handleFocus(true)}
		on:blur={handleFocus(false)}
		style='
			resize: none;
			top: {top}px;
			{cursorStyle};
			left: {left}px;
			color: {color};
			width: {width}px;
			white-space: pre;
			height: {height}px;
			position: absolute;
			padding: {padding};
			position: absolute;
			vertical-align: top;
			z-index: {ZIndex.text};
			{k.prevent_selection_style};
			font-family: Times New Roman;
		'/>
{/key}