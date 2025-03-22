import { k, Angle, svgPaths } from '../common/Global_Imports';

// for rotating (paging arcs and rotation ring)

export default class S_Rotation {
	base64_rotateSVG = btoa(encodeURIComponent(svgPaths.rotateSVG));		// untested
	active_angle: number | null = null;		// angle at location of mouse MOVE
	basis_angle: number | null = null;		// angle at location of mouse DOWN
	isHovering = false;

	get hover_cursor(): string { return 'alias'; }
	get isActive(): boolean { return !!this.basis_angle; }
	reset() { this.basis_angle = this.active_angle = null; }
	get fill_opacity(): number { return this.show_highlight ? 0.1 : 0; }
	get stroke_opacity(): number { return this.show_highlight ? 0.4 : 0; }
	get show_highlight(): boolean { return (this.isHovering || this.isActive); }
	get active_cursor(): string { return new Angle(this.active_angle!).cursor_forAngle; }
	get thumb_opacity(): number { return this.isActive ? 1 : this.isHovering ? 0.4 : 0.15; }
	get cursor(): string { return this.isActive ? this.active_cursor : this.isHovering ? this.hover_cursor : k.cursor_default; }
	
}
