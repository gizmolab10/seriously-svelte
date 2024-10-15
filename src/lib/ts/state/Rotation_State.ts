import { k, debug, Angle, cursors, svgPaths } from '../common/Global_Imports';

// for rotating (paging arcs and rotation ring)

export default class Rotation_State {
	base64_rotateSVG = btoa(encodeURIComponent(svgPaths.rotateSVG));		// untested
	active_angle: number | null = null;		// angle at location of mouse MOVE
	basis_angle: number | null = null;		// angle at location of mouse DOWN
	basis_opacity: number;
	isHovering = false;

	constructor(basis_opacity: number = 0.1) { this.basis_opacity = basis_opacity; }
	get hover_cursor(): string { return 'alias'; }
	reset() { this.basis_angle = this.active_angle = null; }
	get isHighlighted(): boolean { return (this.isHovering || this.isActive); }
	get isActive(): boolean { return !!this.basis_angle || this.active_angle == 0; }
	get active_cursor(): string { return new Angle(this.active_angle!).cursor_forAngle; }			// cursors.svg_cursor;
	get stroke_opacity(): number { return this.isHighlighted ? this.basis_opacity * 2 : this.basis_opacity; }
	get fill_opacity(): number { return this.isHighlighted ? this.basis_opacity * 0.3 : this.basis_opacity * 0.1; }
	get cursor(): string { return this.isActive ? this.active_cursor : this.isHovering ? this.hover_cursor : k.cursor_default; }
	get three_level_opacity(): number { return this.isActive ? 1 : this.isHovering ? this.basis_opacity * 4 : this.basis_opacity * 1.5; }
	
}
