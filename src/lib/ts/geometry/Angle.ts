import { u } from '../common/Utilities';
import '../common/Extensions';

export enum Quadrant {
	upperRight = 'ur',	// 			   0 ... quarter
	upperLeft  = 'ul',	//		 quarter ... half
	lowerLeft  = 'll',	//			half ... three_quarters
	lowerRight = 'lr',	// three_quarters ... full
}

export enum Orientation {
	right = 'right',
	left  = 'left',
	down  = 'down',
	up    = 'up',
}

export default class Angle {
	angle: number;								// angles begin at 3 o'clock & rotate up (counter-clockwise)

	constructor(angle: number) {
		this.angle = angle;
	}

	static zero = 0;							// far right (3 o'clock)
	static full = Math.PI * 2;					// same as (normalizes to) zero
	static quarter = Math.PI / 2;				// zenith (12 o'clock)
	static half = Math.PI;						// far left (9 o'clock)
	static three_quarters = Math.PI * 3 / 2;	// nadir (6 o'clock)

	static radians_from_degrees(degrees: number): number { return Math.PI / 180 * degrees; }
	get angle_orientsDown(): boolean { return this.orientation_ofAngle == Orientation.down; }
	get quadrant_basis_angle(): number { return u.basis_angle_ofQuadrant(this.quadrant_ofAngle); }

	get angle_slantsForward(): boolean {
		const quadrant = this.quadrant_ofAngle;
		return [Quadrant.lowerRight, Quadrant.upperLeft].includes(quadrant);
	}

	get angle_pointsRight(): boolean {
		switch(this.quadrant_ofAngle) {
			case Quadrant.lowerRight: return true;
			case Quadrant.upperRight: return true;
			default: return false;
		}
	}

	get orientation_ofAngle(): Orientation {
		let quadrant = this.quadrant_ofAngle;
		// isFirstEighth first of two half quadrants, counting counter-clockwise
		const isFirstEighth = this.angle.normalize_between_zeroAnd(Angle.quarter) < (Angle.quarter / 2);
		switch (quadrant) {		// going counter-clockwise
			case Quadrant.upperRight: return isFirstEighth ? Orientation.right : Orientation.up;
			case Quadrant.upperLeft:  return isFirstEighth ? Orientation.up    : Orientation.left;
			case Quadrant.lowerLeft:  return isFirstEighth ? Orientation.left  : Orientation.down;
			case Quadrant.lowerRight: return isFirstEighth ? Orientation.down  : Orientation.right;
		}
	}

	get quadrant_ofAngle(): Quadrant {
	
		// angles begin at 3 o'clock & rotate up (counter-clockwise)
		// ending in lowerRight quadrant
	
		const normalized = this.angle.angle_normalized();
		let quadrant = Quadrant.lowerRight;
		if (normalized.isBetween(0,				Angle.quarter,		 true)) { quadrant = Quadrant.upperRight; }
		if (normalized.isBetween(Angle.quarter, Angle.half,			 true)) { quadrant = Quadrant.upperLeft; }
		if (normalized.isBetween(Angle.half,	Angle.three_quarters, true)) { quadrant = Quadrant.lowerLeft; }
		return quadrant;
	}

}