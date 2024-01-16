<script lang='ts'>
	import { onDestroy, dbDispatch, graphEditor, SeriouslyRange } from '../../ts/common/GlobalImports';
	import { s_row_height, s_path_editing, s_path_editingStopped } from '../../ts/managers/State';
	import { k, Thing, ZIndex, Widget, signals, onMount } from '../../ts/common/GlobalImports';
	export let fontFamily = 'Arial';
	export let fontSize = '1em';
	export let widget: Widget;
	export let thing = Thing;
	let originalTitle = thing.title;
	let titleWidth = 0;
	let ghost = null;
	let input = null;

	onMount(() => { updateInputWidth(); });
	onDestroy(() => { thing = null; signalHandler.disconnect(); });
	var hasChanges = () => { return originalTitle != thing.title; }
	function handleBlur(event) { stopAndClearEditing(); updateInputWidth(); }
	function handleInput(event) { thing.title = event.target.value; updateInputWidth(); }
	const signalHandler = signals.handle_relayout((id) => setTimeout(() => { updateInputWidth(); }, 10));

	function updateInputWidth() {
		if (input && ghost && thing) { // ghost only exists to provide its scroll width
			titleWidth = ghost.scrollWidth;
			input.style.width = `${titleWidth}px`;
			thing.debugLog(`titleWidth: ${titleWidth}`);
		}
	}

	$: {
		if ($s_row_height > 0) {
			updateInputWidth();
		}
	}

	$: {
		const _ = $s_path_editing;
		updateInputWidth();
	}

	function canAlterTitle(event) {
		var canAlter = (event instanceof KeyboardEvent) && !event.altKey && !event.shiftKey && !event.code.startsWith("Arrow");
		if (canAlter && event.metaKey) {
			canAlter = false;
		}
		return canAlter;
	}

	function handleKeyDown(event) {
		if (thing && $s_path_editing == thing.id && canAlterTitle(event)) {
			switch (event.key) {	
				case 'Tab':	  event.preventDefault(); stopAndClearEditing(); graphEditor.widget_rebuild_remoteAddChildTo(thing.firstParent); break;
				case 'Enter': event.preventDefault(); stopAndClearEditing(); break;
				default:	  signals.signal_relayout(); break;
			}
		}
	}

	$: {

		///////////////////////
		// manage edit state //
		///////////////////////

		if (k.allowTitleEditing) {
			if ($s_path_editingStopped == thing.id) {
				setTimeout(() => {
					$s_path_editingStopped = null;
				}, 1000);
			} else if ($s_path_editing != thing.id) {
				input?.blur();
			} else if ($s_path_editing == null) {
				$s_path_editing = widget.path;
				widget.path.grabOnly();
				setTimeout(() => {
					input?.focus();
					applyRange();
				}, 10);
			}
		}
	}

	function stopAndClearEditing() {
		invokeBlurNotClearEditing();
		setTimeout(() => {		// eliminate infinite recursion
			const id = thing?.id;
			if (id != null && $s_path_editing == id) {				
				$s_path_editing = null;
				signals.signal_rebuild_fromHere();
			}
		}, 20);
	}

	function invokeBlurNotClearEditing() {
		if (widget.path.isEditing && thing) {
			$s_path_editingStopped = $s_path_editing;
			extractRange();
			input?.blur();
			if (hasChanges() && !thing.isExemplar) {
				dbDispatch.db.thing_remoteUpdate(thing);
				originalTitle = thing.title;		// so hasChanges will be correct
				thing.signal_relayout();
			}
		}
	}

	function handleFocus(event) {
		if (!k.allowTitleEditing) {
			input.blur();
		} else if (!widget.path.isEditing) {
			widget.path.grabOnly()
			widget.path.startEdit();
		}
	}

	function handleCutOrPaste(event) {
		extractRange();
		thing.signal_relayout();
	}

	function extractRange() {
		if (input && thing) {
			const end = input.selectionEnd;
			const start = input.selectionStart;
			thing.selectionRange = new SeriouslyRange(start, end);
		}
	}

	function applyRange() {
		const priorRange = thing?.selectionRange;
		if (priorRange && input) {
			input.setSelectionRange(priorRange.start, priorRange.end);
		}
	}

</script>

<style lang='scss'>
	.title {
		border: none;
		outline: none;
		white-space: pre;
		position: absolute;
	}
	.ghost {
		position: absolute;
		visibility: hidden;
		white-space: pre; /* Preserve whitespace to accurately measure the width */
	}
</style>

{#key originalTitle}
	<span class="ghost" bind:this={ghost}
		style='
			font-size: {fontSize};
			font-family: {fontFamily};
			padding: 0px 0px 0px {$s_row_height / 3}px;'>
		{thing.title}
	</span>
	<input
		type='text'
		name='title'
		class='title'
		bind:this={input}
		on:blur={handleBlur}
		on:focus={handleFocus}
		on:input={handleInput}
		bind:value={thing.title}
		on:cut={handleCutOrPaste}
		on:keydown={handleKeyDown}
		on:paste={handleCutOrPaste}
		style='left: 10px;
			color: {thing.color};
			font-size: {fontSize};
			z-index: {ZIndex.text};
			font-family: {fontFamily};
			outline-color: {k.backgroundColor};
			padding: 0px 0px 0px {$s_row_height / 3}px;
		'/>
{/key}