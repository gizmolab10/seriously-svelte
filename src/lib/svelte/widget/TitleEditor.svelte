<script lang='ts'>
	import { k, Thing, ZIndex, onMount, onDestroy, dbDispatch, graphEditor, Relationship } from '../../ts/common/GlobalImports';
	import { SeriouslyRange, handle_relayout, signal_relayout, signal_rebuild_fromHere, signal_relayout_fromHere } from '../../ts/common/GlobalImports'; 
	import { row_height, id_editing, id_editingStopped } from '../../ts/managers/State';
	import Widget from './Widget.svelte';
	export let relationship = Relationship;
	export let fontFamily = 'Arial';
	export let fontSize = '1em';
	let originalTitle = relationship.toThing?.title;
	let isEditing = false;
	let titleWidth = 0;
	let ghost = null;
	let input = null;
	let thing: Thing;

	onDestroy(() => { thing = null; signalHandler.disconnect(); });
	var hasChanges = () => { return originalTitle != (thing?.title ?? ''); }
	function handleBlur(event) { stopAndClearEditing(); updateInputWidth(); }
	const signalHandler = handle_relayout((id) => setTimeout(() => { updateInputWidth(); }, 10));
	onMount(() => { thing = relationship.toThing; setTimeout(() => { updateInputWidth(); }, 10) });
	
	function handleInput(event) {
		thing.title = event.target.value;
		updateInputWidth();
		signal_relayout_fromHere();
	}

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
		if (thing && $id_editing == thing.id && canAlterTitle(event)) {
			switch (event.key) {	
				case 'Tab':	  event.preventDefault(); stopAndClearEditing(); graphEditor.relationship_toThing_redraw_remoteAddChildTo(thing.firstParent); break;
				case 'Enter': event.preventDefault(); stopAndClearEditing(); break;
				default:	  signal_relayout_fromHere(); break;
			}
		}
	}

	$: {

		///////////////////////
		// manage edit state //
		///////////////////////

		if (k.allowTitleEditing) {
			if ($id_editingStopped == relationship.id) {
				setTimeout(() => {
					$id_editingStopped = null;
				}, 1000);
			} else if ($id_editing != relationship.id) {
				input?.blur();
			} else if (!isEditing) {
				isEditing = true;
				relationship.grabOnly();
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
			const id = relationship.id;
			if (id != null && $id_editing == id) {				
				$id_editing = null;
				signal_rebuild_fromHere();
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
				originalTitle = thing?.title ?? '';		// so hasChanges will be correct
				relationship.signal_relayout();
			}
		}
	}

	function handleFocus(event) {
		if (!k.allowTitleEditing) {
			input.blur();
		} else if (!isEditing) {
			relationship.grabOnly()
			relationship.startEdit();
		}
	}

	function handleCutOrPaste(event) {
		extractRange();
		relationship.signal_relayout();
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
	{#if thing}
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
				width: {titleWidth};
				color: {thing.color};
				font-size: {fontSize};
				z-index: {ZIndex.text};
				font-family: {fontFamily};
				outline-color: {k.backgroundColor};
				padding: 0px 0px 0px {$row_height / 3}px;
			'/>
	{/if}
{/key}