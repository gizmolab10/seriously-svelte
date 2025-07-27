import { T_Thing, T_Action, T_File_Format, T_Predicate, T_Alteration, S_Mouse, S_Alteration } from '../common/Global_Imports';
import { c, h, k, u, ux, grabs, Point, debug, layout, signals, Ancestry, Predicate } from '../common/Global_Imports';
import { w_ancestry_focus, w_count_mouse_up, w_mouse_location, w_mouse_location_scaled } from '../common/Stores';
import { w_device_isMobile, w_ancestries_grabbed, w_user_graph_offset, w_t_database } from '../common/Stores';
import { w_s_alteration, w_count_resize, w_s_text_edit, w_control_key_down } from '../common/Stores';
import { T_Database } from '../database/DB_Common';
import Mouse_Timer from './Mouse_Timer';
import { get } from 'svelte/store';

export class Events {
	mouse_timer_byName: { [name: string]: Mouse_Timer } = {};
	initialTouch: Point | null = null;
	mouseTimer: Mouse_Timer;

	mouse_timer_forName(name: string): Mouse_Timer { return u.assure_forKey_inDict(name, this.mouse_timer_byName, () => new Mouse_Timer(name)); }

	constructor() {
		this.mouseTimer = this.mouse_timer_forName('events');
	}

	setup() {
		w_s_alteration.subscribe((s_alteration: S_Alteration | null) => { this.handle_s_alteration(s_alteration); });
		w_device_isMobile.subscribe((isMobile: boolean) => { this.subscribeTo_events(); });
	}

	static readonly _____INTERNALS: unique symbol;

	name_ofActionAt(t_action: number, column: number): string {
		return Object.keys(this.actions[T_Action[t_action]])[column];
	}

	private showHelpFor(t_action: number, column: number) { 
		const page = this.help_page_forActionAt(t_action, column);
		const url = `${k.help_url.remote}/user_guide/${page}`;
		c.open_tabFor(url);
	}

	private ancestry_toggle_alteration(ancestry: Ancestry, t_alteration: T_Alteration, predicate: Predicate | null) {
		const isAltering = !!get(w_s_alteration);
		const s_alteration = isAltering ? null : new S_Alteration(ancestry, t_alteration, predicate);
		w_s_alteration.set(s_alteration);
	}

	static readonly _____SUBSCRIPTIONS: unique symbol;

	update_event_listener(name: string, handler: EventListenerOrEventListenerObject) {
		window.removeEventListener(name, handler);
		window.addEventListener(name, handler, { passive: false });
	}

	private clear_event_subscriptions() {
		window.removeEventListener('mouseup',	 this.handle_mouse_up);
		window.removeEventListener('mousemove',	 this.handle_mouse_move);
		window.removeEventListener('touchend',	 this.handle_touch_end);
		window.removeEventListener('touchmove',	 this.handle_touch_move);
		window.removeEventListener('touchstart', this.handle_touch_start);
	}

	private subscribeTo_events() {
		this.clear_event_subscriptions();
		this.update_event_listener('wheel', this.handle_wheel);
		this.update_event_listener('keyup', this.handle_key_up);
		this.update_event_listener('resize', this.handle_resize);
		this.update_event_listener('keydown', this.handle_key_down);
		this.update_event_listener('orientationchange', this.handle_orientation_change);
		if (u.device_isMobile) {
			debug.log_action(`  mobile subscribe GRAPH`);
			window.addEventListener('touchend', this.handle_touch_end, { passive: false });
			window.addEventListener('touchmove', this.handle_touch_move, { passive: false });
			window.addEventListener('touchstart', this.handle_touch_start, { passive: false });
		} else {
			window.addEventListener('mouseup', this.handle_mouse_up, { passive: false });
			window.addEventListener('mousemove', this.handle_mouse_move, { passive: false });
		}
	}

	static readonly EVENT_HANDLERS = Symbol('EVENT_HANDLERS');

	private handle_touch_end(event: TouchEvent) { this.initialTouch = null; }
	private handle_mouse_up(event: MouseEvent) { w_count_mouse_up.update(n => n + 1); }

	private handle_mouse_move(event: MouseEvent) {
		const location = new Point(event.clientX, event.clientY);
		w_mouse_location.set(location);
		w_mouse_location_scaled.set(location.dividedBy(layout.scale_factor));
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
		layout.restore_state();
	}

	private handle_touch_start(event: TouchEvent) {
		if (event.touches.length == 2) {
			const touch = event.touches[0];
			this.initialTouch = new Point(touch.clientX, touch.clientY);
			debug.log_action(` two-finger touches GRAPH`);
		}
	}

	private handle_resize(event: Event) {
		// on COMMAND +/-
		// and on simulator switches platform
		const isMobile = u.device_isMobile;
		w_count_resize.update(n => n + 1);
		w_device_isMobile.set(isMobile);
		layout.restore_state();
	}

	private handle_wheel(event: Event) {
		event.preventDefault();
		event.stopPropagation();
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
			event.preventDefault();
			event.stopPropagation();
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
		if (!!s_alteration) {
			this.mouseTimer.alteration_start((invert) => {
				signals.signal_blink_forAlteration(invert);
			});
		} else {
			this.mouseTimer.alteration_stop();
			signals.signal_blink_forAlteration(false);
		}
	}

	handle_singleClick_onDragDot(shiftKey: boolean, ancestry: Ancestry) {
		if (ancestry.isBidirectional && ancestry.thing?.isRoot) {
			this.handle_singleClick_onDragDot(shiftKey, h.rootAncestry);
		} else {
			w_s_text_edit?.set(null);
			if (!!get(w_s_alteration)) {
				h.ancestry_alter_connectionTo_maybe(ancestry);
				layout.grand_build();
				return;
			} else if (!shiftKey && ux.inRadialMode) {
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
		const isEditing = get(w_s_text_edit)?.isActive ?? false;
		if (!!event && event.type == 'keydown' && !isEditing) {
			const OPTION = event.altKey;
			const SHIFT = event.shiftKey;
			const COMMAND = event.metaKey;
			const EXTREME = SHIFT && OPTION;
			const time = new Date().getTime();
			const key = event.key.toLowerCase();
			const ancestry = grabs.latest_upward(true);
			const modifiers = ['alt', 'meta', 'shift', 'control'];
			let graph_needsRebuild = false;
			w_control_key_down.set(event.ctrlKey);
			if (!!h && !!ancestry && !modifiers.includes(key)) {		// ignore modifier-key-only events
				if (c.allow_GraphEditing) {
					if (!!ancestry && c.allow_TitleEditing) {
						if (key == 'd') {
							console.log('user entered "d"');
						}
						switch (key) {
							case 'enter':	ancestry.startEdit(); break;
							case 'd':		await h.thing_edit_persistentDuplicate(ancestry); break;
							case ' ':		await h.ancestry_edit_persistentCreateChildOf(ancestry); break;
							case '-':		if (!COMMAND) { await h.thing_edit_persistentAddLine(ancestry); } break;
							case 'tab':		await h.ancestry_edit_persistentCreateChildOf(ancestry.parentAncestry); break; // S_Text_Edit editor also makes this call
						}
					}
					switch (key) {
						case 'delete':
						case 'backspace':	await h.ancestries_rebuild_traverse_persistentDelete(get(w_ancestries_grabbed)); break;
					}
				}
				if (!!ancestry) {
					switch (key) {
						case '/':			graph_needsRebuild = ancestry.becomeFocus(); break;
						case 'arrowright':	event.preventDefault(); await h.ancestry_rebuild_persistentMoveRight(ancestry,  true, SHIFT, OPTION, EXTREME, false); break;
						case 'arrowleft':	event.preventDefault(); await h.ancestry_rebuild_persistentMoveRight(ancestry, false, SHIFT, OPTION, EXTREME, false); break;
					}
				}
				switch (key) {
					case '?':				c.showHelp(); return;
					case '!':				layout.grand_adjust_toFit(); break;
					case '>':				layout.increase_depth_limit_by(1); break;
					case '<':				layout.increase_depth_limit_by(-1); break;
					case 's':				h.persist_toFile(T_File_Format.json); return;
					case 'm':				layout.toggle_graph_type(); break;
					case 'c':				layout.set_user_graph_offsetTo(Point.zero); return;
					case 'o':				h.select_file_toUpload(T_File_Format.json, event.shiftKey); break;
					case 'p':				if (!COMMAND) { u.print_element_byClassName(ux.inTreeMode ? 'tree-graph' : 'radial-graph') }; break;
					case '!':				graph_needsRebuild = h.rootAncestry?.becomeFocus(); break;
					case 'escape':			if (!!get(w_s_alteration)) { h.stop_alteration(); }; break;
					case 'arrowup':			grabs.latest_rebuild_persistentMoveUp_maybe( true, SHIFT, OPTION, EXTREME); break;
					case 'arrowdown':		grabs.latest_rebuild_persistentMoveUp_maybe(false, SHIFT, OPTION, EXTREME); break;
				}
				if (graph_needsRebuild) {
					layout.grand_build();
				}
				const duration = ((new Date().getTime()) - time).toFixed(1);
				debug.log_key(`H  (${duration}) ${key}`);
				setTimeout( async () => {
					await h.db.persist_all();
				}, 1);
			}
		}
	}

	async handle_action_clickedAt(s_mouse: S_Mouse, t_action: number, column: number, name: string) {
		const ancestry = grabs.ancestry;	
		if (get(w_control_key_down)) {
			this.showHelpFor(t_action, column);
		} else if (!!ancestry && !this.handle_isAction_disabledAt(t_action, column) && !!h) {
			const a = this.actions;
			switch (t_action) {
				case T_Action.browse:			switch (column) {
					case a.browse.up:				grabs.latest_rebuild_persistentMoveUp_maybe( true, false, false, false); break;
					case a.browse.down:				grabs.latest_rebuild_persistentMoveUp_maybe(false, false, false, false); break;
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
					case a.add.parent:				this.ancestry_toggle_alteration(ancestry, T_Alteration.add, Predicate.contains); break;
					case a.add.related:				this.ancestry_toggle_alteration(ancestry, T_Alteration.add, Predicate.isRelated); break;
				}								break;
				case T_Action.delete:			switch (column) {
					case a.delete.selection:		await h.ancestries_rebuild_traverse_persistentDelete(get(w_ancestries_grabbed)); break;
					case a.delete.parent:			this.ancestry_toggle_alteration(ancestry, T_Alteration.delete, Predicate.contains); break;
					case a.delete.related:			this.ancestry_toggle_alteration(ancestry, T_Alteration.delete, Predicate.isRelated); break;
				}								break;
				case T_Action.move:				switch (column) {
					case a.move.up:					grabs.latest_rebuild_persistentMoveUp_maybe( true, false, true, false); break;
					case a.move.down:				grabs.latest_rebuild_persistentMoveUp_maybe(false, false, true, false); break;
					case a.move.left:				await h.ancestry_rebuild_persistentMoveRight(ancestry, false, false, true, false, false); break;
					case a.move.right:				await h.ancestry_rebuild_persistentMoveRight(ancestry,  true, false, true, false, false); break;
				}								break;
			}
		}
	}

	handle_isAction_disabledAt(t_action: number, column: number): boolean {		// true means disabled
		const ancestry = grabs.ancestry;
		if (!!ancestry) {
			const is_altering = !!get(w_s_alteration);
			const no_children = !ancestry.hasChildren;
			const no_siblings = !ancestry.hasSiblings;
			const is_root = ancestry.isRoot;
			const a = this.actions;
			const disable_revealConceal = no_children || is_root || (ux.inRadialMode && ancestry.isFocus);
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

	private help_page_forActionAt(t_action: number, column: number): string {
		const a = this.actions;
		switch (t_action) {
			case T_Action.browse: 				return 'actions/browse';
			case T_Action.focus: 				return 'actions/focus';
			case T_Action.show:
				switch (column) {
					case a.show.selection:		return 'actions/select';
					case a.show.list:			return 'actions/dots';
				}							break;
			case T_Action.center:
				switch (column) {
					case a.center.focus:		return 'actions/focus';
					case a.center.selection:	return 'actions/select';
					case a.center.graph:		return 'looks/graph';
				}							break;
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
