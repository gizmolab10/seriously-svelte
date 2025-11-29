import { T_Hit_Target } from '../common/Global_Imports';
import S_Rotation from './S_Rotation';

// for resizing necklace

export default class S_Resizing extends S_Rotation {
	basis_radius: number | null = null;		// distance from arc radius to location of mouse DOWN
	
	reset()					   { super.reset(); this.basis_radius = null; }
	constructor()			   { super(T_Hit_Target.resizing); }
	get isDragging():  boolean { return !!this.basis_radius; }
	get hover_cursor(): string { return 'all-scroll'; }

}
