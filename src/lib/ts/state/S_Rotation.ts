import { k, s, colors, Angle, S_Hit_Target, T_Hit_Target } from '../common/Global_Imports';
import { get } from 'svelte/store';

// for rotating (paging thumb and ring)

export default class S_Rotation extends S_Hit_Target {
	active_angle: number | null = null;		// current angle (at location of mouse MOVE)
	basis_angle: number | null = null;		// starting angle (where mouse went DOWN)
	fill_color = 'transparent';

	constructor(type: T_Hit_Target = T_Hit_Target.rotation) {
		super(type, get(s.w_ancestry_focus));
		setTimeout(() => {
			this.reset();
		}, 1);
	}

	get hover_cursor():	  string { return 'alias'; }
	get isDragging():	 boolean { return !!this.basis_angle; }		// user has clicked and is dragging
	get isHighlighted(): boolean { return (this.isHovering || this.isDragging); }
	get active_cursor():  string { return new Angle(this.active_angle!).cursor_forAngle; }
	get color():		  string { return this.ancestry?.thing?.color ?? colors.default_forThings; }
	get stroke_opacity(): number { return this.isHovering ? k.opacity.radial.hover : k.opacity.none; }
	get fill_opacity():	  number { return this.isHovering ? k.opacity.radial.armature : k.opacity.radial.default; }
	get cursor():		  string { return this.isDragging ? this.active_cursor : this.isHovering ? this.hover_cursor : k.cursor_default; }
	get thumb_opacity():  number { return this.isDragging ? k.opacity.radial.active : this.isHovering ? k.opacity.radial.hover : k.opacity.radial.thumb; }
	reset()						 { this.basis_angle = this.active_angle = null; this.update_fill_color(); }
	update_fill_color()			 { this.fill_color = colors.opacitize(this.color, this.fill_opacity) }

	
}
