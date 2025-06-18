<script lang='ts'>
	import { w_thing_fontFamily, w_background_color, w_s_text_edit } from '../../ts/common/Stores';
	import { k, u, ux, debug, colors, T_Layer, databases } from '../../ts/common/Global_Imports';
	export let handle_textChange = (label: string, text: string) => {};
	export let handleClick_onLabel: (event: Event) => {} | null = null;
	export let color = colors.default_forThings;
	export let width = k.width_details - 20;
	export let label_underline = false;
	export let original_text = k.empty;
	export let label_color = 'gray';
	export let label = k.empty;
	export let height = 200;
	export let left = 0;
	export let top = 0;
	let textarea = null;
	let labelElement = null;
	let bound_text = original_text;
	let cursorStyle = 'cursor: text';

	$: if (labelElement) {
		labelElement.addEventListener('click', handleLabelClick);
	}

	function handle_keydown(event: KeyboardEvent) { handle_key(true, event); }
	function handle_keyup(event: KeyboardEvent) { handle_key(false, event); }

	function handleLabelClick(event: Event) {
		if (!!handleClick_onLabel) {
			handleClick_onLabel(event);
		}
	}
	
	function handle_focus(event: Event) {
		if (!!$w_s_text_edit) {
			$w_s_text_edit.start_editing();
		}
	}

	function handle_blur(event: Event) {
		handle_textChange(label, null);
		if (!!$w_s_text_edit) {
			$w_s_text_edit.stop_editing();
			$w_s_text_edit = null;		// so widget will react
		}
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

<div class={label}
	style='
		top: {top}px;
		left: {left}px;
		width: {width}px;
		padding-bottom: 8px;
		position: relative;'>
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
			height: {height}px;
			overflow-x: hidden;
			vertical-align: top;
			white-space: normal;
			width: {width - 15}px;
			z-index: {T_Layer.text};
			overflow-wrap: break-word;
			{k.prevent_selection_style};
			font-family: {$w_thing_fontFamily};
			border-radius: {k.height.row / 2}px;
		'/>
	<div style='width: 100%; display: flex; justify-content: center;'>
		<div style='
			top: -8px;
			padding: 0px 3px;
			position: absolute;
			color: {label_color};
			font-size: {k.font_size.small}px;
			background-color: {$w_background_color};
			cursor: {handleClick_onLabel ? 'pointer' : 'default'};
			text-decoration: {label_underline ? 'underline' : 'none'};'
			bind:this={labelElement}>
			{label}
		</div>
	</div>
</div>

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
