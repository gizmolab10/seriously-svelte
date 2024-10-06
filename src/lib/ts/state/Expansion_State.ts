import { k } from '../common/Global_Imports';
import Rotation_State from './Rotation_State';

// for managing the rotation ring

export default class Expansion_State extends Rotation_State {
	basis_offset: number | null = null;		// distance from arc radius to location of mouse DOWN

	constructor() { super(0.03); }

	// track where the mouse (while down) moves
	// with respect to the center (e.g., grows/shrinks the ring)

	reset() { super.reset(); this.basis_offset = null; }
	get isActive(): boolean { return !!super.isActive || !!this.basis_offset; }
	get cursor(): string { return this.isHighlighted ? 'alias' : k.cursor_default; }
	get stroke_opacity(): number { return this.isHighlighted ? this.basis_opacity * 5 : this.basis_opacity; }
	get fill_opacity(): number { return this.isHighlighted ? this.basis_opacity * 0.5 : this.basis_opacity * 0.15; }

}
