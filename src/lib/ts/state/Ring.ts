import { k } from '../common/GlobalImports';

export default class Ring {
	name = k.empty;
	isHovering = false;
	startAngle: number | null = null;		// angle at location of mouse DOWN
	priorAngle: number | null = null;		// angle at location of previous mouse MOVE
	radiusOffset: number | null = null;		// distance from arc radius to location of mouse DOWN
	base64_rotateSVG = btoa(encodeURIComponent(k.rotateSVG));

	constructor(name: string) { this.name = name; }
	reset() { this.priorAngle = this.startAngle = this.radiusOffset = null; }
	get isHighlighted(): boolean { return this.isHovering || this.isActive; }
	get stroke_transparency(): number { return this.isHighlighted ? 0.8 : 1; }
	get fill_transparency(): number { return this.isHighlighted ? 0.9 : 0.98; }
	get isActive(): boolean { return !!this.startAngle || !!this.radiusOffset; }
	get cursor(): string { return this.isActive ? 'move' : this.isHovering ? 'pointer' : k.cursor_default; }
}
