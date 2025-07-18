import { k, colors, Ancestry, S_Element, T_Element, ux } from '../common/Global_Imports';
import { w_background_color } from '../common/Stores';
import { get } from 'svelte/store';

	//////////////////////////////////////////
	//										//
	// widgets, titles, dots & breadcrumbs	//
	//	 use this to preserve state			//
	//	 across reattachment				//
	//										//
	// computes color, background, border	//
	//										//
	//	responds to grab, edit, focus,		//	
	//	hover & expand						//
	//										//
	//////////////////////////////////////////

export default class S_Widget extends S_Element {
	es_reveal: S_Element;
	es_title: S_Element;
	es_drag: S_Element;
	isGrabbed = false;		// NOT a source of truth
	isEditing = false;		// ... only needed for detecting state changes
	isFocus	  = false;

	get stroke(): string { return this.color; }
	get fill(): string { return this.background_color; }
	get thing_color(): string { return this.ancestry.thing?.color ?? k.empty; }
	get background(): string { return `background-color: ${this.background_color}`; }
	get isFilled(): boolean { return this.ancestry.isGrabbed && !this.ancestry.isEditing; }
	get shows_border(): boolean { return this.ancestry.isFocus || this.ancestry.isEditing || !this.isOut; }
	get background_color(): string { return this.isFilled ? this.thing_color : this.shows_border ? get(w_background_color) : 'transparent'; }

	constructor(ancestry: Ancestry) {
		super(ancestry, T_Element.widget, k.empty);
		this.es_drag = ux.s_element_for(ancestry, T_Element.drag, k.empty);
		this.es_title = ux.s_element_for(ancestry, T_Element.title, k.empty);
		this.es_reveal = ux.s_element_for(ancestry, T_Element.reveal, k.empty);
	}

	get color(): string {
		const isLight = colors.luminance_ofColor(this.thing_color) > 0.5;
		return isLight
			? ((!this.ancestry.isGrabbed && !this.ancestry.isEditing) ? this.thing_color : 'black')
			: (this.ancestry.isGrabbed && !this.ancestry.isEditing) ? 'white' : this.thing_color;
	}

	get state_didChange(): boolean {
		const didFocus = this.ancestry.isFocus;
		const didGrab = this.ancestry.isGrabbed;
		const didEdit = this.ancestry.isEditing;
		const change = (this.isEditing != didEdit || this.isGrabbed != didGrab || this.isFocus != didFocus);
		this.isGrabbed = didGrab;
		this.isEditing = didEdit;
		this.isFocus = didFocus;
		return change;
	}

} 