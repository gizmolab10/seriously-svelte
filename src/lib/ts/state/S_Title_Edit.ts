import { Thing, Ancestry, Seriously_Range } from '../common/Global_Imports';

export enum T_Edit {
	percolating	= 'percolating',
	stopping	= 'stopping',
	editing		= 'editing',
	done		= 'done',
}

export default class S_Title_Edit {
	t_edit = T_Edit.editing;
	ancestry: Ancestry;
	
	constructor(ancestry: Ancestry) { this.ancestry = ancestry; }
	get thing(): Thing | null { return this.ancestry.thing; }
	
	// thing is source of truth for selection range
	// why? it initially uses title width

	get thing_selectionRange(): Seriously_Range | undefined {
		return this.thing?.selectionRange;
	}

	thing_setSelectionRange_fromOffset(offset: number) {
		this.thing_setSelectionRange(new Seriously_Range(offset, offset));
	}

	thing_setSelectionRange(range: Seriously_Range) {
		if (!!this.thing) {
			this.thing.selectionRange = range;
		}
	}
	
	// ///////////////////////////////////////////
	//											//
	// single source of truth for editing state //
	//											//
	// ///////////////////////////////////////////

	// created by ancestry start edit
	// widget reacts to changes too it
	// title editor calls blur if isEditStopping is true
	// ancestry props that reference this object: {isEditing, isEditStopping, isEditPercolating}

	isAncestry_inState(ancestry: Ancestry | null, t_edit: string) {
		return (!ancestry || (this.ancestry.pathString != ancestry.pathString)) ? false : (this.t_edit == t_edit);
	}

	setState_temporarily_whileApplying(t_edit: T_Edit, apply: () => void) {
		const saved = this.t_edit;
		this.t_edit = t_edit;
		apply();
		setTimeout(() => {
			this.t_edit = saved;
		}, 1);
	}

}