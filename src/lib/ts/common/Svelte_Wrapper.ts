import { w, Rect, Point, wrappers, T_SvelteComponent } from './Global_Imports';
import { Handle_Mouse_State, Create_Mouse_State } from './Types';
import type { Integer } from './Types';

// Ancestry sometimes needs to access and or alter an associated svelte component

export default class Svelte_Wrapper {
	hid: Integer;
    handle_mouse_state: Handle_Mouse_State;
    type: T_SvelteComponent;
    element: HTMLElement;

    constructor(element: HTMLElement, handle_mouse_state: Handle_Mouse_State, hid: Integer, type: T_SvelteComponent, parentTypes: Array<T_SvelteComponent> = []) {
        this.hid = hid;
        this.type = type;
        this.element = element;
        this.handle_mouse_state = handle_mouse_state;
    	wrappers.wrapper_add(this);
    }

    get boundingRect(): Rect {
        const rect = Rect.boundingRectFor(this.element);
        const unscale_factor = 1 / w.scale_factor;
        return rect?.multipliedBy(unscale_factor) ?? Rect.zero;
    }

    containsPoint(point: Point) { return this.boundingRect.contains(point); }

    handle_event(event: MouseEvent, create_mouse_state: Create_Mouse_State): boolean {
        const state = create_mouse_state(event, this.element);
        return this.handle_mouse_state(state);
    }

}
