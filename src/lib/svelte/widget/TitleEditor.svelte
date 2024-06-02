<script lang='ts'>
	import { dbDispatch, SeriouslyRange, SvelteWrapper, SvelteComponentType } from '../../ts/common/GlobalImports';
	import { k, u, Point, Thing, debug, Angle, ZIndex, onMount, signals } from '../../ts/common/GlobalImports';
	import { s_thing_changed, s_title_editing, s_ancestries_grabbed } from '../../ts/state/ReactiveState';
	import { s_layout_asClusters, s_ancestry_editingTools } from '../../ts/state/ReactiveState';
	export let fontFamily = 'Arial';
	export let fontSize = '1em';
	export let forward = true;
	export let ancestry;
	let padding = `0.5px 0px 0px 5px`;	// down half a pixel, 7 over to make room for drag dot
	let thingTitle = ancestry?.thing?.title ?? k.empty;
    let color = ancestry.thing?.color;
	let titleWrapper: SvelteWrapper;
	let originalTitle = k.empty;
	let cursorStyle = k.empty;
	let mouse_click_timer;
	let isEditing = false;
	let titleWidth = 0;
	let clickCount = 0;
	let ghost = null;
	let input = null;
	let top = 0;
    let thing;

	var hasChanges = () => { return originalTitle != thingTitle; };
	function handle_mouse_up() { clearTimeout(mouse_click_timer); }

	function handle_input(event) {
		thing?.title = event.target.value;
		thingTitle = thing?.title ?? k.empty;
	};
	
	onMount(() => {
		titleWidth = ancestry?.thing?.titleWidth + 6;
		const handler = signals.handle_anySignal((IDSignal, ancestry) => { updateInputWidth(); });
		setTimeout(() => { updateInputWidth(); }, 100);
		return () => { handler.disconnect() };
	});

	function handle_key_down(event) {
		if (!!thing && !!ancestry && ancestry.isEditing && canAlterTitle(event)) {
			switch (event.key) {	
				case 'Tab':	  event.preventDefault(); stopAndClearEditing(); h.ancestry_edit_remoteCreateChildOf(ancestry.parentAncestry); break;
				case 'Enter': event.preventDefault(); stopAndClearEditing(); break;
				default:	  signals.signal_relayoutWidgets(); break;
			}
		}
	}

	function clearClicks() {
		clickCount = 0;
		clearTimeout(mouse_click_timer);	// clear all previous timers
	}

	$: {
		const _ = $s_title_editing;
		updateInputWidth();
	}

	$: {
		if (input && !titleWrapper) {
			titleWrapper = new SvelteWrapper(input, ancestry, SvelteComponentType.title);
		}
	}

	$: {
		if (ancestry.thing?.id == $s_thing_changed.split(k.genericSeparator)[0]) {
			color = thing?.color;
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
		ancestry?.startEdit();
		input.focus();
    }

	function handle_singleClick(event) {
		clickCount++;
		mouse_click_timer = setTimeout(() => {
			if (clickCount === 1 && !!ancestry && !ancestry.isEditing) {
				event.preventDefault();
				if (!ancestry.isGrabbed) {
					ancestry.grabOnly();
				} else if (k.allow_TitleEditing && !ancestry.isRoot && !!thing && !thing.isBulkAlias) {
					ancestry.startEdit();
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
		if (!!ancestry && !ancestry.isEditing) {
			event.preventDefault();
			clearClicks();
			mouse_click_timer = setTimeout(() => {
				clearClicks();
				if (!ancestry.isRoot) {
					if ($s_ancestry_editingTools == ancestry) {
						$s_ancestry_editingTools = null;
					} else  {
						ancestry.grabOnly();
						$s_ancestry_editingTools = ancestry;
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

		if (!!ancestry) {
			thing = ancestry.thing;
		}
		const hasGrabbed = $s_ancestries_grabbed.length > 0;
		const titleState = $s_title_editing; // needs reactivity to s_title_editing
		const titleState_isEditing = !!ancestry && !!titleState && titleState.editing && ancestry.matchesAncestry(titleState.editing);
		const isBulkAlias = !!thing && thing.isBulkAlias;
		if (k.allow_TitleEditing && !isBulkAlias) {
			if (!!ancestry && ancestry.isStoppingEdit ?? false) {
				debug.log_edit(`STOPPING ${thingTitle}`);
				$s_title_editing = null;
				top = hasGrabbed ? 2 : 0.5;
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
		cursorStyle = (!!ancestry && !ancestry.isRoot && !isBulkAlias && (ancestry.isEditing || ancestry.isGrabbed)) ? k.empty : 'cursor: pointer';
	}

	function stopAndClearEditing() {
		invokeBlurNotClearEditing();
		if (!!ancestry && ancestry.isEditing) {				
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
		if (!!ancestry && ancestry.isEditing && thing) {
			isEditing = false;
			extractRange();
			input?.blur();
			if (hasChanges() && !thing?.isExemplar) {
				dbDispatch.db.thing_remoteUpdate(thing);
				originalTitle = thing?.title;		// so hasChanges will be correct
				ancestry.signal_relayoutWidgets();
			}
		}
	}

	function handle_cut_paste(event) {
		extractRange();
		ancestry?.signal_relayoutWidgets();
	}

	function extractRange() {
		if (input && !!ancestry) {
			const end = input.selectionEnd;
			const start = input.selectionStart;
			ancestry.selectionRange = new SeriouslyRange(start, end);
		}
	}

	function applyRange() {
		const range = ancestry?.selectionRange;
		if (range && input) {
			input.setSelectionRange(range.start, range.end);
		}
	}

</script>

<style lang='scss'>
	input:focus {
		outline: none;
	}
</style>

{#key originalTitle}
	<span class="ghost" bind:this={ghost}
		style='
			padding: {padding};
			position: absolute;
			visibility: hidden;
			font-size: {fontSize};
			font-family: {fontFamily};
			white-space: pre; /* Preserve whitespace to accurately measure the width */
	'>
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
		on:mouseup={handle_mouse_up}
		on:keydown={handle_key_down}
		on:paste={handle_cut_paste}
		on:click={handle_singleClick}
		on:mousedown={handle_longClick}
		on:dblclick={handle_doubleClick}
		style='
			top: {top}px;
			border: none;
			{cursorStyle};
			outline: none;
			color: {color};
			white-space: pre;
			position: absolute;
			padding: {padding};
			position: absolute;
			width: {titleWidth}px;
			font-size: {fontSize};
			z-index: {ZIndex.text};
			font-family: {fontFamily};
			{k.prevent_selection_style};
			outline-color: {k.color_background};
			left: {$s_layout_asClusters ? (forward ? 14 : 4) : 10}px;
		'/>
{/key}