import { w_mouse_location_scaled } from '../common/Stores';
import { Svelte_Wrapper } from '../common/Global_Imports';
import type { Integer } from '../common/Types';
import { get } from 'svelte/store';

export class Wrappers {
	private wrappers_byType_andHID: { [type: string]: { [hid: Integer]: Svelte_Wrapper } } = {};
	
	// support for detecting a svelte component 

	wrappers_byHID_forType(type: string): { [hid: Integer]: Svelte_Wrapper } {
		return this.wrappers_byType_andHID[type];
	}

	wrapper_forHID_andType(hid: Integer, type: string) {
		const wrappers_byHID = this.wrappers_byHID_forType(type);
		if (!!wrappers_byHID) {
			return wrappers_byHID[hid];
		}
		return null;
	}

	wrapper_add(wrapper: Svelte_Wrapper) {
		const array = this.wrappers_byType_andHID;
		const dict = array[wrapper.type] ?? {};
		const type = wrapper.type;
		const hid = wrapper.hid;
		dict[hid] = wrapper;
		array[type] = dict;
	}
	
	wrappers_ofType_atMouseLocation(type: string): Array<Svelte_Wrapper> {
		const mouse_vector = get(w_mouse_location_scaled);
		const dict = this.wrappers_byHID_forType(type);
		let found: Array<Svelte_Wrapper> = [];
		if (!!dict && !!mouse_vector) {
			const wrappers = Object.values(dict);
			for (const wrapper of wrappers) {
				if (wrapper.containsPoint(mouse_vector)) {
					found.push(wrapper);
				}
			}
		}
		return found;
	}

}

export const wrappers = new Wrappers();
