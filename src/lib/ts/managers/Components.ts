import { Rect, Point, hover, layout, Ancestry, S_Component, S_Hoverable, T_Hoverable } from '../common/Global_Imports';
import type { Integer } from '../types/Types';
import { get } from 'svelte/store';

export class Components {
	private components_byType_andHID: { [type: string]: { [hid: Integer]: S_Component } } = {};
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
		const type = s_component.type;
		const hid = s_component.hid;
		if (!!hid && !!type) {
			const array = this.components_byType_andHID;
			const dict = array[type] ?? {};
			dict[hid] = s_component;
			array[type] = dict;
		}
	}

	static readonly _____CREATE: unique symbol;

	get dummy(): S_Component {
		if (!this._dummy) {
			this._dummy = new S_Component(null, T_Hoverable.none);
		}
		return this._dummy;
	}

	component_forAncestry_andType(ancestry: Ancestry | null, type: T_Hoverable): S_Component | null {
		const dict = this.components_byHID_forType(type);
		return dict[ancestry?.hid ?? -1 as Integer] ?? null;
	}

	component_forAncestry_andType_createUnique(ancestry: Ancestry | null, type: T_Hoverable): S_Component | null {
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

	static readonly _____HIT_TESTING: unique symbol;

	convert_hoverables_to_components(s_hoverables: Array<S_Hoverable>): Array<S_Component> {
		return s_hoverables
			.map(s_hoverable => s_hoverable as S_Component)
			.filter(s_c => !!s_c && s_c instanceof S_Component);
	}

	components_ofType_withinRect(type: T_Hoverable, rect: Rect): Array<S_Component> {
		const s_components = this.convert_hoverables_to_components(hover.s_hoverables_inRect(rect));
		if (s_components.length > 0) {
			return s_components
				.filter(s_c => s_c.type === type && s_c.intersects_rect(rect));
		}
		return [];
	}

	components_ofType_atMouseLocation(type: T_Hoverable): Array<S_Component> {
		const mouse_vector = get(layout.w_mouse_location_scaled);
		if (!!mouse_vector) {
			const s_components = this.convert_hoverables_to_components(hover.s_hoverables_atPoint(mouse_vector));
			if (s_components.length > 0) {
				return s_components
					.filter(s_c => s_c.type === type && s_c.contains_point(mouse_vector));
			}
		}
		return [];
	}

}

export const components = new Components();
