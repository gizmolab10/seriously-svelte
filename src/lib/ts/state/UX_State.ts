import { Mouse_State, Cluster_Map, ElementType, Element_State } from '../common/Global_Imports';
import { Rotation_State, Expansion_State, Clusters_Geometry } from '../common/Global_Imports';
import Identifiable from '../data/Identifiable';

export default class UX_State {

	rotationState_byName: {[name: string]: Rotation_State} = {};
	elementState_byName: {[name: string]: Element_State} = {};
	mouse_state_byName: { [name: string]: Mouse_State } = {};
	clusters_geometry!: Clusters_Geometry;
	active_cluster_map!: Cluster_Map;
	rebuild_count = 0;

	//////////////////////////////////////
	//									//
	//	preservation of state outside	//
	//	  transient svelte components	//
	//									//
	//  this allows them to be deleted	//
	//	  by their own event handling	//
	//									//
	//	used by: Button, Close_Button,	//
	//	  Rings & Paging_Arc			//
	//									//
	//////////////////////////////////////

	reset_paging() { this.rotation_states.map(s => s.reset()); }
	get new_clusters_geometry() { return this.clusters_geometry = new Clusters_Geometry(); }
	elementState_forName(name: string): Element_State { return this.elementState_byName[name]; }
	get rotation_states(): Array<Rotation_State> { return Object.values(this.rotationState_byName); }
	get isAny_paging_arc_active(): boolean { return this.rotation_states.filter(s => s.isActive).length > 0; }
	get isAny_paging_arc_hovering(): boolean { return this.rotation_states.filter(s => s.isHovering).length > 0; }

	name_from(identifiable: Identifiable, type: ElementType, subtype: string): string {
		return `${type}-${subtype}-${identifiable.id}`;
	}

	rotationState_forName(name: string): Rotation_State {
		let rotation_state = this.rotationState_byName[name];
		if (!rotation_state) {
			rotation_state = new Rotation_State();
			this.rotationState_byName[name] = rotation_state;
		}
		return rotation_state;
	}

	mouse_state_forName(name: string): Mouse_State {
		let state = this.mouse_state_byName[name];
		if (!state) {
			state = Mouse_State.empty();
			this.mouse_state_byName[name] = state;
		}
		return state;
	}

	elementState_for(identifiable: Identifiable | null, type: ElementType, subtype: string): Element_State {
		const realIdentifiable = identifiable ?? new Identifiable()
		const name = this.name_from(realIdentifiable, type, subtype);
		let element_state = this.elementState_forName(name);
		if (!element_state) {
			element_state = new Element_State(realIdentifiable, type, subtype);
			this.elementState_byName[name] = element_state;
		}
		return element_state;
	}

}

export const ux = new UX_State();
