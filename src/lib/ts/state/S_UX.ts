import { w_show_details, w_popupView_id, w_show_graph_ofType } from '../common/Stores';
import { c, k, colors, layout, Ancestry } from '../common/Global_Imports';
import { T_Graph, T_Control, T_Element } from '../common/Global_Imports';
import { S_Mouse, S_Widget, S_Element } from '../common/Global_Imports';
import Identifiable from '../runtime/Identifiable';
import type { Dictionary } from '../common/Types';
import { get } from 'svelte/store';

export default class S_UX {
	control_isVisible_forType: {[t_control: string]: boolean} = {};
	s_control_byType: { [t_control: string]: S_Element } = {};
	s_widget_byAncestryID: { [id: string]: S_Widget } = {};
	s_element_byName: { [name: string]: S_Element } = {};
	s_mouse_byName: { [name: string]: S_Mouse } = {};
	mouse_responder_number = 0;
	width = 0;

	t_controls = [	// in order of importance on mobile
		T_Control.details,
		T_Control.shrink,
		T_Control.grow,
		T_Control.help,
		T_Control.builds,
	];

	//////////////////////////////////////
	//									//
	//	state managed outside svelte	//
	//									//
	//  allows svelte components to be	//
	//	  deleted by their own event	//
	//	  handling						//
	//									//
	//	used by: Button, Close_Button,	//
	//	  Radial & Radial_ArcSlider		//
	//									//
	//////////////////////////////////////

	get inTreeMode(): boolean { return get(w_show_graph_ofType) == T_Graph.tree; }
	get inRadialMode(): boolean { return get(w_show_graph_ofType) == T_Graph.radial; }
	s_element_forName(name: string): S_Element { return this.s_element_byName[name]; }
	s_mouse_forName(name: string): S_Mouse { return this.assure_forKey_inDict(name, this.s_mouse_byName, () => S_Mouse.empty()); }
	name_from(identifiable: Identifiable, type: T_Element, subtype: string): string { return `${type}(${subtype}) (id '${identifiable.id}')`; }

	get next_mouse_responder_number(): number {
		this.mouse_responder_number += 1;
		return this.mouse_responder_number;
	}

	togglePopupID(id: T_Control) {
		const same = get(w_popupView_id) == id
		w_popupView_id.set(same ? null : id); 
	}

	s_element_for(identifiable: Identifiable | null, type: T_Element, subtype: string): S_Element {
		const realIdentifiable = identifiable ?? new Identifiable()
		const name = this.name_from(realIdentifiable, type, subtype);
		return this.assure_forKey_inDict(name, this.s_element_byName, () => new S_Element(realIdentifiable, type, subtype));
	}

	s_widget_forAncestry(ancestry: Ancestry): S_Widget {
		const id = ancestry.id;
		if (!id) {
			console.warn(`ancestry ${ancestry.title} has no id`);
		}
		return this.assure_forKey_inDict(id, this.s_widget_byAncestryID, () => new S_Widget(ancestry));
	}

	assure_forKey_inDict<T>(key: string, dict: Dictionary, closure: () => T): T {
		let result = dict[key];
		if (!result) {
			result = closure();
			if (!!result) {
				dict[key] = result;
			}
		}
		return result;
	}

	s_control_forType(t_control: T_Control): S_Element {
		let s_control = this.s_control_byType[t_control];
		if (!s_control) {
			const hover_color = t_control == T_Control.details ? 'white' : colors.default;
			s_control = this.s_element_for(new Identifiable(t_control), T_Element.control, t_control);
			s_control.ignore_hover = t_control == T_Control.details;
			s_control.isDisabled = T_Control.details == t_control;
			s_control.set_forHovering(hover_color, 'pointer');
			this.s_control_byType[t_control] = s_control;
		}
		return s_control;
	}

	handle_s_mouse_forControl_Type(s_mouse: S_Mouse, t_control: T_Control) {
		if (s_mouse.isHover) {
			const s_control = this.s_control_byType[t_control];
			if (!!s_control) {
				s_control.isOut = s_mouse.isOut;
			}
		} else if (s_mouse.isUp) {
			switch (t_control) {
				case T_Control.help:	c.showHelp(); break;
				case T_Control.details: w_show_details.set(!get(w_show_details)); break;
				case T_Control.grow:	this.width = layout.scaleBy(k.ratio.zoom_in) - 20; break;
				case T_Control.shrink:	this.width = layout.scaleBy(k.ratio.zoom_out) - 20; break;
				default:				this.togglePopupID(t_control); break;
			}
		}
	}

}

export const ux = new S_UX();
