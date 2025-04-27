import S_Rotation from './S_Rotation';

// for resizing necklace

export default class S_Resizing extends S_Rotation {
	basis_radius: number | null = null;		// distance from arc radius to location of mouse DOWN

	get hover_cursor(): string { return 'all-scroll'; }
	reset() { super.reset(); this.basis_radius = null; }
	get isActive(): boolean { return !!this.basis_radius; }

}
