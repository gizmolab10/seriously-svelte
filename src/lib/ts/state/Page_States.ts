import Predicate from '../data/Predicate';
import { k } from '../common/Constants';

export class Page_State {

	// a page is a subset of a too-long list of things
	// index == first of subset

	atLimit = [true, true];
	points_out = false;
	show_thumb = false;
	kind = k.empty;
	thing_id = 0;
	index = 0;
	shown = 0;
	total = 0;

	static get empty(): Page_State { return new Page_State(0, 0, 0, 0); }
	get max_index(): number { return this.total - this.shown; }

	constructor(thing_id: number, index: number, shown: number, total: number) {
		this.shown = shown;
		this.total = total;
		this.thing_id = thing_id;
		const max = this.max_index;
		this.index = index.force_between(0, max);
		this.atLimit = [this.index < 1, (max - 1) < this.index];
	}

	get description(): string {
		const s = k.generic_separator;
		return `${this.points_out}` + s +
		`${this.kind}` + s +
		`${this.thing_id}` + s +
		`${this.index}` + s +
		`${this.shown}` + s +
		`${this.total}`; }

	static create_fromDescription(description: string): Page_State {
		let strings = description.split(k.generic_separator);
		const [out, kind, ...remaining] = strings;
		const points_out = out == 'true';
		const v: Array<number> = remaining.map(r => Number(r));
		let state = new Page_State(v[0], v[1], v[2], v[3]);
		state.points_out = points_out;
		state.kind = kind;
		return state;
	}

	set_index_to(index: number) {
		// at limit contains two elements: at start and at end
		// both true means do not show thumb
		this.index = index;
		this.atLimit = [false, false];
		if (index == 0) {
			this.atLimit[0] = true;
		}
		if (index + this.shown >= this.total) {
			this.atLimit[1] = true;
		}
		this.show_thumb = !this.atLimit[0] || !this.atLimit[1];
	}
}

export class Page_States {
	inward_page_states: Array<Page_State>;
	outward_page_states: Array<Page_State>;

	// two arrays of Page_State (defined above)
	// 1) outward: (to) children and relateds (more kinds later?)
	// 2) inward: (from) parents
	// each array  has one index for each predicate kind
	// 
	// page == a subset of a too-long list
	// index == first of subset

	constructor() {

		// keep track of paging through cluster of things

		this.inward_page_states = [];
		this.outward_page_states = [];
	}

	get description(): string {
		return this.description_for(true) + '::::' +
		this.description_for(false);
	}

	description_for(points_out: boolean): string {
		const states = this.page_states_for(points_out);
		let separator = k.empty;
		let result = k.empty;
		for (const state of states) {
			const description = state.description;
			result = result + separator + description;
			separator = ':::';
		}
		return result;
	}

	static create_fromDescription(description: string): Page_States {
		let state_descriptions = description.split(':::');
		let page_states = new Page_States();
		for (const state_description of state_descriptions) {
			const state = Page_State.create_fromDescription(state_description);
			if (!!state) {
				const points_out = state.points_out;
				let states = page_states.page_states_for(points_out) ?? [];
				states.push(state);
			}
		}
		return page_states;
	}

	show_thumb_for(points_out: boolean, predicate: Predicate): boolean {
		return this.page_state_for(points_out, predicate).show_thumb;
	}

	atLimit_for(atStart: boolean, points_out: boolean, predicate: Predicate): boolean {
		const page_state = this.page_state_for(points_out, predicate);
		return page_state.atLimit[atStart ? 0 : 1];
	}

	page_state_for(points_out: boolean, predicate: Predicate): Page_State {
		let states = this.page_states_for(points_out) ?? []
		const index = predicate.stateIndex;
		if (!states[index]) {
			let state = Page_State.empty;
			state.points_out = points_out;
			state.kind = predicate.kind;
			states[index] = state;
		}
		return states[index];
	}

	set_page_state_for(page_state: Page_State, points_out: boolean, predicate: Predicate) {
		this.page_states_for(points_out)[predicate.stateIndex] = page_state;
	}

	index_for(points_out: boolean, predicate: Predicate): number {
		return this.page_state_for(points_out, predicate)?.index;
	}

	setIndex_for(index: number, points_out: boolean, predicate: Predicate) {
		const page_states = this.page_states_for(points_out);
		const page_state = page_states[predicate.stateIndex];
		page_state.points_out = points_out;
		page_state.kind = predicate.kind;
		page_state.set_index_to(index);
		this.set_page_states_for(page_states, points_out);
		return this;
	}

	page_states_for(points_out: boolean): Array<Page_State> {
		return points_out ? this.outward_page_states : this.inward_page_states;
	}

	set_page_states_for(page_states: Array<Page_State>, points_out: boolean) {
		if (points_out) {
			this.outward_page_states = page_states;
		} else {
			this.inward_page_states = page_states;
		}
	}

}
