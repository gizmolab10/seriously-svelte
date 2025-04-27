import { k, Angle, svgPaths } from '../common/Global_Imports';

// for rotating (sliding arcs and rotation ring)

export default class S_Rotation {
	base64_rotateSVG = btoa(encodeURIComponent(svgPaths.rotateSVG));		// untested
	active_angle: number | null = null;		// current angle (at location of mouse MOVE)
	basis_angle: number | null = null;		// starting angle (" " DOWN)
	isHovering = false;

	get hover_cursor():	  string { return 'alias'; }
	get isActive():		 boolean { return !!this.basis_angle; }
	get isHighlighted(): boolean { return (this.isHovering || this.isActive); }
	get active_cursor():  string { return new Angle(this.active_angle!).cursor_forAngle; }
	get stroke_opacity(): number { return this.isHovering ? k.opacity.hover : k.opacity.none; }
	get fill_opacity():	  number { return this.isHovering ? k.opacity.standard : k.opacity.none; }
	get thumb_opacity():  number { return this.isActive ? k.opacity.active : this.isHovering ? k.opacity.hover : k.opacity.thumb; }
	get cursor():		  string { return this.isActive ? this.active_cursor : this.isHovering ? this.hover_cursor : k.cursor_default; }
	reset()						 { this.basis_angle = this.active_angle = null; }
	
}
