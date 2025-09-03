import { T_Graph, T_Filter, T_Control, T_Element, T_Kinship } from '../common/Global_Imports';
import { p, grabs, colors, layout, Ancestry } from '../common/Global_Imports';
import { S_Mouse, S_Widget, S_Element } from '../common/Global_Imports';
import { w_show_tree_ofType, w_depth_limit } from '../managers/Stores';
import { w_show_related, w_ancestry_focus } from '../managers/Stores';
import { w_t_filter, w_show_graph_ofType } from '../managers/Stores';
import Identifiable from '../runtime/Identifiable';
import type { Dictionary } from '../common/Types';
import { get } from 'svelte/store';

export default class S_UX {
	control_isVisible_forType: {[t_control: string]: boolean} = {};
	s_control_byType: { [t_control: string]: S_Element } = {};
	s_widget_byAncestryID: { [id: string]: S_Widget } = {};
	s_element_byName: { [name: string]: S_Element } = {};
	s_mouse_byName: { [name: string]: S_Mouse } = {};
	parents_focus_ancestry!: Ancestry;
	attached_branches: string[] = [];
	mouse_responder_number = 0;
	focus_ancestry!: Ancestry;

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
			s_control.set_forHovering(hover_color, 'pointer');
			this.s_control_byType[t_control] = s_control;
		}
		return s_control;
	}

	static readonly _____GRAPHS: unique symbol;

	increase_depth_limit_by(increment: number) {
		w_depth_limit.update(a => a + increment);
		layout.grand_layout();
	}
	
	handle_choiceOf_t_graph(name: string, types: string[]) {
		switch (name) {
			case 'graph': w_show_graph_ofType.set(types[0] as unknown as T_Graph); break;
			case 'filter': w_t_filter.set(types[0] as unknown as T_Filter); break;
			case 'tree': this.set_tree_types(types as Array<T_Kinship>); break;
		}
	}

	toggle_graph_type() {
		switch (get(w_show_graph_ofType)) {
			case T_Graph.tree:   w_show_graph_ofType.set(T_Graph.radial); break;
			case T_Graph.radial: w_show_graph_ofType.set(T_Graph.tree);   break;
		}
		layout.grand_sweep();
	}

	branch_isAlready_attached(ancestry: Ancestry, clear: boolean = false): boolean {
		if (clear) {
			this.attached_branches = [];	// null clears the array
		}
		const visited = this.attached_branches.includes(ancestry.id);
		if (!visited) {
			this.attached_branches.push(ancestry.id);
		}
		return visited;
	}

	set_tree_types(t_trees: Array<T_Kinship>) {
		if (t_trees.length == 0) {
			t_trees = [T_Kinship.children];
		}
		w_show_tree_ofType.set(t_trees);
		let focus_ancestry = get(w_ancestry_focus);
		if (p.branches_areChildren) {
			this.parents_focus_ancestry = focus_ancestry;
			focus_ancestry = this.focus_ancestry;
		} else {
			this.focus_ancestry = focus_ancestry;
			focus_ancestry = this.parents_focus_ancestry ?? grabs.ancestry;
		}
		w_show_related.set(t_trees.includes(T_Kinship.related));
		focus_ancestry?.becomeFocus();
		p.restore_expanded();
		layout.grand_build();
	}

}

export const ux = new S_UX();
