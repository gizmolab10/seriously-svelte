import { c, h, k, u, w, grabs, Point, debug, layout, signals, Ancestry, Predicate } from '../common/Global_Imports';
import { T_Action, T_File_Format, T_Predicate, T_Alteration, S_Mouse, S_Alteration } from '../common/Global_Imports';
import { w_ancestry_focus, w_count_mouse_up, w_mouse_location, w_mouse_location_scaled } from '../common/Stores';
import { w_device_isMobile, w_ancestries_grabbed, w_user_graph_offset } from '../common/Stores';
import { w_s_alteration, w_count_resize, w_s_text_edit } from '../common/Stores';
import { get } from 'svelte/store';

export class Events {
	initialTouch: Point | null = null;
	alteration_interval: NodeJS.Timeout | null = null;
	autorepeat_interval: NodeJS.Timeout | null = null;

	setup() {
		w_s_alteration.subscribe((s_alteration: S_Alteration | null) => { this.handle_s_alteration(s_alteration); });
		w_device_isMobile.subscribe((isMobile: boolean) => { this.subscribeTo_events(); });
		this.subscribeTo_events();
	}
	
	static readonly _____INTERNALS: unique symbol;

	private handle_touch_end(event: TouchEvent) { this.initialTouch = null; }
	private get autorepeaters(): number[] { return [T_Action.browse, T_Action.move]; }

	private ancestry_toggle_alteration(ancestry: Ancestry, t_alteration: T_Alteration, predicate: Predicate | null) {
		const isAltering = !!get(w_s_alteration);
		const s_alteration = isAltering ? null : new S_Alteration(ancestry, t_alteration, predicate);
		w_s_alteration.set(s_alteration);
	}

	private update_event_listener(name: string, handler: EventListenerOrEventListenerObject) {
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
		this.update_event_listener('keydown', this.handle_zoom);
		this.update_event_listener('resize', this.handle_resize);
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

	private handle_mouse_up(event: MouseEvent) {
		w_count_mouse_up.update(n => n + 1);
	}

	private handle_orientation_change(event: Event) {
		const isMobile = u.device_isMobile;
		debug.log_action(` orientation change [is${isMobile ? '' : ' not'} mobile] STATE`);
		w_device_isMobile.set(isMobile);
		w.restore_state();
	}

	private handle_touch_start(event: TouchEvent) {
		if (event.touches.length == 2) {
			const touch = event.touches[0];
			this.initialTouch = new Point(touch.clientX, touch.clientY);
			debug.log_action(` two-finger touches GRAPH`);
		}
	}

	private handle_mouse_move(event: MouseEvent) {
		const location = new Point(event.clientX, event.clientY);
		w_mouse_location.set(location);
		w_mouse_location_scaled.set(location.dividedBy(w.scale_factor));
	}

	private handle_resize(event: Event) {
		// called when simulator switches platform (e.c., desktop <--> iphone)
		const isMobile = u.device_isMobile;
		debug.log_action(` resize [is${isMobile ? '' : ' not'} mobile] STATE`);
		w_count_resize.update(n => n + 1);
		w_device_isMobile.set(isMobile);
		w.restore_state();
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

	private handle_zoom(e: Event) {
		const event = e as KeyboardEvent;
		const key = event.key;
		if (event.metaKey && ['+', '=', '-', '0'].includes(key)) {
			event.preventDefault();
			event.stopPropagation();
			switch (key) {
				case '0': w.applyScale(1); break;
				case '=': w.zoomBy(k.ratio.zoom_in); break;
				default: w.zoomBy(k.ratio.zoom_out); break;
			}
			layout.renormalize_user_graph_offset();
			layout.grand_build();
		}
	}

	private handle_s_alteration(s_alteration: S_Alteration | null) {
		if (!!this.alteration_interval) {
			clearInterval(this.alteration_interval);
			this.alteration_interval = null;
		}
		if (!!s_alteration) {
			let invert = true;
			this.alteration_interval = setInterval(() => {
				signals.signal_blink_forAlteration(invert);
				invert = !invert;
			}, 500)
		} else {
			signals.signal_blink_forAlteration(false);
		}
	}
	
	static readonly _____MAIN_EVENT_HANDLERS: unique symbol;

	handle_s_mouse(s_mouse: S_Mouse, from: string): S_Mouse { return s_mouse; }			// for dots and buttons

	async handle_action_autorepeatAt(s_mouse: S_Mouse, t_action: number, column: number, name: string) {
		if (s_mouse.isDown) {
			return this.handle_action_clickedAt(s_mouse, t_action, column, name);
		} else if (s_mouse.isLong && this.autorepeaters.includes(t_action)) {
			this.autorepeat_interval = setInterval(() => {			// begin autorepeating
				this.handle_action_clickedAt(s_mouse, t_action, column, name);
			}, k.autorepeat_interval);
		} else if (s_mouse.isUp && !!this.autorepeat_interval) {	// stop autorepeating
			clearInterval(this.autorepeat_interval);
			this.autorepeat_interval = null;
		}
	}

	// T_Action and actions must be in sync

	async handle_key_down(event: KeyboardEvent) {
		const isEditing = get(w_s_text_edit)?.isActive ?? false;
		if (event.type == 'keydown' && !isEditing) {
			const OPTION = event.altKey;
			const SHIFT = event.shiftKey;
			const COMMAND = event.metaKey;
			const EXTREME = SHIFT && OPTION;
			const time = new Date().getTime();
			const key = event.key.toLowerCase();
			const ancestry = grabs.latest_upward(true);
			const modifiers = ['alt', 'meta', 'shift', 'control'];
			let graph_needsRebuild = false;
			if (!!h && !!ancestry && !modifiers.includes(key)) {		// ignore modifier-key-only events
				if (c.allow_GraphEditing) {
					if (!!ancestry && c.allow_TitleEditing) {
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
					case 's':				h.persist_toFile(T_File_Format.json); return;
					case 'm':				layout.toggle_graph_type(); break;
					case 'c':				layout.set_user_graph_offsetTo(Point.zero); return;
					case 'o':				h.select_file_toUpload(T_File_Format.json, event.shiftKey); break;
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
		const ancestry = grabs.latest;
		if (!!ancestry && !this.handle_isAction_disabledAt(t_action, column) && !!h) {
			switch (t_action) {
				case T_Action.browse:							switch (column) {
					case this.actions.browse.up:				grabs.latest_rebuild_persistentMoveUp_maybe( true, false, false, false); break;
					case this.actions.browse.down:				grabs.latest_rebuild_persistentMoveUp_maybe(false, false, false, false); break;
					case this.actions.browse.left:				await h.ancestry_rebuild_persistentMoveRight(ancestry, false, false, false, false, false); break;
					case this.actions.browse.right:				await h.ancestry_rebuild_persistentMoveRight(ancestry,  true, false, false, false, false); break;
				}											break;										break;
				case T_Action.focus:							switch (column) {
					case this.actions.focus.selection:			ancestry.becomeFocus(); break;
					case this.actions.focus.parent:				ancestry.collapse(); ancestry.parentAncestry?.becomeFocus(); break;
				}											break;
				case T_Action.show:							switch (column) {
					case this.actions.show.selection:			break;
					case this.actions.show.list:				await h.ancestry_toggle_expansion(ancestry); break;
				}											break;
				case T_Action.center:							switch (column) {
					case this.actions.center.focus:				layout.place_ancestry_atCenter(get(w_ancestry_focus)); break;
					case this.actions.center.selection:			layout.place_ancestry_atCenter(ancestry); break;
					case this.actions.center.root:				layout.place_ancestry_atCenter(h.rootAncestry); break;
					case this.actions.center.graph:				layout.set_user_graph_offsetTo(Point.zero); break;
				}											break;
				case T_Action.add:							switch (column) {
					case this.actions.add.child:				await h.ancestry_edit_persistentCreateChildOf(ancestry); break;
					case this.actions.add.sibling:				await h.ancestry_edit_persistentCreateChildOf(ancestry.parentAncestry); break;
					case this.actions.add.line:					await h.thing_edit_persistentAddLine(ancestry); break;
					case this.actions.add.parent:				this.ancestry_toggle_alteration(ancestry, T_Alteration.add, Predicate.contains); break;
					case this.actions.add.related:				this.ancestry_toggle_alteration(ancestry, T_Alteration.add, Predicate.isRelated); break;
				}											break;
				case T_Action.delete:							switch (column) {
					case this.actions.delete.selection:			await h.ancestries_rebuild_traverse_persistentDelete(get(w_ancestries_grabbed)); break;
					case this.actions.delete.parent:			this.ancestry_toggle_alteration(ancestry, T_Alteration.delete, Predicate.contains); break;
					case this.actions.delete.related		:	this.ancestry_toggle_alteration(ancestry, T_Alteration.delete, Predicate.isRelated); break;
				}											break;
				case T_Action.move:							switch (column) {
					case this.actions.move.up:					grabs.latest_rebuild_persistentMoveUp_maybe( true, false, true, false); break;
					case this.actions.move.down:				grabs.latest_rebuild_persistentMoveUp_maybe(false, false, true, false); break;
					case this.actions.move.left:				await h.ancestry_rebuild_persistentMoveRight(ancestry, false, false, true, false, false); break;
					case this.actions.move.right:				await h.ancestry_rebuild_persistentMoveRight(ancestry,  true, false, true, false, false); break;
				}											break;
			}
		}
	}

	private go_to_root() {
		const root = h.rootAncestry;
		if (!!root) {
			for (const childAncestry of root.childAncestries) {
				childAncestry.collapse();
			}
			// root.expand();
			root.becomeFocus();
			layout.grand_build();
		}
	}

	name_ofActionAt(t_action: number, column: number): string {
		return Object.keys(this.actions[T_Action[t_action]])[column];
	}

	handle_isAction_disabledAt(t_action: number, column: number): boolean {		// true means disabled
		const ancestry = grabs.latest;
		if (!!ancestry) {
			const is_altering = !!get(w_s_alteration);
			const no_children = !ancestry.hasChildren;
			const no_siblings = !ancestry.hasSiblings;
			const is_root = ancestry.isRoot;
			const disable_revealConceal = no_children || is_root || (layout.inRadialMode && ancestry.isFocus);
			switch (t_action) {
				case T_Action.browse:							switch (column) {
					case this.actions.browse.left:				return is_root;
					case this.actions.browse.up:				return no_siblings;
					case this.actions.browse.down:				return no_siblings;
					case this.actions.browse.right:				return no_children;
				}											break;
				case T_Action.focus:							switch (column) {
					case this.actions.focus.selection:			return ancestry.isFocus;
					case this.actions.focus.parent:				return !ancestry.parentAncestry || ancestry.parentAncestry.isFocus;
				}											break;
				case T_Action.show:							switch (column) {
					case this.actions.show.selection:			return ancestry.isVisible;
					case this.actions.show.list:				return disable_revealConceal;
				}											break;
				case T_Action.center:							switch (column) {
					case this.actions.center.focus:				return get(w_ancestry_focus)?.isCentered ?? false;
					case this.actions.center.selection:			return ancestry.isCentered;
					case this.actions.center.root:				return h.rootAncestry?.isCentered ?? false;
					case this.actions.center.graph:				return get(w_user_graph_offset).isZero;;
				}											break;
				case T_Action.add:							switch (column) {
					case this.actions.add.child:				return is_altering;
					case this.actions.add.sibling:				return is_altering;
					case this.actions.add.line:					return is_altering || is_root;
					case this.actions.add.parent:				return is_root;
					case this.actions.add.related:				return false;
				}											break;
				case T_Action.delete:							switch (column) {
					case this.actions.delete.selection:			return is_altering || is_root;
					case this.actions.delete.parent:			return !ancestry.hasParents_ofKind(T_Predicate.contains);
					case this.actions.delete.related:			return !ancestry.hasParents_ofKind(T_Predicate.isRelated);
				}											break;
				case T_Action.move:							switch (column) {
					case this.actions.move.left:				return is_root;
					case this.actions.move.up:					return no_siblings;
					case this.actions.move.down:				return no_siblings;
					case this.actions.move.right:				return no_children;
				}											break;
			}
		}
		return true;
	}

	actions: { [key: string]: { [key: string]: number } } = {
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
		},
		center: {
			focus: 0,
			selection: 1,
			root: 2,
			graph: 3,
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
