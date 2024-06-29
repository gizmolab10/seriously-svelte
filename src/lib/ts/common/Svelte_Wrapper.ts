import { Handle_Mouse_State, Create_Mouse_State } from './Global_Imports';
import { Rect, SvelteComponentType } from './Global_Imports';
import Identifiable from '../data/Identifiable';
import { h } from '../db/DBDispatch';

// Ancestry sometimes needs to access and or alter an associated svelte component

export default class Svelte_Wrapper extends Identifiable {
    mouse_closure: Handle_Mouse_State;
    type: SvelteComponentType;
    element: HTMLElement;
    idHashed: number;

    constructor(element: HTMLElement, mouse_closure: Handle_Mouse_State, idHashed: number, type: SvelteComponentType) {
		super();
        this.type = type;
        this.element = element;
        this.idHashed = idHashed;
        this.mouse_closure = mouse_closure;
    	h.wrapper_add(this);
    }

    get boundingRect(): Rect { return Rect.boundingRectFor(this.element) ?? Rect.zero; }

    handle_event_closure(event: MouseEvent, event_closure: Create_Mouse_State): boolean {
        return this.mouse_closure(event_closure(event, this.element));
    }

}
