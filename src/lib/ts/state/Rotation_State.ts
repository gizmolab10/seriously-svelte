import { k } from '../common/Global_Imports';

// for managing the paging ring

export default class Rotation_State {
	active_angle: number | null = null;		// angle at location of mouse MOVE
	basis_angle: number | null = null;		// angle at location of mouse DOWN
	isHovering = false;

	// track where the user:
	//  a) rotates the rotation_ring
	//  b) rotates the thumb button (paging)
	
	get isActive(): boolean { return !!this.basis_angle; }
	reset() { this.basis_angle = this.active_angle = null; }
	get fill_opacity(): number { return this.isHighlighted ? 0.03 : 0.02; }
	get stroke_opacity(): number { return this.isHighlighted ? 0.2 : 0.1; }
	get isHighlighted(): boolean { return (this.isHovering || this.isActive); }
	get needs_update(): boolean { return this.basis_angle != this.active_angle; }
	get three_level_opacity(): number { return this.isActive ? 1 : this.isHovering ? 0.4 : 0.15; }
	get cursor(): string { return this.isActive ? 'move' : this.isHovering ? 'pointer' : k.cursor_default; }

}
