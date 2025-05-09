import { tu } from './Testworthy_Utilities';
import '../common/Extensions';

export enum E_Quadrant {
	upperRight = 'ur',	// 				0 ... quarter
	upperLeft  = 'ul',	//		  quarter ... half
	lowerLeft  = 'll',	//			 half ... three_quarters
	lowerRight = 'lr',	// three_quarters ... full
}

export enum E_Orientation {
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
	static half = Angle.full / 2;				// far left (9 o'clock)
	static quarter = Angle.full / 4;			// zenith (12 o'clock)
	static three_quarters = Angle.quarter * 3;	// nadir (6 o'clock)
	static sixteenth = Angle.full / 16;			// support octants
	static eighth = Angle.full / 8;

	static radians_from_degrees(degrees: number): number { return Math.PI / 180 * degrees; }
	get angle_orientsDown(): boolean { return this.orientation_ofAngle == E_Orientation.down; }
	get quadrant_basis_angle(): number { return tu.basis_angle_ofType_Quadrant(this.quadrant_ofAngle); }

	get angle_slantsForward(): boolean {
		const quadrant = this.quadrant_ofAngle;
		return [E_Quadrant.lowerRight, E_Quadrant.upperLeft].includes(quadrant);
	}

	get angle_pointsRight(): boolean {
		switch(this.quadrant_ofAngle) {
			case E_Quadrant.lowerRight: return true;
			case E_Quadrant.upperRight: return true;
			default: return false;
		}
	}

	get orientation_ofAngle(): E_Orientation {
		let quadrant = this.quadrant_ofAngle;
		// isFirstEighth first of two half quadrants, counting counter-clockwise
		const isFirstEighth = this.angle.normalize_between_zeroAnd(Angle.quarter) < (Angle.quarter / 2);
		switch (quadrant) {		// going counter-clockwise
			case E_Quadrant.upperRight: return isFirstEighth ? E_Orientation.right : E_Orientation.up;
			case E_Quadrant.upperLeft:  return isFirstEighth ? E_Orientation.up    : E_Orientation.left;
			case E_Quadrant.lowerLeft:  return isFirstEighth ? E_Orientation.left  : E_Orientation.down;
			case E_Quadrant.lowerRight: return isFirstEighth ? E_Orientation.down  : E_Orientation.right;
		}
	}

	get quadrant_ofAngle(): E_Quadrant {
	
		// angles begin at 3 o'clock & rotate up (counter-clockwise)
		// ending in lowerRight quadrant (this is also the default)
	
		const normalized = this.angle.angle_normalized();
		let quadrant = E_Quadrant.lowerRight;
		if (normalized.isBetween(0,				Angle.quarter,		  true)) { quadrant = E_Quadrant.upperRight; }
		if (normalized.isBetween(Angle.quarter, Angle.half,			  true)) { quadrant = E_Quadrant.upperLeft; }
		if (normalized.isBetween(Angle.half,	Angle.three_quarters, true)) { quadrant = E_Quadrant.lowerLeft; }
		return quadrant;
	}

	get octant_ofAngle(): number {
		const normalized = this.angle.angle_normalized();
		let test_angle = Angle.sixteenth;
		for (let i = 0; i < 8; i++) {
			if (normalized < test_angle) {
				return i;
			}
			test_angle += Angle.eighth;
		}
		return 0;
	}

	get cursor_forAngle(): string {
		if (!!this.angle) {
			const octant = this.octant_ofAngle;
			switch (octant % 4) {
				case 0: return 'ns-resize';
				case 1: return 'nwse-resize';
				case 2: return 'ew-resize';
				case 3: return 'nesw-resize';
			}
		}
		return '';
	}

}

export enum Direction {
	up = Angle.three_quarters,
	down = Angle.quarter,
	right = Angle.half,
	left = Angle.zero,
}
