<script lang='ts'>
	import { g, k, Thing, debug, ZIndex, onMount, signals, onDestroy } from '../../ts/common/GlobalImports';
	import { dbDispatch, SeriouslyRange, Wrapper, IDWrapper } from '../../ts/common/GlobalImports';
	import { s_title_editing } from '../../ts/managers/State';
	export let fontFamily = 'Arial';
	export let fontSize = '1em';
	export let thing;
	export let path;
	let padding = `0.5px 0px 0px 7px`;	// down half a pixel, 7 over to make room for drag dot
	let titleWrapper: Wrapper;
	let originalTitle = '';
	let isEditing = false;
	let titleWidth = 0;
	let ghost = null;
	let input = null;

	onDestroy(() => { relayoutHandler.disconnect(); });
	var hasChanges = () => { return originalTitle != thing.title; };
	function handleInput(event) { thing.title = event.target.value; updateInputWidth(); };
	const rebuildHandler = signals.handle_rebuild((path) => setTimeout(() => { updateInputWidth(); }, 10));
	const relayoutHandler = signals.handle_relayout((path) => setTimeout(() => { updateInputWidth(); }, 10));

	$: {
		if (input) {
			titleWrapper = new Wrapper(input, path, IDWrapper.title);
		}
	}
	
	onMount(() => {
		setTimeout(() => {
			updateInputWidth();
		}, 100);
	});

	function updateInputWidth() {
		if (input && ghost) { // ghost only exists to provide its scroll width
			titleWidth = ghost.scrollWidth;
			input.style.width = `${titleWidth}px`;
			// debug.log_edit(`WIDTH: ${titleWidth} ${path.title}`);
		}
	}

	$: {
		if (k.row_height > 0) {
			updateInputWidth();
		}
	}

	$: {
		const _ = $s_title_editing;
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
		if (thing && path.isEditing && canAlterTitle(event)) {
			switch (event.key) {	
				case 'Tab':	  event.preventDefault(); stopAndClearEditing(); g.hierarchy.path_edit_remoteCreateChildOf(path.fromPath); break;
				case 'Enter': event.preventDefault(); stopAndClearEditing(); break;
				default:	  signals.signal_relayout(); break;
			}
		}
	}

	function handleBlur(event) {
		stopAndClearEditing();
		debug.log_edit(`BLUR ${path.title}`);
		updateInputWidth();
	}

	function handleFocus(event) {
		if (!k.allow_TitleEditing) {
			input?.blur();
		} else if (!path.isEditing) {
			debug.log_edit(`FOCUS ${path.title}`);
			path.startEdit();
		}
	}

	$: {

		///////////////////////////////////////////////////////
		//													 //
		//				   manage edit state				 //
		//													 //
		//	N.B., to react, must use $s_path_edit variables	 //
		///////////////////////////////////////////////////////

		if (k.allow_TitleEditing) {
			if (path.isStoppingEdit) {
				debug.log_edit(`STOPPING ${path.title}`);
				$s_title_editing = null;
				input?.blur();
			} else if (isEditing != path.isEditing) {
				if (isEditing) {
					debug.log_edit(`STOP ${path.title}`);
					input?.blur();
				} else {
					input?.focus();
					debug.log_edit(`RANGE ${path.title}`);
					applyRange();
				}
				isEditing = !isEditing;
			}
		}
	}

	function stopAndClearEditing() {
		invokeBlurNotClearEditing();
		setTimeout(() => {		// eliminate infinite recursion
			if (path.isEditing) {				
				$s_title_editing.stop();
				signals.signal_relayout_fromHere();
			}
		}, 20);
	}

	function invokeBlurNotClearEditing() {
		if (path.isEditing && thing) {
			isEditing = false;
			extractRange();
			input?.blur();
			if (hasChanges() && !thing.isExemplar) {
				dbDispatch.db.thing_remoteUpdate(thing);
				originalTitle = thing.title;		// so hasChanges will be correct
				path.signal_relayout();
			}
		}
	}

	function handleCutOrPaste(event) {
		extractRange();
		path.signal_relayout();
	}

	function extractRange() {
		if (input) {
			const end = input.selectionEnd;
			const start = input.selectionStart;
			path.selectionRange = new SeriouslyRange(start, end);
		}
	}

	function applyRange() {
		const range = path.selectionRange;
		if (range && input) {
			input.setSelectionRange(range.start, range.end);
		}
	}

</script>

<style lang='scss'>
	.ghost {
		position: absolute;
		visibility: hidden;
		white-space: pre; /* Preserve whitespace to accurately measure the width */
	}
	.title {
		border: none;
		outline: none;
		white-space: pre;
		position: absolute;
	}
</style>

{#key originalTitle}
	<span class="ghost" bind:this={ghost}
		style='
			font-size: {fontSize};
			font-family: {fontFamily};
			padding: {padding};'>
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
			padding: {padding};
			color: {thing.color};
			font-size: {fontSize};
			z-index: {ZIndex.text};
			font-family: {fontFamily};
			outline-color: {k.color_background};
		'/>
{/key}