<script lang='ts'>
	import { Thing, editor, signal, Signals, ZIndex, onDestroy, dbDispatch } from '../../ts/common/GlobalImports';
	import { idEditing, titleFontSize, titleFontFamily, stoppedIDEditing } from '../../ts/managers/State';
	import Widget from './Widget.svelte';
	export let thing = Thing;
	let originalTitle = thing.title;
	let currentThing = Thing;
	let isEditing = false;
	let wrapper = null;
	let input = null;

	var hasChanges = () => { return originalTitle != thing.title; }
	function handleInput(event) { thing.title = event.target.value; }
	function handleBlur(event) { stopAndClearEditing(false); updateInputWidth(); }
	onDestroy(() => { thing = null; });

	function handleKeyDown(event) {
		if ($idEditing == thing.id) {
			switch (event.key) {	
				case 'Tab': 	stopAndClearEditing(); editor.thing_redraw_remoteDuplicate(); break;
				case 'Enter': stopAndClearEditing();
			}
		}
	}

	$: {

		///////////////////////
		// manage edit state //
		///////////////////////

		if ($stoppedIDEditing == thing.id) {
			stopEditing();
			$stoppedIDEditing = null;
		} else if ($idEditing != thing.id) {
			stopEditing();
		} else if (!isEditing) {
			isEditing = true;
			thing.grabOnly();
			setTimeout(() => {
				input?.focus();
				input?.select();
			}, 10);
		}
		if (currentThing != thing) {
			currentThing = thing;
			setTimeout(() => {
				updateInputWidth();
			}, 1);
		}
	}

	function stopAndClearEditing(invokeBlur: boolean = true) {
		stopEditing(invokeBlur);
		setTimeout(() => {		// eliminate infinite recursion
			if ($idEditing == thing.id) {				
				$idEditing = null;
			}
		}, 20);
	}

	function stopEditing(invokeBlur: boolean = true) {
		if (isEditing) {
			$stoppedIDEditing = $idEditing;
			isEditing = false;
			if (invokeBlur) {
				input?.blur();
			}
			if (hasChanges()) {
				dbDispatch.db.thing_remoteUpdate(thing);
				originalTitle = thing.title;		// so hasChanges will be correct
				signal(Signals.childrenOf, thing.firstParent.id); // for crumbs
			}
		}
	}

	function handleFocus(event) {
		if (!isEditing) {
			isEditing = true;
			thing.grabOnly()
			thing.startEdit();
		}
	}

	function updateInputWidth() {
		if (input && wrapper && thing) { // wrapper only exists to provide its scroll width
			const width = wrapper.scrollWidth;
			input.style.width = `${width - 6}px`;
		}
	}
</script>

{#key originalTitle}
	<span class="wrapper" bind:this={wrapper}
		style='font-size: {$titleFontSize}px; font-family: {$titleFontFamily};'>
		{thing.title}
	</span>
	<input
		type='text'
		bind:this={input}
		on:blur={handleBlur}
		on:focus={handleFocus}
		on:input={handleInput}
		on:keydown={handleKeyDown}
		on:input={updateInputWidth}
		bind:value={thing.title}
		style='
			color: {thing.color};
			z-index:{ZIndex.text ?? ''};
			font-size: {$titleFontSize}px;
			font-family: {$titleFontFamily};
		'/>
{/key}

<style lang='scss'>
	input {
		border: none;
		outline: none;
		padding: 0px 0px 0px 6px;
		position: relative;
		top: 4px;
		outline-color: 'white';
	}
	.wrapper {
		position: absolute;
		visibility: hidden;
		padding: 0px 0px 0px 6px;
		white-space: pre; /* Preserve whitespace to accurately measure the width */
	}
</style>