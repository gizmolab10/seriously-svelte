<script lang='ts'>
	import { signals, Wrapper, IDWrapper, dbDispatch, SeriouslyRange } from '../../ts/common/GlobalImports';
	import { g, k, u, Point, Thing, debug, ZIndex, onMount, Angle } from '../../ts/common/GlobalImports';
	import { s_title_editing, s_paths_grabbed, s_path_editingTools } from '../../ts/state/State';
	export let fontFamily = 'Arial';
	export let fontSize = '1em';
    export let angle = 0;
	export let path;
	let normal = angle <= Angle.quarter || angle >= Angle.threeQuarters;
	let position = normal ? k.empty : 'position: absolute';
	let padding = `0.5px 0px 0px 5px`;	// down half a pixel, 7 over to make room for drag dot
	let thingTitle = path?.thing?.title ?? k.empty;
	let originalTitle = k.empty;
	let cursorStyle = k.empty;
	let titleWrapper: Wrapper;
	let isEditing = false;
	let titleWidth = 0;
	let clickCount = 0;
	let ghost = null;
	let input = null;
	let clickTimer;
	let left = 10;
    let thing;

	var hasChanges = () => { return originalTitle != thingTitle; };
	function handle_mouseUp() { clearTimeout(clickTimer); }

	function handle_input(event) {
		thing?.title = event.target.value;
		thingTitle = thing?.title ?? k.empty;
	};
	
	onMount(() => {
		titleWidth = u.getWidthOf(thingTitle);
		left = normal ? 10 : -10 - titleWidth;
		const handler = signals.handle_anySignal((IDSignal, path) => { updateInputWidth(); });
		setTimeout(() => { updateInputWidth(); }, 100);
		return () => { handler.disconnect() };
	});

	function handle_key_down(event) {
		if (!!thing && !!path && path.isEditing && canAlterTitle(event)) {
			switch (event.key) {	
				case 'Tab':	  event.preventDefault(); stopAndClearEditing(); g.hierarchy.path_edit_remoteCreateChildOf(path.parentPath); break;
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
			// debug.log_edit(`WIDTH: ${titleWidth} ${thingTitle}`);
		}
	}

	function canAlterTitle(event) {
		var canAlter = (event instanceof KeyboardEvent) && !event.altKey && !event.shiftKey && !event.code.startsWith("ClusterLine");
		if (canAlter && event.metaKey) {
			canAlter = false;
		}
		return canAlter;
	}

	function handleBlur(event) {
		stopAndClearEditing();
		debug.log_edit(`BLUR ${thingTitle}`);
		updateInputWidth();
	}

	function handle_doubleClick(event) {
		event.preventDefault();
		clearClicks();
		path?.startEdit();
		input.focus();
    }

	function handle_singleClick(event) {
		clickCount++;
		clickTimer = setTimeout(() => {
			if (clickCount === 1 && !!path && !path.isEditing) {
				event.preventDefault();
				if (!path.isGrabbed) {
					path.grabOnly();
				} else if (k.allow_TitleEditing && !path.isRoot && !!thing && !thing.isBulkAlias) {
					path.startEdit();
					input.focus();
					return;
				}
				$s_title_editing = null;
				input.blur();
				clearClicks();
			}
		}, k.threshold_doubleClick);
	}
 
	function handle_longClick(event) {
		if (!!path && !path.isEditing) {
			event.preventDefault();
			clearClicks();
			clickTimer = setTimeout(() => {
				clearClicks();
				if (!path.isRoot) {
					if ($s_path_editingTools == path) {
						$s_path_editingTools = null;
					} else  {
						path.grabOnly();
						$s_path_editingTools = path;
					}
					signals.signal_rebuildGraph_fromFocus();
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

		if (!!path) {
			thing = path.thing;
		}
		const _ = $s_paths_grabbed;
		const titleState = $s_title_editing; // needs reactivity to s_title_editing
		const titleState_isEditing = !!path && !!titleState && titleState.editing && path.matchesPath(titleState.editing);
		const isBulkAlias = !!thing && thing.isBulkAlias;
		if (k.allow_TitleEditing && !isBulkAlias) {
			if (!!path && path.isStoppingEdit ?? false) {
				debug.log_edit(`STOPPING ${thingTitle}`);
				$s_title_editing = null;
				input?.blur();
			} else if (isEditing != titleState_isEditing) {
				if (!isEditing) {
					input?.focus();
					debug.log_edit(`RANGE ${thingTitle}`);
					applyRange();
				} else {
					debug.log_edit(`STOP ${thingTitle}`);
					input?.blur();
				}
				isEditing = !isEditing;
			}
		}
		cursorStyle = (!!path && !path.isRoot && !isBulkAlias && (path.isEditing || path.isGrabbed)) ? k.empty : 'cursor: pointer';
	}

	function stopAndClearEditing() {
		invokeBlurNotClearEditing();
		if (!!path && path.isEditing) {				
			setTimeout(() => {		// eliminate infinite recursion
				const state = $s_title_editing;
				if (!!state) {
					state.stop()
					signals.signal_relayoutWidgets_fromFocus();
				}
			}, 2);
		}
	}

	function invokeBlurNotClearEditing() {
		if (!!path && path.isEditing && thing) {
			isEditing = false;
			extractRange();
			input?.blur();
			if (hasChanges() && !thing?.isExemplar) {
				dbDispatch.db.thing_remoteUpdate(thing);
				originalTitle = thing?.title;		// so hasChanges will be correct
				path.signal_relayoutWidgets();
			}
		}
	}

	function handle_cut_paste(event) {
		extractRange();
		path?.signal_relayoutWidgets();
	}

	function extractRange() {
		if (input && !!path) {
			const end = input.selectionEnd;
			const start = input.selectionStart;
			path.selectionRange = new SeriouslyRange(start, end);
		}
	}

	function applyRange() {
		const range = path?.selectionRange;
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
		{thingTitle}
	</span>
	<input
		type='text'
		name='title'
		class='title'
		bind:this={input}
		on:blur={handleBlur}
		on:input={handle_input}
		bind:value={thingTitle}
		on:cut={handle_cut_paste}
		on:mouseup={handle_mouseUp}
		on:keydown={handle_key_down}
		on:paste={handle_cut_paste}
		on:click={handle_singleClick}
		on:mousedown={handle_longClick}
		on:dblclick={handle_doubleClick}
		style='
			top: 0.5px;
			{position};
			{cursorStyle};
			left: {left}px;
			padding: {padding};
			color: {thing?.color};
			width: {titleWidth}px;
			font-size: {fontSize};
			z-index: {ZIndex.text};
			font-family: {fontFamily};
			outline-color: {k.color_background};
		'/>
{/key}