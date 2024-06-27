import Predicate from '../data/Predicate';

export class Page_Index {

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

export default class Page_Indices {
	inward_indices: Array<Page_Index>;
	outward_indices: Array<Page_Index>;

	// two arrays of Page_Index (defined above)
	// 1) outward: (to) children and relateds (more kinds later?)
	// 2) inward: (from) parents
	// each array  has one index for each predicate kind
	// 
	// page == a subset of a too-long list
	// index == first of subset

	constructor() {

		// keep track of paging through cluster of things

		this.inward_indices = [];
		this.outward_indices = [];
	}

	show_thumb_for(points_out: boolean, predicate: Predicate): boolean {
		return this.pageIndex_for(points_out, predicate).show_thumb;
	}

	atLimit_for(atStart: boolean, points_out: boolean, predicate: Predicate): boolean {
		const pageIndex = this.pageIndex_for(points_out, predicate);
		return pageIndex.atLimit[atStart ? 0 : 1];
	}

	pageIndex_for(points_out: boolean, predicate: Predicate): Page_Index {
		return this.indices_for(points_out)[predicate.stateIndex];
	}

	index_for(points_out: boolean, predicate: Predicate): number {
		return this.pageIndex_for(points_out, predicate).index;
	}

	setIndex_for(index: number, points_out: boolean, predicate: Predicate) {
		const indices = this.indices_for(points_out);
		const pageIndex = indices[predicate.stateIndex];
		pageIndex.set_index_to(index);
		this.set_indices_for(indices, points_out);
		return this;
	}

	indices_for(points_out: boolean): Array<Page_Index> {
		return points_out ? this.outward_indices : this.inward_indices;
	}

	set_indices_for(indices: Array<Page_Index>, points_out: boolean) {
		if (points_out) {
			this.outward_indices = indices;
		} else {
			this.inward_indices = indices;
		}
	}

}
