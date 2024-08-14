import { k } from '../common/Global_Imports';

// for managing the paging ring

export default class Rotation_State {
	basis_angle: number | null = null;			// angle at location of mouse DOWN
	lastRotated_angle: number | null = null;	// angle at location of previous mouse MOVE
	isHovering = false;

	// track where the user 
	// a) rotates the thumb button (scrolls the page)
	// b) rotates the rotation_ring (via subclass: Expansion_State)
	
	get isActive(): boolean { return !!this.basis_angle; }
	reset() { this.basis_angle = this.lastRotated_angle = null; }
	get stroke_opacity(): number { return this.isHighlighted ? 0.2 : 0.1; }
	get fill_opacity(): number { return this.isHighlighted ? 0.03 : 0.02; }
	get isHighlighted(): boolean { return (this.isHovering || this.isActive); }
	get cursor(): string { return this.isActive ? 'move' : this.isHovering ? 'pointer' : k.cursor_default; }

}
