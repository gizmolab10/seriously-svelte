import { w_s_title_edit } from '../managers/Stores';
import { Ancestry } from '../common/Global_Imports';
import { T_Edit } from './S_Title_Edit';
import { get } from 'svelte/store';

export default class S_Widget {
	ancestry!: Ancestry;
	isGrabbed = false;		// NOT a source of truth
	isEditing = false;		// ... only needed for widget relayout

	constructor(ancestry: Ancestry) { this.ancestry = ancestry; }

	get update_forChange(): boolean {
		const shallGrab = this.ancestry.isGrabbed;
		const shallEdit = get(w_s_title_edit)?.isAncestry_inState(this.ancestry, T_Edit.editing) ?? false;
		const change = (this.isEditing != shallEdit || this.isGrabbed != shallGrab);
		this.isGrabbed = shallGrab;
		this.isEditing = shallEdit;
		return change;
	}

} 