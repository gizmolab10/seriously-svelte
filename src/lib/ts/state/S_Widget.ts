import { k, colors, Ancestry, S_Element, T_Element } from '../common/Global_Imports';
import { w_background_color } from '../common/Stores';
import { get } from 'svelte/store';

	//////////////////////////////////////////
	//										//
	// widgets, titles, dots & breadcrumbs	//
	//	 use this to preserve state			//
	//	 across reattachment				//
	//										//
	// computes color, background, border	//
	// influenced by grab, edit, focus		//	
	//										//
	//	no hover & no expanded				//
	//										//
	//////////////////////////////////////////

export default class S_Widget extends S_Element {
	isGrabbed = false;		// NOT a source of truth
	isEditing = false;		// ... only needed for detecting state changes
	isFocus	  = false;
	
	get stroke(): string { return this.color; }
	get fill(): string { return this.background_color; }
	get thing_color(): string { return this.ancestry.thing?.color ?? k.empty; }
	constructor(ancestry: Ancestry) { super(ancestry, T_Element.widget, k.empty); }
	get background(): string { return `background-color: ${this.background_color}`; }
	get isFilled(): boolean { return this.ancestry.isGrabbed && !this.ancestry.isEditing; }
	get shows_border(): boolean { return this.ancestry.isFocus || this.ancestry.isEditing; }
	get background_color(): string { return this.isFilled ? this.thing_color : this.shows_border ? get(w_background_color) : 'transparent'; }

	get color(): string {
		const luminance = colors.luminance_ofColor(this.thing_color);
		return (this.isFilled) ? (luminance > 0.5 ? 'black' : 'white') : this.thing_color;
	}

	get state_didChange(): boolean {
		const didGrab = this.ancestry.isGrabbed;
		const didEdit = this.ancestry.isEditing;
		const didFocus = this.ancestry.isFocus;
		const change = (this.isEditing != didEdit || this.isGrabbed != didGrab || this.isFocus != didFocus);
		this.isGrabbed = didGrab;
		this.isEditing = didEdit;
		this.isFocus = didFocus;
		return change;
	}

} 