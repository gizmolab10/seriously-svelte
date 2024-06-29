import { s_altering, s_resize_count, s_rebuild_count, s_mouse_up_count, s_mouse_location } from '../state/Reactive_State';
import { g, get, Point, signals, Mouse_State, Create_Mouse_State } from '../common/Global_Imports';
import { Alteration_State, SvelteComponentType } from '../common/Global_Imports';
import { h } from '../db/DBDispatch';

export class Event_Dispatch {
	// assure delivery of events
	// to a svelt component
	// with a higher ZIndex
	// than the containing component
	// when they overlap

	setup() {
		s_resize_count.set(0);
		s_rebuild_count.set(0);
		s_mouse_up_count.set(0);
		this.subscribeTo_events();
		this.subscribeTo_alterationState();
	}

	respondTo_closure(event: MouseEvent, closure: Create_Mouse_State) {
		// in order of priority by wrapper type
		// ask each wrapper to
		// construct & handle the mouse state
		// stop if handled
		// else ask the next wrapper
		const types = [SvelteComponentType.title, SvelteComponentType.drag, SvelteComponentType.reveal, SvelteComponentType.widget, SvelteComponentType.button, SvelteComponentType.ring];
		for (const type of types) {
			const wrappers_byHID = h.wrappers_byHID_forType(type);
			if (!!wrappers_byHID) {
				const wrappers = Object.values(wrappers_byHID) ?? [];
				for (const wrapper of wrappers) {
					if (wrapper.handle_event_closure(event, closure)) {
						return;
					}
				}
			}
		}
	}

	subscribeTo_events() {
		window.addEventListener('resize', (event) => {
			s_resize_count.set(get(s_resize_count) + 1)
			g.graphRect_update();
		});
		window.addEventListener('mouseup', (event: MouseEvent) => {
			event.stopPropagation();
			s_mouse_up_count.set(get(s_mouse_up_count) + 1);
			// this.respondTo_closure(event, Mouse_State.up);
		});
		// window.addEventListener('mousedown', (event: MouseEvent) => {
		// 	event.stopPropagation();
		// 	this.respondTo_closure(event, Mouse_State.down);
		// });
		window.addEventListener('mousemove', (event: MouseEvent) => {
			event.stopPropagation();
			s_mouse_location.set(new Point(event.clientX, event.clientY));
			// this.respondTo_closure(event, Mouse_State.move);
		});
	}

	subscribeTo_alterationState() {
		let interval: NodeJS.Timeout | null = null;

		s_altering.subscribe((state: Alteration_State | null) => {
			if (interval) {
				clearInterval(interval);
				interval = null;
			}
			if (state) {
				let blink = true;
				interval = setInterval(() => {
					signals.signal_altering(blink ? state : null);
					blink = !blink;
				}, 500)
			} else {
				signals.signal_altering(null);
			}
		})
	}

}

export const e = new Event_Dispatch();
