import { k } from '../common/Global_Imports';

// for managing the paging ring

export default class Rotation_State {
	basis_angle: number | null = null;		// angle at location of mouse DOWN
	lastRotated_angle: number | null = null;			// angle at location of previous mouse MOVE
	isHovering = false;

	// track where the user 
	// a) rotates the thumb button (scrolls the page)
	// b) rotates the rotation_ring (in subclass: Expansion_State)
	
	reset() { this.basis_angle = this.lastRotated_angle = null; }
	get isActive(): boolean { return !!this.basis_angle; }
	get stroke_transparency(): number { return this.isHighlighted ? 0.8 : 1; }
	get isHighlighted(): boolean { return (this.isHovering || this.isActive); }
	get fill_transparency(): number { return this.isHighlighted ? 0.97 : 0.98; }
	get cursor(): string { return this.isActive ? 'move' : this.isHovering ? 'pointer' : k.cursor_default; }

}
