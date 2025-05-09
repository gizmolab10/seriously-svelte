import { c, k, ux, w, Point, debug, layout, signals, Hierarchy, Predicate } from '../common/Global_Imports';
import { E_Tool, E_Predicate, E_Alteration, S_Mouse, S_Alteration } from '../common/Global_Imports';
import { w_device_isMobile, w_ancestries_grabbed, w_user_graph_offset } from '../common/Stores';
import { w_count_mouse_up, w_mouse_location, w_mouse_location_scaled } from '../common/Stores';
import { w_hierarchy, w_s_alteration, w_count_resize } from '../common/Stores';
import { get } from 'svelte/store';

export class Events {
	initialTouch: Point | null = null;
	alteration_interval: NodeJS.Timeout | null = null;
	autorepeat_interval: NodeJS.Timeout | null = null;

	get hierarchy(): Hierarchy { return get(w_hierarchy); }
	handle_touch_end(event: TouchEvent) { this.initialTouch = null; }
	get autorepeaters(): number[] { return [E_Tool.browse, E_Tool.list, E_Tool.move]; }

	update_event_listener(name: string, handler: EventListenerOrEventListenerObject) {
		window.removeEventListener(name, handler);
		window.addEventListener(name, handler, { passive: false });
	}

	setup() {
		w_s_alteration.subscribe((s_alteration: S_Alteration | null) => { this.handle_s_alteration(s_alteration); });
		w_device_isMobile.subscribe((isMobile: boolean) => { this.subscribeTo_events(); });
		this.subscribeTo_events();
	}

	handle_mouse_up(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		w_count_mouse_up.update(n => n + 1);
	}

	handle_orientation_change(event: Event) {
		const isMobile = c.device_isMobile;
		debug.log_action(` orientation change [is${isMobile ? '' : ' not'} mobile] STATE`);
		w_device_isMobile.set(isMobile);
		w.restore_state();
	}

	clear_event_subscriptions() {
		window.removeEventListener('mouseup',	 this.handle_mouse_up);
		window.removeEventListener('mousemove',	 this.handle_mouse_move);
		window.removeEventListener('touchend',	 this.handle_touch_end);
		window.removeEventListener('touchmove',	 this.handle_touch_move);
		window.removeEventListener('touchstart', this.handle_touch_start);
	}

	handle_touch_start(event: TouchEvent) {
		if (event.touches.length == 2) {
			const touch = event.touches[0];
			this.initialTouch = new Point(touch.clientX, touch.clientY);
			debug.log_action(` two-finger touches GRAPH`);
		}
	}

	handle_mouse_move(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		const location = new Point(event.clientX, event.clientY);
		w_mouse_location.set(location);
		w_mouse_location_scaled.set(location.dividedBy(w.scale_factor));
	}

	handle_resize(event: Event) {
		// called when simulator switches platform (e.c., desktop <--> iphone)
		const isMobile = c.device_isMobile;
		debug.log_action(` resize [is${isMobile ? '' : ' not'} mobile] STATE`);
		w_count_resize.update(n => n + 1);
		w_device_isMobile.set(isMobile);
		w.restore_state();
	}

	handle_wheel(event: Event) {
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

	handle_touch_move(event: TouchEvent) {
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

	async handle_tool_autorepeatAt(s_mouse: S_Mouse, e_tool: number, column: number, name: string) {
		if (s_mouse.isDown) {
			return this.handle_tool_clickedAt(s_mouse, e_tool, column, name);
		} else if (s_mouse.isLong && this.autorepeaters.includes(e_tool)) {
			this.autorepeat_interval = setInterval(() => {
				this.handle_tool_clickedAt(s_mouse, e_tool, column, name);
			}, 200)			// start interval
		} else if (s_mouse.isUp && !!this.autorepeat_interval) {
			clearInterval(this.autorepeat_interval);	// stop interval
			this.autorepeat_interval = null;
		}
	}

	subscribeTo_events() {
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

	handle_zoom(e: Event) {
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

	handle_s_alteration(s_alteration: S_Alteration | null) {
		if (!!this.alteration_interval) {
			clearInterval(this.alteration_interval);
			this.alteration_interval = null;
		}
		if (!!s_alteration) {
			let blink = true;
			this.alteration_interval = setInterval(() => {
				signals.signal_altering(blink ? s_alteration : null);
				blink = !blink;
			}, 500)
		} else {
			signals.signal_altering(null);
		}
	}

	//////////////////////////////////////////////////////
	//			four? main dispatch handlers			//
	//				mouse_state		  (???)				//
	//				key_down							//
	//				tool_clickedAt						//
	//				isTool_disabledAt					//
	//////////////////////////////////////////////////////

	handle_s_mouse(s_mouse: S_Mouse, from: string): S_Mouse { return s_mouse; }			// for dots and buttons

	async handle_key_down(event: KeyboardEvent) {
		const h = this.hierarchy;
		let ancestry = h.grabs_latest_upward(true);
		if (event.type == 'keydown' && !ux.isEditing_text) {
			const OPTION = event.altKey;
			const SHIFT = event.shiftKey;
			const COMMAND = event.metaKey;
			const EXTREME = SHIFT && OPTION;
			const key = event.key.toLowerCase();
			const modifiers = ['alt', 'meta', 'shift', 'control'];
			const time = new Date().getTime();
			let graph_needsRebuild = false;
			if (!modifiers.includes(key)) {		// ignore modifier-key-only events
				if (c.allow_GraphEditing) {
					if (!!ancestry && c.allow_TitleEditing) {
						switch (key) {
							case k.space:	await h.ancestry_edit_persistentCreateChildOf(ancestry); break;
							case 'd':		await h.thing_edit_persistentDuplicate(ancestry); break;
							case '-':		if (!COMMAND) { await h.thing_edit_persistentAddLine(ancestry); } break;
							case 'tab':		await h.ancestry_edit_persistentCreateChildOf(ancestry.parentAncestry); break; // S_Title_Edit editor also makes this call
							case 'enter':	ancestry.startEdit(); break;
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
					case '!':				graph_needsRebuild = h.rootAncestry?.becomeFocus(); break;
					case 'arrowup':			h.grabs_latest_rebuild_persistentMoveUp_maybe(true, SHIFT, OPTION, EXTREME); break;
					case 'arrowdown':		h.grabs_latest_rebuild_persistentMoveUp_maybe(false, SHIFT, OPTION, EXTREME); break;
					case 'escape':			if (!!get(w_s_alteration)) { h.stop_alteration(); }
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

	async handle_tool_clickedAt(s_mouse: S_Mouse, e_tool: number, column: number, name: string) {
		if (!this.isTool_disabledAt(e_tool, column)) {
			const h = this.hierarchy;
			const isLongClick = s_mouse.isLong;
			const ancestry = h.grabs_latest_upward(true);
			switch (e_tool) {
				case E_Tool.browse:				switch (column) {
					case k.tools.browse.up:			h.grabs_latest_rebuild_persistentMoveUp_maybe( true, false, false, false); break;
					case k.tools.browse.down:		h.grabs_latest_rebuild_persistentMoveUp_maybe(false, false, false, false); break;
					case k.tools.browse.left:		await h.ancestry_rebuild_persistentMoveRight(ancestry, false, false, false, false, false); break;
					case k.tools.browse.right:		await h.ancestry_rebuild_persistentMoveRight(ancestry,  true, false, false, false, false); break;
				}								break;
				case E_Tool.add:				switch (column) {
					case k.tools.add.child:			await h.ancestry_edit_persistentCreateChildOf(ancestry); break;
					case k.tools.add.sibling:		await h.ancestry_edit_persistentCreateChildOf(ancestry.parentAncestry); break;
					case k.tools.add.line:			await h.thing_edit_persistentAddLine(ancestry); break;
					case k.tools.add.parent:		h.ancestry_toggle_alteration(ancestry, E_Alteration.add, Predicate.contains); break;
					case k.tools.add.related:		h.ancestry_toggle_alteration(ancestry, E_Alteration.add, Predicate.isRelated); break;
				}								break;
				case E_Tool.delete:				switch (column) {
					case k.tools.delete.selection:	await h.ancestries_rebuild_traverse_persistentDelete(get(w_ancestries_grabbed)); break;
					case k.tools.delete.parent:		h.ancestry_toggle_alteration(ancestry, E_Alteration.delete, Predicate.contains); break;
					case k.tools.delete.related:	h.ancestry_toggle_alteration(ancestry, E_Alteration.delete, Predicate.isRelated); break;
				}								break;
				case E_Tool.move:				switch (column) {
					case k.tools.move.up:			h.grabs_latest_rebuild_persistentMoveUp_maybe( true, false, true, false); break;
					case k.tools.move.down:			h.grabs_latest_rebuild_persistentMoveUp_maybe(false, false, true, false); break;
					case k.tools.move.left:			await h.ancestry_rebuild_persistentMoveRight(ancestry, false, false, true, false, false); break;
					case k.tools.move.right:		await h.ancestry_rebuild_persistentMoveRight(ancestry,  true, false, true, false, false); break;
				}								break;
				case E_Tool.list:					await h.ancestry_toggle_expansion(ancestry); break;
				case E_Tool.show:				switch (column) {
					case k.tools.show.selection:	h.grabs_latest_assureIsVisible(); break;
					case k.tools.show.root:			h.rootAncestry.becomeFocus(); break;
				}								break;
				case E_Tool.graph:					w.user_graph_offset_setTo(Point.zero); break;
			}
		}
	}

	isTool_disabledAt(e_tool: number, column: number): boolean {		// true means disabled
		const ancestry = this.hierarchy.grabs_latest_upward(true);
		const is_altering = !!get(w_s_alteration);
		const no_children = !ancestry.hasChildren;
		const no_siblings = !ancestry.hasSiblings;
		const is_root = ancestry.isRoot;
		const disable_revealConceal = no_children || is_root || (layout.inRadialMode && ancestry.isFocus);
		switch (e_tool) {
			case E_Tool.browse:				switch (column) {
				case k.tools.browse.up:			return no_siblings;
				case k.tools.browse.down:		return no_siblings;
				case k.tools.browse.left:		return is_root;
				case k.tools.browse.right:		return no_children;
			}								break;
			case E_Tool.add:				switch (column) {
				case k.tools.add.child:			return is_altering;
				case k.tools.add.sibling:		return is_altering || no_siblings;
				case k.tools.add.line:			return is_altering || is_root;
				case k.tools.add.parent:		return is_root;
				case k.tools.add.related:		return false;
			}								break;
			case E_Tool.delete:				switch (column) {
				case k.tools.delete.selection:	return is_altering || is_root;
				case k.tools.delete.parent:		return !ancestry.hasParents_ofKind(E_Predicate.contains);
				case k.tools.delete.related:	return !ancestry.hasParents_ofKind(E_Predicate.isRelated);
			}								break;
			case E_Tool.move:				switch (column) {
				case k.tools.move.up:			return no_siblings;
				case k.tools.move.down:			return no_siblings;
				case k.tools.move.left:			return is_root;
				case k.tools.move.right:		return is_root;
			}								break;
			case E_Tool.list:					return disable_revealConceal;
			case E_Tool.show:				switch (column) {
				case k.tools.show.selection:	return ancestry.isVisible;
				case k.tools.show.root:			return this.hierarchy.rootAncestry.isVisible;
			}								break;
			case E_Tool.graph:					return get(w_user_graph_offset).isZero;
		}
		return true;
	}
}

export let e = new Events();
