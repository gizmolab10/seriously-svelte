import { Handle_S_Mouse, Create_S_Mouse, Signal_Priority, Integer } from '../common/Types';
import { Rect, Point, layout, debug, T_Signal, T_Component } from '../common/Global_Imports';
import { u } from '../common/Utilities';

// Ancestry sometimes needs to access and or alter an associated svelte component

export default class S_Component {
    signal_priorities: Signal_Priority[] = [];
    handle_s_mouse: Handle_S_Mouse | null;
    element: HTMLElement | null;
	hid: Integer | null;
    type: T_Component;

    constructor(element: HTMLElement | null, handle_s_mouse: Handle_S_Mouse | null, hid: Integer | null, type: T_Component) {
        this.handle_s_mouse = handle_s_mouse;
        this.element = element;
        this.type = type;
        this.hid = hid;
    }

    get description(): string { return this.type; }
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

	log_signal(sending: boolean, value: any | null, t_signal: T_Signal, priority: number) {
		const resolved = u.resolve_signal_value(value);
		const first = sending ? 'SENDING' : 'HANDLING';
		const second = sending ? 'to' : 'in';
		debug.log_signal(`${first} "${t_signal}" @ ${priority} ${second} ${this.description} with ${resolved}`);
	}

    disconnect_signal() {}

}
