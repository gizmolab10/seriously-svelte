import { k, colors, Ancestry, S_Element, T_Element } from '../common/Global_Imports';
import { w_background_color } from '../common/Stores';
import { get } from 'svelte/store';

export default class S_Widget extends S_Element {
	isGrabbed = false;		// NOT a source of truth
	isEditing = false;		// ... only needed for widget relayout

	constructor(ancestry: Ancestry) { super(ancestry, T_Element.widget, k.empty); }
	get shows_border(): boolean { return this.ancestry.isGrabbed || this.ancestry.isEditing; }

	get update_forStateChange(): boolean {
		const shallGrab = this.ancestry.isGrabbed;
		const shallEdit = this.ancestry.isEditing;
		const change = (this.isEditing != shallEdit || this.isGrabbed != shallGrab);
		this.isGrabbed = shallGrab;
		this.isEditing = shallEdit;
		return change;
	}

	get color(): string {
		const isFocus = this.ancestry.isFocus;
		const color = this.ancestry.thing?.color ?? k.empty;
		const luminance = colors.luminance_ofColor(color);
		return this.shows_border ? color : isFocus ? (luminance > 0.5 ? 'black' : 'white') : color;
	}

	get background_color(): string {
		const isFocus = this.ancestry.isFocus;
		const background_color = get(w_background_color);
		const color = this.ancestry.thing?.color ?? k.empty;
		return this.shows_border ? background_color : isFocus ? color : 'transparent';
	}
} 