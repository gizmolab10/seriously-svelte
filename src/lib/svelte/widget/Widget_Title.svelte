<script lang='ts'>
	import { layout, signals, databases, Seriously_Range, Svelte_Wrapper } from '../../ts/common/Global_Imports';
	import { c, k, u, ux, w, Rect, Size, Point, Thing, debug, Angle } from '../../ts/common/Global_Imports';
	import { T_Graph, T_Layer, S_Title_Edit, T_SvelteComponent } from '../../ts/common/Global_Imports';
	import { w_thing_color, w_thing_title, w_thing_fontFamily } from '../../ts/common/Stores';
	import { w_hierarchy, w_ancestries_grabbed } from '../../ts/common/Stores';
	import { w_s_title_edit, w_mouse_location } from '../../ts/common/Stores';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import { w_background_color } from '../../ts/common/Stores';
	import { T_Edit } from '../../ts/state/S_Title_Edit';
	import { onMount, onDestroy } from 'svelte';
	export let fontSize = '1em';
    export let name = k.empty;
	export let ancestry;
	export let origin;
	const thing = ancestry?.thing;
	const padding = `0.5px 0px 0px 0px`;
	const input_height = k.height.dot + 2;
	const es_title = ux.s_element_forName(name);
	const showingReveal = ancestry?.shows_reveal ?? false;
	let title_width = (thing?.width_ofTitle ?? 0) + title_extra();
	let title_binded = thing?.title ?? k.empty;
	let color = thing?.color ?? k.empty;
	let title_wrapper: Svelte_Wrapper;
	let origin_ofInput = Point.zero;
	let title_prior = thing?.title;
	let cursor_style = k.empty;
	let ghost = null;
	let input = null;
	
	function isHit():					   boolean { return false }
	function hasFocus():				   boolean { return document.activeElement === input; }
	function ancestry_isEditing():		   boolean { return $w_s_title_edit?.isAncestry_inState(ancestry, T_Edit.editing) ?? false; }
	function ancestry_isEditStopping():	   boolean { return $w_s_title_edit?.isAncestry_inState(ancestry, T_Edit.stopping) ?? false; }
	function ancestry_isEditPercolating(): boolean { return $w_s_title_edit?.isAncestry_inState(ancestry, T_Edit.percolating) ?? false; }
	function title_extra():					number { return (layout.inTreeMode && ancestry_isEditing()) ? 2 : 0; }
	function hasChanges()						   { return title_prior != title_binded; };
	function handle_mouse_up()					   { clearClicks(); }

	onMount(() => {
		debug.log_build(`TITLE ${ancestry?.title}`);
		const handle_anySignal = signals.handle_anySignal_atPriority(0, (t_signal, ancestry) => {
			updateInputWidth();
		});
		setTimeout(() => {
			updateInputWidth();
			if (ancestry_isEditing()) {
				applyRange_fromThing_toInput();
			}
		}, 100);
		return () => {
			handle_anySignal.disconnect();
		};
	});

	export const REACTIVES: unique symbol = Symbol('REACTIVES');

	$: {
		const _ = $w_s_title_edit;
		if (!!input) {
			title_width = (thing?.width_ofTitle ?? 0) + title_extra();
		}
	}

	$: {
		if (!!input && !title_wrapper) {
			title_wrapper = new Svelte_Wrapper(input, handle_forWrapper, ancestry.hid, T_SvelteComponent.title);
		}
	}

	$: {
		if (!!thing && thing.id == $w_thing_color?.split(k.separator.generic)[0]) {
			color = thing?.color;
		}
	}

	$: {
		const _ = $w_ancestries_grabbed;
		const isGrabbed = ancestry?.isGrabbed ?? false;
		origin_ofInput = isGrabbed ? Point.x(0.1) : Point.y(0.8);
	}

	export const RANGE: unique symbol = Symbol('RANGE');

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

	export const UPDATE: unique symbol = Symbol('UPDATE');
	
	function update_cursorStyle() {
		const noCursor = (ancestry_isEditing() || ancestry.isGrabbed) && layout.inTreeMode && ancestry.isEditable;
		const useTextCursor = ancestry_isEditing() || ancestry.isGrabbed || !(layout.inRadialMode || ancestry.isEditable);
		cursor_style = noCursor ? k.empty : `cursor: ${useTextCursor ? 'text' : 'pointer'}`;
	}

	export const HANDLERS: unique symbol = Symbol('HANDLERS');

	function handle_forWrapper(s_mouse: S_Mouse): boolean { return false; }
	
	function handle_cut_paste(event) {
		extractRange_fromInput_toThing();
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
				case 'enter': event.preventDefault(); stop_andPersist(); break;
				case 'tab':	  event.preventDefault(); stop_andPersist(); $w_hierarchy.ancestry_edit_persistentCreateChildOf(ancestry.parentAncestry); break;
			}
			extractRange_fromInput_toThing();
		}
	}

	function handle_s_mouse(s_mouse: S_Mouse) {
		if (!!ancestry && !s_mouse.notRelevant) {
			if (ancestry_isEditing()) {
				extractRange_fromInput_toThing();
			} else if (s_mouse.isDown) {
				if (!!$w_s_title_edit && $w_s_title_edit.isActive) {
					$w_s_title_edit.t_edit = T_Edit.stopping;		// stop prior edit, wait for it to percolate (below with setTimeout)
				}
				if (!ancestry.isGrabbed) {
					ancestry.grab_forShift(event.shiftKey);
				} else if (ancestry.isEditable) {
					setTimeout(() => {
						ancestry.startEdit();
						thing_setSelectionRange_fromMouseLocation();
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
		layout.grand_layout();
	}

	function startEditMaybe() {
		if (ancestry.isEditable) {
			ancestry?.startEdit();
			title_updatedTo(thing.title);
			input?.focus();
		}
	}

	function canAlterTitle(event) {
		let canAlter = (event instanceof KeyboardEvent) && !event.altKey && !event.shiftKey && !event.code.startsWith("Cluster_Label");
		if (canAlter && event.metaKey) {
			canAlter = false;
		}
		return canAlter;
	}

	function updateInputWidth() {
		if (!!input && !!ghost) { // ghost only exists to provide its width (in pixels)
			title_width = ghost.scrollWidth + title_extra();
		}
	}

	function title_updatedTo(title: string | null) {
		const prior = $w_thing_title;
		if (prior != title && !!$w_s_title_edit) {
			extractRange_fromInput_toThing();
			$w_thing_title = title;		// tell Info to update it's selection's title
			debug.log_edit(`TITLE ${title}`);
			$w_s_title_edit.title = title;
			$w_s_title_edit.setState_temporarilyTo_whileApplying(T_Edit.percolating, () => {
				layout.grand_layout();
			});
			debug.log_edit(`UPDATED ${$w_s_title_edit.description}`);
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
				if (!!$w_s_title_edit && $w_s_title_edit.actively_refersTo(ancestry)) {
					debug.log_edit(`STOPPING ${ancestry.title}`);
					$w_s_title_edit.t_edit = T_Edit.stopping;	// inform Widget
				}
			});
		}
	}

	$: {
		const s_title_edit = $w_s_title_edit;
		if (hasFocus() && !s_title_edit) {
			stopEdit();
		} else if (!!input && !!s_title_edit) {
			if (s_title_edit.ancestry.id_thing == ancestry.id_thing) {
				input.value = ancestry.title;	// consistently update titles of widgets of things with multiple parents
			}
			if (s_title_edit.ancestry.equals(ancestry)) {

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
	}

</script>

<style lang='scss'>
	input:focus {
		outline: none;
	}
</style>

<Mouse_Responder
	origin={origin}
	width={title_width}
	name={es_title.name}
	height={k.height.row}
	handle_s_mouse={handle_s_mouse}>
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
			top : {origin_ofInput.y}px;
			left : {origin_ofInput.x}px;
			{k.prevent_selection_style};
			background-color : transparent;
			font-family : {$w_thing_fontFamily};'/>
</Mouse_Responder>
