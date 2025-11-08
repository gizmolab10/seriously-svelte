import { k, Rect, Point, debug, layout, signals, elements, Ancestry } from '../common/Global_Imports';
import { Integer, Handle_S_Mouse, Create_S_Mouse } from '../types/Types';
import { S_Element, T_Signal, T_Component } from '../common/Global_Imports';
import { SignalConnection_atPriority } from '../types/Types';
import Identifiable from '../runtime/Identifiable';
import { SignalConnection } from 'typed-signals';
import { u } from '../utilities/Utilities';
import { get } from 'svelte/store';

// formerly called Svelte Wrapper
// (?) style construction (by type and hid)
// manage signals and for debugging styles and DOM issues
// unique id assignment (of html elements) for DOM lookups
// provide Ancestry access to an associated svelte component's main element (and vice versa)

export default class S_Component {
    signal_handlers: SignalConnection_atPriority[] = [];
    handle_s_mouse: Handle_S_Mouse | null = null;
    s_element: S_Element | null = null;
    ancestry: Ancestry | null = null;
	hid: Integer | null = null;
    t_component: T_Component;

    // hit test, logger, emitter, handler and destroyer

    constructor(ancestry: Ancestry | null, t_component: T_Component, handle_s_mouse: Handle_S_Mouse | null = null) {
        const suffix = 'handle_ ' + (t_component ?? '<--NO TYPE-->') + ' for: ' + (ancestry?.titles ?? '<--UNIDENTIFIED ANCESTRY-->');
        this.hid = ancestry?.hid ?? -1 as Integer;
        this.handle_s_mouse = handle_s_mouse;
        const prefix = 'S_Component has no';
        this.t_component = t_component;
        this.ancestry = ancestry;
        this.s_element = elements.s_element_forComponent(this);
        if (!ancestry && this.isComponentLog_enabled) {
            debug.log_component(prefix, 'ancestry', suffix);
        }
    }

    get description(): string { return this.t_component; }
    get distance_toGraphCenter(): Point { return this.boundingRect.center; }
    containsPoint(point: Point) { return this.boundingRect.contains(point); }
    get element(): HTMLElement | null { return document.getElementById(this.id) }
    get id(): string { return `${this.t_component}-${this.ancestry?.kind ?? 'no-predicate'}-${this.ancestry?.titles ?? Identifiable.newID()}`; }

    get boundingRect(): Rect {
        const scale_factor = get(layout.w_scale_factor);
        const rect = Rect.boundingRectFor(this.element);
        return rect?.dividedEquallyBy(scale_factor) ?? Rect.zero;
    }

    static readonly _____SIGNALS: unique symbol;

    handle_event(event: MouseEvent, create_s_mouse: Create_S_Mouse): boolean {
        if (!!this.element && !!this.handle_s_mouse) {
            const state = create_s_mouse(event, this.element);
            return this.handle_s_mouse(state);
        }
        return false;
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

    static readonly _____DEBUG_LOGGING: unique symbol;

    get isComponentLog_enabled(): boolean {
        const log_isEnabledFor_t_component = {
            breadcrumbs : false,
            branches	: false,
            radial		: false,
            reveal		: false,
            widget		: false,
            title		: false,
            drag		: false,
            line		: false,
            none		: false,
            tree		: false,
            app			: false,
        }
        const t_component = this.t_component as keyof typeof log_isEnabledFor_t_component;
        return log_isEnabledFor_t_component[t_component] ?? false;
    }

	debug_log_style(prefix: string) {
        if (!this.isComponentLog_enabled) { return; }
        const information = this.style_debug_info(prefix);
        if (!!information) {
            debug.log_component(information);
        }
	}

	debug_log_signal(sending: boolean, value: any | null, t_signal: T_Signal, priority: number) {
        if (signals.log_isEnabledFor_t_signal[t_signal] && signals.log_isEnabled_forSending(sending) && this.isComponentLog_enabled) {
            const resolved = u.resolve_signal_value(value);
            const first = sending ? '[s]---->' : '---->[h]';
			const second = sending ? 'from' : 'in';
			debug.log_signal(`${first} "${t_signal}" @ ${priority} ${second} ${this.description} with ${resolved}`);
		}
	}

	debug_log_connection_state(prefix: string) {
        if (!this.isComponentLog_enabled) { return; }
		const element = this.element;
		if (!!element) {
			const indented = k.newLine + k.tab;
            const type = this.t_component.toUpperCase();
			const array = [type, prefix, 'connection state', `(at ${new Date().toLocaleString()})`,
				indented + k.title.line,
				indented + this.style_debug_info('ancestry'),
				indented + k.title.line,
				indented + 'ancestry.isGrabbed', this.ancestry?.isGrabbed,
				indented + 'ancestry.isEditing', this.ancestry?.isEditing,
				indented + 'ancestry.isFocus', this.ancestry?.isFocus,
				indented + 'previousSibling', element.previousSibling?.nodeName,
				indented + 'nextSibling', element.nextSibling?.nodeName,
			];
			array.push(this.element_debug_info('ELEMENT', element));
			// array.push(this.element_debug_info('PARENT', element.parentElement));
			// array.push(this.element_debug_info('GRAND-PARENT', element.parentElement?.parentElement));
			debug.log_component(array.join(k.tab));
		}
	}

    static readonly _____INTERNALS: unique symbol;
    
    private get element_style(): string {
        const element = this.element;
        if (!!element) {
            const indented = k.newLine + k.tab;
            const style = element.getAttribute('style');
            if (!!style) {
                return style.replace(/; /g, indented).replace(/ :/g, ':').replace(/: /g, '\t');
            }
        }
        return 'no style information';
    }

	private style_debug_info(prefix: string): string {
		const element = this.element;
		if (!!element) {
			const indented = k.newLine + k.tab;
			const computed = window.getComputedStyle(element);
			return [prefix, this.ancestry?.titles,
                indented + k.title.line,
                indented + this.element_style,
				indented + k.title.line,
				indented + 'isConnected', element.isConnected,
				indented + 'computed.backgroundColor', computed.backgroundColor,
				indented + 'computed.display', computed.display,
				indented + 'computed.visibility', computed.visibility,
				indented + 'ownerDocument', element.ownerDocument === document ? 'main document' :'different document',
				indented + (element.offsetParent === element.parentElement) ? 'positioning is normal' :'offset is not parent'
			].join(k.tab);
		}
        return 'no style information';
	}

	private element_debug_info(prefix: string, element: HTMLElement | null | undefined): string {
		const indented = k.newLine + k.tab + prefix + k.space;
		const array = !element ? [] : [
			k.newLine + k.tab + k.title.line,
			indented + 'tagName', element.tagName,
			indented + 'isConnected', element.isConnected,
			indented + 'getBoundingClientRect', JSON.stringify(element.getBoundingClientRect()),
			indented + 'ownerDocument.contains', element.ownerDocument?.contains(element),
			indented + 'getRootNode', element.getRootNode()?.nodeName,
			indented + 'compareDocumentPosition', element.compareDocumentPosition(document.body) & 0x8 ? 'body contains ' + prefix : prefix + ' is orphaned',
			indented + 'closest body', element.closest('body')?.tagName];
			return array.join(k.tab);
	}

}
