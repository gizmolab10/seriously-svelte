import { w, Rect, Point, wrappers, E_SvelteComponent } from './Global_Imports';
import { Handle_S_Mouse, Create_S_Mouse } from './Types';
import type { Integer } from './Types';

// Ancestry sometimes needs to access and or alter an associated svelte component

export default class Svelte_Wrapper {
	hid: Integer;
    handle_s_mouse: Handle_S_Mouse;
    type: E_SvelteComponent;
    element: HTMLElement;

    constructor(element: HTMLElement, handle_s_mouse: Handle_S_Mouse, hid: Integer, type: E_SvelteComponent, parentTypes: Array<E_SvelteComponent> = []) {
        this.hid = hid;
        this.type = type;
        this.element = element;
        this.handle_s_mouse = handle_s_mouse;
    	wrappers.wrapper_add(this);
    }

    get boundingRect(): Rect {
        const rect = Rect.boundingRectFor(this.element);
        const unscale_factor = 1 / w.scale_factor;
        return rect?.multipliedBy(unscale_factor) ?? Rect.zero;
    }

    containsPoint(point: Point) { return this.boundingRect.contains(point); }

    handle_event(event: MouseEvent, Create_S_Mouse: Create_S_Mouse): boolean {
        const state = Create_S_Mouse(event, this.element);
        return this.handle_s_mouse(state);
    }

}
