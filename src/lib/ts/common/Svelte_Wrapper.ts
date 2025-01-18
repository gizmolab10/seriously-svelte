import { w, Rect, wrappers, S_Mouse, T_SvelteComponent } from './Global_Imports';
import { Handle_S_Mouse, Create_S_Mouse } from './Types';
import Identifiable from '../data/basis/Identifiable';
import type { Integer } from './Types';

// Ancestry sometimes needs to access and or alter an associated svelte component

export default class Svelte_Wrapper extends Identifiable {
    _parentTypes: Array<T_SvelteComponent> = [];  // ABANDON
    handle_mouse_state: Handle_S_Mouse;
    type: T_SvelteComponent;
    element: HTMLElement;

    constructor(element: HTMLElement, handle_mouse_state: Handle_S_Mouse, hid: Integer, type: T_SvelteComponent, parentTypes: Array<T_SvelteComponent> = []) {
		super();
        this.hid = hid;
        this.type = type;
        this.element = element;
        this.set_parentTypes(parentTypes);  // ABANDON
        this.handle_mouse_state = handle_mouse_state;
    	wrappers.wrapper_add(this);
    }

    get boundingRect(): Rect {
        const rect = Rect.boundingRectFor(this.element);
        return rect?.originMultipliedBy(1 / w.scale_factor) ?? Rect.zero;
    }

    handle_event(event: MouseEvent, create_mouse_state: Create_S_Mouse): boolean {
        const state = create_mouse_state(event, this.element);
        return this.handle_mouse_state(state);
    }

	//////////////////////////////////////
	//	 ABANDON remaining functions	//
	// WHY? negligible performance gain	//
	//////////////////////////////////////

    set_parentTypes(types: Array<T_SvelteComponent>) {
        this._parentTypes = types;
	}

    isHit(event: MouseEvent): boolean {
        const state = S_Mouse.hit(event);   // create a 'hit' mouse state
        return this.handle_mouse_state(state);
    }

    get parentTypes(): Array<T_SvelteComponent> {
        const types = this._parentTypes;
        if (!!types && types.length > 0) {
            return types;
        }
        return Svelte_Wrapper.parentTypes_for(this.type);
    }

    static parentTypes_for(type: string): Array<T_SvelteComponent> {
        switch (type) {
            case T_SvelteComponent.thumb:   return [T_SvelteComponent.paging];
            case T_SvelteComponent.widget:
            case T_SvelteComponent.app:     return [];
            case T_SvelteComponent.tools:
            case T_SvelteComponent.title:
            case T_SvelteComponent.rotate:  return [T_SvelteComponent.graph];
            case T_SvelteComponent.drag:
            case T_SvelteComponent.paging:
            case T_SvelteComponent.reveal:  return [T_SvelteComponent.rotate];
            case T_SvelteComponent.graph:
            case T_SvelteComponent.details:
            case T_SvelteComponent.banners: return [T_SvelteComponent.app];
        }
        return [T_SvelteComponent.banners];
    }

}
