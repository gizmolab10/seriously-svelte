import { k, Angle } from '../common/Global_Imports';

// for rotating (arc sliders and the rotation ring)

export default class S_Rotation {
	active_angle: number | null = null;		// current angle (at location of mouse MOVE)
	basis_angle: number | null = null;		// starting angle (where mouse went DOWN)
	isHovering = false;

	get hover_cursor():	  string { return 'alias'; }
	get isActive():		 boolean { return !!this.basis_angle; }
	get isHighlighted(): boolean { return (this.isHovering || this.isActive); }
	get active_cursor():  string { return new Angle(this.active_angle!).cursor_forAngle; }
	get fill_opacity():	  number { return this.isHovering ? k.opacity.radial.armature : k.opacity.none; }
	get stroke_opacity(): number { return this.isHovering ? k.opacity.radial.hover : k.opacity.none; }
	get thumb_opacity():  number { return this.isActive ? k.opacity.radial.active : this.isHovering ? k.opacity.radial.hover : k.opacity.radial.thumb; }
	get cursor():		  string { return this.isActive ? this.active_cursor : this.isHovering ? this.hover_cursor : k.cursor_default; }
	reset()						 { this.basis_angle = this.active_angle = null; }
	
}
