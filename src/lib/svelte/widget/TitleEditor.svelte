<script lang='ts'>
	import { SeriouslyRange, handle_relayout, signal_relayout, signal_rebuild_fromHere } from '../../ts/common/GlobalImports'; 
	import { k, Thing, ZIndex, Widget, onMount, onDestroy, dbDispatch, graphEditor } from '../../ts/common/GlobalImports';
	import { row_height, path_editing, path_editingStopped } from '../../ts/managers/State';
	import Widget from './Widget.svelte';
	export let fontFamily = 'Arial';
	export let fontSize = '1em';
	export let widget: Widget;
	export let thing = Thing;
	let originalTitle = thing.title;
	let isEditing = false;
	let titleWidth = 0;
	let ghost = null;
	let input = null;

	onMount(() => { updateInputWidth(); });
	onDestroy(() => { thing = null; signalHandler.disconnect(); });
	var hasChanges = () => { return originalTitle != thing.title; }
	function handleBlur(event) { stopAndClearEditing(); updateInputWidth(); }
	function handleInput(event) { thing.title = event.target.value; updateInputWidth(); }
	const signalHandler = handle_relayout((idThing) => setTimeout(() => { updateInputWidth(); }, 10));

	function updateInputWidth() {
		if (input && ghost && thing) { // ghost only exists to provide its scroll width
			titleWidth = ghost.scrollWidth;
			input.style.width = `${titleWidth}px`;
			thing.debugLog(`titleWidth: ${titleWidth}`);
		}
	}

	$: {
		if ($row_height > 0) {
			updateInputWidth();
		}
	}

	function canAlterTitle(event) {
		var canAlter = (event instanceof KeyboardEvent) && !event.altKey && !event.shiftKey && !event.code.startsWith("Arrow");
		if (canAlter && event.metaKey) {
			canAlter = false;
		}
		return canAlter;
	}

	function handleKeyDown(event) {
		if (thing && $path_editing == thing.id && canAlterTitle(event)) {
			switch (event.key) {	
				case 'Tab':	  event.preventDefault(); stopAndClearEditing(); graphEditor.widget_redraw_remoteAddChildTo(thing.firstParent); break;
				case 'Enter': event.preventDefault(); stopAndClearEditing(); break;
				default:	  signal_relayout(); break;
			}
		}
	}

	$: {

		///////////////////////
		// manage edit state //
		///////////////////////

		if (k.allowTitleEditing) {
			if ($path_editingStopped == thing.id) {
				setTimeout(() => {
					$path_editingStopped = null;
				}, 1000);
			} else if ($path_editing != thing.id) {
				input?.blur();
			} else if (!isEditing) {
				isEditing = true;
				dbDispatch.db.hierarchy.grabs.grabOnly(widget.path);
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
			if (id != null && $path_editing == id) {				
				$path_editing = null;
				signal_rebuild_fromHere();
			}
		}, 20);
	}

	function invokeBlurNotClearEditing() {
		if (isEditing && thing) {
			$path_editingStopped = $path_editing;
			isEditing = false;
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
		} else if (!isEditing && thing) {
			thing.grabOnly()
			thing.startEdit();
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
			padding: 0px 0px 0px {$row_height / 3}px;'>
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
			padding: 0px 0px 0px {$row_height / 3}px;
		'/>
{/key}