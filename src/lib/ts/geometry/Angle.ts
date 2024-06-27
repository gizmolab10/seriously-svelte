import { u } from '../common/Utilities';
import '../common/Extensions';

export enum Quadrant {
	upperRight = 'ur',	// 			   0 ... quarter
	upperLeft  = 'ul',	//		 quarter ... half
	lowerRight = 'lr',	//			half ... threeQuarters
	lowerLeft  = 'll',	// threeQuarters ... full
}

export enum Orientation {
	right = 'right',
	left  = 'left',
	down  = 'down',
	up    = 'up',
}

export default class Angle {
	angle: number;		// angles begin at 3 o'clock & rotate up (counter-clockwise)

	constructor(angle: number) {
		this.angle = angle;
	}

	static zero = 0;							// far right (3 o'clock)
	static full = Math.PI * 2;					// same as (normalizes to) zero
	static quarter = Math.PI / 2;				// zenith (12 o'clock)
	static half = Math.PI;						// far left (9 o'clock)
	static threeQuarters = Math.PI * 3 / 2;		// nadir (6 o'clock)

	get quadrant_referenceAngle(): number { return u.referenceAngle_ofQuadrant(this.quadrant_ofAngle); }
	get normalized_angle() { return Angle.full.normalize(this.angle); }
		
	get degrees_of(): string {
		const degrees = this.normalized_angle * 180 / Angle.half;
		return u.formatter_toFixed(1).format(degrees);
	}

	get angle_tiltsUp(): boolean {
		const quadrant = this.quadrant_ofAngle;
		return [Quadrant.upperRight, Quadrant.lowerLeft].includes(quadrant);
	}

	get angle_hasPositiveX(): boolean {
		switch(this.quadrant_ofAngle) {
			case Quadrant.upperRight: return true;
			case Quadrant.lowerRight: return true;
			default: return false;
		}
	}

	get orientation_ofAngle(): Orientation {
		let quadrant = this.quadrant_ofAngle;
		const isFirstEighth = Angle.quarter.normalize(this.angle) < (Math.PI / 4);
		switch (quadrant) {
			case Quadrant.upperRight: return isFirstEighth ? Orientation.right : Orientation.up;
			case Quadrant.upperLeft:  return isFirstEighth ? Orientation.up    : Orientation.left;
			case Quadrant.lowerLeft:  return isFirstEighth ? Orientation.left  : Orientation.down;
			default:				  return isFirstEighth ? Orientation.down  : Orientation.right;
		}
	}

	get quadrant_ofAngle(): Quadrant {
	
		// angles begin at 3 o'clock & rotate up (counter-clockwise)
	
		const normalized = this.normalized_angle;
		let quadrant = Quadrant.lowerRight;
		if (normalized.isBetween(0,				Angle.quarter,		 true)) { quadrant = Quadrant.upperRight; }
		if (normalized.isBetween(Angle.quarter, Angle.half,			 true)) { quadrant = Quadrant.upperLeft; }
		if (normalized.isBetween(Angle.half,	Angle.threeQuarters, true)) { quadrant = Quadrant.lowerLeft; }
		return quadrant;
	}
	
	isAlmost_horizontal(angle: number, almost: number = (Angle.half / 10)): boolean {
		for (const horizontal of [Angle.half, Angle.full]) {
			const delta = new Angle(this.angle - horizontal).normalized_angle;
			if (delta.isClocklyBetween(-almost, almost, Angle.full)) {
				return true;
			}
		}
		return false;
	}
}