import ScrollRingState from '../../ts/state/ScrollRingState';
import { k } from '../common/GlobalImports';

export default class NecklaceRingState extends ScrollRingState {
	radiusOffset: number | null = null;		// distance from arc radius to location of mouse DOWN
	base64_rotateSVG = btoa(encodeURIComponent(k.rotateSVG));

	reset() { this.startAngle = this.priorAngle = this.radiusOffset = null; }
	get isActive(): boolean { return !!this.startAngle || !!this.radiusOffset; }

}

export const necklace_ringState = new NecklaceRingState();
