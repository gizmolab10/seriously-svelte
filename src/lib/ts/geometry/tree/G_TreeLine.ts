import { k, Rect, Size, Point, T_Curve, svgPaths, Ancestry } from '../../common/Global_Imports';

export default class G_TreeLine {
	t_curve: string = T_Curve.flat;
	ancestry: Ancestry | null;	// main end of the line
	other_ancestry: Ancestry;	// other end of the line (N.B. main can be deeper!!)
	isBidirectional = false;
	points_atOther = true;
	viewBox = Rect.zero;
	origin = Point.zero;
	extent = Point.zero;
	linePath = k.empty;
	rect = Rect.zero;
	size = Size.zero;
	name = k.empty;

	// scratchpad for one line drawn
	// from the "main" widget to its "other" {child OR bidirectional} widget

	constructor(ancestry: Ancestry | null, other_ancestry: Ancestry, isBidirectional: boolean = false) {
		this.name = ancestry?.title ?? k.empty;
		this.other_ancestry = other_ancestry;
		this.isBidirectional = isBidirectional;
		this.ancestry = ancestry;
	}
		
	layout() {
		this.layout_svgPaths();
		this.update_name();
	}

	set_t_curve_forHeight(height: number) {
		if (height > 1) {
			this.t_curve = T_Curve.down;
		} else if (height < -1) {
			this.t_curve = T_Curve.up;
		} else {
			this.t_curve = T_Curve.flat;
		}
	}

	private update_name() {
		if (!!this.ancestry && !this.ancestry.equals(this.other_ancestry)) {
			this.name = `${this.ancestry.titles.join('.')}...${this.other_ancestry.titles.join('.')}`;
		}
	}
		
	private layout_svgPaths() {
		const lineOffset = new Point(-122.5, 2.5);
		let lineRect = this.rect.offsetBy(lineOffset);
		switch (this.t_curve) {
			case T_Curve.up:
				this.origin = lineRect.origin;
				this.extent = lineRect.extent.offsetByY(-1.5);
				break;
			case T_Curve.down:
				this.origin = lineRect.bottomLeft.offsetByY(-0.5);
				this.extent = this.origin.offsetBy(lineRect.size.asPoint).offsetByY(0.5);
				break;
			case T_Curve.flat:
				lineRect = lineRect.offsetByY(-1.5);
				this.origin = lineRect.centerLeft;
				this.extent = lineRect.centerRight;
				this.linePath = svgPaths.line(this.origin.vector_to(this.extent));
				break;
		}
		const vector = this.origin.vector_to(this.extent);
		this.size = vector.abs.asSize;
		if (this.t_curve != T_Curve.flat) {
			const flag = (this.t_curve == T_Curve.down) ? 0 : 1;
			const originY = this.t_curve == T_Curve.down ? 0 : this.size.height;
			const extentY = this.t_curve == T_Curve.up   ? 0 : this.size.height;
			this.linePath = `M0 ${originY} A ${this.size.description} 0 0 ${flag} ${this.size.width} ${extentY}`;
		}
		const boxSize = new Size(this.size.width, Math.max(2, this.size.height));
		this.viewBox = new Rect(this.origin, boxSize);
	}

}