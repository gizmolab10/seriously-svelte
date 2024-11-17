import { w, Rect, wrappers, Mouse_State, SvelteComponentType } from './Global_Imports';
import { Handle_Mouse_State, Create_Mouse_State } from './Global_Imports';
import Identifiable from '../basis/Identifiable';

// Ancestry sometimes needs to access and or alter an associated svelte component

export default class Svelte_Wrapper extends Identifiable {
    _parentTypes: Array<SvelteComponentType> = [];  // ABANDON
    handle_mouse_state: Handle_Mouse_State;
    type: SvelteComponentType;
    element: HTMLElement;

    constructor(element: HTMLElement, handle_mouse_state: Handle_Mouse_State, idHashed: number, type: SvelteComponentType, parentTypes: Array<SvelteComponentType> = []) {
		super();
        this.type = type;
        this.element = element;
        this.idHashed = idHashed;
        this.set_parentTypes(parentTypes);  // ABANDON
        this.handle_mouse_state = handle_mouse_state;
    	wrappers.wrapper_add(this);
    }

    get boundingRect(): Rect {
        const rect = Rect.boundingRectFor(this.element);
        return rect?.originMultipliedBy(1 / w.scale_factor) ?? Rect.zero;
    }

    handle_event(event: MouseEvent, create_mouse_state: Create_Mouse_State): boolean {
        const state = create_mouse_state(event, this.element);
        return this.handle_mouse_state(state);
    }

	//////////////////////////////////////
	//	 ABANDON remaining functions	//
	// WHY? negligible performance gain	//
	//////////////////////////////////////

    set_parentTypes(types: Array<SvelteComponentType>) {
        this._parentTypes = types;
	}

    isHit(event: MouseEvent): boolean {
        const state = Mouse_State.hit(event);   // create a 'hit' mouse state
        return this.handle_mouse_state(state);
    }

    get parentTypes(): Array<SvelteComponentType> {
        const types = this._parentTypes;
        if (!!types && types.length > 0) {
            return types;
        }
        return Svelte_Wrapper.parentTypes_for(this.type);
    }

    static parentTypes_for(type: string): Array<SvelteComponentType> {
        switch (type) {
            case SvelteComponentType.thumb:   return [SvelteComponentType.paging];
            case SvelteComponentType.widget:
            case SvelteComponentType.app:     return [];
            case SvelteComponentType.tools:
            case SvelteComponentType.title:
            case SvelteComponentType.rotate:  return [SvelteComponentType.graph];
            case SvelteComponentType.drag:
            case SvelteComponentType.paging:
            case SvelteComponentType.reveal:  return [SvelteComponentType.rotate];
            case SvelteComponentType.graph:
            case SvelteComponentType.details:
            case SvelteComponentType.banners: return [SvelteComponentType.app];
        }
        return [SvelteComponentType.banners];
    }

}
