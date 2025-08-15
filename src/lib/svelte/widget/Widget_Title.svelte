<script lang='ts'>
	import { layout, signals, components, databases, Seriously_Range, S_Component } from '../../ts/common/Global_Imports';
	import { w_thing_color, w_background_color, w_thing_title, w_thing_fontFamily } from '../../ts/managers/Stores';
	import { c, h, k, u, ux, Rect, Size, Point, Thing, debug, Angle } from '../../ts/common/Global_Imports';
	import { w_s_text_edit, w_ancestries_grabbed, w_ancestries_expanded } from '../../ts/managers/Stores';
	import { S_Element, T_Graph, T_Layer, T_Component } from '../../ts/common/Global_Imports';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import { w_mouse_location } from '../../ts/managers/Stores';
	import { T_Edit } from '../../ts/state/S_Text_Edit';
	import { onMount, onDestroy } from 'svelte';
	export let s_title!: S_Element;
	export let fontSize = '1em';
    const name = s_title.name;
	const ancestry = s_title.ancestry;
	const thing = ancestry?.thing;
	const padding = `1px 0px 0px 0px`;
	const g_widget = ancestry.g_widget;
	const s_widget = g_widget.s_widget;
	const input_height = k.height.dot + 2;
	const id = `title of ${ancestry?.title} ${ancestry?.kind}`;
	let title_width = (thing?.width_ofTitle ?? 0) + title_extra();
	let title_binded = thing?.title ?? k.empty;
	let title_component: S_Component;
	let title_prior = thing?.title;
	let s_component: S_Component;
	let color = s_widget.color;
	let reattachments = 0;
	let ghost = null;
	let input = null;
	let left = 0;
	let top = 0;
	
	function isHit():		  boolean { return false }
	function hasFocus():	  boolean { return document.activeElement === input; }
	function isEditing():	  boolean { return $w_s_text_edit?.ancestry_isEditing(ancestry) ?? false; }
	function isStopping():	  boolean { return $w_s_text_edit?.ancestry_isStopping(ancestry) ?? false; }
	function isPercolating(): boolean { return $w_s_text_edit?.ancestry_isPercolating(ancestry) ?? false; }
	function title_extra():	   number { return (ux.inTreeMode && isEditing()) ? 2 : 0; }
	function hasChanges()	 		  { return title_prior != title_binded; }
	function handle_mouse_up() 		  { clearClicks(); }

	onMount(() => {
		debug.log_build(`TITLE ${ancestry?.title}`);
		s_component = signals.handle_anySignal_atPriority(0, ancestry.hid, T_Component.title, (t_signal, ancestry) => {
			updateInputWidth();
		});
		setTimeout(() => {
			updateInputWidth();
			if (isEditing()) {
				applyRange_fromThing_toInput();
			}
		}, 100);
		return () => s_component.disconnect();
	});

	$: if (!!input) { s_component.element = input; }

	export const _____REACTIVES: unique symbol = Symbol('_____REACTIVES');

	$: {
		const _ = `${$w_ancestries_grabbed.join(',')}${$w_ancestries_expanded.join(',')}${$w_thing_color}`;
		const isFocus = ancestry?.isFocus ?? false;
		const adjust = ux.inRadialMode && isFocus;
		const isGrabbed = ancestry?.isGrabbed ?? false;
		top = (isGrabbed ? 0.4 : 0) - (adjust ? isGrabbed ? 2.5 : 2 : 0);
		left = adjust ? (title_width / 20 - 3) : 0.8;
		color = s_widget.color;
	}

	$: {
		const _ = $w_s_text_edit;
		if (!!input) {
			title_width = (thing?.width_ofTitle ?? 0) + title_extra();
			color = s_widget.color;
		}
	}

	$: {
		if (!!input && !title_component) {
			title_component = components.component_createUnique(input, handle_forComponent, ancestry.hid, T_Component.title);
		}
	}

	$: {
		const s_text_edit = $w_s_text_edit;
		if (hasFocus() && !s_text_edit) {
			stopEdit();
		} else if (!!input && !!s_text_edit) {
			if (s_text_edit.ancestry.id_thing == ancestry.id_thing) {
				input.value = ancestry.title;	// consistently update titles of widgets of things with multiple parents
			}
			if (s_text_edit.ancestry.equals(ancestry)) {

				//////////////////////////////////////////////////////
				//													//
				//			handle w_s_text_edit state				//
				//													//
				//////////////////////////////////////////////////////

				switch (s_text_edit.t_edit) {
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

	export const _____EDIT: unique symbol = Symbol('_____EDIT');

	function stopEdit() {
		debug.log_edit(`STOP ${title_binded}`);
		$w_s_text_edit = null;
		input?.blur();
		layout.grand_layout();
	}

	async function stop_andPersist() {
		if (!!thing && !!input && !!ancestry && isEditing() && !isPercolating()) {
			debug.log_edit(`INVOKING BLUR ${ancestry.title}`);
			input.blur();
			if (hasChanges()) {
				debug.log_edit(`PERSISTING ${thing?.title}`);
				await databases.db_now.thing_persistentUpdate(thing);
				title_prior = thing?.title;			// so hasChanges will be correct next time
			}
			u.onNextTick(() => {		// prevent Panel's enter key handler call to start edit from actually starting
				if (!!$w_s_text_edit && $w_s_text_edit.actively_refersTo(ancestry)) {
					debug.log_edit(`STOPPING ${ancestry.title}`);
					$w_s_text_edit.stop_editing();
					$w_s_text_edit = null;	// inform Widget
				}
			});
		}
	}

	export const _____RANGE: unique symbol = Symbol('_____RANGE');

	function extractRange_fromInput_toThing() {
		if (!!input && !!$w_s_text_edit) {
			const end = input.selectionEnd;
			const start = input.selectionStart;
			debug.log_edit(`EXTRACT RANGE ${start} ${end}`);
			$w_s_text_edit.thing_setSelectionRange(new Seriously_Range(start, end));
		}
	}

	function applyRange_fromThing_toInput() {
		const range = $w_s_text_edit.thing_selectionRange;
		if (!!range && !!input) {
			const end = range.end;
			const start = range.start;
			input.setSelectionRange(start, end);
			debug.log_edit(`APPLY RANGE ${start} ${end}`);
		}
	}

	function thing_setSelectionRange_fromMouseLocation() {
		if (!!input && !!$w_s_text_edit && !isPercolating()) {
			const location = $w_mouse_location;
			if (Rect.rect_forElement_containsPoint(input, location)) {
				const offset = u.convert_windowOffset_toCharacterOffset_in(location.x, input);
				debug.log_edit(`CURSOR OFFSET ${offset}`);
				$w_s_text_edit.thing_setSelectionRange_fromOffset(offset);
				$w_s_text_edit.start_editing();
			}
		}
	}

	export const _____HANDLERS: unique symbol = Symbol('_____HANDLERS');

	function handle_forComponent(s_mouse: S_Mouse): boolean { return false; }
	
	function handle_cut_paste(event) {
		extractRange_fromInput_toThing();
	}

	function handle_focus(event) {
		event.preventDefault();
		if (!isEditing()) {
			input.blur();
		}
	}

	function handle_blur(event) {
		if (!!ancestry && !isEditing() && hasFocus()) {
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
		if (!!thing && !!ancestry && isEditing() && canAlterTitle(event)) {
			const key = event.key.toLowerCase();
			debug.log_key(`H KEY ${key}`);
			switch (key) {	
				case 'arrowup':
				case 'arrowdown':
				case 'arrowleft':
				case 'arrowright': break;
				case 'enter': event.preventDefault(); stop_andPersist(); break;
				case 'tab':	  event.preventDefault(); stop_andPersist(); h.ancestry_edit_persistentCreateChildOf(ancestry.parentAncestry); break;
			}
			extractRange_fromInput_toThing();
		}
	}

	function handle_s_mouse(s_mouse: S_Mouse) {
		if (!!ancestry && !s_mouse.notRelevant) {
			if (isEditing()) {
				extractRange_fromInput_toThing();
			} else if (s_mouse.isDown) {
				if (!!$w_s_text_edit && $w_s_text_edit.isActive) {
					$w_s_text_edit.stop_editing();		// stop prior edit, wait for it to percolate (below with setTimeout)
					$w_s_text_edit = null;
				}
				if (!ancestry.isGrabbed) {
					ancestry.grab_forShift(event.shiftKey);
				} else if (ancestry.isEditable && !!input) {
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

	export const _____TITLE: unique symbol = Symbol('_____TITLE');

	function updateInputWidth() {
		if (!!input && !!ghost) { // ghost only exists to provide its width (in pixels)
			title_width = ghost.scrollWidth + title_extra();
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
		if (prior != title && !!$w_s_text_edit) {
			extractRange_fromInput_toThing();
			$w_thing_title = title;		// tell Info to update it's selection's title
			debug.log_edit(`TITLE ${title}`);
			$w_s_text_edit.title = title;
			$w_s_text_edit.setState_temporarilyTo_whileApplying(T_Edit.percolating, () => {
				layout.grand_layout();
			});
			debug.log_edit(`UPDATED ${$w_s_text_edit.description}`);
		}
	}

</script>

<style lang='scss'>
	input:focus {
		outline: none;
	}
</style>

{#key reattachments}
	<Mouse_Responder
		width={title_width}
		name={s_title.name}
		height={k.height.row}
		handle_s_mouse={handle_s_mouse}
		origin={g_widget.origin_ofTitle}>
		<span class='ghost-{title_binded}'
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
			id={id}
			type='text'
			name='title'
			bind:this={input}
			on:blur={handle_blur}
			on:focus={handle_focus}
			on:input={handle_input}
			bind:value={title_binded}
			on:cut={handle_cut_paste}
			on:paste={handle_cut_paste}
			class='title-{title_binded}'
			on:keydown={handle_key_down}
			on:mouseover={(event) => { event.preventDefault(); }}
			style='
				border : none;
				top : {top}px;
				outline : none;
				left : {left}px;
				color : {color};
				white-space : pre;
				position : absolute;
				padding : {padding};
				font-size : {fontSize};
				width : {title_width}px;
				z-index : {T_Layer.text};
				height : {input_height}px;
				{k.prevent_selection_style};
				background-color : transparent;
				font-family : {$w_thing_fontFamily};
				cursor: {isEditing() ? 'text' : 'pointer'};'/>
	</Mouse_Responder>
{/key}
