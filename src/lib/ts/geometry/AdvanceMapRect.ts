import { s, Ancestry, Predicate, ElementType, ElementState } from '../common/GlobalImports'

export default class AdvanceMapRect {
	elementState: ElementState;
	predicate: Predicate;
	points_out: boolean;
	isForward: boolean;
	ancestry: Ancestry;

	constructor(ancestry: Ancestry, predicate: Predicate, points_out: boolean, isForward: boolean) {
		const effect = isForward ? 'forward' : 'backward';
		const relation = points_out ? 'children' : 'parents';
		const subtype = `${predicate.kind}-${relation}-${effect}`;
		this.elementState = s.elementState_for(ancestry, ElementType.advance, subtype);
		this.points_out = points_out;
		this.predicate = predicate;
		this.isForward = isForward;
		this.ancestry = ancestry;
	}

}