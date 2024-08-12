import { Mouse_State, Cluster_Map, ElementType, Element_State } from '../common/Global_Imports';
import { Rotation_State, Expansion_State, Clusters_Geometry } from '../common/Global_Imports';
import Identifiable from '../data/Identifiable';

export default class UX_State {

	rotationState_byName: {[name: string]: Rotation_State} = {};
	elementState_byName: {[name: string]: Element_State} = {};
	mouse_state_byName: { [name: string]: Mouse_State } = {};
	clusters_geometry!: Clusters_Geometry;
	rotation_ring_state!: Expansion_State;
	paging_ring_state!: Rotation_State;
	active_thumb_cluster!: Cluster_Map;
	rebuild_count = 0;

	//////////////////////////////////////
	//									//
	//	preservation of state outside	//
	//		transient svelte components	//
	//									//
	//  this allows them to be deleted	//
	//		by their own event handling	//
	//									//
	//	used by: Button, Rings	//
	//		& Close_Button				//
	//									//
	//////////////////////////////////////

	constructor() {
		setTimeout(() => {
			this.paging_ring_state = new Rotation_State();
			this.rotation_ring_state = new Expansion_State();
		}, 1);
	}

	get new_clusters_geometry() { return this.clusters_geometry = new Clusters_Geometry(); }
	elementState_forName(name: string): Element_State { return this.elementState_byName[name]; }

	name_from(identifiable: Identifiable, type: ElementType, subtype: string): string {
		return `${type}-${subtype}-${identifiable.id}`;
	}

	get isAny_rotation_active(): boolean {
		return ux.isAny_paging_arc_active || ux.paging_ring_state.isActive || ux.rotation_ring_state.isActive
	}

	get isAny_paging_arc_active(): boolean {
		const states = Object.values(this.rotationState_byName);
		for (const state of states) {
			if (state.isActive) {
				return true;
			}
		}
		return false;
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
