import { Rect, T_Signal, S_Component, T_Component } from '../common/Global_Imports';
import type { Handle_S_Mouse, Integer } from '../common/Types';
import { w_mouse_location_scaled } from './Stores';
import { get } from 'svelte/store';

export class Components {
	private componentsFor_t_signal_byPriority: { [priority: number]: { [t_signal: string]: S_Component } } = {};
	private componentsBy_t_signal_andPriority: { [type_andPriority: string]: Array<S_Component> } = {};
	private components_byType_andHID: { [type: string]: { [hid: Integer]: S_Component } } = {};
	private componentsBy_t_component: { [t_component: string]: S_Component } = {};

	// hit testing
	// signal management

	static readonly _____REGISTER: unique symbol;

	component_registerFor_t_component(t_component: T_Component, s_component: S_Component) {
		if (!this.componentsBy_t_component[t_component]) {
			this.componentsBy_t_component[t_component] = s_component;
		}
	}

	component_registerFor_t_signals_andPriority(t_signals: Array<T_Signal>, priority: number, component: S_Component) {
		for (const t_signal of t_signals) {
			const type_andPriority = this.indexFor_t_signal_andPriority(t_signal, priority);
			let components = this.componentsBy_t_signal_andPriority[type_andPriority] ?? [];
			if (!components.includes(component)) {
				components.push(component);
				this.componentsBy_t_signal_andPriority[type_andPriority] = components;
			}
		}
	}

	component_register(s_component: S_Component) {
		const hid = s_component.hid;
		if (!!hid) {
			const array = this.components_byType_andHID;
			const components_byHID = array[s_component.type] ?? {};
			const type = s_component.type;
			components_byHID[hid] = s_component;
			array[type] = components_byHID;
		}
	}

	static readonly _____CREATE: unique symbol;

    component_createUnique(element: HTMLElement | null, handle_s_mouse: Handle_S_Mouse | null, hid: Integer, type: T_Component) {
        const component = this.component_forHID_andType_createUnique(hid, type);
        if (!!component) {
            component.element = element;
            component.handle_s_mouse = handle_s_mouse;
        }
        return component;
    }

	component_forHID_andType_createUnique(hid: Integer | null, type: T_Component): S_Component | null {
		let s_component: S_Component | null = null;
		if (!!hid) {
			const components_byHID = this.components_byHID_forType(type);
			s_component = components_byHID[hid];
			if (!s_component) {
				s_component = new S_Component(null, null, hid, type);
				if (!!s_component) {
					this.component_register(s_component);
				}
			}
		}
		return s_component;
	}

	static readonly _____LOOKUP: unique symbol;

	componentsFor_t_signal_andPriority(t_signal: T_Signal, priority: number): Array<S_Component> {
		const type_andPriority = this.indexFor_t_signal_andPriority(t_signal, priority);
		return this.componentsBy_t_signal_andPriority[type_andPriority] ?? [];
	}

	components_byHID_forType(type: string): { [hid: Integer]: S_Component } {
		let components_byHID = this.components_byType_andHID[type];
		if (!components_byHID) {
			components_byHID = {};
			this.components_byType_andHID[type] = components_byHID;
		}
		return components_byHID;
	}

	componentFor_t_signals_andPriority_createUnique(t_signals: Array<T_Signal>, priority: number): S_Component {
		const componentsBy_t_signal = this.componentsFor_t_signal_byPriority[priority] ?? {};
		let s_component: S_Component | null = null;
		for (const t_signal of t_signals) {
			if (!componentsBy_t_signal[t_signal]) {
				if (!s_component) {
					s_component = new S_Component(null, null, null, T_Component.none);
					componentsBy_t_signal[t_signal] = s_component;
				}
			}
		}
		s_component!.assureHas_t_signals_atPriority(t_signals, priority);
		return s_component!;
	}
	
	components_ofType_atMouseLocation(type: T_Component): Array<S_Component> {
		const mouse_vector = get(w_mouse_location_scaled);
		const components_byHID = this.components_byHID_forType(type);
		let found: Array<S_Component> = [];
		if (!!components_byHID && !!mouse_vector) {
			const components = Object.values(components_byHID);
			for (const component of components) {
				if (component.containsPoint(mouse_vector)) {
					found.push(component);
				}
			}
		}
		return found;
	}

	components_ofType_withinRect(type: T_Component, rect: Rect): Array<S_Component> {
		const components_byHID = this.components_byHID_forType(type);
		let found: Array<S_Component> = [];
		if (!!components_byHID) {
			const components = Object.values(components_byHID);
			for (const component of components) {
				if (component.boundingRect.intersects(rect)) {
					found.push(component);
				}
			}
		}
		return found;
	}

	static readonly _____INDICES: unique symbol;

	indexFor_t_signal_andPriority(t_signal: T_Signal, priority: number): string {
		return `${t_signal}(${priority})`;
	}

	indexFor_componentType_andHID(component: S_Component | null): string | null {
		return component ? `${component.type}(${component.hid})` : null;
	}

}

export const components = new Components();
