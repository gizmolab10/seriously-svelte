import ClusterState from './ClusterState';
import Predicate from '../data/Predicate';

export default class ClusterStates {
	forward_states: Array<ClusterState>;
	reverse_states: Array<ClusterState>;

	constructor() {

		// keep track of paging through cluster of things

		this.forward_states = [];
		this.reverse_states = [];
	}

	index_for(points_out: boolean, predicate: Predicate) {
		return this.states_for(points_out)[predicate.stateIndex].index;
	}

	setIndex_for(index: number, points_out: boolean, predicate: Predicate) {
		this.states_for(points_out)[predicate.stateIndex].index = index;
	}

	states_for(points_out: boolean) {
		return points_out ? this.forward_states : this.reverse_states;
	}

	setStates_for(states: Array<ClusterState>, points_out: boolean) {
		if (points_out) {
			this.forward_states = states;
		} else {
			this.reverse_states = states;
		}
	}
}