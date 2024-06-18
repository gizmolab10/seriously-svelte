import ClusterState from './ClusterState';
import Predicate from '../data/Predicate';

export default class ClusterStates {
	inward_states: Array<ClusterState>;
	outward_states: Array<ClusterState>;

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

	states_for(points_out: boolean): Array<ClusterState> {
		return points_out ? this.outward_states : this.inward_states;
	}

	setStates_for(states: Array<ClusterState>, points_out: boolean) {
		if (points_out) {
			this.outward_states = states;
		} else {
			this.inward_states = states;
		}
	}

}