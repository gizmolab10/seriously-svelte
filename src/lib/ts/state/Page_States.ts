import { k, get, Thing, Predicate, Ancestry, Cluster_Map, persistLocal } from '../common/Global_Imports';
import { s_paging_state, s_rotation_ring_radius } from './Reactive_State';
import { h } from '../db/DBDispatch';

export class Paging_State {

	// a page is a subset of a too-long list of things
	// shown == length of subset
	// index == first of subset

	points_out = false;
	thing_id = k.empty;
	kind = k.empty;
	index = 0;
	shown = 0;
	total = 0;

	constructor(index: number = 0, shown: number = 0, total: number = 0) {
		this.index = index.force_between(0, total - shown);
		this.shown = shown;
		this.total = total;
	}

	static create_paging_state_fromDescription(description: string): Paging_State | null {
		let strings = description.split(k.generic_separator);
		const [out, kind, id, ...remaining] = strings;
		if (remaining.length > 2) {
			const v: Array<number> = remaining.map(r => Number(r));
			const paging_state = new Paging_State(v[0], v[1], v[2]);
			paging_state.points_out = out == 'true';
			paging_state.thing_id = id;
			paging_state.kind = kind;
			return paging_state;
		}
		return null;
	}

	static get empty(): Paging_State { return new Paging_State(); }
	get stateIndex(): number { return this.predicate?.stateIndex ?? -1; }
	get predicate(): Predicate | null { return h.predicate_forKind(this.kind) ?? null }
	get sub_key(): string { return `${this.thing_id}${k.generic_separator}${this.kind}${k.generic_separator}${this.points_out}`; }

	get description(): string {
		const strings = [
			`${this.points_out}`,
			`${this.kind}`,
			`${this.thing_id}`,
			`${this.index}`,
			`${this.shown}`,
			`${this.total}`];
		return strings.join(k.generic_separator);
	}

	set_paging_index_for(index: number | null, map: Cluster_Map): boolean {
		if (!!index && this.index != index) {
			this.total = map.total;
			this.shown = map.shown;
			this.index = index;
			s_paging_state.set(this);
			return true;
		}
		return false;
	}

	onePaging_from(ancestries: Array<Ancestry>): Array<Ancestry> {
		const canShow = Math.round(get(s_rotation_ring_radius) * 2 / k.row_height) - 5;
		const index = Math.round(this.index);
		this.total = ancestries.length;
		this.shown = Math.min(canShow, this.total);
		const max = index + this.shown;
		if (max <= this.total) {
			return ancestries.slice(index, max);
		}
		return ancestries;
	}

}

export class Page_States {
	outward_paging_states: Array<Paging_State> = [];
	inward_paging_states: Array<Paging_State> = [];
	thing_id = k.empty;

	// two arrays of Paging_State (defined above)
	// 1) outward: (to) children and relateds (more kinds later?)
	// 2) inward: (from) parents
	// each array has one index for each predicate kind
	// 
	// page == a subset of a too-long list
	// index == first of subset

	constructor(thing_id: string = k.empty, paging_states: Array<Paging_State> = []) {
		this.thing_id = thing_id;
		for (const paging_state of paging_states) {
			if (!!paging_state) {
				this.paging_states_for(paging_state.points_out)[paging_state.stateIndex] = paging_state;
			}
		}
	}

	static restore_page_states_from(descriptions: Array<string>) {
		let thing!: Thing;
		let paging_states: Array<Paging_State> = [];
		for (const description of descriptions) {
			const paging_state = Paging_State.create_paging_state_fromDescription(description);
			const thing_id = paging_state?.thing_id;
			if (!!paging_state && !!thing_id) {
				const next_thing = h.thing_forHID(thing_id.hash());
				if (!next_thing) {													// if no thing => delete all paging states
					persistLocal.delete_paging_state_for(paging_state.sub_key);
				} else {															// accumulate paging states
					paging_states[paging_state.stateIndex] = paging_state;			// using index (not push)
					if (!thing) {
						thing = next_thing;
					} else if (thing.id != thing_id) {								// each time a new thing's state is encountered
																					// assume for each thing that
																					// multiple descriptions are consecutive
						this.assign_paging_states_toThing(thing, paging_states);	// save accumulated states for thing
						thing = next_thing;
						paging_states = [];
					}
				}
			}
		}
		this.assign_paging_states_toThing(thing, paging_states);					// save the last thing's states
	}

	static assign_paging_states_toThing(thing: Thing, paging_states: Array<Paging_State>) {
		// use paging states => create new Page States => store in thing
		if (paging_states.length > 0) {		
			thing.page_states = new Page_States(thing.id, paging_states);
		}
	}

	get description(): string {
		return this.description_for(true) + k.big_separator +
		this.description_for(false);
	}

	paging_state_for(map: Cluster_Map) {
		return this.paging_state_forPointsOut(map.points_out, map.predicate);
	}

	paging_states_for(points_out: boolean): Array<Paging_State> {
		return points_out ? this.outward_paging_states : this.inward_paging_states;
	}

	description_for(points_out: boolean): string {
		const states = this.paging_states_for(points_out);
		let separator, result = k.empty;
		for (const state of states) {
			result = result + separator + state.description;
			separator = k.small_separator;
		}
		return result;
	}

	paging_state_forPointsOut(points_out: boolean, predicate: Predicate) {
		let states = this.paging_states_for(points_out);
		const index = predicate.stateIndex;
		let state = states[index]
		if (!state) {
			state = Paging_State.empty;
			state.kind = predicate.kind;
			state.points_out = points_out;
			state.thing_id = this.thing_id;
			states[index] = state;
		}
		return state;
	}

}
