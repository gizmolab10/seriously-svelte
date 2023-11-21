<script lang='ts'>
	import { k, Thing, signal, Signals, ZIndex, onMount, onDestroy } from '../../ts/common/GlobalImports';
	import { idEditing, thingFontSize, thingFontFamily, idEditingStopped } from '../../ts/managers/State';
	import { dbDispatch, SeriouslyRange, graphEditor, DebugOption } from '../../ts/common/GlobalImports';
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
		if ($idEditing == thing.id && canAlterTitle(event)) {
			switch (event.key) {	
				case 'Tab':	  event.preventDefault(); stopAndClearEditing(); graphEditor.thing_redraw_remoteAddChildTo(thing.firstParent); break;
				case 'Enter': event.preventDefault(); stopAndClearEditing(); break;
				default:	  signal(Signals.childrenOf, thing.id);
			}
		}
	}

	$: {

		///////////////////////
		// manage edit state //
		///////////////////////

		if (k.allowTitleEditing) {
			if ($idEditingStopped == thing.id) {
				setTimeout(() => {
					$idEditingStopped = null;
				}, 1000);
			} else if ($idEditing != thing.id) {
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
			if (id != null && $idEditing == id) {				
				$idEditing = null;
			}
		}, 20);
	}

	function invokeBlurNotClearEditing() {
		if (isEditing) {
			$idEditingStopped = $idEditing;
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
		} else if (!isEditing) {
			thing.grabOnly()
			thing?.startEdit();
		}
	}

	function handleCutOrPaste(event) {
		extractRange();
		signal(Signals.childrenOf, thing.id);
	}

	function extractRange() {
		if (input) {
			const end = input.selectionEnd;
			const start = input.selectionStart;
			thing.selectionRange = new SeriouslyRange(start, end);
		}
	}

	function applyRange() {
		const priorRange = thing.selectionRange;
		if (priorRange && input) {
			input.setSelectionRange(priorRange.start, priorRange.end);
		}
	}

</script>

{#key originalTitle}
	<span class="ghost" bind:this={ghost}
		style='
			font-size: {$thingFontSize}px;
			font-family: {$thingFontFamily};'>
		{thing.title}
	</span>
	<input
		class='title'
		type='text'
		name='title'
		bind:this={input}
		bind:value={thing.title}
		on:paste={handleCutOrPaste}
		on:keydown={handleKeyDown}
		on:cut={handleCutOrPaste}
		on:input={handleInput}
		on:focus={handleFocus}
		on:blur={handleBlur}
		style='
			color: {thing.color};
			z-index: {ZIndex.text};
			font-size: {$thingFontSize}px;
			font-family: {$thingFontFamily};
			outline-color: k.backgroundColor;
		'/>
{/key}

<style lang='scss'>
	.title {
		top: 3.5px;
		left: 7.5px;
		border: none;
		outline: none;
		white-space: pre;
		position: relative;
		padding: 0px 0px 0px 6px;
	}
	.ghost {
		position: absolute;
		visibility: hidden;
		padding: 0px 0px 0px 6px;
		white-space: pre; /* Preserve whitespace to accurately measure the width */
	}
</style>