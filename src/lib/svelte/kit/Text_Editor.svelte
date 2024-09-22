<script lang='ts'>
	import { dbDispatch, Seriously_Range, Svelte_Wrapper, SvelteComponentType } from '../../ts/common/Global_Imports';
	import { g, k, u, Point, Thing, debug, Angle, ZIndex, onMount, signals } from '../../ts/common/Global_Imports';
	import { s_rings_mode, s_thing_changed } from '../../ts/state/Reactive_State';
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

	var hasChanges = () => { return original_text != bound_text; };
	function handle_mouse_up() { clearTimeout(mouse_click_timer); }

	function handle_input(event) {
		const text = event.target.value;
		if (!!text) {
			bound_text = text;
			handle_textChange(text);
		}
	};

	function clearClicks() {
		clickCount = 0;
		clearTimeout(mouse_click_timer);	// clear all previous timers
	}
 
	function isHit(): boolean {
		return false
	}

	function handle_mouse_state(mouse_state: Mouse_State): boolean {
		return false;
	}

	function canAlterText(event) {
		var canAlter = (event instanceof KeyboardEvent) && !event.altKey && !event.shiftKey && !event.code.startsWith("Cluster_Label");
		if (canAlter && event.metaKey) {
			canAlter = false;
		}
		return canAlter;
	}

	function handle_key_down(event) {
		if (canAlterTitle(event)) {
			signals.signal_relayoutWidgets();
		}
	}

	function handleBlur(event) {
		stopAndClearEditing();
		debug.log_edit(`BLUR ${bound_text}`);
	}

	function handle_doubleClick(event) {
		event.preventDefault();
		clearClicks();
		input?.focus();
    }

	function handle_singleClick(event) {
		clickCount++;
		mouse_click_timer = setTimeout(() => {
			if (clickCount === 1) {
				event.preventDefault();
				if (g.allow_TextEditing) {
					input?.focus();
					return;
				}
				input?.blur();
				clearClicks();
			}
		}, k.threshold_doubleClick);
	}
 
	function handle_longClick(event) {}


	$: {

		//////////////////////////////////////////////////////
		//													//
		//				  manage focus state				//
		//													//
		//////////////////////////////////////////////////////

		if (g.allow_TextEditing && !isBulkAlias) {
			if (!isEditing) {
				debug.log_edit(`FOCUS ${bound_text}`);
				input?.focus();
			} else {
				debug.log_edit(`STOP ${bound_text}`);
				input?.blur();
			}
			isEditing = !isEditing;
		}
		cursorStyle = 'cursor: pointer';
	}

	function stopAndClearEditing() {
		invokeBlurNotClearEditing();
	}

	function invokeBlurNotClearEditing() {
		isEditing = false;
		extractRange();
		input?.blur();
		if (hasChanges()) {
			dbDispatch.db.thing_remoteUpdate(thing);
		}
	}

	function handle_cut_paste(event) {
		extractRange();
	}

	function extractRange() {
		if (!!input) {
			const end = input.selectionEnd;
			const start = input.selectionStart;
			selectionRange = new Seriously_Range(start, end);
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
		on:blur={handleBlur}
		on:input={handle_input}
		bind:value={bound_text}
		on:cut={handle_cut_paste}
		on:paste={handle_cut_paste}
		on:mouseup={handle_mouse_up}
		on:keydown={handle_key_down}
		on:click={handle_singleClick}
		on:mousedown={handle_longClick}
		on:dblclick={handle_doubleClick}
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