import Predicate from '../data/Predicate';

export default class Page_Indices {
	inward_states: Array<Page_Index>;
	outward_states: Array<Page_Index>;

	// two arrays of Page_Index (defined below)
	// 1) outward: (to) children and relateds (more kinds later?)
	// 2) inward: (from) parents
	// each array  has one index for each predicate kind
	// 
	// page == a subset of a too-long list
	// index == first of subset

	constructor() {

		// keep track of paging through cluster of things

		this.inward_states = [];
		this.outward_states = [];
	}

	index_for(points_out: boolean, predicate: Predicate): number {
		return this.states_for(points_out)[predicate.stateIndex].index;
	}

	setIndex_for(index: number, points_out: boolean, predicate: Predicate) {
		const states = this.states_for(points_out);
		states[predicate.stateIndex].index = index;
		this.setStates_for(states, points_out);
		return this;
	}

	states_for(points_out: boolean): Array<Page_Index> {
		return points_out ? this.outward_states : this.inward_states;
	}

	setStates_for(states: Array<Page_Index>, points_out: boolean) {
		if (points_out) {
			this.outward_states = states;
		} else {
			this.inward_states = states;
		}
	}

}

export class Page_Index {

	// page is a subset of a too-long list
	// index == first of subset

	atLimit = [false, false];
	index = 0;
	total = 0;
}
