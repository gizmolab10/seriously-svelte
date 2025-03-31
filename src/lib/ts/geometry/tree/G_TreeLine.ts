import { k, Rect, Size, Point, T_Curve, svgPaths, Ancestry } from '../../common/Global_Imports';

export default class G_TreeLine {
	curveType: string = T_Curve.flat;
	ancestry: Ancestry | null;	// main end of the line
	other_ancestry: Ancestry;	// other end of the line (N.B. main can be deeper!!)
	points_atChild = true;
	viewBox = Rect.zero;
	origin = Point.zero;
	extent = Point.zero;
	linePath = k.empty;
	rect = Rect.zero;
	size = Size.zero;

	// scratchpad for one line drawn
	// from the "main" widget to its "other" {child OR bidirectional} widget

	constructor(ancestry: Ancestry | null, other_ancestry: Ancestry) {
		this.other_ancestry = other_ancestry;
		this.ancestry = ancestry;
	}
		
	update() {
		const lineOffset = new Point(-122.5, 2.5);
		let lineRect = this.rect.offsetBy(lineOffset);
		switch (this.curveType) {
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
		if (this.curveType != T_Curve.flat) {
			const flag = (this.curveType == T_Curve.down) ? 0 : 1;
			const originY = this.curveType == T_Curve.down ? 0 : this.size.height;
			const extentY = this.curveType == T_Curve.up   ? 0 : this.size.height;
			this.linePath = `M0 ${originY} A ${this.size.description} 0 0 ${flag} ${this.size.width} ${extentY}`;
		}
		const boxSize = new Size(this.size.width, Math.max(2, this.size.height));
		this.viewBox = new Rect(this.origin, boxSize);
	}

}