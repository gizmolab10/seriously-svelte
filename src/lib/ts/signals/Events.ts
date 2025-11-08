import { w_count_window_resized, w_s_alteration, w_s_title_edit, w_user_graph_offset, w_control_key_down } from '../managers/Stores';
import { c, h, k, u, x, g_tree, debug, search, layout, details, signals, controls, elements } from '../common/Global_Imports';
import { w_count_mouse_up, w_mouse_location, w_mouse_location_scaled, w_scaled_movement } from '../managers/Stores';
import { T_Search, T_Action, T_Control, T_File_Format, T_Predicate, T_Alteration } from '../common/Global_Imports';
import { w_search_state, w_device_isMobile, w_ancestry_focus, w_ancestry_forDetails } from '../managers/Stores';
import { Point, Ancestry, Predicate } from '../common/Global_Imports';
import { S_Mouse, S_Alteration } from '../common/Global_Imports';
import Mouse_Timer from './Mouse_Timer';
import { get } from 'svelte/store';

export class Events {
	mouse_timer_byName: { [name: string]: Mouse_Timer } = {};
	handle_focus_cleanup: (() => void) | null = null;
	initialTouch: Point | null = null;
	alterationTimer!: Mouse_Timer;

	mouse_timer_forName(name: string): Mouse_Timer { return elements.assure_forKey_inDict(name, this.mouse_timer_byName, () => new Mouse_Timer(name)); }

	setup() {
		w_s_alteration.subscribe((s_alteration: S_Alteration | null) => { this.handle_s_alteration(s_alteration); });
		w_device_isMobile.subscribe((isMobile: boolean) => { this.subscribeTo_events(); });
		this.start_watching_focus();
	}

	name_ofActionAt(t_action: number, column: number): string {
		return Object.keys(this.actions[T_Action[t_action]])[column];
	}

	static readonly _____SUBSCRIPTIONS: unique symbol;

	update_window_listener(name: string, handler: EventListenerOrEventListenerObject) {
		window.removeEventListener(name, handler);
		window.addEventListener(name, handler, { passive: false });
	}

	update_document_listener(name: string, handler: EventListenerOrEventListenerObject) {
		document.removeEventListener(name, handler);
		document.addEventListener(name, handler, { passive: false });
	}

	private clear_event_subscriptions() {
		document.removeEventListener('mouseup',	 this.handle_mouse_up);
		document.removeEventListener('mousemove',	 this.handle_mouse_move);
		document.removeEventListener('touchend',	 this.handle_touch_end);
		document.removeEventListener('touchmove',	 this.handle_touch_move);
		document.removeEventListener('touchstart', this.handle_touch_start);
	}

	private subscribeTo_events() {
		this.clear_event_subscriptions();
		this.update_document_listener('wheel', this.handle_wheel);
		this.update_document_listener('keyup', this.handle_key_up);
		this.update_document_listener('keydown', this.handle_key_down);
		this.update_window_listener('resize', this.handle_window_resize);
		this.update_document_listener('orientationchange', this.handle_orientation_change);
		if (u.device_isMobile) {
			debug.log_action(`  mobile subscribe GRAPH`);
			document.addEventListener('touchend', this.handle_touch_end, { passive: false });
			document.addEventListener('touchmove', this.handle_touch_move, { passive: false });
			document.addEventListener('touchstart', this.handle_touch_start, { passive: false });
		} else {
			document.addEventListener('mouseup', this.handle_mouse_up, { passive: false });
			document.addEventListener('mousedown', this.handle_mouse_down, { passive: false });
			document.addEventListener('mousemove', this.handle_mouse_move, { passive: false });
		}
	}

	static readonly _____FOCUS_WATCHING: unique symbol;

	get focused_element(): Element | null { return document.activeElement; }

	get focused_element_deep(): Element | null {
		let focused = this.focused_element;
		// Traverse shadow DOM if present
		while (focused && focused.shadowRoot && focused.shadowRoot.activeElement) {
			focused = focused.shadowRoot.activeElement;
		}
		return focused;
	}

	start_watching_focus(): void {
		if (!this.handle_focus_cleanup && debug.focus) {
			this.handle_focus_cleanup = this.watch_focus(this.log_focus.bind(this));
		}
	}

	stop_watching_focus() {
		if (!!this.handle_focus_cleanup) {
			this.handle_focus_cleanup();
			this.handle_focus_cleanup = null;
		}
	}

	log_focus(element: Element | null, gained_focus: boolean): void {
		if (element) {
			console.log(gained_focus ? 'Focus gained:' : 'Focus lost:');
			console.log('Element:', element);
			console.log('Tag name:', element.tagName);
			console.log('ID:', element.id);
			console.log('Class list:', element.classList);
		} else {
			console.log(gained_focus ? 'No element gained focus' : 'No element lost focus');
		}
	}

	watch_focus(callback?: (focused_element: Element | null, gained_focus: boolean) => void): () => void {
		const handleFocusIn = () => {
			const focused = this.focused_element_deep;
			if (callback) {
				callback(focused, true);
			} else {
				console.log(`Focus gained by: ${focused?.tagName ?? 'none'}`);
			}
		};
		const handleFocusOut = () => {
			const focused = this.focused_element_deep;
			if (callback) {
				callback(focused, false);
			} else {
				console.log(`Focus lost from: ${focused?.tagName ?? 'none'}`);
			}
		};
		document.addEventListener('focusin', handleFocusIn);
		document.addEventListener('focusout', handleFocusOut);
		return () => {
			document.removeEventListener('focusin', handleFocusIn);
			document.removeEventListener('focusout', handleFocusOut);
		};
	}

	static readonly EVENT_HANDLERS = Symbol('EVENT_HANDLERS');

	private handle_touch_end(event: TouchEvent) { this.initialTouch = null; }
	private handle_mouse_down(event: MouseEvent) { w_scaled_movement.set(Point.zero); }

	private handle_mouse_up(event: MouseEvent) {
		w_scaled_movement.set(null);
		w_count_mouse_up.update(n => n + 1);
	}

	private handle_key_up(e: Event) {
		const event = e as KeyboardEvent;
		if (!!event && event.type == 'keyup') {
			w_control_key_down.set(event.ctrlKey);
		}
	}

	private handle_orientation_change(event: Event) {
		const isMobile = u.device_isMobile;
		debug.log_action(` orientation change [is${isMobile ? '' : ' not'} mobile] STATE`);
		w_device_isMobile.set(isMobile);
		layout.restore_preferences();
	}

	private handle_touch_start(event: TouchEvent) {
		if (event.touches.length == 2) {
			const touch = event.touches[0];
			this.initialTouch = new Point(touch.clientX, touch.clientY);
			debug.log_action(` two-finger touches GRAPH`);
		}
	}

	private handle_window_resize(event: Event) {
		// on COMMAND +/-
		// and on simulator switches platform
		const isMobile = u.device_isMobile;
		w_count_window_resized.update(n => n + 1);		// observed by controls
		w_device_isMobile.set(isMobile);
		layout.restore_preferences();
	}

	private handle_wheel(event: Event) {
		u.grab_event(event);
		if (!u.device_isMobile) {
			const e = event as WheelEvent;
			const userOffset = get(w_user_graph_offset);
			const delta = new Point(-e.deltaX, -e.deltaY);
			if (!!userOffset && c.allow_HorizontalScrolling && delta.magnitude > 1) {
				debug.log_action(` wheel GRAPH`);
				layout.set_user_graph_offsetTo(userOffset.offsetBy(delta));
			}
		}
	}

	private handle_touch_move(event: TouchEvent) {
		if (event.touches.length == 2) {
			u.grab_event(event);
			if (this.initialTouch) {
				const touch = event.touches[0];
				const deltaX = touch.clientX - this.initialTouch.x;
				const deltaY = touch.clientY - this.initialTouch.y;
				layout.set_user_graph_offsetTo(new Point(deltaX, deltaY));
				debug.log_action(` two-finger touch move GRAPH`);
			}
		}
	}

	private handle_s_alteration(s_alteration: S_Alteration | null) {
		if (!this.alterationTimer) {
			this.alterationTimer = this.mouse_timer_forName('alteration');
		}
		if (!!s_alteration) {
			this.alterationTimer.alteration_start((invert) => {
				signals.signal_blink_forAlteration(invert);
			});
		} else {
			this.alterationTimer.alteration_stop();
			signals.signal_blink_forAlteration(false);
		}
	}

	private handle_mouse_move(event: MouseEvent) {
		const location = new Point(event.clientX, event.clientY);
		const scaled = location.dividedEquallyBy(layout.scale_factor);
		const prior_scaled = get(w_mouse_location_scaled);
		const delta = prior_scaled?.vector_to(scaled);
		if (!!delta && delta.magnitude > 1) {
			w_scaled_movement.set(delta);
		}
		w_mouse_location.set(location);
		w_mouse_location_scaled.set(scaled);
	}

	handle_s_mouseFor_t_control(s_mouse: S_Mouse, t_control: T_Control) {
		if (s_mouse.hover_didChange) {
			const s_control = elements.s_control_byType[t_control];
			if (!!s_control) {
				s_control.isHovering = s_mouse.isHovering;
			}
		} else if (s_mouse.isUp) {
			switch (t_control) {
				case T_Control.help:	controls.showHelp_home(); break;
				case T_Control.search:	search.activate(); break;
				case T_Control.grow:	layout.scaleBy(k.ratio.zoom_in) - 20; break;
				case T_Control.shrink:	layout.scaleBy(k.ratio.zoom_out) - 20; break;
				case T_Control.details: details.details_toggle_visibility(); break;
				default:				controls.togglePopupID(t_control); break;
			}
		}
	}

	handle_singleClick_onDragDot(shiftKey: boolean, ancestry: Ancestry) {
		if (ancestry.isBidirectional && ancestry.thing?.isRoot) {
			this.handle_singleClick_onDragDot(shiftKey, h.rootAncestry);
		} else {
			w_s_title_edit?.set(null);
			if (!!get(w_s_alteration)) {
				h.ancestry_alter_connectionTo_maybe(ancestry);
				layout.grand_build();
				return;
			} else if (!shiftKey && controls.inRadialMode) {
				if (ancestry.becomeFocus()) {
					layout.grand_build();
					return;
				}
			} else if (shiftKey || ancestry.isGrabbed) {
				ancestry.toggleGrab();
			} else {
				ancestry.grabOnly();
			}
			layout.grand_layout();
		}
	}

	async handle_key_down(e: Event) {
		const event = e as KeyboardEvent;
		const isEditing = get(w_s_title_edit)?.isActive ?? false;
		if (!!event && event.type == 'keydown' && !isEditing) {
			const key = event.key.toLowerCase();
			const ancestry = x.ancestry_grabbed_atEnd_upward(true);
			const modifiers = ['alt', 'meta', 'shift', 'control'];
			let graph_needsSweep = false;
			w_control_key_down.set(event.ctrlKey);
			if (!!h && !!ancestry && !modifiers.includes(key)) {
				const OPTION = event.altKey;
				const SHIFT = event.shiftKey;
				const COMMAND = event.metaKey;
				const EXTREME = SHIFT && OPTION;
				if (get(w_search_state) != T_Search.off) {
					switch (key) {
						case 'enter':	
						case 'escape':
						case 'arrowright':	    search.deactivate_focus_and_grab(); break;	// stop searching		
						case 'arrowleft':		u.grab_event(event); w_search_state.set(T_Search.enter); break;
						case 'arrowup':			u.grab_event(event); search.next_row(false); break;
						case 'arrowdown':		u.grab_event(event); search.next_row(true); break;
						case 'tab':				search.selected_row = 0; break;
						case 'f':				search.activate(); break;			
					}
				} else {
					if (c.allow_graph_editing) {
						if (!!ancestry && c.allow_title_editing) {
							switch (key) {
								case 'enter':	ancestry.startEdit(); break;
								case 'd':		await h.thing_edit_persistentDuplicate(ancestry); break;
								case ' ':		await h.ancestry_edit_persistentCreateChildOf(ancestry); break;
								case '-':		if (!COMMAND) { await h.thing_edit_persistentAddLine(ancestry); } break;
								case 'tab':		await h.ancestry_edit_persistentCreateChildOf(ancestry.parentAncestry); break; // S_Title_Edit editor also makes this call
							}
						}
						switch (key) {
							case 'delete':
							case 'backspace':	await h.ancestries_rebuild_traverse_persistentDelete(x.si_grabs.items); break;
						}
					}
					if (!!ancestry) {
						switch (key) {
							case '/':			graph_needsSweep = ancestry.becomeFocus(); break;
							case 'arrowright':	u.grab_event(event); await h.ancestry_rebuild_persistentMoveRight(ancestry,  true, SHIFT, OPTION, EXTREME, false); break;
							case 'arrowleft':	u.grab_event(event); await h.ancestry_rebuild_persistentMoveRight(ancestry, false, SHIFT, OPTION, EXTREME, false); break;
						}
					}
					switch (key) {
						case '?':				controls.showHelp_home(); return;
						case 'm':				controls.toggle_graph_type(); break;
						case ']':				x.ancestry_next_focusOn(true); break;
						case '[':				x.ancestry_next_focusOn(false); break;
						case '!':				layout.grand_adjust_toFit(); break;
						case '>':				g_tree.increase_depth_limit_by(1); break;
						case '<':				g_tree.increase_depth_limit_by(-1); break;
						case 'f':				w_search_state.set(T_Search.enter); break;
						case 'p':				if (!COMMAND) { u.print_graph(); }; break;
						case 's':				h.persist_toFile(T_File_Format.json); return;
						case 'c':				layout.set_user_graph_offsetTo(Point.zero); return;
						case 'o':				h.select_file_toUpload(T_File_Format.json, event.shiftKey); break;
						case '/':				if (!ancestry) { graph_needsSweep = h.rootAncestry?.becomeFocus(); } break;
						case 'arrowup':			h.ancestry_rebuild_persistent_grabbed_atEnd_moveUp_maybe( true, SHIFT, OPTION, EXTREME); break;
						case 'arrowdown':		h.ancestry_rebuild_persistent_grabbed_atEnd_moveUp_maybe(false, SHIFT, OPTION, EXTREME); break;
						case 'escape':			if (!!get(w_s_alteration)) { h.stop_alteration(); }; search.deactivate(); break;
					}
				}
			}
			if (graph_needsSweep) {
				layout.grand_sweep();
			}
			if (c.allow_autoSave) {
				setTimeout( async () => {
					await h.db.persist_all();
				}, 1);
			}
		}
	}

	async handle_action_clickedAt(s_mouse: S_Mouse, t_action: number, column: number, name: string) {
		const ancestry = get(w_ancestry_forDetails);	
		if (get(w_control_key_down)) {
			controls.showHelp_for(t_action, column);
		} else if (!!ancestry && !this.handle_isAction_disabledAt(t_action, column) && !!h) {
			const a = this.actions;
			switch (t_action) {
				case T_Action.browse:			switch (column) {
					case a.browse.up:				h.ancestry_rebuild_persistent_grabbed_atEnd_moveUp_maybe( true, false, false, false); break;
					case a.browse.down:				h.ancestry_rebuild_persistent_grabbed_atEnd_moveUp_maybe(false, false, false, false); break;
					case a.browse.left:				await h.ancestry_rebuild_persistentMoveRight(ancestry, false, false, false, false, false); break;
					case a.browse.right:			await h.ancestry_rebuild_persistentMoveRight(ancestry,  true, false, false, false, false); break;
				}								break;
				case T_Action.focus:			switch (column) {
					case a.focus.selection:			ancestry.becomeFocus(); break;
					case a.focus.parent:			ancestry.collapse(); ancestry.parentAncestry?.becomeFocus(); break;
				}								break;
				case T_Action.show:				switch (column) {
					case a.show.selection:			break;
					case a.show.list:				h.ancestry_rebuild_persistentMoveRight(ancestry, !ancestry.isExpanded, false, false, false, true); break;
					case a.show.graph:				layout.grand_adjust_toFit(); break;
				}								break;
				case T_Action.center:			switch (column) {
					case a.center.focus:			layout.ancestry_place_atCenter(get(w_ancestry_focus)); break;
					case a.center.selection:		layout.ancestry_place_atCenter(ancestry); break;
					case a.center.graph:			layout.set_user_graph_offsetTo(Point.zero); break;
				}								break;
				case T_Action.add:				switch (column) {
					case a.add.child:				await h.ancestry_edit_persistentCreateChildOf(ancestry); break;
					case a.add.sibling:				await h.ancestry_edit_persistentCreateChildOf(ancestry.parentAncestry); break;
					case a.add.line:				await h.thing_edit_persistentAddLine(ancestry); break;
					case a.add.parent:				controls.toggle_alteration(ancestry, T_Alteration.add, Predicate.contains); break;
					case a.add.related:				controls.toggle_alteration(ancestry, T_Alteration.add, Predicate.isRelated); break;
				}								break;
				case T_Action.delete:			switch (column) {
					case a.delete.selection:		await h.ancestries_rebuild_traverse_persistentDelete(x.si_grabs.items); break;
					case a.delete.parent:			controls.toggle_alteration(ancestry, T_Alteration.delete, Predicate.contains); break;
					case a.delete.related:			controls.toggle_alteration(ancestry, T_Alteration.delete, Predicate.isRelated); break;
				}								break;
				case T_Action.move:				switch (column) {
					case a.move.up:					h.ancestry_rebuild_persistent_grabbed_atEnd_moveUp_maybe( true, false, true, false); break;
					case a.move.down:				h.ancestry_rebuild_persistent_grabbed_atEnd_moveUp_maybe(false, false, true, false); break;
					case a.move.left:				await h.ancestry_rebuild_persistentMoveRight(ancestry, false, false, true, false, false); break;
					case a.move.right:				await h.ancestry_rebuild_persistentMoveRight(ancestry,  true, false, true, false, false); break;
				}								break;
			}
		}
	}

	handle_isAction_disabledAt(t_action: number, column: number): boolean {		// true means disabled
		const ancestry = get(w_ancestry_forDetails);
		if (!!ancestry) {
			const is_altering = !!get(w_s_alteration);
			const no_children = !ancestry.hasChildren;
			const no_siblings = !ancestry.hasSiblings;
			const is_root = ancestry.isRoot;
			const a = this.actions;
			const disable_revealConceal = no_children || is_root || (controls.inRadialMode && ancestry.isFocus);
			switch (t_action) {
				case T_Action.browse:			switch (column) {
					case a.browse.left:				return is_root;
					case a.browse.up:				return no_siblings;
					case a.browse.down:				return no_siblings;
					case a.browse.right:			return no_children;
				}								break;
				case T_Action.focus:			switch (column) {
					case a.focus.selection:			return ancestry.isFocus;
					case a.focus.parent:			return !ancestry.parentAncestry || ancestry.parentAncestry.isFocus;
				}								break;
				case T_Action.show:				switch (column) {
					case a.show.selection:			return ancestry.isVisible;
					case a.show.list:				return disable_revealConceal;
					case a.show.graph:				return false;
				}								break;
				case T_Action.center:			switch (column) {
					case a.center.focus:			return layout.ancestry_isCentered(get(w_ancestry_focus));
					case a.center.selection:		return layout.ancestry_isCentered(ancestry);
					case a.center.graph:			return get(w_user_graph_offset).magnitude < 1;
				}								break;
				case T_Action.add:				switch (column) {
					case a.add.child:				return is_altering;
					case a.add.sibling:				return is_altering || is_root;
					case a.add.line:				return is_altering || is_root;
					case a.add.parent:				return is_root;
					case a.add.related:				return false;
				}								break;
				case T_Action.delete:			switch (column) {
					case a.delete.selection:		return is_altering || is_root;
					case a.delete.parent:			return !ancestry.hasParents_ofKind(T_Predicate.contains);
					case a.delete.related:			return !ancestry.hasParents_ofKind(T_Predicate.isRelated);
				}								break;
				case T_Action.move:				switch (column) {
					case a.move.left:				return is_root;
					case a.move.up:					return no_siblings || is_root;
					case a.move.down:				return no_siblings || is_root;
					case a.move.right:				return no_children || is_root;
				}								break;
			}
		}
		return true;
	}

	help_page_forActionAt(t_action: number, column: number): string {
		const a = this.actions;
		switch (t_action) {
			case T_Action.browse: 				return 'actions/browse';
			case T_Action.focus: 				return 'actions/focus';
			case T_Action.show:					switch (column) {
					case a.show.selection:			return 'actions/select';
					case a.show.list:				return 'actions/dots';
				}								break;
			case T_Action.center:				switch (column) {
					case a.center.focus:			return 'actions/focus';
					case a.center.selection:		return 'actions/select';
					case a.center.graph:			return 'looks/graph';
				}								break;
			default:							return 'actions/organize';
		}
		return k.empty;
	}

	private actions: { [key: string]: { [key: string]: number } } = {
		browse: {
			left: 0,
			up: 1,
			down: 2,
			right: 3,
		},
		focus: {
			selection: 0,
			parent: 1,
		},
		show: {
			selection: 0,
			list: 1,
			graph: 2,
		},
		center: {
			focus: 0,
			selection: 1,
			graph: 2,
		},
		add: {
			child: 0,
			sibling: 1,
			line: 2,
			parent: 3,
			related: 4,
		},
		delete: {
			selection: 0,
			parent: 1,
			related: 2,
		},
		move: {
			left: 0,
			up: 1,
			down: 2,
			right: 3,
		},
	};

}

export let e = new Events();
