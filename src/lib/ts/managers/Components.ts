import { Rect, Ancestry, T_Signal, S_Component, T_Component } from '../common/Global_Imports';
import { w_mouse_location_scaled } from './Stores';
import type { Integer } from '../common/Types';
import { get } from 'svelte/store';

export class Components {
	private componentsFor_t_signal_byPriority: { [priority: number]: { [t_signal: string]: S_Component } } = {};
	private componentsBy_t_signal_andPriority: { [type_andPriority: string]: Array<S_Component> } = {};
	private components_byType_andHID: { [type: string]: { [hid: Integer]: S_Component } } = {};
	private componentsBy_t_component: { [t_component: string]: S_Component } = {};
	private _dummy!: S_Component;

	log_isEnabledFor_t_component = {
		breadcrumbs : false,
		branches	: true,
		radial		: false,
		reveal		: false,
		widget		: true,
		title		: false,
		drag		: false,
		line		: false,
		none		: false,
		tree		: true,
		app			: false,
	}

	// hit testing
	// debug logging
	// signal management
	// unique id assignment (of html elements) for DOM lookups

	static readonly _____CREATE: unique symbol;

	get dummy(): S_Component {
		if (!this._dummy) {
			this._dummy = new S_Component(null, T_Component.none);
		}
		return this._dummy;
	}

	component_forAncestry_andType_createUnique(ancestry: Ancestry | null, type: T_Component): S_Component | null {
		const dict = this.components_byHID_forType(type);
		let s_component: S_Component | null = dict[ancestry?.hid ?? -1 as Integer];
		if (!s_component) {
			s_component = new S_Component(ancestry, type);
			if (!!s_component) {
				this.component_register(s_component);
			}
		}
		return s_component;
	}

	static readonly _____REGISTER: unique symbol;

	private component_register(s_component: S_Component) {
		const type = s_component.type;
		const hid = s_component.hid;
		if (!!hid && !!type) {
			const array = this.components_byType_andHID;
			const dict = array[type] ?? {};
			dict[hid] = s_component;
			array[type] = dict;
		}
	}

	static readonly _____LOOKUP: unique symbol;

	private components_byHID_forType(type: string): { [hid: Integer]: S_Component } {
		let dict = this.components_byType_andHID[type];
		if (!dict) {
			dict = {};
			this.components_byType_andHID[type] = dict;
		}
		return dict;
	}
	
	static readonly _____HIT_TESTING: unique symbol;

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

	static readonly _____INDICES: unique symbol;

	private indexFor_t_signal_andPriority(t_signal: T_Signal, priority: number): string {
		return `${t_signal}(${priority})`;
	}

	private indexFor_componentType_andHID(component: S_Component | null): string | null {
		return component ? `${component.type}(${component.hid})` : null;
	}

}

export const components = new Components();
