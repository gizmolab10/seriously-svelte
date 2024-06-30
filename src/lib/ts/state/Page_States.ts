import Predicate from '../data/Predicate';

export class Page_State {

	// a page is a subset of a too-long list of things
	// index == first of subset

	atLimit = [false, false];
	show_thumb = false;
	index = 0;
	shown = 0;
	total = 0;

	constructor() {}

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

	show_thumb_for(points_out: boolean, predicate: Predicate): boolean {
		return this.page_state_for(points_out, predicate).show_thumb;
	}

	atLimit_for(atStart: boolean, points_out: boolean, predicate: Predicate): boolean {
		const page_state = this.page_state_for(points_out, predicate);
		return page_state.atLimit[atStart ? 0 : 1];
	}

	page_state_for(points_out: boolean, predicate: Predicate): Page_State {
		return this.page_states_for(points_out)[predicate.stateIndex];
	}

	index_for(points_out: boolean, predicate: Predicate): number {
		return this.page_state_for(points_out, predicate).index;
	}

	setIndex_for(index: number, points_out: boolean, predicate: Predicate) {
		const page_states = this.page_states_for(points_out);
		const page_state = page_states[predicate.stateIndex];
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
