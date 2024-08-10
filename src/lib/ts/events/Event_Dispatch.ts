import { s_altering, s_resize_count, s_rebuild_count, s_mouse_location, s_mouse_up_count } from '../state/Reactive_State';
import { g, u, get, Point, signals, Svelte_Wrapper, Alteration_State } from '../common/Global_Imports';
import { Create_Mouse_State, SvelteComponentType } from '../common/Global_Imports';
import { h } from '../../ts/db/DBDispatch';

export class Event_Dispatch {
	private wrappers_byType_andHID: { [type: string]: { [hid: number]: Svelte_Wrapper } } = {};
	private child_wrapperTypes_byType: {[type: string]: Array<string>} = {};
	
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

	wrappers_byHID_forType(type: string): { [hid: number]: Svelte_Wrapper } {
		return this.wrappers_byType_andHID[type];
	}

	wrapper_forHID_andType(hid: number, type: string) {
		const wrappers_byHID = this.wrappers_byHID_forType(type);
		if (!!wrappers_byHID) {
			return wrappers_byHID[hid];
		}
		return null;
	}

	wrapper_add(wrapper: Svelte_Wrapper) {
		const array = this.wrappers_byType_andHID;
		const dict = array[wrapper.type] ?? {};
		const hash = wrapper.idHashed;
		const type = wrapper.type;
		dict[hash] = wrapper;
		array[type] = dict;
		// this.addTo_hitHierarchy(wrapper);
	}

	//////////////////////////////////////
	//	 ABANDON remaining functions	//
	// WHY? negligible performance gain	//
	//////////////////////////////////////

	addTypeTo_parent(type: string, parentType: string) {
		let childrenTypes = this.child_wrapperTypes_byType[parentType] ?? [];
		if (!childrenTypes.includes(type)) {
			childrenTypes.push(type);
			this.child_wrapperTypes_byType[parentType] = childrenTypes;
		}
	}

	addTypeTo_hitHierarchy(type: string) {
		for (const parentType of Svelte_Wrapper.parentTypes_for(type)) {
			this.addTypeTo_parent(type, parentType);
			this.addTypeTo_hitHierarchy(parentType);	// recurse
		}
	}

	addTo_hitHierarchy(wrapper: Svelte_Wrapper) {
		for (const parentType of wrapper.parentTypes) {
			this.addTypeTo_parent(wrapper.type, parentType);
			this.addTypeTo_hitHierarchy(parentType);
		}
	}

	respondTo_closure(event: MouseEvent, closure: Create_Mouse_State) {
		// gather all wrappers whose type generates a hit
		// ask each wrapper to
		// construct & handle the mouse state
		// stop if handled
		// else ask the next wrapper

		const wrappers = this.hitsFor(event, SvelteComponentType.app)
		for (const wrapper of wrappers) {
			if (wrapper.handle_event(event, closure)) {
				return;
			}
		}
	}

	hitsFor(event: MouseEvent, type: string): Array<Svelte_Wrapper> {
		const wrappers_byHID = this.wrappers_byHID_forType(type);
		if (!wrappers_byHID) {
			return this.hitsForChildTypesOf(event, type);
		} else {
			const wrappers = Object.values(wrappers_byHID);
			for (const wrapper of wrappers) {
				const idHashed = wrapper.idHashed;
				const ancestry = h.ancestry_forHID(idHashed)
				const title = ancestry?.title ?? wrapper.idHashed;
				console.log(`hitsFor ${type} ${title}`);
				if (wrapper.isHit(event)) {
					const recurse = this.hitsForChildTypesOf(event, type);
					if (recurse.length == 0) {
						return wrappers;
					}
					break;
				}
			}
		}
		return [];	// URGENT: return app or something
	}

	hitsForChildTypesOf(event: MouseEvent, type: string): Array<Svelte_Wrapper> {

		// return all wrappers for type, if both:
		//  (1) type is hit and
		//  (2) its children are NOT hit
		//    
		// if a child is hit,
		//  recursively descend type hierarchy

		console.log(`hitsForChildTypesOf ${type}`);
		let hits: Array<Svelte_Wrapper> = [];
		const child_wrapperTypes = this.child_wrapperTypes_byType[type] ?? [];
		for (const child_wrapperType of child_wrapperTypes) {
			hits = u.concatenateArrays(hits, this.hitsFor(event, child_wrapperType));
		
		}
		return hits;
	}

}

export const e = new Event_Dispatch();
