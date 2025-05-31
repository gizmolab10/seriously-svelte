import { w_s_text_edit } from '../common/Stores';
import { Ancestry } from '../common/Global_Imports';
import { T_Edit } from './S_Text_Edit';
import { get } from 'svelte/store';

export default class S_Widget {
	ancestry!: Ancestry;
	isGrabbed = false;		// NOT a source of truth
	isEditing = false;		// ... only needed for widget relayout

	constructor(ancestry: Ancestry) { this.ancestry = ancestry; }

	get update_forStateChange(): boolean {
		const shallGrab = this.ancestry.isGrabbed;
		const shallEdit = get(w_s_text_edit)?.ancestry_isEditing(this.ancestry) ?? false;
		const change = (this.isEditing != shallEdit || this.isGrabbed != shallGrab);
		// console.log('  S_Widget update forStateChange', change);
		this.isGrabbed = shallGrab;
		this.isEditing = shallEdit;
		return change;
	}

} 