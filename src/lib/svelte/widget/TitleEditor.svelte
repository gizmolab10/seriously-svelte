<script lang='ts'>
	import { s_row_height, s_path_editing, s_path_editingStopped } from '../../ts/managers/State';
	import { k, Thing, ZIndex, WidgetWrapper, signals, onMount } from '../../ts/common/GlobalImports';
	import { onDestroy, dbDispatch, SeriouslyRange } from '../../ts/common/GlobalImports';
	export let widget: WidgetWrapper;
	export let fontFamily = 'Arial';
	export let fontSize = '1em';
	export let thing = Thing;
	let originalTitle = thing.title;
	let isEditing = false;
	let titleWidth = 0;
	let ghost = null;
	let input = null;

	onMount(() => { updateInputWidth(); });
	onDestroy(() => { thing = null; signalHandler.disconnect(); });
	var hasChanges = () => { return originalTitle != thing.title; }
	function handleBlur(event) { stopAndClearEditing(); console.log(`BLUR ${widget.path.thing()?.title}`); updateInputWidth(); }
	function handleInput(event) { thing.title = event.target.value; updateInputWidth(); }
	const signalHandler = signals.handle_relayout((path) => setTimeout(() => { updateInputWidth(); }, 10));

	function updateInputWidth() {
		if (input && ghost) { // ghost only exists to provide its scroll width
			titleWidth = ghost.scrollWidth;
			input.style.width = `${titleWidth}px`;
			// console.log(`WIDTH: ${titleWidth} ${widget.path.thing()?.title}`);
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
		if (thing && widget.path.isEditing && canAlterTitle(event)) {
			switch (event.key) {	
				case 'Tab':	  event.preventDefault(); stopAndClearEditing(); dbDispatch.db.hierarchy.path_edit_remoteCreateChildOf(widget.path.parentPath); break;
				case 'Enter': event.preventDefault(); stopAndClearEditing(); break;
				default:	  signals.signal_relayout(); break;
			}
		}
	}

	$: {

		///////////////////////////////////////////////////////
		//													 //
		//				   manage edit state				 //
		//													 //
		//	N.B., to react, must use $s_path_edit variables	 //
		///////////////////////////////////////////////////////

		if (k.allowTitleEditing) {
			const path = widget.path;
			if ($s_path_editingStopped?.matchesPath(path)) {
				console.log(`STOPPING ${widget.path.thing()?.title}`);
				$s_path_editingStopped = null;
				input?.blur();
			} else if (!$s_path_editing?.matchesPath(path)) {
				// console.log(`BLUR ${widget.path.thing()?.title}`);
				input?.blur();
			} else if (!isEditing) {
				console.log(`RANGE ${widget.path.thing()?.title}`);
				isEditing = true;
				input?.focus();
				applyRange();
			}
		}
	}

	function stopAndClearEditing() {
		invokeBlurNotClearEditing();
		setTimeout(() => {		// eliminate infinite recursion
			if (widget.path.isEditing) {				
				$s_path_editing = null;
				signals.signal_relayout_fromHere();
			}
		}, 20);
	}

	function invokeBlurNotClearEditing() {
		if (widget.path.isEditing && thing) {
			$s_path_editing?.matchesPath($s_path_editingStopped);
			isEditing = false;
			extractRange();
			input?.blur();
			if (hasChanges() && !thing.isExemplar) {
				dbDispatch.db.thing_remoteUpdate(thing);
				originalTitle = thing.title;		// so hasChanges will be correct
				widget.path.signal_relayout();
			}
		}
	}

	function handleFocus(event) {
		console.log(`FOCUS ${widget.path.thing()?.title}`);
		if (!k.allowTitleEditing) {
			input?.blur();
		} else if (!isEditing) {
			widget.path.startEdit();
		}
	}

	function handleCutOrPaste(event) {
		extractRange();
		widget.path.signal_relayout();
	}

	function extractRange() {
		if (input) {
			const end = input.selectionEnd;
			const start = input.selectionStart;
			widget.path.selectionRange = new SeriouslyRange(start, end);
		}
	}

	function applyRange() {
		const range = widget.path.selectionRange;
		if (range && input) {
			input.setSelectionRange(range.start, range.end);
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