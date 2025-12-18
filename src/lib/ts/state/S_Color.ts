import { k, hits, colors, Ancestry, S_Hit_Target } from '../common/Global_Imports';
import Identifiable from '../runtime/Identifiable';
import { get } from 'svelte/store';

	//////////////////////////////////////////
	//										//
	//	State object for color computation	//
	//	Passed to ColorComputer methods		//
	//	Contains all boolean flags and		//
	//	context needed for color logic		//
	//										//
	//////////////////////////////////////////

export default class S_Color {
	hit_target?: S_Hit_Target;	// Hit target for hover detection (includes type + identifiable)
	identifiable?: Identifiable;	// Provides: isGrabbed, isEditing, isFocus, thing.color
	isInverted?: boolean;
	isDisabled?: boolean;
	isSelected?: boolean;
	subtype?: string;				// For special cases (e.g., T_Control.details)

	constructor(hit_target: S_Hit_Target | Identifiable | undefined, isDisabled?: boolean, isSelected?: boolean, isInverted?: boolean, subtype?: string) {
		if (hit_target instanceof S_Hit_Target) {
			this.hit_target = hit_target;
			this.identifiable = hit_target.identifiable ?? undefined;
		} else {
			this.identifiable = hit_target;
		}
		this.isDisabled = isDisabled;
		this.isSelected = isSelected;
		this.isInverted = isInverted;
		this.subtype = subtype;
	}

	get grabbed(): boolean { return this.ancestry?.isGrabbed ?? false; }
	get editing(): boolean { return this.ancestry?.isEditing ?? false; }
	get focus(): boolean { return this.ancestry?.isFocus ?? false; }
	get ancestry(): Ancestry { return this.identifiable as Ancestry; }
	get thing_color(): string { return this.ancestry?.thing?.color ?? k.empty; }

	get hover(): boolean {
		if (this.hit_target) {
			if (this.hit_target.isHovering) {
				return true;
			}
			// For widgets: also check if title with same ancestry is hovered
			if (this.hit_target.isAWidget && this.identifiable) {
				const hover_target = get(hits.w_s_hover);
				if (hover_target?.isAWidget && hover_target.identifiable?.id === this.identifiable.id) {
					return true;
				}
			}
			return false;
		}
		// Fallback: compare by identifiable (less precise, but works if no hit_target provided)
		const hover_target = get(hits.w_s_hover);
		return !!hover_target && !!this.identifiable && hover_target.identifiable?.id === this.identifiable.id;
	}
}
