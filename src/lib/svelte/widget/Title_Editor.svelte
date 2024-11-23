<script lang='ts'>
	import { Graph_Type, dbDispatch, Seriously_Range, Svelte_Wrapper, SvelteComponentType } from '../../ts/common/Global_Imports';
	import { s_hierarchy, s_graph_type, s_thing_color, s_title_thing, s_edit_state } from '../../ts/state/Svelte_Stores';
	import { s_thing_fontFamily, s_grabbed_ancestries, s_ancestry_showing_tools } from '../../ts/state/Svelte_Stores';
	import { g, k, u, Point, Thing, debug, Angle, ZIndex, signals } from '../../ts/common/Global_Imports';
	import { onMount } from 'svelte';
	export let fontSize = '1em';
	export let forward = true;
	export let ancestry;
	const titleTop = g.showing_rings ? 0.5 : 0;
	let padding = `0.5px 0px 0px 6.5px`;	// 8.5 makes room for drag dot
	let bound_title = ancestry?.thing?.title ?? k.empty;
    let color = ancestry.thing?.color;
	let titleWrapper: Svelte_Wrapper;
	let originalTitle = k.empty;
	let cursorStyle = k.empty;
	let mouse_click_timer;
	let isEditing = false;
	let clickCount = 0;
	let titleWidth = 0;
	let titleLeft = 0;
    let thing!: Thing;
	let ghost = null;
	let input = null;

	function handle_mouse_up() { clearClicks(); }
	var hasChanges = () => { return originalTitle != bound_title; };

	function handle_input(event) {
		const title = event.target.value;
		if (!!thing && (!!title || title == k.empty)) {
			thing.title = bound_title = title;
			s_title_thing.set(null);
		}
	};
	
	onMount(() => {
		if (!!ancestry?.thing) {
			titleWidth = ancestry.thing.titleWidth + 6;
			titleLeft = g.showing_rings ? ancestry.isFocus ? -2 : (forward ? 14 : 4) : 10;
		}
		const handler = signals.handle_anySignal((IDSignal, ancestry) => { updateInputWidth(); });
		setTimeout(() => { updateInputWidth(); }, 100);
		return () => { handler.disconnect() };
	})

	function handle_key_down(event) {
		if (!!thing && !!ancestry && ancestry.isEditing && canAlterTitle(event)) {
			debug.log_key(`TITLE  ${event.key}`);
			switch (event.key) {	
				case 'Tab':	  event.preventDefault(); stopAndClearEditing(); $s_hierarchy.ancestry_edit_remoteCreateChildOf(ancestry.parentAncestry); break;
				case 'Enter': event.preventDefault(); stopAndClearEditing(); break;
				default:	  s_title_thing.set(thing.id); break;
			}
		}
	}

	function clearClicks() {
		clickCount = 0;
		clearTimeout(mouse_click_timer);	// clear all previous timers
	}

	$: {
		const _ = $s_edit_state;
		updateInputWidth();
	}

	$: {
		if (!!input && !titleWrapper) {
			titleWrapper = new Svelte_Wrapper(input, handle_mouse_state, ancestry.idHashed, SvelteComponentType.title);
		}
	}

	$: {
		if (!!ancestry.thing && ancestry.thing.id == $s_thing_color?.split(k.generic_separator)[0]) {
			color = thing?.color;
		}
	}
 
	function isHit(): boolean {
		return false
	}

	function handle_mouse_state(mouse_state: Mouse_State): boolean {
		return false;
	}

	function updateInputWidth() {
		if (!!input && !!ghost) { // ghost only exists to provide its width (in pixels)
			titleWidth = ghost.scrollWidth - 5;
			input.style.width = `${titleWidth}px`;	// apply its width to the input element
		}
	}

	function canAlterTitle(event) {
		var canAlter = (event instanceof KeyboardEvent) && !event.altKey && !event.shiftKey && !event.code.startsWith("Cluster_Label");
		if (canAlter && event.metaKey) {
			canAlter = false;
		}
		return canAlter;
	}

	function handleBlur(event) {
		stopAndClearEditing();
		debug.log_edit(`BLUR ${bound_title}`);
		updateInputWidth();
	}

	function handle_doubleClick(event) {
		debug.log_action(` double click '${thing.title}' TITLE`);
		event.preventDefault();
		startEditMaybe();
		clearClicks();
    }

	function startEditMaybe() {
		if (g.allow_TitleEditing && !ancestry.isRoot && !!thing && !thing.isBulkAlias) {
			ancestry?.startEdit();
			input?.focus();
		}
	}

	function handle_singleClick(event) {
		if (!!ancestry && !ancestry.isEditing) {
			event.preventDefault();
			if (ancestry.isGrabbed) {
				startEditMaybe();
			} else {
				if (event.shiftKey) {
					ancestry.grab();
				} else {
					ancestry.grabOnly();
				}
				$s_edit_state = null;
			}
		}
	}
 
	function handle_longClick(event) {
		if (!!ancestry && !ancestry.isEditing) {
			event.preventDefault();
			clearClicks();
			mouse_click_timer = setTimeout(() => {
				clearClicks();
				if (!ancestry.isRoot) {
					if ($s_ancestry_showing_tools == ancestry) {
						$s_ancestry_showing_tools = null;
					} else  {
						ancestry.grabOnly();
						$s_ancestry_showing_tools = ancestry;
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
		const hasGrabbed = $s_grabbed_ancestries.length > 0;
		const titleState = $s_edit_state; // needs reactivity to s_edit_state
		const titleState_isEditing = !!ancestry && !!titleState && titleState.editing && ancestry.matchesAncestry(titleState.editing);
		const isBulkAlias = !!thing && thing.isBulkAlias;
		if (g.allow_TitleEditing && !isBulkAlias) {
			if (!!ancestry && (ancestry.isStoppingEdit ?? false)) {
				debug.log_edit(`STOPPING ${bound_title}`);
				$s_edit_state = null;
				input?.blur();
			} else if (isEditing != titleState_isEditing) {
				if (!isEditing) {
					input?.focus();
					debug.log_edit(`RANGE ${bound_title}`);
					applyRange();
				} else {
					debug.log_edit(`STOP ${bound_title}`);
					input?.blur();
				}
				isEditing = !isEditing;
			}
		}
		cursorStyle = (ancestry.isEditing || ancestry.isGrabbed) ? 'cursor: text' : g.showing_rings ? 'cursor: pointer' : (!!ancestry && !ancestry.isRoot && !isBulkAlias) ? k.empty : 'cursor: text';
	}

	function stopAndClearEditing() {
		invokeBlurNotClearEditing();
		if (!!ancestry && ancestry.isEditing) {				
			setTimeout(() => {		// eliminate infinite recursion
				const state = $s_edit_state;
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
			if (hasChanges()) {
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
		if (!!input && !!ancestry) {
			const end = input.selectionEnd;
			const start = input.selectionStart;
			ancestry.selectionRange = new Seriously_Range(start, end);
		}
	}

	function applyRange() {
		const range = ancestry?.thing?.selectionRange;
		if (!!range && !!input) {
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
			left:-9999px;
			padding: {padding};
			position: absolute;
			visibility: hidden;
			font-size: {fontSize};
			font-family: {$s_thing_fontFamily};
			white-space: pre; /* Preserve whitespace to accurately measure the width */
	'>
		{bound_title}
	</span>
	<input
		type='text'
		name='title'
		class='title'
		bind:this={input}
		on:blur={handleBlur}
		on:input={handle_input}
		bind:value={bound_title}
		on:cut={handle_cut_paste}
		on:paste={handle_cut_paste}
		on:mouseup={handle_mouse_up}
		on:keydown={handle_key_down}
		on:click={handle_singleClick}
		on:mousedown={handle_longClick}
		on:dblclick={handle_doubleClick}
		style='
			border: none;
			{cursorStyle};
			outline: none;
			color: {color};
			white-space: pre;
			top: {titleTop}px;
			position: absolute;
			padding: {padding};
			position: absolute;
			left: {titleLeft}px;
			width: {titleWidth}px;
			font-size: {fontSize};
			z-index: {ZIndex.text};
			{k.prevent_selection_style};
			font-family: {$s_thing_fontFamily};
			outline-color: {k.color_background};
		'/>
{/key}