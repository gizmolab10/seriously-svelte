import { Rect, layout, Ancestry, S_Component, T_Component } from '../common/Global_Imports';
import type { Integer } from '../types/Types';
import { get } from 'svelte/store';
import RBush from 'rbush';

type S_Component_RBBox = {
	component: S_Component;
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

export class Components {
	private components_byType_andHID: { [type: string]: { [hid: Integer]: S_Component } } = {};
	private rbush = new RBush<S_Component_RBBox>();  // single tree for all types
	private _dummy!: S_Component;

	//////////////////////////////////////////////////////////////////
	//																//
	//				  state managed outside svelte					//
	//																//
	// debug logging												//
	// signal management											//
	// hit testing (for radial)										//
	// (?) style construction (by type and hid)						//
	// (?) unique id assignment (of html elements) for DOM lookups	//
	//																//
	//////////////////////////////////////////////////////////////////

	static readonly _____REGISTER: unique symbol;

	private component_register(s_component: S_Component) {
		const type = s_component.t_component;
		const hid = s_component.hid;
		if (!!hid && !!type) {
			const array = this.components_byType_andHID;
			const dict = array[type] ?? {};
			dict[hid] = s_component;
			array[type] = dict;
			this.index_s_component(s_component);
		}
	}

	static readonly _____CREATE: unique symbol;

	get dummy(): S_Component {
		if (!this._dummy) {
			this._dummy = new S_Component(null, T_Component.none);
		}
		return this._dummy;
	}

	component_forAncestry_andType(ancestry: Ancestry | null, type: T_Component): S_Component | null {
		const dict = this.components_byHID_forType(type);
		return dict[ancestry?.hid ?? -1 as Integer] ?? null;
	}

	component_forAncestry_andType_createUnique(ancestry: Ancestry | null, type: T_Component): S_Component | null {
		let s_component: S_Component | null = this.component_forAncestry_andType(ancestry, type);
		if (!s_component) {
			s_component = new S_Component(ancestry, type);
			if (!!s_component) {
				this.component_register(s_component);
			}
		}
		return s_component;
	}

	private components_byHID_forType(type: string): { [hid: Integer]: S_Component } {
		let dict = this.components_byType_andHID[type];
		if (!dict) {
			dict = {};
			this.components_byType_andHID[type] = dict;
		}
		return dict;
	}

	static readonly _____RBUSH: unique symbol;

	index_s_component(s_component: S_Component) {
		const rect = s_component.boundingRect;
		if (!rect.isZero) {
			this.rbush.insert({
				minX: rect.x,
				minY: rect.y,
				maxX: rect.right,
				maxY: rect.bottom,
				component: s_component
			});
		}
	}

	update_s_component(s_component: S_Component) {
		this.remove_s_component(s_component);
		this.index_s_component(s_component);
	}

	remove_s_component(s_component: S_Component) {
		const rect = s_component.boundingRect;
		if (!rect.isZero) {
			this.rbush.remove({
				minX: rect.x,
				minY: rect.y,
				maxX: rect.right,
				maxY: rect.bottom,
				component: s_component
			}, (a, b) => a.component === b.component);
		}
	}

	static readonly _____HIT_TESTING: unique symbol;

	components_ofType_atMouseLocation(type: T_Component): Array<S_Component> {
		const mouse_vector = get(layout.w_mouse_location_scaled);
		if (!mouse_vector) return [];
		
		// Use rbush for spatial query
		const results = this.rbush.search({
			minX: mouse_vector.x,
			minY: mouse_vector.y,
			maxX: mouse_vector.x,
			maxY: mouse_vector.y
		});
		
		// Filter by type and verify containment
		return results
			.map(item => item.component)
			.filter(component => component.t_component === type && component.containsPoint(mouse_vector));
	}

	components_ofType_withinRect(type: T_Component, rect: Rect): Array<S_Component> {
		// Use rbush for spatial query
		const results = this.rbush.search({
			minX: rect.x,
			minY: rect.y,
			maxX: rect.right,
			maxY: rect.bottom
		});
		
		// Filter by type and verify intersection
		return results
			.map(item => item.component)
			.filter(component => component.t_component === type &&component.boundingRect.intersects(rect));
	}

	xcomponents_ofType_atMouseLocation(type: T_Component): Array<S_Component> {
		const mouse_vector = get(layout.w_mouse_location_scaled);
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

	xcomponents_ofType_withinRect(type: T_Component, rect: Rect): Array<S_Component> {
		const dict = this.components_byHID_forType(type);
		let found: Array<S_Component> = [];
		if (!!dict) {
			const components_array = Object.values(dict);
			for (const component of components_array) {
				if (component.boundingRect.intersects(rect)) {
					found.push(component);
				}
			}
		}
		return found;
	}

}

export const components = new Components();
