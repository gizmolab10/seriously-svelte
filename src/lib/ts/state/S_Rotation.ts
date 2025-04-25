import { k, Angle, svgPaths } from '../common/Global_Imports';

// for rotating (sliding arcs and rotation ring)

export default class S_Rotation {
	base64_rotateSVG = btoa(encodeURIComponent(svgPaths.rotateSVG));		// untested
	active_angle: number | null = null;		// current angle (at location of mouse MOVE)
	basis_angle: number | null = null;		// starting angle (" " DOWN)
	isHovering = false;

	get isActive():		   boolean { return !!this.basis_angle; }
	get isHighlighted():   boolean { return (this.isHovering || this.isActive); }
	get fill_opacity():		number { return this.isHovering ? 0.1 : 0; }
	get stroke_opacity():	number { return this.isHovering ? 0.4 : 0; }
	get thumb_saturation():	number { return this.isActive ? 1 : this.isHovering ? 0.4 : 0.2; }
	get cursor():			string { return this.isActive ? this.active_cursor : this.isHovering ? this.hover_cursor : k.cursor_default; }
	get active_cursor():	string { return new Angle(this.active_angle!).cursor_forAngle; }
	get hover_cursor():		string { return 'alias'; }
	reset()						   { this.basis_angle = this.active_angle = null; }
	
}
