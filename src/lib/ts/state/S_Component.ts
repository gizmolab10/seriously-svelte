import { Rect, Point, layout, debug, T_Signal, T_Component } from '../common/Global_Imports';
import { Integer, Handle_S_Mouse, Create_S_Mouse } from '../common/Types';
import { SignalConnection_atPriority } from '../common/Types';
import { SignalConnection } from 'typed-signals';
import { u } from '../common/Utilities';

// Ancestry sometimes needs to access and or alter an associated svelte component

export default class S_Component {
    signal_handlers: SignalConnection_atPriority[] = [];
    handle_s_mouse: Handle_S_Mouse | null;
    element: HTMLElement | null;
	hid: Integer | null;
    type: T_Component;

    // hit test, logger, emitter, handler and destroyer

    constructor(element: HTMLElement | null, handle_s_mouse: Handle_S_Mouse | null, hid: Integer | null, type: T_Component) {
        this.handle_s_mouse = handle_s_mouse;
        this.element = element;
        this.type = type;
        this.hid = hid;
    }

    get description(): string { return this.type; }
    get distance_toGraphCenter(): Point { return this.boundingRect.center; }
    containsPoint(point: Point) { return this.boundingRect.contains(point); }

    get boundingRect(): Rect {
        const rect = Rect.boundingRectFor(this.element);
        const unscale_factor = 1 / layout.scale_factor;
        return rect?.multipliedBy(unscale_factor) ?? Rect.zero;
    }

    handle_event(event: MouseEvent, create_s_mouse: Create_S_Mouse): boolean {
        if (!!this.element && !!this.handle_s_mouse) {
            const state = create_s_mouse(event, this.element);
            return this.handle_s_mouse(state);
        }
        return false;
    }

	log_signal(sending: boolean, value: any | null, t_signal: T_Signal, priority: number) {
		const resolved = u.resolve_signal_value(value);
		const first = sending ? ']]]]]>' : '----->';
		const second = sending ? 'from' : 'in';
		debug.log_signal(`${first} "${t_signal}" @ ${priority} ${second} ${this.description} with ${resolved}`);
	}

    assure_hasConnection_atPriority(priority: number, connection: SignalConnection) {
        for (const handler of this.signal_handlers) {
            if (handler.priority == priority) {
                handler.connection = connection;
            }
        }
    }

    assureHas_t_signals_atPriority(t_signals: Array<T_Signal>, priority: number) {
        for (const handler of this.signal_handlers) {
            if (!t_signals.includes(handler.t_signal) || handler.priority != priority) {
                const keyed_handler: SignalConnection_atPriority = { t_signal: handler.t_signal, priority: handler.priority, connection: null };
                this.signal_handlers.push(keyed_handler);
            }
        }
    }

    disconnect() {
        for (const handler of this.signal_handlers) {
            handler.connection?.disconnect();
            handler.connection = null;
        }
    }

}
