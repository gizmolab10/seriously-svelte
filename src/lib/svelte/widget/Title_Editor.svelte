<script lang='ts'>
	import { T_Graph, databases, Seriously_Range, Svelte_Wrapper, T_SvelteComponent } from '../../ts/common/Global_Imports';
	import { w_hierarchy, w_t_graph, w_thing_color, w_thing_title, w_s_ancestry_edit } from '../../ts/state/S_Stores';
	import { w_thing_fontFamily, w_ancestries_grabbed, w_ancestry_showing_tools } from '../../ts/state/S_Stores';
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
	let hasChanges = () => { return originalTitle != bound_title; };
	function thing(): Thing | null { return ancestry?.thing ?? null; }
	function handle_mouse_state(s_mouse: S_Mouse): boolean { return false; }

	export const REACTIVES: unique symbol = Symbol('REACTIVES');
	
	$: {
		const _ = $w_s_ancestry_edit;
		updateInputWidth();
	}

	$: {
		if (!!input && !titleWrapper) {
			titleWrapper = new Svelte_Wrapper(input, handle_mouse_state, ancestry.hid, T_SvelteComponent.title);
		}
	}

	$: {
		if (!!thing() && thing().id == $w_thing_color?.split(k.generic_separator)[0]) {
			color = thing()?.color;
		}
	}

	$: {
		const _ = $w_s_ancestry_edit;		// react to w_s_ancestry_edit

		//////////////////////////////////////////////////////
		//													//
		//				  manage focus state				//
		//													//
		//////////////////////////////////////////////////////

		if (!!ancestry) {
			const hasGrabbed = ($w_ancestries_grabbed ?? [])?.length > 0;
			if (ancestry.isEditable) {
				if (!!ancestry && (ancestry.isStoppingEdit ?? false)) {
					debug.log_edit(`STOPPING ${bound_title}`);
					$w_s_ancestry_edit = null;
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

	export const PRIMITIVES: unique symbol = Symbol('PRIMITIVES');
 
	function title_isEditing(): boolean {
		const s_ancestry_edit = $w_s_ancestry_edit;
		return !!ancestry && !!s_ancestry_edit && s_ancestry_edit.editing && ancestry.ancestry_hasEqualID(s_ancestry_edit.editing);
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
		let canAlter = (event instanceof KeyboardEvent) && !event.altKey && !event.shiftKey && !event.code.startsWith("Cluster_Label");
		if (canAlter && event.metaKey) {
			canAlter = false;
		}
		return canAlter;
	}

	function title_updatedTo(title: string | null) {
		const prior = $w_thing_title;
		if (prior != title) {
			$w_thing_title = title;		// tell Info to update it's selection's title
			debug.log_signals(`title_updatedTo ${title}`);
			// ancestry?.signal_relayoutWidgets_fromThis();
		}
	}

	export const HANDLERS: unique symbol = Symbol('HANDLERS');
	
	onMount(() => {
		if (!!thing()) {
			const showingReveal = ancestry?.showsReveal ?? false;
			titleWidth = thing().titleWidth + (showingReveal ? 6 : 1) + 15;
			titleLeft = g.inRadialMode ? ancestry.isFocus ? 5 : (points_right ? 21 : (showingReveal ? 18.5 : 10)) : 19;
		}
		const handler = signals.handle_anySignal_atPriority(0, (t_signal, ancestry) => { updateInputWidth(); });
		setTimeout(() => { updateInputWidth(); }, 100);
		return () => { handler.disconnect() };
	})

	function handle_cut_paste(event) {
		extractRange();
		ancestry?.signal_relayoutWidgets_fromThis();
	}

	function handleBlur(event) {
		if (!!ancestry && !ancestry.isEditing) {
			stopAndClearEditing();
			debug.log_edit(`BLUR ${bound_title}`);
			updateInputWidth();
		}
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
			title_updatedTo(title);
		}
	};

	function handle_key_down(event) {
		if (!!thing() && !!ancestry && ancestry.isEditing && canAlterTitle(event)) {
			debug.log_key(`TITLE  ${event.key}`);
			switch (event.key) {	
				case 'ArrowUp':
				case 'ArrowDown':
				case 'ArrowLeft':
				case 'ArrowRight': break;
				case 'Tab':	  event.preventDefault(); stopAndClearEditing(); $w_hierarchy.ancestry_edit_persistentCreateChildOf(ancestry.parentAncestry); break;
				case 'Enter': event.preventDefault(); stopAndClearEditing(); break;
				default:	  title_updatedTo(thing().title); break;
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
				$w_s_ancestry_edit = null;
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
					if ($w_ancestry_showing_tools == ancestry) {
						$w_ancestry_showing_tools = null;
					} else  {
						ancestry.grabOnly();
						$w_ancestry_showing_tools = ancestry;
					}
					signals.signal_rebuildGraph_fromFocus();
				}
			}, k.threshold_longClick);
		}
	}

	export const EDIT: unique symbol = Symbol('EDIT');

	function startEditMaybe() {
		if (ancestry.isEditable) {
			ancestry?.startEdit();
			title_updatedTo(thing().title);
			input?.focus();
		}
	}

	function stopAndClearEditing() {
		invokeBlurNotClearEditing();
		if (!!ancestry && ancestry.isEditing) {				
			setTimeout(() => {									// eliminate infinite recursion
				const s_ancestry_edit = $w_s_ancestry_edit;
				if (!!s_ancestry_edit) {
					s_ancestry_edit.stop();
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
				databases.db_now.thing_persistentUpdate(thing());
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
			font-family: {$w_thing_fontFamily};
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
			font-family: {$w_thing_fontFamily};
			outline-color: {k.color_background};
		'/>
{/key}