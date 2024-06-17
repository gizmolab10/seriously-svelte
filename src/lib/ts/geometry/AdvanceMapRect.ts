import { k, s, Rect, Size, Point, Ancestry, Predicate, ElementType, ElementState } from '../common/GlobalImports'

export default class AdvanceMapRect extends Rect {
	elementState: ElementState;
	predicate: Predicate;
	points_out: boolean;
	isForward: boolean;
	ancestry: Ancestry;
	subtype = k.empty;
	total: number;
	title = 'r';

	constructor(ancestry: Ancestry, total: number, predicate: Predicate, points_out: boolean, isForward: boolean) {
		super(Point.zero, new Size(0, 200));
		this.points_out = points_out;
		this.predicate = predicate;
		this.isForward = isForward;
		this.ancestry = ancestry;
		this.total = total;
		this.subtype = this.compute_subtype();
		this.elementState = this.compute_elementState();
		this.origin.x = (this.subtype.length + 16) * k.debug_size - 600;
		this.title = this.predicate.isBidirectional ? 'r' : this.points_out ? 'p' : 'c';
	}

	compute_subtype() {
		const effect = this.isForward ? 'forward-unto-dawn' : 'backward';
		const relation = this.points_out ? 'children' : 'parentisis';
		const subtype = `${this.predicate.kind}-${relation}-${effect}`;
		return subtype;
	}

	compute_elementState() {
		const state = s.elementState_for(this.ancestry, ElementType.advance, this.subtype);
		state.set_forHovering(this.ancestry.thing?.color ?? 'red', 'transparent');
		state.color_background = 'transparent';
		state.defaultCursor = 'pointer';
		state.hoverCursor = 'pointer';
		return state;
	}

}