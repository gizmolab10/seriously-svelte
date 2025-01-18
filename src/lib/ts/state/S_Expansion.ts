import S_Rotation from './S_Rotation';

// for resizing (resize ring)

export default class S_Expansion extends S_Rotation {
	basis_radius: number | null = null;		// distance from arc radius to location of mouse DOWN

	constructor() { super(0.03); }
	get hover_cursor(): string { return 'all-scroll'; }
	reset() { super.reset(); this.basis_radius = null; }
	get isActive(): boolean { return !!this.basis_radius; }
	get stroke_opacity(): number { return this.isHighlighted ? this.basis_opacity * 5 : this.basis_opacity; }
	get fill_opacity(): number { return this.isHighlighted ? this.basis_opacity * 0.5 : this.basis_opacity * 0.15; }

}
