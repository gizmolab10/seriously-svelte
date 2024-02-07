<script lang='ts'>
	import { dbDispatch, SeriouslyRange, Wrapper, TypeW } from '../../ts/common/GlobalImports';
	import { k, Thing, ZIndex, onMount, signals, onDestroy } from '../../ts/common/GlobalImports';
	import { s_title_editing, s_row_height } from '../../ts/managers/State';
	export let fontFamily = 'Arial';
	export let fontSize = '1em';
	export let path;
	let thing = path.thing();
	let originalTitle = thing.title;
	let titleWrapper: Wrapper;
	let isEditing = false;
	let titleWidth = 0;
	let ghost = null;
	let input = null;

	onDestroy(() => { thing = null; relayoutHandler.disconnect(); });
	var hasChanges = () => { return originalTitle != thing.title; };
	function handleInput(event) { thing.title = event.target.value; updateInputWidth(); };
	const relayoutHandler = signals.handle_relayout((path) => setTimeout(() => { updateInputWidth(); }, 10));
	const rebuildHandler = signals.handle_rebuild((path) => setTimeout(() => { updateInputWidth(); }, 10));

	$: {
		if (input) {
			// if (path.thingTitle == 'a') {
			// 	console.log(`TITLE ${path.thingTitles}`);
			// }
			titleWrapper = new Wrapper(input, path, TypeW.title);
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
			// console.log(`WIDTH: ${titleWidth} ${path.thingTitle}`);
		}
	}

	$: {
		if ($s_row_height > 0) {
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
				case 'Tab':	  event.preventDefault(); stopAndClearEditing(); dbDispatch.db.hierarchy.path_edit_remoteCreateChildOf(path.parentPath); break;
				case 'Enter': event.preventDefault(); stopAndClearEditing(); break;
				default:	  signals.signal_relayout(); break;
			}
		}
	}

	function handleBlur(event) {
		stopAndClearEditing();
		console.log(`BLUR ${path.thingTitle}`);
		updateInputWidth();
	}

	function handleFocus(event) {
		if (!k.allowTitleEditing) {
			input?.blur();
		} else if (!path.isEditing) {
			console.log(`FOCUS ${path.thingTitle}`);
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

		if (k.allowTitleEditing) {
			if (path.isStoppingEdit) {
				console.log(`STOPPING ${path.thingTitle}`);
				$s_title_editing = null;
				input?.blur();
			} else if (isEditing != path.isEditing) {
				if (isEditing) {
					console.log(`STOP ${path.thingTitle}`);
					input?.blur();
				} else {
					input?.focus();
					console.log(`RANGE ${path.thingTitle}`);
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