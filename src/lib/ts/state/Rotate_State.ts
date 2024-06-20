import { necklace_ringState } from './Expand_State';
import { k } from '../common/GlobalImports';

export default class Rotate_State {
	startAngle: number | null = null;		// angle at location of mouse DOWN
	priorAngle: number | null = null;		// angle at location of previous mouse MOVE
	isHovering = false;

	// track where the user 
	// a) rotates the thumb button (scrolls the page)
	// b) rotates the necklace (in subclass: Expand_State)
	
	reset() { this.startAngle = this.priorAngle = null; }
	get isActive(): boolean { return !!this.startAngle; }
	get stroke_transparency(): number { return this.isHighlighted ? 0.8 : 1; }
	get fill_transparency(): number { return this.isHighlighted ? 0.97 : 0.98; }
	get cursor(): string { return this.isActive ? 'move' : this.isHovering ? 'pointer' : k.cursor_default; }
	get isHighlighted(): boolean { return (this.isHovering || this.isActive) && !necklace_ringState.isActive; }

}

export const scrolling_state = new Rotate_State();