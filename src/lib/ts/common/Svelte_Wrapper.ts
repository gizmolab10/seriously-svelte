import { Rect, Point, layout, wrappers, T_SvelteComponent } from './Global_Imports';
import { Handle_S_Mouse, Create_S_Mouse } from './Types';
import type { Integer } from './Types';

// Ancestry sometimes needs to access and or alter an associated svelte component

export default class Svelte_Wrapper {
    handle_s_mouse: Handle_S_Mouse;
    type: T_SvelteComponent;
    element: HTMLElement;
	hid: Integer;

    constructor(element: HTMLElement, handle_s_mouse: Handle_S_Mouse, hid: Integer, type: T_SvelteComponent, parentTypes: Array<T_SvelteComponent> = []) {
        this.handle_s_mouse = handle_s_mouse;
        this.element = element;
        this.type = type;
        this.hid = hid;
    	wrappers.wrapper_add(this);
    }

    get boundingRect(): Rect {
        const rect = Rect.boundingRectFor(this.element);
        const unscale_factor = 1 / layout.scale_factor;
        return rect?.multipliedBy(unscale_factor) ?? Rect.zero;
    }

    get distance_toGraphCenter(): Point { return this.boundingRect.center; }

    containsPoint(point: Point) { return this.boundingRect.contains(point); }

    handle_event(event: MouseEvent, Create_S_Mouse: Create_S_Mouse): boolean {
        const state = Create_S_Mouse(event, this.element);
        return this.handle_s_mouse(state);
    }

}
