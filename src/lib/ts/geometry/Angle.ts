import { u } from '../common/Utilities';
import '../common/Extensions';

export enum Quadrant {
	upperRight = 'ur',	// 			   0 ... quarter
	upperLeft  = 'ul',	//		 quarter ... half
	lowerLeft  = 'll',	//			half ... threeQuarters
	lowerRight = 'lr',	// threeQuarters ... full
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
	static threeQuarters = Math.PI * 3 / 2;		// nadir (6 o'clock)

	get quadrant_referenceAngle(): number { return u.referenceAngle_ofQuadrant(this.quadrant_ofAngle); }

	get angle_leansForward(): boolean {
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

	get angle_pointsDown(): boolean {
		switch(this.quadrant_ofAngle) {
			case Quadrant.upperRight: return true;
			case Quadrant.upperLeft: return true;
			default: return false;
		}
	}

	get orientation_ofAngle(): Orientation {
		let quadrant = this.quadrant_ofAngle;
		const isFirstEighth = this.angle.normalize_between_zeroAnd(Angle.quarter) < (Math.PI / 4);
		switch (quadrant) {
			case Quadrant.lowerRight: return isFirstEighth ? Orientation.right : Orientation.down;
			case Quadrant.lowerLeft:  return isFirstEighth ? Orientation.down  : Orientation.left;
			case Quadrant.upperLeft:  return isFirstEighth ? Orientation.left  : Orientation.up;
			default:				  return isFirstEighth ? Orientation.up    : Orientation.right;
		}
	}

	get quadrant_ofAngle(): Quadrant {
	
		// angles begin at 3 o'clock & rotate up (counter-clockwise)
	
		const normalized = this.angle.normalized_angle();
		let quadrant = Quadrant.upperRight;
		if (normalized.isBetween(0,				Angle.quarter,		 true)) { quadrant = Quadrant.lowerRight; }
		if (normalized.isBetween(Angle.quarter, Angle.half,			 true)) { quadrant = Quadrant.lowerLeft; }
		if (normalized.isBetween(Angle.half,	Angle.threeQuarters, true)) { quadrant = Quadrant.upperLeft; }
		return quadrant;
	}

}