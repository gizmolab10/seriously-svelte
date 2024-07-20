import { k } from '../common/Global_Imports';
import Rotation_State from './Rotation_State';

// for managing the necklace ring

export default class Expansion_State extends Rotation_State {
	radiusOffset: number | null = null;		// distance from arc radius to location of mouse DOWN
	base64_rotateSVG = btoa(encodeURIComponent(k.rotateSVG));

	// als track where the user (besides rotating)
	// moves with respect to the center (grows the necklace)

	reset() { super.reset(); this.radiusOffset = null; }
	get isActive(): boolean { return !!this.referenceAngle || !!this.radiusOffset; }

}