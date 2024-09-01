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
		this.total = total;
		this.shown = shown;
	}

	get isPaging(): boolean { return this.shown < this.total; }
	get stateIndex(): number { return this.predicate?.stateIndex ?? -1; }
	get maximum_paging_index(): number { return this.total - this.shown; }
	get thing(): Thing | null { return h.thing_forHID(this.thing_id.hash()) ?? null; }
	get predicate(): Predicate | null { return h.predicate_forKind(this.kind) ?? null; }
	get canShow(): number { return Math.round((get(s_rotation_ring_radius) ** 1.5) * Math.PI / 45 / k.row_height) + 1; }
	get sub_key(): string { return `${this.thing_id}${k.generic_separator}${this.kind}${k.generic_separator}${this.points_out}`; }

	update_index_forShown(shown: number) {
		this.shown = shown;
		this.index = Math.min(this.index, this.maximum_paging_index);
	}

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

	static create_paging_state_from(description: string): Paging_State | null {
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

	addTo_paging_index_for(delta: number): boolean {
		if (delta != 0) {
			const prior_index = this.index;
			this.index = (this.index + delta).force_between(0, this.maximum_paging_index);
			const integrally_changed = Math.round(prior_index) != Math.round(this.index);
			s_paging_state.set(this);
			return integrally_changed;
		}
		return false;
	}

	onePage_from(ancestries: Array<Ancestry>): Array<Ancestry> {
		this.total = ancestries.length;
		this.shown = Math.min(this.canShow, this.total);
		this.index = this.index.force_between(0, this.maximum_paging_index);
		const index = Math.round(this.index);
		return ancestries.slice(index, index + this.shown);
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

	constructor(thing_id: string = k.empty) {
		this.thing_id = thing_id;
	}

	get thing(): Thing | null { return h.thing_forHID(this.thing_id.hash()) ?? null; }
	get description(): string { return this.description_for(true) + k.big_separator + this.description_for(false); }
	paging_state_for(map: Cluster_Map): Paging_State { return this.paging_state_forPointsOut(map.points_out, map.predicate); }
	paging_states_for(points_out: boolean): Array<Paging_State> { return points_out ? this.outward_paging_states : this.inward_paging_states; }

	add_paging_state(paging_state: Paging_State) {
		const paging_states = this.paging_states_for(paging_state.points_out);
		paging_states[paging_state.stateIndex] = paging_state;
	}

	description_for(points_out: boolean): string {
		const paging_states = this.paging_states_for(points_out);
		let separator, result = k.empty;
		for (const paging_state of paging_states) {
			result = result + separator + paging_state.description;
			separator = k.small_separator;
		}
		return result;
	}

	paging_state_forPointsOut(points_out: boolean, predicate: Predicate): Paging_State {
		let paging_states = this.paging_states_for(points_out);
		const stateIndex = predicate.stateIndex;
		let paging_state = paging_states[stateIndex]
		if (!paging_state) {
			paging_state = new Paging_State();
			paging_state.kind = predicate.kind;
			paging_state.points_out = points_out;
			paging_state.thing_id = this.thing_id;
			paging_states[stateIndex] = paging_state;
		}
		return paging_state;
	}

}
