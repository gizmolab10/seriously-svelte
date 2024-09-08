import { k } from '../common/Global_Imports';
import Rotation_State from './Rotation_State';

// for managing the rotation ring

export default class Expansion_State extends Rotation_State {
	radiusOffset: number | null = null;		// distance from arc radius to location of mouse DOWN
	base64_rotateSVG = btoa(encodeURIComponent(k.rotateSVG));

	constructor() {
		super();
		this.basis_opacity = 0.02;
	}

	// als track where the user (besides rotating)
	// moves with respect to the center (grows the rotation)

	reset() { super.reset(); this.radiusOffset = null; }
	get isActive(): boolean { return !!super.isActive || !!this.radiusOffset; }
	get stroke_opacity(): number { return this.isHighlighted ? this.basis_opacity * 7 : this.basis_opacity; }
	get fill_opacity(): number { return this.isHighlighted ? this.basis_opacity * 1.5 : this.basis_opacity * 0.2; }

}
