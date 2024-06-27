import { k } from '../common/GlobalImports';
import Rotate_State from './Rotate_State';

// for managing the necklace ring

export default class Expand_State extends Rotate_State {
	radiusOffset: number | null = null;		// distance from arc radius to location of mouse DOWN
	base64_rotateSVG = btoa(encodeURIComponent(k.rotateSVG));

	// als track where the user (besides rotating)
	// moves with respect to the center (grows the necklace)

	reset() { super.reset(); this.radiusOffset = null; }
	get isHighlighted(): boolean { return this.isHovering || this.isActive; }
	get isActive(): boolean { return !!this.referenceAngle || !!this.radiusOffset; }

}

export const necklace_ringState = new Expand_State();
