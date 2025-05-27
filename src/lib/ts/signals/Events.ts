import { T_Tool, T_File, T_Predicate, T_Alteration, S_Mouse, S_Alteration } from '../common/Global_Imports';
import { c, h, k, w, grabs, Point, debug, layout, signals, Ancestry, Predicate } from '../common/Global_Imports';
import { w_device_isMobile, w_ancestries_grabbed, w_user_graph_offset } from '../common/Stores';
import { w_count_mouse_up, w_mouse_location, w_mouse_location_scaled } from '../common/Stores';
import { w_s_alteration, w_count_resize, w_s_title_edit } from '../common/Stores';
import { s_details } from '../state/S_Details';
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
	private get autorepeaters(): number[] { return [T_Tool.browse, T_Tool.list, T_Tool.move]; }

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
		if (c.device_isMobile) {
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
		event.preventDefault();
		event.stopPropagation();
		w_count_mouse_up.update(n => n + 1);
	}

	private handle_orientation_change(event: Event) {
		const isMobile = c.device_isMobile;
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
		event.preventDefault();
		event.stopPropagation();
		const location = new Point(event.clientX, event.clientY);
		w_mouse_location.set(location);
		w_mouse_location_scaled.set(location.dividedBy(w.scale_factor));
	}

	private handle_resize(event: Event) {
		// called when simulator switches platform (e.c., desktop <--> iphone)
		const isMobile = c.device_isMobile;
		debug.log_action(` resize [is${isMobile ? '' : ' not'} mobile] STATE`);
		w_count_resize.update(n => n + 1);
		w_device_isMobile.set(isMobile);
		w.restore_state();
	}

	private handle_wheel(event: Event) {
		event.preventDefault();
		event.stopPropagation();
		if (!c.device_isMobile) {
			const e = event as WheelEvent;
			const userOffset = get(w_user_graph_offset);
			const delta = new Point(-e.deltaX, -e.deltaY);
			if (!!userOffset && c.allow_HorizontalScrolling && delta.magnitude > 1) {
				debug.log_action(` wheel GRAPH`);
				w.user_graph_offset_setTo(userOffset.offsetBy(delta));
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
				w.user_graph_offset_setTo(new Point(deltaX, deltaY));
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
			w.renormalize_user_graph_offset();
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

	async handle_tool_autorepeatAt(s_mouse: S_Mouse, t_tool: number, column: number, name: string) {
		if (s_mouse.isDown) {
			return this.handle_tool_clickedAt(s_mouse, t_tool, column, name);
		} else if (s_mouse.isLong && this.autorepeaters.includes(t_tool)) {
			this.autorepeat_interval = setInterval(() => {			// begin autorepeating
				this.handle_tool_clickedAt(s_mouse, t_tool, column, name);
			}, k.autorepeat_interval);
		} else if (s_mouse.isUp && !!this.autorepeat_interval) {	// stop autorepeating
			clearInterval(this.autorepeat_interval);
			this.autorepeat_interval = null;
		}
	}

	async handle_tool_clickedAt(s_mouse: S_Mouse, t_tool: number, column: number, name: string) {
		const ancestry = grabs.ancestry_forInfo;
		if (!!ancestry && !this.handle_isTool_disabledAt(t_tool, column) && !!h) {
			switch (t_tool) {
				case T_Tool.browse:					switch (column) {
					case k.tools.browse.up:				grabs.latest_rebuild_persistentMoveUp_maybe( true, false, false, false); break;
					case k.tools.browse.down:			grabs.latest_rebuild_persistentMoveUp_maybe(false, false, false, false); break;
					case k.tools.browse.left:			await h.ancestry_rebuild_persistentMoveRight(ancestry, false, false, false, false, false); break;
					case k.tools.browse.right:			await h.ancestry_rebuild_persistentMoveRight(ancestry,  true, false, false, false, false); break;
				}									break;
				case T_Tool.add:					switch (column) {
					case k.tools.add.child:				await h.ancestry_edit_persistentCreateChildOf(ancestry); break;
					case k.tools.add.sibling:			await h.ancestry_edit_persistentCreateChildOf(ancestry.parentAncestry); break;
					case k.tools.add.line:				await h.thing_edit_persistentAddLine(ancestry); break;
					case k.tools.add.parent:			this.ancestry_toggle_alteration(ancestry, T_Alteration.add, Predicate.contains); break;
					case k.tools.add.related:			this.ancestry_toggle_alteration(ancestry, T_Alteration.add, Predicate.isRelated); break;
				}									break;
				case T_Tool.delete:					switch (column) {
					case k.tools.delete.selection:		await h.ancestries_rebuild_traverse_persistentDelete(get(w_ancestries_grabbed)); break;
					case k.tools.delete.parent:			this.ancestry_toggle_alteration(ancestry, T_Alteration.delete, Predicate.contains); break;
					case k.tools.delete.related:		this.ancestry_toggle_alteration(ancestry, T_Alteration.delete, Predicate.isRelated); break;
				}									break;
				case T_Tool.move:					switch (column) {
					case k.tools.move.up:				grabs.latest_rebuild_persistentMoveUp_maybe( true, false, true, false); break;
					case k.tools.move.down:				grabs.latest_rebuild_persistentMoveUp_maybe(false, false, true, false); break;
					case k.tools.move.left:				await h.ancestry_rebuild_persistentMoveRight(ancestry, false, false, true, false, false); break;
					case k.tools.move.right:			await h.ancestry_rebuild_persistentMoveRight(ancestry,  true, false, true, false, false); break;
				}									break;
				case T_Tool.list:						await h.ancestry_toggle_expansion(ancestry); break;
				case T_Tool.show:					switch (column) {
					case k.tools.show.selection:		grabs.latest_assureIsVisible(); break;
					case k.tools.show.root:				h.rootAncestry.becomeFocus(); break;
					case k.tools.show.all:				layout.expandAll(); layout.grand_build(); break;
				}									break;
				case T_Tool.graph:						w.user_graph_offset_setTo(Point.zero); break;
			}
		}
	}

	handle_isTool_disabledAt(t_tool: number, column: number): boolean {		// true means disabled
		const ancestry = grabs.ancestry_forInfo;
		if (!!ancestry) {
			const is_altering = !!get(w_s_alteration);
			const no_children = !ancestry.hasChildren;
			const no_siblings = !ancestry.hasSiblings;
			const is_root = ancestry.isRoot;
			const disable_revealConceal = no_children || is_root || (layout.inRadialMode && ancestry.isFocus);
			switch (t_tool) {
				case T_Tool.browse:					switch (column) {
					case k.tools.browse.left:			return is_root;
					case k.tools.browse.up:				return no_siblings;
					case k.tools.browse.down:			return no_siblings;
					case k.tools.browse.right:			return no_children;
				}									break;
				case T_Tool.add:					switch (column) {
					case k.tools.add.child:				return is_altering;
					case k.tools.add.sibling:			return is_altering;
					case k.tools.add.line:				return is_altering || is_root;
					case k.tools.add.parent:			return is_root;
					case k.tools.add.related:			return false;
				}									break;
				case T_Tool.delete:					switch (column) {
					case k.tools.delete.selection:		return is_altering || is_root;
					case k.tools.delete.parent:			return !ancestry.hasParents_ofKind(T_Predicate.contains);
					case k.tools.delete.related:		return !ancestry.hasParents_ofKind(T_Predicate.isRelated);
				}									break;
				case T_Tool.move:					switch (column) {
					case k.tools.move.left:				return is_root;
					case k.tools.move.up:				return no_siblings;
					case k.tools.move.down:				return no_siblings;
					case k.tools.move.right:			return is_root;
				}									break;
				case T_Tool.list:						return disable_revealConceal;
				case T_Tool.show:					switch (column) {
					case k.tools.show.selection:		return ancestry.isVisible;
					case k.tools.show.root:				return h?.rootAncestry?.isVisible ?? false;
					case k.tools.show.all:				return layout.isAllExpanded;
				}									break;
				case T_Tool.graph:						return get(w_user_graph_offset).isZero;
			}
		}
		return true;
	}

	async handle_key_down(event: KeyboardEvent) {
		const isEditing = get(w_s_title_edit)?.isActive ?? false;
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
							case 'tab':		await h.ancestry_edit_persistentCreateChildOf(ancestry.parentAncestry); break; // S_Title_Edit editor also makes this call
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
					case 's':				h.persist_toFile(T_File.json); return;
					case 'm':				layout.toggle_t_graph(); break;
					case 'c':				w.user_graph_offset_setTo(Point.zero); return;
					case 'o':				h.select_file_toUpload(T_File.json, event.shiftKey); break;
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
					await h?.db.persist_all();
				}, 1);
			}
		}
	}

}

export let e = new Events();
