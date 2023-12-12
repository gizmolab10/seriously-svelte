<script lang='ts'>
	import { dot_size, row_height, id_editing, thing_fontSize, thing_fontFamily, id_editingStopped } from '../../../ts/managers/State';
	import { k, Thing, signal, Signals, ZIndex, onMount, onDestroy } from '../../../ts/common/GlobalImports';
	import { dbDispatch, SeriouslyRange, graphEditor } from '../../../ts/common/GlobalImports';
	import Widget from './Widget.svelte';
	export let thing = Thing;
	let originalTitle = thing.title;
	let isEditing = false;
	let ghost = null;
	let input = null;

	onDestroy(() => { thing = null; });
	onMount(() => { updateInputWidth(); });
	var hasChanges = () => { return originalTitle != thing.title; }
	function handleBlur(event) { stopAndClearEditing(); updateInputWidth(); }
	function handleInput(event) { thing.title = event.target.value; updateInputWidth(); }

	function updateInputWidth() {
		if (input && ghost && thing) { // ghost only exists to provide its scroll width
			const width = ghost.scrollWidth;
			input.style.width = `${width}px`;
			thing.debugLog('TITLE WIDTH: ' + width);
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
		if (thing && $id_editing == thing.id && canAlterTitle(event)) {
			switch (event.key) {	
				case 'Tab':	  event.preventDefault(); stopAndClearEditing(); graphEditor.thing_redraw_remoteAddChildTo(thing.firstParent); break;
				case 'Enter': event.preventDefault(); stopAndClearEditing(); break;
				default:	  signal(Signals.layout, thing.id); break;
			}
		}
	}

	$: {

		///////////////////////
		// manage edit state //
		///////////////////////

		if (k.allowTitleEditing) {
			if ($id_editingStopped == thing.id) {
				setTimeout(() => {
					$id_editingStopped = null;
				}, 1000);
			} else if ($id_editing != thing.id) {
				input?.blur();
			} else if (!isEditing) {
				isEditing = true;
				thing.grabOnly();
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
			if (id != null && $id_editing == id) {				
				$id_editing = null;
			}
		}, 20);
	}

	function invokeBlurNotClearEditing() {
		if (isEditing && thing) {
			$id_editingStopped = $id_editing;
			isEditing = false;
			extractRange();
			input?.blur();
			if (hasChanges() && !thing.isExemplar) {
				dbDispatch.db.thing_remoteUpdate(thing);
				originalTitle = thing.title;		// so hasChanges will be correct
				signal(Signals.childrenOf, thing.id);
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
		signal(Signals.childrenOf, thing.id);
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
		position: fixed;
		visibility: hidden;
		white-space: pre; /* Preserve whitespace to accurately measure the width */
	}
</style>

{#key originalTitle}
	<span class="ghost" bind:this={ghost}
		style='
			font-size: {$thing_fontSize}px;
			font-family: {$thing_fontFamily};
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
		style='
			left: {$dot_size / 2 + 2}px;
			color: {thing.color};
			z-index: {ZIndex.text};
			top: {($row_height / -8) + 3}px;
			font-size: {$thing_fontSize}px;
			font-family: {$thing_fontFamily};
			outline-color: k.backgroundColor;
			padding: 0px 0px 0px {$row_height / 3}px;
		'/>
{/key}