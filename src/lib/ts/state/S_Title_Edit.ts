import { k, Thing, Ancestry, Seriously_Range } from '../common/Global_Imports';

export enum E_Edit {
	percolating	= 'percolating',
	stopping	= 'stopping',
	editing		= 'editing',
	done		= 'done',
}

export default class S_Title_Edit {
	e_edit = E_Edit.editing;
	ancestry: Ancestry;
	title = k.empty
	
	// singleton (store)
	// e_edit is source of truth for all editing
	// ancestry.thing is source of truth for selection range
	
	stop_editing() { this.e_edit = E_Edit.done; }
	get thing(): Thing | null { return this.ancestry.thing; }
	constructor(ancestry: Ancestry) { this.ancestry = ancestry; }
	get isActive(): boolean { return this.e_edit != E_Edit.done; }
	get description(): string { return `${this.e_edit} ${this.thing?.title}`; }
	get thing_selectionRange(): Seriously_Range | undefined { return this.thing?.selectionRange; }
	refersTo(ancestry: Ancestry): boolean { return this.ancestry.equals(ancestry); }
	actively_refersTo(ancestry: Ancestry): boolean { return this.refersTo(ancestry) && this.isActive; }
	inactively_refersTo(ancestry: Ancestry): boolean { return this.refersTo(ancestry) && !this.isActive; }
	thing_setSelectionRange_fromOffset(offset: number) { this.thing_setSelectionRange(new Seriously_Range(offset, offset)); }

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

	startEditing(ancestry: Ancestry) {
		this.e_edit = E_Edit.editing;
		this.ancestry = ancestry;
	}

	isAncestry_inState(ancestry: Ancestry | null, e_edit: string) {
		return (!ancestry || (!this.ancestry.equals(ancestry))) ? false : (this.e_edit == e_edit);
	}

	setState_temporarilyTo_whileApplying(e_edit: E_Edit, apply: () => void) {
		const saved = this.e_edit;
		this.e_edit = e_edit;
		apply();
		this.e_edit = saved;
	}

}