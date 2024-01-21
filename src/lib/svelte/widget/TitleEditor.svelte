<script lang='ts'>
	import { dbDispatch, SeriouslyRange, Wrapper, SvelteType } from '../../ts/common/GlobalImports';
	import { k, Thing, ZIndex, onMount, signals, onDestroy } from '../../ts/common/GlobalImports';
	import { s_title, s_row_height } from '../../ts/managers/State';
	export let widgetWrapper: Wrapper;
	export let fontFamily = 'Arial';
	export let fontSize = '1em';
	export let thing = Thing;
	let originalTitle = thing.title;
	let titleWrapper: Wrapper;
	let isEditing = false;
	let titleWidth = 0;
	let ghost = null;
	let input = null;

	onDestroy(() => { thing = null; signalHandler.disconnect(); });
	var hasChanges = () => { return originalTitle != thing.title; }
	function handleInput(event) { thing.title = event.target.value; updateInputWidth(); }
	const signalHandler = signals.handle_relayout((path) => setTimeout(() => { updateInputWidth(); }, 10));
	
	onMount(() => {
		updateInputWidth();
	});

	function updateInputWidth() {
		if (input && ghost) { // ghost only exists to provide its scroll width
			titleWidth = ghost.scrollWidth;
			input.style.width = `${titleWidth}px`;
			// console.log(`WIDTH: ${titleWidth} ${widgetWrapper.path.thing()?.title}`);
		}
	}

	$: {
		titleWrapper = new Wrapper(this, widgetWrapper.path, SvelteType.title);
	}

	$: {
		if ($s_row_height > 0) {
			updateInputWidth();
		}
	}

	$: {
		const _ = $s_title;
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
		if (thing && widgetWrapper.path.isEditing && canAlterTitle(event)) {
			switch (event.key) {	
				case 'Tab':	  event.preventDefault(); stopAndClearEditing(); dbDispatch.db.hierarchy.path_edit_remoteCreateChildOf(widgetWrapper.path.parentPath); break;
				case 'Enter': event.preventDefault(); stopAndClearEditing(); break;
				default:	  signals.signal_relayout(); break;
			}
		}
	}

	function handleBlur(event) {
		stopAndClearEditing();
		console.log(`BLUR ${widgetWrapper.path.thing()?.title}`);
		updateInputWidth();
	}

	function handleFocus(event) {
		if (!k.allowTitleEditing) {
			input?.blur();
		} else if (!widgetWrapper.path.isEditing) {
			console.log(`FOCUS ${widgetWrapper.path.thing()?.title}`);
			widgetWrapper.path.startEdit();
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
			const path = widgetWrapper.path;
			if (path.isStoppingEdit) {
				console.log(`STOPPING ${path.thing()?.title}`);
				$s_title = null;
				input?.blur();
			} else if (isEditing != path.isEditing) {
				if (isEditing) {
					console.log(`STOP ${path.thing()?.title}`);
					input?.blur();
				} else {
					input?.focus();
					console.log(`RANGE ${path.thing()?.title}`);
					applyRange();
				}
				isEditing = !isEditing;
			}
		}
	}

	function stopAndClearEditing() {
		invokeBlurNotClearEditing();
		setTimeout(() => {		// eliminate infinite recursion
			if (widgetWrapper.path.isEditing) {				
				$s_title.stop();
				signals.signal_relayout_fromHere();
			}
		}, 20);
	}

	function invokeBlurNotClearEditing() {
		if (widgetWrapper.path.isEditing && thing) {
			isEditing = false;
			extractRange();
			input?.blur();
			if (hasChanges() && !thing.isExemplar) {
				dbDispatch.db.thing_remoteUpdate(thing);
				originalTitle = thing.title;		// so hasChanges will be correct
				widgetWrapper.path.signal_relayout();
			}
		}
	}

	function handleCutOrPaste(event) {
		extractRange();
		widgetWrapper.path.signal_relayout();
	}

	function extractRange() {
		if (input) {
			const end = input.selectionEnd;
			const start = input.selectionStart;
			widgetWrapper.path.selectionRange = new SeriouslyRange(start, end);
		}
	}

	function applyRange() {
		const range = widgetWrapper.path.selectionRange;
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