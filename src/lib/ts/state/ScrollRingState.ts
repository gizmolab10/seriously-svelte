import { k } from '../common/GlobalImports';

export default class ScrollRingState {
	isHovering = false;
	startAngle: number | null = null;		// angle at location of mouse DOWN
	priorAngle: number | null = null;		// angle at location of previous mouse MOVE
	
	get isActive(): boolean { return false; }
	get isHighlighted(): boolean { return this.isHovering || this.isActive; }
	get stroke_transparency(): number { return this.isHighlighted ? 0.8 : 1; }
	get fill_transparency(): number { return this.isHighlighted ? 0.97 : 0.98; }
	get cursor(): string { return this.isActive ? 'move' : this.isHovering ? 'pointer' : k.cursor_default; }

}

export const scroll_ringState = new ScrollRingState();