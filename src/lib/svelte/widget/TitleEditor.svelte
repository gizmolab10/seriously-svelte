<script lang='ts'>
	import { g, k, u, Thing, debug, ZIndex, onMount, signals } from '../../ts/common/GlobalImports';
	import { Wrapper, IDWrapper, dbDispatch, SeriouslyRange } from '../../ts/common/GlobalImports';
	import { s_title_editing, s_paths_grabbed, s_path_toolsCluster } from '../../ts/common/State';
	export let fontFamily = 'Arial';
	export let fontSize = '1em';
	export let path;
	let padding = `0.5px 0px 0px 7px`;	// down half a pixel, 7 over to make room for drag dot
	let titleWidth = u.getWidthOf(path.thing.title);
	let titleWrapper: Wrapper;
	let originalTitle = '';
	let isEditing = false;
	let cursorStyle = '';
	let clickCount = 0;
	let ghost = null;
	let input = null;
	let clickTimer;

	var hasChanges = () => { return originalTitle != path.thing.title; };
	function handleInput(event) { path.thing.title = event.target.value; };
	function handleMouseUp() { clearTimeout(clickTimer); }
	
	onMount(() => {
		const handler = signals.handle_anySignal((IDSignal, path) => { updateInputWidth(); });
		setTimeout(() => { updateInputWidth(); }, 100);
		return () => { handler.disconnect() };
	});

	function handle_key_down(event) {
		if (path.thing && path.isEditing && canAlterTitle(event)) {
			switch (event.key) {	
				case 'Tab':	  event.preventDefault(); stopAndClearEditing(); g.hierarchy.path_edit_remoteCreateChildOf(path.fromPath); break;
				case 'Enter': event.preventDefault(); stopAndClearEditing(); break;
				default:	  signals.signal_relayoutWidgets(); break;
			}
		}
	}

	function clearClicks() {
		clickCount = 0;
		clearTimeout(clickTimer);	// clear all previous timers
	}

	$: {
		const _ = $s_title_editing;
		updateInputWidth();
	}

	$: {
		if (input && !titleWrapper) {
			titleWrapper = new Wrapper(input, path, IDWrapper.title);
		}
	}

	function updateInputWidth() {
		if (input && ghost) { // ghost only exists to provide its width (in pixels)
			titleWidth = ghost.scrollWidth - 5;
			input.style.width = `${titleWidth}px`;	// apply its width to the input element
			// debug.log_edit(`WIDTH: ${titleWidth} ${path.title}`);
		}
	}

	function canAlterTitle(event) {
		var canAlter = (event instanceof KeyboardEvent) && !event.altKey && !event.shiftKey && !event.code.startsWith("Arrow");
		if (canAlter && event.metaKey) {
			canAlter = false;
		}
		return canAlter;
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
		clickCount++;
		clickTimer = setTimeout(() => {
			if (clickCount === 1) {
				handleClick(event);
				clearClicks();
			}
		}, k.threshold_doubleClick);
	}

	function handleClick(event) {
		if (!path.isEditing) {
			event.preventDefault();
			if (!path.isGrabbed) {
				path.grabOnly();
			} else if (k.allow_TitleEditing && !path.isRoot && !path.thing.isBulkAlias) {
				path.startEdit();
				input.focus();
				return;
			}
			$s_title_editing = null;
			input.blur();
		}
	}
 
	function handleLongClick(event) {
		if (!path.isEditing) {
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
					signals.signal_rebuildWidgets_fromHere();
				}
			}, k.threshold_longClick);
		}
	}


	$: {

		//////////////////////////////////////////////////////
		//													//
		//				  manage focus state				//
		//													//
		//////////////////////////////////////////////////////

		const _ = $s_paths_grabbed;
		const editPath = $s_title_editing;
		if (k.allow_TitleEditing && !path.thing.isBulkAlias) {
			if (path.isStoppingEdit) {
				debug.log_edit(`STOPPING ${path.title}`);
				$s_title_editing = null;
				input?.blur();
			} else if (isEditing != path.matchesPath(editPath?.editing ?? null)) { // needs reactivity to $s_title_editing;
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
		cursorStyle = (!path.isRoot && !path.thing.isBulkAlias && (path.isEditing || path.isGrabbed)) ? '' : 'cursor: pointer';
	}

	function stopAndClearEditing() {
		invokeBlurNotClearEditing();
		if (path.isEditing) {				
			setTimeout(() => {		// eliminate infinite recursion
				const state = $s_title_editing;
				if (state) {
					state.stop()
					signals.signal_relayoutWidgets_fromHere();
				}
			}, 2);
		}
	}

	function invokeBlurNotClearEditing() {
		if (path.isEditing && path.thing) {
			isEditing = false;
			extractRange();
			input?.blur();
			if (hasChanges() && !path.thing.isExemplar) {
				dbDispatch.db.thing_remoteUpdate(path.thing);
				originalTitle = path.thing.title;		// so hasChanges will be correct
				path.signal_relayoutWidgets();
			}
		}
	}

	function handleCutOrPaste(event) {
		extractRange();
		path.signal_relayoutWidgets();
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
			padding: {padding};
			font-size: {fontSize};
			font-family: {fontFamily};'>
		{path.thing.title}
	</span>
	<input
		type='text'
		name='title'
		class='title'
		bind:this={input}
		on:blur={handleBlur}
		on:input={handleInput}
		bind:value={path.thing.title}
		on:cut={handleCutOrPaste}
		on:mouseup={handleMouseUp}
		on:keydown={handle_key_down}
		on:paste={handleCutOrPaste}
		on:click={handleSingleClick}
		on:mousedown={handleLongClick}
		on:dblclick={handleDoubleClick}
		style='left: 10px;
			{cursorStyle};
			padding: {padding};
			color: {path.thing.color};
			width: {titleWidth}px;
			font-size: {fontSize};
			z-index: {ZIndex.text};
			font-family: {fontFamily};
			outline-color: {k.color_background};
		'/>
{/key}