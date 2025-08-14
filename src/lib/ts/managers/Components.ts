import { Rect, T_Signal, S_Component, T_Component } from '../common/Global_Imports';
import type { Handle_S_Mouse, Integer } from '../common/Types';
import { w_mouse_location_scaled } from './Stores';
import { get } from 'svelte/store';

export class Components {
	private components_byType_andHID: { [type: string]: { [hid: Integer]: S_Component } } = {};
	componentsBy_t_signal_andPriority: { [type_andPriority: string]: S_Component } = {};
	componentsBy_t_signal_andHID: { [type_andHID: string]: S_Component } = {};

	// hit testing
	// signal management

	combined_type_andPriority_for(t_signal: T_Signal, priority: number): string {
		return `${t_signal}(${priority})`;
	}

	combined_type_andHID_from(component: S_Component | null): string | null {
		return component ? `${component.type}(${component.hid})` : null;
	}

	component_for(t_signal: T_Signal, priority: number, component: S_Component | null = null): S_Component | undefined {
		const type_andPriority = this.combined_type_andPriority_for(t_signal, priority);
		const type_andHID = this.combined_type_andHID_from(component);
		return (!!type_andHID ? this.componentsBy_t_signal_andHID[type_andHID] : null) ?? this.componentsBy_t_signal_andPriority[type_andPriority];
	}

	component_registerFor(t_signals: Array<T_Signal>, priority: number, component: S_Component) {
		for (const t_signal of t_signals) {
			const type_andPriority = this.combined_type_andPriority_for(t_signal, priority);
			this.componentsBy_t_signal_andPriority[type_andPriority] = component;
		}
	}

	components_byHID_forType(type: string): { [hid: Integer]: S_Component } {
		let components_byHID = this.components_byType_andHID[type];
		if (!components_byHID) {
			components_byHID = {};
			this.components_byType_andHID[type] = components_byHID;
		}
		return components_byHID;
	}

    component_createUnique(element: HTMLElement | null, handle_s_mouse: Handle_S_Mouse | null, hid: Integer, type: T_Component) {
        const component = this.component_forHID_andType_createUnique(hid, type);
        if (!!component) {
            component.element = element;
            component.handle_s_mouse = handle_s_mouse;
        }
        return component;
    }

	component_forHID_andType_createUnique(hid: Integer | null, type: T_Component): S_Component | null {
		const components_byHID = this.components_byHID_forType(type);
		let s_component: S_Component | null = null;
		if (!!hid) {
			s_component = components_byHID[hid];
			if (!s_component) {
				s_component = new S_Component(null, null, hid, type);
				if (!!s_component) {
					this.component_add(s_component);
				}
			}
		}
		return s_component;
	}

	component_add(s_component: S_Component) {
		const hid = s_component.hid;
		if (!!hid) {
			const array = this.components_byType_andHID;
			const dict = array[s_component.type] ?? {};
			const type = s_component.type;
			dict[hid] = s_component;
			array[type] = dict;
		}
	}
	
	components_ofType_atMouseLocation(type: T_Component): Array<S_Component> {
		const mouse_vector = get(w_mouse_location_scaled);
		const dict = this.components_byHID_forType(type);
		let found: Array<S_Component> = [];
		if (!!dict && !!mouse_vector) {
			const components = Object.values(dict);
			for (const component of components) {
				if (component.containsPoint(mouse_vector)) {
					found.push(component);
				}
			}
		}
		return found;
	}

	components_ofType_withinRect(type: T_Component, rect: Rect): Array<S_Component> {
		const dict = this.components_byHID_forType(type);
		let found: Array<S_Component> = [];
		if (!!dict) {
			const components = Object.values(dict);
			for (const component of components) {
				if (component.boundingRect.intersects(rect)) {
					found.push(component);
				}
			}
		}
		return found;
	}

}

export const components = new Components();
