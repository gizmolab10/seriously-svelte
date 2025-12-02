import { k, colors, T_Hit_Target } from '../common/Global_Imports';
import S_Rotation from './S_Rotation';

// for resizing necklace

export default class S_Resizing extends S_Rotation {
	basis_radius: number | null = null;		// distance from arc radius to location of mouse DOWN
	
	get hover_cursor(): string { return 'all-scroll'; }
	get isDragging():  boolean { return !!this.basis_radius; }
	constructor()			   { super(T_Hit_Target.resizing); }
	reset()					   { super.reset(); this.basis_radius = null; }
	get fill_opacity(): number { return this.isHovering ? k.opacity.radial.armature : k.opacity.radial.default; }
	update_fill_color()		   { this.fill_color = this.isHighlighted ? colors.opacitize(this.color, this.fill_opacity) : 'transparent'; }

}
