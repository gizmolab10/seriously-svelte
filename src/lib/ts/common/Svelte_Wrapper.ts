import { Rect, Point, layout, wrappers, T_SvelteComponent } from './Global_Imports';
import { Handle_S_Mouse, Create_S_Mouse } from './Types';
import type { Integer } from './Types';

// Ancestry sometimes needs to access and or alter an associated svelte component

export default class Svelte_Wrapper {
	static readonly dummy_wrapper = new Svelte_Wrapper(null, null, null, T_SvelteComponent.none);
    handle_s_mouse: Handle_S_Mouse | null;
    element: HTMLElement | null;
    type: T_SvelteComponent;
	hid: Integer | null;

    constructor(element: HTMLElement | null, handle_s_mouse: Handle_S_Mouse | null, hid: Integer | null, type: T_SvelteComponent) {
        this.handle_s_mouse = handle_s_mouse;
        this.element = element;
        this.type = type;
        this.hid = hid;
    	wrappers.wrapper_add(this);
    }

    get description(): string { return `${this.type} for ${this.hid}`; }
    get distance_toGraphCenter(): Point { return this.boundingRect.center; }

    get boundingRect(): Rect {
        const rect = Rect.boundingRectFor(this.element);
        const unscale_factor = 1 / layout.scale_factor;
        return rect?.multipliedBy(unscale_factor) ?? Rect.zero;
    }

    containsPoint(point: Point) { return this.boundingRect.contains(point); }

    handle_event(event: MouseEvent, create_s_mouse: Create_S_Mouse): boolean {
        if (!!this.element && !!this.handle_s_mouse) {
            const state = create_s_mouse(event, this.element);
            return this.handle_s_mouse(state);
        }
        return false;
    }

}
