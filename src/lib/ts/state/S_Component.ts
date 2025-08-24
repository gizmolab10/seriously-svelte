import { k, Rect, Point, debug, layout, Ancestry, components } from '../common/Global_Imports';
import { Integer, Handle_S_Mouse, Create_S_Mouse } from '../common/Types';
import { T_Signal, T_Component } from '../common/Global_Imports';
import { SignalConnection_atPriority } from '../common/Types';
import { SignalConnection } from 'typed-signals';
import { u } from '../common/Utilities';

// formerly called Svelte Wrapper
// provide Ancestry access to an associated svelte component's main element (and vice versa)
// manage signals and for debugging styles and DOM issues

export default class S_Component {
    signal_handlers: SignalConnection_atPriority[] = [];
    handle_s_mouse: Handle_S_Mouse | null;
    ancestry: Ancestry | null = null;
	hid: Integer | null;
    type: T_Component;

    // hit test, logger, emitter, handler and destroyer

    constructor(ancestry: Ancestry | null, type: T_Component, handle_s_mouse: Handle_S_Mouse | null = null) {
        const suffix = 'handle_ ' + (type ?? '<--NO TYPE-->') + ' for: ' + (ancestry?.titles ?? '<--UNIDENTIFIED ANCESTRY-->');
        this.hid = ancestry?.hid ?? -1 as Integer;
        this.handle_s_mouse = handle_s_mouse;
        const prefix = 'S_Component has no';
        this.ancestry = ancestry;
        this.type = type;
        if (!ancestry && this.isDebug_enabled) {
            debug.log_components(prefix, 'ancestry:', suffix);
        }
    }

    get description(): string { return this.type; }
    get distance_toGraphCenter(): Point { return this.boundingRect.center; }
    containsPoint(point: Point) { return this.boundingRect.contains(point); }
    get element(): HTMLElement | null { return document.getElementById(this.id) }
    get id(): string { return `${this.type}-${this.ancestry?.titles ?? 'UNIDENTIFIED'}`; }

    get boundingRect(): Rect {
        const rect = Rect.boundingRectFor(this.element);
        const unscale_factor = 1 / layout.scale_factor;
        return rect?.multipliedBy(unscale_factor) ?? Rect.zero;
    }

    static readonly _____SIGNALS: unique symbol = Symbol('SIGNALS');

    handle_event(event: MouseEvent, create_s_mouse: Create_S_Mouse): boolean {
        if (!!this.element && !!this.handle_s_mouse) {
            const state = create_s_mouse(event, this.element);
            return this.handle_s_mouse(state);
        }
        return false;
    }

	log_signal(sending: boolean, value: any | null, t_signal: T_Signal, priority: number) {
		const resolved = u.resolve_signal_value(value);
		const first = sending ? '[s]]]]]>' : '[h]---->';
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

    static readonly _____DEBUGGING: unique symbol = Symbol('DEBUGGING');

    get isDebug_enabled(): boolean { return components.debug_isEnabledFor_t_component[this.type]; }

	log_style(prefix: string) {
        if (!this.isDebug_enabled) { return; }
        const information = this.style_information(prefix);
        if (!!information) {
            debug.log_components(information);
        }
	}

	log_parent_connection(prefix: string) {
        if (!this.isDebug_enabled) { return; }
		const element = this.element;
		if (!!element) {
			const array = [prefix, ' on ', this.ancestry?.titles];
			array.push(this.element_information('ELEMENT', element));
			debug.log_components(array.join(k.newLine));
		}
	}

	log_connection_state(prefix: string) {
        if (!this.isDebug_enabled) { return; }
		const element = this.element;
		if (!!element) {
			const indented = k.newLine + k.tab;
			const element_style = element?.getAttribute('style')?.replace(/; /g, indented);
			const array = [indented + prefix, 'connection state for:',
				indented + k.title.line,
				indented + this.type + ' for:', this.ancestry?.titles,
				indented + k.title.line,
				indented + 'ancestry.isGrabbed:', this.ancestry?.isGrabbed,
				indented + 'ancestry.isEditing:', this.ancestry?.isEditing,
				indented + 'ancestry.isFocus:', this.ancestry?.isFocus,
				indented + 'previousSibling:', element.previousSibling?.nodeName,
				indented + 'nextSibling:', element.nextSibling?.nodeName,
				indented + k.title.line
			];
			array.push(indented + element_style);
            array.push(indented + k.title.line);
            array.push(indented + this.style_information('style information'));
			array.push(this.element_information('ELEMENT', element));
			array.push(this.element_information('PARENT', element.parentElement));
			array.push(this.element_information('GRAND-PARENT', element.parentElement?.parentElement));
			debug.log_components(array.join(k.tab));
		}
	}

	private style_information(prefix: string): string {
		const element = this.element;
		if (!!element) {
			const indented = k.newLine + k.tab;
			const computed = window.getComputedStyle(element);
			return [prefix, ' on ', this.ancestry?.titles,
                indented + k.title.line,
				indented + 'cssText:', element.style.cssText,
				indented + 'style.backgroundColor:', element.style.backgroundColor,
				indented + 'computed.backgroundColor:', computed.backgroundColor,
				indented + 'computed.display:', computed.display,
				indented + 'computed.visibility:', computed.visibility,
				indented + 'isConnected:', element.isConnected,
				indented + 'getBoundingClientRect:', JSON.stringify(element.getBoundingClientRect()),
				indented + 'ownerDocument:', element.ownerDocument === document ? 'main document' :'different document',
				indented + (element.offsetParent === element.parentElement) ? 'positioning is normal' :'offset is not parent'
			].join(k.tab);
		}
        return 'no style information';
	}

	private element_information(prefix: string, element: HTMLElement | null | undefined): string {
		const indented = k.newLine + k.tab + prefix + k.space;
		const array = !element ? [] : [
			k.newLine + k.tab + k.title.line,
			indented + 'tagName:', element.tagName,
			indented + 'isConnected:', element.isConnected,
			indented + 'getBoundingClientRect:', JSON.stringify(element.getBoundingClientRect()),
			indented + 'ownerDocument.contains:', element.ownerDocument?.contains(element),
			indented + 'getRootNode:', element.getRootNode()?.nodeName,
			indented + 'compareDocumentPosition:', element.compareDocumentPosition(document.body) & 0x8 ? 'body contains ' + prefix : prefix + ' is orphaned',
			indented + 'closest body:', element.closest('body')?.tagName];
			return array.join(k.tab);
	}

}
