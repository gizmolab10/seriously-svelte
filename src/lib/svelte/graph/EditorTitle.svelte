<script lang='ts'>
	import { Thing, signal, Signals, ZIndex, k, onMount, onDestroy, dbDispatch, editorGraph } from '../../ts/common/GlobalImports';
	import { idEditing, titleFontSize, titleFontFamily, idEditingStopped } from '../../ts/managers/State';
	import Widget from './Widget.svelte';
	export let thing = Thing;
	let originalTitle = thing.title;
	let isEditing = false;
	let wrapper = null;
	let input = null;

	function handleBlur(event) { stopAndClearEditing(false); updateInputWidth(); }
	function handleInput(event) { thing.title = event.target.value; }
	var hasChanges = () => { return originalTitle != thing.title; }
	onDestroy(() => { thing = null; });

	onMount(() => {
		updateInputWidth();
		// console.log('MOUNT TITLE', thing.id, thing.title);		// prevent reveal dot blinking
	});

	function handleKeyDown(event) {
		if ($idEditing == thing.id) {
			switch (event.key) {	
				case 'Tab':	  event.preventDefault(); stopAndClearEditing(); editorGraph.thing_redraw_remoteAddChildTo(thing.firstParent); break;
				case 'Enter': event.preventDefault(); stopAndClearEditing(); break;
			}
		}
	}

	$: {

		///////////////////////
		// manage edit state //
		///////////////////////

		if (k.allowTitleEditing) {
			if ($idEditingStopped == thing.id) {
				$idEditingStopped = null;
			} else if ($idEditing != thing.id) {
				invokeBlurAndDoNotClearEditing();
			} else if (!isEditing) {
				isEditing = true;
				thing.grabOnly();
				setTimeout(() => {
					input?.focus();
					input?.select();
					// console.log('SELECT');
				}, 10);
			}
		}
	}

	function stopAndClearEditing() {
		invokeBlurAndDoNotClearEditing();
		setTimeout(() => {		// eliminate infinite recursion
			const id = thing?.id;
			if (id && $idEditing == id) {				
				$idEditing = null;
			}
		}, 20);
	}

	function invokeBlurAndDoNotClearEditing() {
		if (isEditing) {
			$idEditingStopped = $idEditing;
			isEditing = false;
			input?.blur();
			if (hasChanges() && !thing.isExemplar) {
				dbDispatch.db.thing_remoteUpdate(thing);
				originalTitle = thing.title;		// so hasChanges will be correct
				signal(Signals.childrenOf, thing.firstParent.id); // for crumbs
			}
		}
	}

	function handleFocus(event) {
		if (!k.allowTitleEditing) {
			input.blur();
		} else if (!isEditing) {
			// isEditing = true;
			thing.grabOnly()
			thing?.startEdit();
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
		top: 3px;
		outline-color: 'white';
	}
	.wrapper {
		position: absolute;
		visibility: hidden;
		padding: 0px 0px 0px 6px;
		white-space: pre; /* Preserve whitespace to accurately measure the width */
	}
</style>