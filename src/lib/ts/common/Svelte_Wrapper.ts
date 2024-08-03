import { Handle_Mouse_State, Create_Mouse_State } from './Global_Imports';
import { e, Rect, SvelteComponentType } from './Global_Imports';
import Identifiable from '../data/Identifiable';
import { h } from '../db/DBDispatch';

// Ancestry sometimes needs to access and or alter an associated svelte component

export default class Svelte_Wrapper extends Identifiable {
    _parentTypes: Array<SvelteComponentType> = [];
    handle_mouse_state: Handle_Mouse_State;
    type: SvelteComponentType;
    element: HTMLElement;
    idHashed: number;

    constructor(element: HTMLElement, handle_mouse_state: Handle_Mouse_State, idHashed: number, type: SvelteComponentType, parentTypes: Array<SvelteComponentType> = []) {
		super();
        this.type = type;
        this.element = element;
        this.idHashed = idHashed;
        this.set_parentTypes(parentTypes);
        this.handle_mouse_state = handle_mouse_state;
    	e.wrapper_add(this);
    }

    handle_event(event: MouseEvent, create_mouse_state: Create_Mouse_State): boolean {
        const state = create_mouse_state(event, this.element);
        return this.handle_mouse_state(state);
    }

    set_parentTypes(types: Array<SvelteComponentType>) {
        this._parentTypes = types;
	}

    isHit(event: MouseEvent): boolean {
        return false;
    }

    get boundingRect(): Rect { return Rect.boundingRectFor(this.element) ?? Rect.zero; }

    get parentTypes(): Array<SvelteComponentType> {
        if (!!this._parentTypes) {
            return this._parentTypes;
        }
        switch (this.type) {
            case SvelteComponentType.tools:
            case SvelteComponentType.rotation:  return [SvelteComponentType.graph];
            case SvelteComponentType.paging:
            case SvelteComponentType.reveal:    return [SvelteComponentType.rotation];
            case SvelteComponentType.thumb:     return [SvelteComponentType.paging];
            case SvelteComponentType.graph:
            case SvelteComponentType.details:
            case SvelteComponentType.banners:   return [SvelteComponentType.app];
        }
        return [SvelteComponentType.banners];
    }

}
