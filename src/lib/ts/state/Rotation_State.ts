import { k } from '../common/Global_Imports';

// for managing the paging ring

export default class Rotation_State {
	active_angle: number | null = null;		// angle at location of mouse MOVE
	basis_angle: number | null = null;		// angle at location of mouse DOWN
	basis_opacity: number;
	isHovering = false;

	constructor(basis_opacity: number = 0.1) { this.basis_opacity = basis_opacity; }

	// track where the user:
	//  a) rotates the rotation_ring
	//  b) rotates the thumb button (paging)
	
	get isActive(): boolean { return !!this.basis_angle; }
	reset() { this.basis_angle = this.active_angle = null; }
	get isHighlighted(): boolean { return (this.isHovering || this.isActive); }
	get cursor(): string { return this.isActive ? 'move' : this.isHovering ? 'pointer' : k.cursor_default; }
	get stroke_opacity(): number { return this.isHighlighted ? this.basis_opacity * 2 : this.basis_opacity; }
	get fill_opacity(): number { return this.isHighlighted ? this.basis_opacity * 0.3 : this.basis_opacity * 0.1; }
	get three_level_opacity(): number { return this.isActive ? 1 : this.isHovering ? this.basis_opacity * 4 : this.basis_opacity * 1.5; }

}
