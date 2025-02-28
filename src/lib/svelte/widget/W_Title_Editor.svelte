<script lang='ts'>
	import { g, k, u, ux, w, Rect, Size, Point, Thing, debug, Angle, signals } from '../../ts/common/Global_Imports';
	import { T_Graph, T_Layer, S_Title_Edit, T_SvelteComponent } from '../../ts/common/Global_Imports';
	import { w_t_graph, w_hierarchy, w_s_title_edit, w_mouse_location } from '../../ts/state/S_Stores';
	import { databases, Seriously_Range, Svelte_Wrapper } from '../../ts/common/Global_Imports';
	import { w_thing_color, w_thing_title, w_thing_fontFamily } from '../../ts/state/S_Stores';
	import { w_ancestries_grabbed, w_ancestry_showing_tools } from '../../ts/state/S_Stores';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import { w_count_relayout } from '../../ts/state/S_Stores';
	import { T_Edit } from '../../ts/state/S_Title_Edit';
	import { onMount, onDestroy } from 'svelte';
	export let points_right = true;
	export let fontSize = '1em';
    export let name = k.empty;
	export let ancestry;
	export let origin;
	const thing = ancestry?.thing;
	const padding = `0.5px 0px 0px 0px`;
	const es_title = ux.s_element_forName(name);
	const showingReveal = ancestry?.showsReveal ?? false;
	const input_height = k.dot_size - (g.inRadialMode ? 0.5 : 0.2);
	let title_width = (thing?.titleWidth ?? 0) + (showingReveal ? 6 : 1);
	let title_binded = thing?.title ?? k.empty;
	let color = thing?.color ?? k.empty;
	let title_wrapper: Svelte_Wrapper;
	let title_prior = thing?.title;
	let cursor_style = k.empty;
	let ghost = null;
	let input = null;

	debug.log_mount(`TITLE ${ancestry?.title}`);
	onDestroy(() => { debug.log_mount(`DESTROY TITLE ${ancestry?.title}`); });
	
	function hasFocus(): boolean { return document.activeElement === input; }
	function hasChanges() { return title_prior != title_binded; };
	function handle_mouse_up() { clearClicks(); }
	function isHit(): boolean { return false }
	function ancestry_isEditing():		   boolean { return $w_s_title_edit?.isAncestry_inState(ancestry, T_Edit.editing) ?? false; }
	function ancestry_isEditStopping():	   boolean { return $w_s_title_edit?.isAncestry_inState(ancestry, T_Edit.stopping) ?? false; }
	function ancestry_isEditPercolating(): boolean { return $w_s_title_edit?.isAncestry_inState(ancestry, T_Edit.percolating) ?? false; }

	onMount(() => {
		const handler = signals.handle_anySignal_atPriority(0, (t_signal, ancestry) => { updateInputWidth(); });
		setTimeout(() => { updateInputWidth(); }, 100);
		return () => { handler.disconnect() };
	});

	export const REACTIVES: unique symbol = Symbol('REACTIVES');

	$: {
		if (!!input && !title_wrapper) {
			title_wrapper = new Svelte_Wrapper(input, handle_forWrapper, ancestry.hid, T_SvelteComponent.title);
		}
	}

	$: {
		if (!!thing && thing.id == $w_thing_color?.split(k.generic_separator)[0]) {
			color = thing?.color;
		}
	}

	$: {
		const s_title_edit = $w_s_title_edit;
		if (!!ancestry && (ancestry_isEditStopping() || (hasFocus() && !s_title_edit))) {
			stopEdit();
		}
	}

	$: {
		const s_title_edit = $w_s_title_edit;
		if (!!input && !!s_title_edit && s_title_edit.ancestry.id == ancestry.id) {

			//////////////////////////////////////////////////////
			//													//
			//			handle w_s_title_edit state				//
			//													//
			//////////////////////////////////////////////////////

			switch (s_title_edit.t_edit) {
				case T_Edit.stopping:
					stopEdit();
					break;
				case T_Edit.editing:
					if (!hasFocus()) {
						input.focus();
						applyRange_fromThing_toInput();
					}
					break;
			}
		}
	}

	export const PRIMITIVES: unique symbol = Symbol('PRIMITIVES');

	function relayout() {
		debug.log_edit(`RELAYOUT ${ancestry.title}`);
		signals.signal_relayoutAndRecreate_widgets_from(ancestry);
	}
	
	function update_cursorStyle() {
		const noCursor = (ancestry_isEditing() || ancestry.isGrabbed) && !g.inRadialMode && ancestry.isEditable;
		const useTextCursor = ancestry_isEditing() || ancestry.isGrabbed || !(g.inRadialMode || ancestry.isEditable);
		cursor_style = noCursor ? k.empty : `cursor: ${useTextCursor ? 'text' : 'pointer'}`;
	}

	function updateInputWidth() {
		if (!!input && !!ghost) { // ghost only exists to provide its width (in pixels)
			title_width = ghost.scrollWidth;
			input.style.width = `${title_width}px`;	// apply its width to the input element
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
				$w_s_title_edit?.thing_setSelectionRange_fromOffset(offset);
				$w_s_title_edit?.t_edit = T_Edit.editing;
			}
		}
	}

	function title_updatedTo(title: string | null) {
		const prior = $w_thing_title;
		if (prior != title) {
			extractRange_fromInput_toThing();
			$w_thing_title = title;		// tell Info to update it's selection's title
			debug.log_edit(`TITLE ${title}`);
			$w_s_title_edit?.setState_temporarily_whileApplying(T_Edit.percolating, () => {
				relayout();
			});
			debug.log_edit(`UPDATED ${$w_s_title_edit?.description}`);
		}
	}

	export const HANDLERS: unique symbol = Symbol('HANDLERS');

	function handle_forWrapper(s_mouse: S_Mouse): boolean { return false; }
	
	function handle_cut_paste(event) {
		extractRange_fromInput_toThing();
		relayout();
	}

	function handle_focus(event) {
		event.preventDefault();
		if (!ancestry_isEditing()) {
			input.blur();
		}
	}

	function handle_blur(event) {
		if (!!ancestry && !ancestry_isEditing() && hasFocus()) {
			stop_andPersist();
			debug.log_edit(`H BLUR ${title_binded}`);
			updateInputWidth();
		}
	}

	function handle_input(event) {
		const title = event.target.value;
		if (!!thing && (!!title || title == k.empty)) {
			thing.title = title_binded = title;
			title_updatedTo(title);
			relayout();
		}
	};

	function handle_key_down(event) {
		if (!!thing && !!ancestry && ancestry_isEditing() && canAlterTitle(event)) {
			const key = event.key.toLowerCase();
			debug.log_key(`H KEY ${key}`);
			switch (key) {	
				case 'arrowup':
				case 'arrowdown':
				case 'arrowleft':
				case 'arrowright': break;
				case 'tab':	  event.preventDefault(); stop_andPersist(); $w_hierarchy.ancestry_edit_persistentCreateChildOf(ancestry.parentAncestry); break;
				case 'enter': event.preventDefault(); stop_andPersist(); break;
				default:	  title_updatedTo(thing.title); break;
			}
		}
	}

	function handle_mouse_state(s_mouse: S_Mouse) {
		if (!!ancestry && !s_mouse.notRelevant) {
			if (s_mouse.isDown && !ancestry_isEditing()) {
				if ($w_s_title_edit?.isActive) {
					$w_s_title_edit?.t_edit = T_Edit.stopping;		// stop prior edit, wait for it to percolate (below with setTimeout)
				}
				if (!ancestry.isGrabbed) {
					if (event.shiftKey) {
						ancestry.grab();
					} else {
						ancestry.grabOnly();
					}
				} else if (ancestry.isEditable) {
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

	export const EDIT: unique symbol = Symbol('EDIT');

	function stopEdit() {
		debug.log_edit(`STOP ${title_binded}`);
		$w_s_title_edit = null;
		input?.blur();
		update_cursorStyle();
		// layout not needed
	}

	function startEditMaybe() {
		if (ancestry.isEditable) {
			ancestry?.startEdit();
			title_updatedTo(thing.title);
			input?.focus();
		}
	}

	async function stop_andPersist() {
		if (!!thing && !!input && !!ancestry && ancestry_isEditing() && !ancestry_isEditPercolating()) {
			debug.log_edit(`INVOKING BLUR ${ancestry.title}`);
			input.blur();
			if (hasChanges()) {
				debug.log_edit(`PERSISTING ${thing?.title}`);
				await databases.db_now.thing_persistentUpdate(thing);
				title_prior = thing?.title;			// so hasChanges will be correct next time
			}
			u.onNextCycle_apply(() => {		// prevent Panel's enter key handler call to start edit from actually starting
				if ($w_s_title_edit?.actively_refersTo(ancestry)) {
					debug.log_edit(`STOPPING ${ancestry.title}`);
					$w_s_title_edit?.t_edit = T_Edit.stopping;	// inform Widget
				}
			});
		}
	}

</script>

<style lang='scss'>
	input:focus {
		outline: none;
	}
</style>

<Mouse_Responder
	origin={origin}
	name={es_title.name}
	height={k.row_height}
	width={title_width + 2}
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
		{title_binded}
	</span>
	<input
		type='text'
		name='title'
		class='title'
		bind:this={input}
		on:blur={handle_blur}
		on:focus={handle_focus}
		on:input={handle_input}
		bind:value={title_binded}
		on:cut={handle_cut_paste}
		on:paste={handle_cut_paste}
		on:keydown={handle_key_down}
		on:mouseover={(event) => { event.preventDefault(); }}
		style='
			top : 1.8px;
			left : 3.5px;
			border : none;
			{cursor_style};
			outline : none;
			color : {color};
			white-space : pre;
			position : absolute;
			padding : {padding};
			font-size : {fontSize};
			width : {title_width}px;
			z-index : {T_Layer.text};
			height : {input_height}px;
			{k.prevent_selection_style};
			font-family : {$w_thing_fontFamily};
			outline-color : {k.color_background};'/>
</Mouse_Responder>
