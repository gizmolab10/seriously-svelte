<script lang='ts'>
	import { g, k, u, Thing, debug, ZIndex, onMount, signals } from '../../ts/common/GlobalImports';
	import { Wrapper, IDWrapper, dbDispatch, SeriouslyRange } from '../../ts/common/GlobalImports';
	import { s_title_editing, s_paths_grabbed, s_path_toolsCluster } from '../../ts/managers/State';
	export let fontFamily = 'Arial';
	export let fontSize = '1em';
	export let thing;
	export let path;
	let padding = `0.5px 0px 0px 7px`;	// down half a pixel, 7 over to make room for drag dot
	let titleWrapper: Wrapper;
	let originalTitle = '';
	let isEditing = false;
	let cursorStyle = '';
	let titleWidth = 0;
	let clickCount = 0;
	let ghost = null;
	let input = null;
	let clickTimer;

	var hasChanges = () => { return originalTitle != thing.title; };
	function handleInput(event) { thing.title = event.target.value; updateInputWidth(); };
	function handleMouseUp() { clearTimeout(clickTimer); }

	function clearClicks() {
		clickCount = 0;
		clearTimeout(clickTimer);	// clear all previous timers
	}

	$: {
		if (input) {
			titleWrapper = new Wrapper(input, path, IDWrapper.title);
		}
	}
	
	onMount(() => {
		const rebuildHandler = signals.handle_rebuild((path) => { updateInputWidth(); });
		const relayoutHandler = signals.handle_relayout((path) => { updateInputWidth(); });

		setTimeout(() => {
			updateInputWidth();
		}, 100);

		return () => {
			rebuildHandler.disconnect();
			relayoutHandler.disconnect()
		};
	});

	function updateInputWidth() {
		if (input && ghost) { // ghost only exists to provide its scroll width
			titleWidth = ghost.scrollWidth - 5;
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

	function handleDoubleClick(event) {
		event.preventDefault();
		clearClicks();
		path.startEdit();
		input.focus();
    }

	function handleSingleClick(event) {
		event.preventDefault();
		clickCount++;
		clickTimer = setTimeout(() => {
			if (clickCount === 1) {
				handleClick(event);
				clearClicks();
			}
		}, k.threshold_doubleClick);
	}

	function handleClick(event) {
		event.preventDefault();
		if (!path.isEditing) {
			if (!path.isGrabbed) {
				path.grabOnly();
			} else if (k.allow_TitleEditing && !path.isRoot) {
				path.startEdit();
				input.focus();
				return;
			}
			$s_title_editing = null;
			input.blur();
		}
	}
 
	function handleLongClick(event) {
		event.preventDefault();
		clearClicks();
		clickTimer = setTimeout(() => {
			clearClicks();
			if (!path.isRoot) {
				if ($s_path_toolsCluster == path) {
					$s_path_toolsCluster = null;
				} else  {
					path.grabOnly();
					$s_path_toolsCluster = path;
				}
				signals.signal_rebuild_fromHere();
			}
		}, k.threshold_longClick);
	}


	$: {

		//////////////////////////////////////////////////////
		//													//
		//				  manage focus state				//
		//													//
		//////////////////////////////////////////////////////

		const _ = $s_paths_grabbed;
		const editPath = $s_title_editing;
		if (k.allow_TitleEditing) {
			if (path.isStoppingEdit) {
				debug.log_edit(`STOPPING ${path.title}`);
				$s_title_editing = null;
				input?.blur();
			} else {
				if (isEditing != path.matchesPath(editPath?.editing ?? null)) {
					if (!isEditing) {
						input?.focus();
						debug.log_edit(`RANGE ${path.title}`);
						applyRange();
					} else {
						debug.log_edit(`STOP ${path.title}`);
						input?.blur();
					}
					isEditing = !isEditing;
				}
			}
		}
		cursorStyle = (!path.isRoot && (path.isEditing || path.isGrabbed)) ? '' : 'cursor: pointer';
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
	input:focus {
		outline: none;
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
		on:input={handleInput}
		bind:value={thing.title}
		on:cut={handleCutOrPaste}
		on:mouseup={handleMouseUp}
		on:keydown={handleKeyDown}
		on:paste={handleCutOrPaste}
		on:click={handleSingleClick}
		on:mousedown={handleLongClick}
		on:dblclick={handleDoubleClick}
		style='left: 10px;
			{cursorStyle};
			padding: {padding};
			color: {thing.color};
			width: {titleWidth}px;
			font-size: {fontSize};
			z-index: {ZIndex.text};
			font-family: {fontFamily};
			outline-color: {k.color_background};
		'/>
{/key}