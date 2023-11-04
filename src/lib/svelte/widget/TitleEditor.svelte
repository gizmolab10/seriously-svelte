<script lang='ts'>
	import { k, Thing, signal, Signals, ZIndex, onMount, onDestroy, dbDispatch, graphEditor } from '../../ts/common/GlobalImports';
	import { idEditing, titleFontSize, titleFontFamily, idEditingStopped } from '../../ts/managers/State';
	import Widget from './Widget.svelte';
	export let thing = Thing;
	let originalTitle = thing.title;
	let isEditing = false;
	let identifier = '';
	let wrapper = null;
	let input = null;

	function handleBlur(event) { stopAndClearEditing(false); updateInputWidth(); }
	function handleInput(event) { thing.title = event.target.value; }
	var hasChanges = () => { return originalTitle != thing.title; }
	onDestroy(() => { thing = null; });

	onMount(() => {
		updateInputWidth();
		identifier = '${new Date().getTime()}';
	});

	function handleKeyDown(event) {
		if ($idEditing == thing.id) {
			switch (event.key) {	
				case 'Tab':	  event.preventDefault(); stopAndClearEditing(); graphEditor.thing_redraw_remoteAddChildTo(thing.firstParent); break;
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
					input?.select();
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
		class='title'
		type='text'
		name='title'
		bind:this={input}
		bind:value={thing.title}
		on:input={updateInputWidth}
		on:keydown={handleKeyDown}
		on:input={handleInput}
		on:focus={handleFocus}
		on:blur={handleBlur}
		style='
			color: {thing.color};
			z-index: {ZIndex.text};
			font-size: {$titleFontSize}px;
			font-family: {$titleFontFamily};
			padding: 0px {thing.hasChildren || thing.isBulkAlias ? 16 : 0}px 0px 6px;
		'/>
{/key}

<style lang='scss'>
	.title {
		border: none;
		outline: none;
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