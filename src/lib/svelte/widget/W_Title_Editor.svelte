<script lang='ts'>
	import { g, k, u, ux, w, Rect, Point, Thing, debug, Angle, signals } from '../../ts/common/Global_Imports';
	import { T_Graph, T_Layer, S_Title_Edit, T_SvelteComponent } from '../../ts/common/Global_Imports';
	import { w_t_graph, w_hierarchy, w_s_title_edit, w_mouse_location } from '../../ts/state/S_Stores';
	import { databases, Seriously_Range, Svelte_Wrapper } from '../../ts/common/Global_Imports';
	import { w_thing_color, w_thing_title, w_thing_fontFamily } from '../../ts/state/S_Stores';
	import { w_ancestries_grabbed, w_ancestry_showing_tools } from '../../ts/state/S_Stores';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import { T_Edit } from '../../ts/state/S_Title_Edit';
	import { onMount, onDestroy } from 'svelte';
	export let points_right = true;
	export let fontSize = '1em';
    export let name = k.empty;
	export let ancestry;
	const padding = `0.5px 0px 0px 0px`;
	const titleOrigin = new Point(19, 0);
	const s_editor = ux.s_element_forName(name);
	let binded_title = thing()?.title ?? k.empty;
	let color = thing()?.color ?? k.empty;
	let titleWrapper: Svelte_Wrapper;
	let originalTitle = k.empty;
	let cursorStyle = k.empty;
	let mouse_click_timer;
	let hasFocus = false;
	let clickCount = 0;
	let titleWidth = 0;
	let titleLeft = 0;
	let ghost = null;
	let input = null;

	debug.log_mount(`MOUNT ${ancestry?.title}`);
	onDestroy(() => { debug.log_mount(`DESTROY ${ancestry?.title}`); });
	
	function thing(): Thing | null { return ancestry?.thing ?? null; }
	function hasChanges() { return originalTitle != binded_title; };
	function handle_mouse_up() { clearClicks(); }
	function isHit(): boolean { return false }
	function ancestry_isEditing():		   boolean { return $w_s_title_edit?.isAncestry_inState(ancestry, T_Edit.editing) ?? false; }
	function ancestry_isEditStopping():	   boolean { return $w_s_title_edit?.isAncestry_inState(ancestry, T_Edit.stopping) ?? false; }
	function ancestry_isEditPercolating(): boolean { return $w_s_title_edit?.isAncestry_inState(ancestry, T_Edit.percolating) ?? false; }

	if (!!thing()) {
		const showingReveal = ancestry?.showsReveal ?? false;
		titleWidth = thing().titleWidth + (showingReveal ? 6 : 1) + 15;
		titleLeft = g.inRadialMode ? ancestry.isFocus ? -4 : (points_right ? 1 : (showingReveal ? 1 : -11)) : 1;
	}

	onMount(() => {
		const handler = signals.handle_anySignal_atPriority(0, (t_signal, ancestry) => { updateInputWidth(); });
		setTimeout(() => { updateInputWidth(); }, 100);
		return () => { handler.disconnect() };
	});

	export const REACTIVES: unique symbol = Symbol('REACTIVES');

	$: {
		if (!!input && !titleWrapper) {
			titleWrapper = new Svelte_Wrapper(input, handle_forWrapper, ancestry.hid, T_SvelteComponent.title);
		}
	}

	$: {
		if (!!thing() && thing().id == $w_thing_color?.split(k.generic_separator)[0]) {
			color = thing()?.color;
		}
	}

	$: {
		const s_title_edit = $w_s_title_edit;

		//////////////////////////////////////////////////////
		//													//
		//				manage hasFocus & blur				//
		//													//
		//////////////////////////////////////////////////////

		if (!!ancestry && ancestry.isEditable && (ancestry_isEditStopping() || (hasFocus && !s_title_edit))) {
			debug.log_edit(`STOP ${binded_title}`);
			$w_s_title_edit = null;
			hasFocus = false;
			input?.blur();
			update_cursorStyle();
		}
	}

	export const PRIMITIVES: unique symbol = Symbol('PRIMITIVES');

	function clearClicks() {
		clickCount = 0;
		clearTimeout(mouse_click_timer);	// clear all previous timers
	}

	function update_cursorStyle() {
			const noCursor = (ancestry_isEditing() || ancestry.isGrabbed) && !g.inRadialMode && ancestry.isEditable;
			const useTextCursor = ancestry_isEditing() || ancestry.isGrabbed || !(g.inRadialMode || ancestry.isEditable);
			cursorStyle = noCursor ? k.empty : `cursor: ${useTextCursor ? 'text' : 'pointer'}`;
	}

	function updateInputWidth() {
		if (!!input && !!ghost) { // ghost only exists to provide its width (in pixels)
			titleWidth = ghost.scrollWidth;
			input.style.width = `${titleWidth}px`;	// apply its width to the input element
		}
	}

	function canAlterTitle(event) {
		let canAlter = (event instanceof KeyboardEvent) && !event.altKey && !event.shiftKey && !event.code.startsWith("Cluster_Label");
		if (canAlter && event.metaKey) {
			canAlter = false;
		}
		return canAlter;
	}

	function extractRange_fromInput_toThing() {
		if (!!input) {
			const end = input.selectionEnd;
			const start = input.selectionStart;
			debug.log_edit(`EXTRACT RANGE ${start} ${end}`);
			$w_s_title_edit?.thing_setSelectionRange(new Seriously_Range(start, end));
		}
	}

	function applyRange_fromThing_toInput() {
		const range = $w_s_title_edit?.thing_selectionRange;
		if (!!range && !!input) {
			const end = range.end;
			const start = range.start;
			input.setSelectionRange(start, end);
			debug.log_edit(`APPLY RANGE ${start} ${end}`);
		}
	}

	function thing_setSelectionRange_fromMouseLocation() {
		if (!!input && !!$w_s_title_edit && !ancestry_isEditPercolating()) {
			const location = $w_mouse_location;
			if (Rect.rect_forElement_containsPoint(input, location)) {
				const offset = u.convert_windowOffset_toCharacterOffset_in(location.x, input);
				debug.log_edit(`CURSOR OFFSET ${offset}`);
				$w_s_title_edit.thing_setSelectionRange_fromOffset(offset);
				$w_s_title_edit.t_edit = T_Edit.editing;
			}
		}
	}

	function title_updatedTo(title: string | null) {
		const prior = $w_thing_title;
		if (prior != title) {
			$w_thing_title = title;		// tell Info to update it's selection's title
			debug.log_edit(`TITLE ${title}`);
			$w_s_title_edit?.setState_temporarily_whileApplying(T_Edit.percolating, () => {
				ancestry?.signal_relayoutAndRecreate_widgets_fromThis();
			});
		}
	}

	export const HANDLERS: unique symbol = Symbol('HANDLERS');

	function handle_forWrapper(s_mouse: S_Mouse): boolean { return false; }

	function handle_focus(event) {
		event.preventDefault();
		if (!ancestry_isEditing()) {
			input.blur();
		}
		// debug.log_edit(`H FOCUS on "${ancestry?.title}" (was ${$w_s_title_edit?.description})`);
	}

	function handle_mouse_state(s_mouse: S_Mouse) {
		if (!!ancestry && !s_mouse.notRelevant) {
			if (s_mouse.isDown && !ancestry_isEditing()) {
				$w_s_title_edit?.t_edit = T_Edit.stopping;		// stop prior edit, wait for it to percolate
				if (!ancestry.isGrabbed) {
					ancestry.grabOnly();
				} else {
					setTimeout(() => {
						ancestry.startEdit();
						thing_setSelectionRange_fromMouseLocation();
						debug.log_edit(`H START ${$w_s_title_edit?.description}`);
						input.focus();
						applyRange_fromThing_toInput();
					}, 1);
				}
			}
		}
	}

	function handle_blur(event) {
		if (!!ancestry && !ancestry_isEditing()) {
			stopAndClearEditing();
			debug.log_edit(`H BLUR ${binded_title}`);
			updateInputWidth();
		}
	}
	
	function handle_cut_paste(event) {
		extractRange_fromInput_toThing();
		ancestry?.signal_relayoutAndRecreate_widgets_fromThis();
	}

	function handle_doubleClick(event) {
		debug.log_action(`H double click '${thing().title}' TITLE`);
		event.preventDefault();
		startEditMaybe();
		clearClicks();
	}

	function handle_input(event) {
		const title = event.target.value;
		if (!!thing() && (!!title || title == k.empty)) {
			thing().title = binded_title = title;
			title_updatedTo(title);
		}
	};

	function handle_key_down(event) {
		if (!!thing() && !!ancestry && ancestry_isEditing() && canAlterTitle(event)) {
			const key = event.key.toLowerCase();
			debug.log_key(`H KEY ${key}`);
			switch (key) {	
				case 'arrowup':
				case 'arrowdown':
				case 'arrowleft':
				case 'arrowright': break;
				case 'tab':	  event.preventDefault(); stopAndClearEditing(); $w_hierarchy.ancestry_edit_persistentCreateChildOf(ancestry.parentAncestry); break;
				case 'enter': event.preventDefault(); stopAndClearEditing(); break;
				default:	  title_updatedTo(thing().title); break;
			}
		}
	}

	function handle_singleClick(event) {
		if (!!ancestry && !$w_s_title_edit) {			// react only when not yet editing
			event.preventDefault();
			if (ancestry.isGrabbed && ancestry.isEditable) {
				debug.log_edit(`H CLICK ${ancestry.title}`);
				thing_setSelectionRange_fromMouseLocation();
				startEditMaybe();
			} else {
				if (event.shiftKey) {
					ancestry.grab();
				} else {
					ancestry.grabOnly();
				}
				// signals.signal_relayoutAndRecreate_widgets_fromFocus();
			}
		}
	}
 
	function handle_longClick(event) {
		if (!!ancestry && !ancestry_isEditing()) {
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
		if (invokeBlurNotClearEditing()) {				
			setTimeout(() => {									// eliminate infinite recursion
				const s_title_edit = $w_s_title_edit;
				if (!!s_title_edit) {
					s_title_edit.t_edit = T_Edit.stopping;
					signals.signal_relayoutAndRecreate_widgets_fromFocus();
				}
			}, 2);
		}
	}

	function invokeBlurNotClearEditing() {
		if (!!ancestry && ancestry_isEditing() && !ancestry_isEditPercolating() && !!thing()) {
			hasFocus = false;
			extractRange_fromInput_toThing();
			input?.blur();
			if (hasChanges()) {
				databases.db_now.thing_persistentUpdate(thing());
				originalTitle = thing()?.title;		// so hasChanges will be correct
				ancestry.signal_relayoutAndRecreate_widgets_fromThis();
			}
			return true;
		}
		return false;
	}

</script>

<style lang='scss'>
	input:focus {
		outline: none;
	}
</style>

<Mouse_Responder
	origin={titleOrigin}
	name={s_editor.name}
	height={k.row_height}
	width={titleWidth - 22}
	handle_mouse_state={handle_mouse_state}>
	<span class="ghost"
		bind:this={ghost}
		style='left:-9999px;
			white-space: pre;					/* Preserve whitespace to accurately measure the width */
			padding: {padding};
			position: absolute;
			visibility: hidden;
			font-size: {fontSize};
			font-family: {$w_thing_fontFamily};'>
		{binded_title}
	</span>
	<input
		type='text'
		name='title'
		class='title'
		bind:this={input}
		on:blur={handle_blur}
		on:focus={handle_focus}
		on:input={handle_input}
		bind:value={binded_title}
		on:cut={handle_cut_paste}
		on:paste={handle_cut_paste}
		on:keydown={handle_key_down}
		on:mouseover={(event) => { event.preventDefault(); }}
		style='
			top: 0.5px;
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
			outline-color: {k.color_background};'/>
</Mouse_Responder>
