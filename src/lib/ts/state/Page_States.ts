import { k, get, Predicate, Ancestry, Cluster_Map, persistLocal } from '../common/Global_Imports';
import { s_page_state, s_rotation_ring_radius } from '../state/Reactive_State';
import { h } from '../db/DBDispatch';

export class Page_State {

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

	static create_page_state_fromDescription(description: string): Page_State | null {
		let strings = description.split(k.generic_separator);
		const [out, kind, id, ...remaining] = strings;
		if (remaining.length > 2) {
			const v: Array<number> = remaining.map(r => Number(r));
			const page_state = new Page_State(v[0], v[1], v[2]);
			page_state.points_out = out == 'true';
			page_state.thing_id = id;
			page_state.kind = kind;
			return page_state;
		}
		return null;
	}

	static get empty(): Page_State { return new Page_State(); }
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

	set_page_index_for(index: number, map: Cluster_Map) {
		this.total = map.total;
		this.shown = map.shown;
		this.index = index;
		s_page_state.set(this);
	}

	onePage_from(ancestries: Array<Ancestry>): Array<Ancestry> {
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
	outward_page_states: Array<Page_State> = [];
	inward_page_states: Array<Page_State> = [];
	thing_id = k.empty;

	// two arrays of Page_State (defined above)
	// 1) outward: (to) children and relateds (more kinds later?)
	// 2) inward: (from) parents
	// each array has one index for each predicate kind
	// 
	// page == a subset of a too-long list
	// index == first of subset

	constructor(thing_id: string = k.empty, states: Array<Page_State> = []) {
		this.thing_id = thing_id;
		for (const state of states) {
			this.page_states_for(state.points_out)[state.stateIndex] = state;
		}
	}

	static restoreAll_pageStates_from(descriptions: Array<string>) {
		let prior_thing_id = k.empty;
		let page_states: Array<Page_State> = [];
		for (const description of descriptions) {
			// this assumes that multiple descriptions for each thing are consecutive
			const page_state = Page_State.create_page_state_fromDescription(description);
			const thing_id = page_state?.thing_id;
			if (!!page_state && !!thing_id) {
				if (prior_thing_id != thing_id) {									// each time a new thing's state is encountered
					this.assign_page_states_toThing(prior_thing_id, page_states);	// save the already accumulated states for prior thing
					page_states = [];
					prior_thing_id = thing_id;
				}
				page_states[page_state.stateIndex] = page_state;					// VITAL: do this AFTER if clause above
			}
		}
		this.assign_page_states_toThing(prior_thing_id, page_states);				// save the last thing's state
	}

	static assign_page_states_toThing(thing_id: string, page_states: Array<Page_State>) {
		if (thing_id != k.empty && page_states.length > 0) {		
			const thing = h.thing_forHID(thing_id.hash());
			if (!thing) {
				persistLocal.delete_page_states(page_states);	// remove from persistence
			} else {
				thing.page_states = new Page_States(thing_id, page_states);
			}
		}
	}

	get description(): string {
		return this.description_for(true) + k.big_separator +
		this.description_for(false);
	}

	page_state_for(map: Cluster_Map) {
		return this.page_state_forPointsOut(map.points_out, map.predicate);
	}

	page_states_for(points_out: boolean): Array<Page_State> {
		return points_out ? this.outward_page_states : this.inward_page_states;
	}

	description_for(points_out: boolean): string {
		const states = this.page_states_for(points_out);
		let separator, result = k.empty;
		for (const state of states) {
			result = result + separator + state.description;
			separator = k.small_separator;
		}
		return result;
	}

	page_state_forPointsOut(points_out: boolean, predicate: Predicate) {
		let states = this.page_states_for(points_out);
		const index = predicate.stateIndex;
		let state = states[index]
		if (!state) {
			state = Page_State.empty;
			state.kind = predicate.kind;
			state.points_out = points_out;
			state.thing_id = this.thing_id;
			states[index] = state;
		}
		return state;
	}

}
