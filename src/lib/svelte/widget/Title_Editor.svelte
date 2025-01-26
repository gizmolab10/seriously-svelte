<script lang='ts'>
	import { T_Graph, databases, Seriously_Range, Svelte_Wrapper, T_SvelteComponent } from '../../ts/common/Global_Imports';
	import { s_hierarchy, s_graph_type, s_thing_color, s_thing_title, s_title_edit_state } from '../../ts/state/S_Stores';
	import { s_thing_fontFamily, s_ancestries_grabbed, s_ancestry_showing_tools } from '../../ts/state/S_Stores';
	import { g, k, u, Point, Thing, debug, Angle, T_Layer, signals } from '../../ts/common/Global_Imports';
	import { onMount } from 'svelte';
	export let points_right = true;
	export let fontSize = '1em';
	export let ancestry;
	let bound_title = thing()?.title ?? k.empty;
    let color = thing()?.color ?? k.empty;
	let padding = `0.5px 0px 0px 0px`;
	let titleWrapper: Svelte_Wrapper;
	let originalTitle = k.empty;
	let cursorStyle = k.empty;
	let mouse_click_timer;
	let isEditing = false;
	let clickCount = 0;
	let titleWidth = 0;
	let titleLeft = 0;
	let ghost = null;
	let input = null;

	function isHit(): boolean { return false }
	function handle_mouse_up() { clearClicks(); }
	var hasChanges = () => { return originalTitle != bound_title; };
	function thing(): Thing | null { return ancestry?.thing ?? null; }
	function handle_mouse_state(mouse_state: S_Mouse): boolean { return false; }

	export const _____REACTIVES_____: unique symbol = Symbol('_____REACTIVES_____');
	
	$: {
		const _ = $s_title_edit_state;
		updateInputWidth();
	}

	$: {
		if (!!input && !titleWrapper) {
			titleWrapper = new Svelte_Wrapper(input, handle_mouse_state, ancestry.hid, T_SvelteComponent.title);
		}
	}

	$: {
		if (!!thing() && thing().id == $s_thing_color?.split(k.generic_separator)[0]) {
			color = thing()?.color;
		}
	}

	$: {

		//////////////////////////////////////////////////////
		//													//
		//				  manage focus state				//
		//													//
		//////////////////////////////////////////////////////

		if (!!ancestry) {
			const hasGrabbed = ($s_ancestries_grabbed ?? [])?.length > 0;
			const te_state = $s_title_edit_state; // react to s_title_edit_state
			if (ancestry.isEditable) {
				if (!!ancestry && (ancestry.isStoppingEdit ?? false)) {
					debug.log_edit(`STOPPING ${bound_title}`);
					$s_title_edit_state = null;
					input?.blur();
				} else if (isEditing != title_isEditing()) {
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
			cursorStyle = (ancestry.isEditing || ancestry.isGrabbed) ? 'cursor: text' : g.inRadialMode ? 'cursor: pointer' : ancestry.isEditable ? k.empty : 'cursor: text';
		}
	}

	export const _____PRIMITIVES_____: unique symbol = Symbol('_____PRIMITIVES_____');
 
	function title_isEditing(): boolean {
		const te_state = $s_title_edit_state;
		return !!ancestry && !!te_state && te_state.editing && ancestry.ancestry_hasEqualID(te_state.editing);
	}

	function clearClicks() {
		clickCount = 0;
		clearTimeout(mouse_click_timer);	// clear all previous timers
	}

	function updateInputWidth() {
		if (!!input && !!ghost) { // ghost only exists to provide its width (in pixels)
			titleWidth = ghost.scrollWidth + 5;
			input.style.width = `${titleWidth}px`;	// apply its width to the input element
		}
	}

	function applyRange() {
		const range = thing()?.selectionRange;
		if (!!range && !!input) {
			input.setSelectionRange(range.start, range.end);
		}
	}

	function extractRange() {
		if (!!input && !!ancestry) {
			const end = input.selectionEnd;
			const start = input.selectionStart;
			ancestry.selectionRange = new Seriously_Range(start, end);
		}
	}

	function canAlterTitle(event) {
		var canAlter = (event instanceof KeyboardEvent) && !event.altKey && !event.shiftKey && !event.code.startsWith("Cluster_Label");
		if (canAlter && event.metaKey) {
			canAlter = false;
		}
		return canAlter;
	}

	export const _____HANDLERS_____: unique symbol = Symbol('_____HANDLERS_____');
	
	onMount(() => {
		if (!!thing()) {
			const showingReveal = ancestry?.showsReveal ?? false;
			titleWidth = thing().titleWidth + (showingReveal ? 6 : 1) + 15;
			titleLeft = g.inRadialMode ? ancestry.isFocus ? 5 : (points_right ? 21 : (showingReveal ? 18.5 : 10)) : 19;
		}
		const handler = signals.handle_anySignal((T_Signal, ancestry) => { updateInputWidth(); });
		setTimeout(() => { updateInputWidth(); }, 100);
		return () => { handler.disconnect() };
	})

	function handle_cut_paste(event) {
		extractRange();
		ancestry?.signal_relayoutWidgets_fromThis();
	}

	function handleBlur(event) {
		stopAndClearEditing();
		debug.log_edit(`BLUR ${bound_title}`);
		updateInputWidth();
	}

	function handle_doubleClick(event) {
		debug.log_action(` double click '${thing().title}' TITLE`);
		event.preventDefault();
		startEditMaybe();
		clearClicks();
    }

	function handle_input(event) {
		const title = event.target.value;
		if (!!thing() && (!!title || title == k.empty)) {
			thing().title = bound_title = title;
			s_thing_title.set(null);
		}
	};

	function handle_key_down(event) {
		if (!!thing() && !!ancestry && ancestry.isEditing && canAlterTitle(event)) {
			debug.log_key(`TITLE  ${event.key}`);
			switch (event.key) {	
				case 'Tab':	  event.preventDefault(); stopAndClearEditing(); $s_hierarchy.ancestry_edit_persistentCreateChildOf(ancestry.parentAncestry); break;
				case 'Enter': event.preventDefault(); stopAndClearEditing(); break;
				default:	  s_thing_title.set(thing().id); break;
			}
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
				$s_title_edit_state = null;
				signals.signal_relayoutWidgets_fromFocus();
			}
		}
	}
 
	function handle_longClick(event) {
		if (!!ancestry && !ancestry.isEditing) {
			event.preventDefault();
			clearClicks();
			mouse_click_timer = setTimeout(() => {
				clearClicks();
				if (ancestry.isEditable) {
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

	export const _____EDIT_____: unique symbol = Symbol('_____EDIT_____');

	function startEditMaybe() {
		if (ancestry.isEditable) {
			ancestry?.startEdit();
			input?.focus();
		}
	}

	function stopAndClearEditing() {
		invokeBlurNotClearEditing();
		if (!!ancestry && ancestry.isEditing) {				
			setTimeout(() => {									// eliminate infinite recursion
				const te_state = $s_title_edit_state;
				if (!!te_state) {
					te_state.stop();
					signals.signal_relayoutWidgets_fromFocus();
				}
			}, 2);
		}
	}

	function invokeBlurNotClearEditing() {
		if (!!ancestry && ancestry.isEditing && thing()) {
			isEditing = false;
			extractRange();
			input?.blur();
			if (hasChanges()) {
				databases.db.thing_persistentUpdate(thing());
				originalTitle = thing()?.title;		// so hasChanges will be correct
				ancestry.signal_relayoutWidgets_fromThis();
			}
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
			top: 0.3px;
			border: none;
			{cursorStyle};
			outline: none;
			color: {color};
			white-space: pre;
			position: absolute;
			padding: {padding};
			position: absolute;
			left: {titleLeft}px;
			width: {titleWidth}px;
			font-size: {fontSize};
			z-index: {T_Layer.text};
			{k.prevent_selection_style};
			font-family: {$s_thing_fontFamily};
			outline-color: {k.color_background};
		'/>
{/key}