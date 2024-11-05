import { u, debug, Svelte_Wrapper, Create_Mouse_State, SvelteComponentType } from '../common/Global_Imports';

export class Wrappers {
	private child_wrapperTypes_byType: {[type: string]: Array<string>} = {};
	private wrappers_byType_andHID: { [type: string]: { [hid: number]: Svelte_Wrapper } } = {};
	
	// assure delivery of events
	// to a svelt component
	// with a higher ZIndex
	// than the containing component
	// when they overlap

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
		// this.add_toHitHierarchy(wrapper);
	}

	//////////////////////////////////////
	//	 ABANDON remaining functions	//
	// WHY? negligible performance gain	//
	//////////////////////////////////////

	addType_toParent(type: string, parentType: string) {
		let childrenTypes = this.child_wrapperTypes_byType[parentType] ?? [];
		if (!childrenTypes.includes(type)) {
			childrenTypes.push(type);
			this.child_wrapperTypes_byType[parentType] = childrenTypes;
		}
	}

	addType_toHitHierarchy(type: string) {
		for (const parentType of Svelte_Wrapper.parentTypes_for(type)) {
			this.addType_toParent(type, parentType);
			this.addType_toHitHierarchy(parentType);	// recurse
		}
	}

	add_toHitHierarchy(wrapper: Svelte_Wrapper) {
		for (const parentType of wrapper.parentTypes) {
			this.addType_toParent(wrapper.type, parentType);
			this.addType_toHitHierarchy(parentType);
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
				const ancestry = get(s_hierarchy).ancestry_forHID(idHashed)
				const title = ancestry?.title ?? wrapper.idHashed;
				debug.log_action(`hitsFor ${type} ${title}`);
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

		debug.log_action(`hitsForChildTypesOf ${type}`);
		let hits: Array<Svelte_Wrapper> = [];
		const child_wrapperTypes = this.child_wrapperTypes_byType[type] ?? [];
		for (const child_wrapperType of child_wrapperTypes) {
			hits = u.concatenateArrays(hits, this.hitsFor(event, child_wrapperType));
		
		}
		return hits;
	}

}

export const wrappers = new Wrappers();
