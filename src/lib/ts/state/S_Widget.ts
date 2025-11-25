import { k, colors, elements, Ancestry, S_Element, T_Detectable } from '../common/Global_Imports';
import { get } from 'svelte/store';

	//////////////////////////////////////////
	//										//
	// widgets, titles, dots & breadcrumbs	//
	//	 use this to preserve state			//
	//	 across reattachment				//
	//										//
	// computes color, background, border	//
	//										//
	//	responds to grab, edit,	focus,		//	
	//	hover & expand						//
	//										//
	//////////////////////////////////////////

export default class S_Widget extends S_Element {
	s_reveal: S_Element;
	s_title: S_Element;
	s_drag: S_Element;
	isGrabbed = false;		// NOT a source of truth
	isEditing = false;		// ... only needed for detecting state changes
	isFocus	  = false;

	get stroke(): string { return this.color; }
	get fill(): string { return this.background_color; }
	get thing_color(): string { return this.ancestry.thing?.color ?? k.empty; }
	get background(): string { return `background-color: ${this.background_color}`; }
	get isFilled(): boolean { return this.ancestry.isGrabbed && !this.ancestry.isEditing; }
	get shows_border(): boolean { return this.ancestry.isGrabbed || this.ancestry.isEditing || this.isHovering; }
	get color(): string { return this.colorFor_grabbed_andEditing(this.ancestry.isGrabbed, this.ancestry.isEditing); }
	get background_color(): string { return this.isFilled ? this.thing_color : this.shows_border ? get(colors.w_background_color) : 'transparent'; }
	
	constructor(ancestry: Ancestry) {
		super(ancestry, T_Detectable.widget, k.empty);
		this.s_drag = elements.s_element_for(ancestry, T_Detectable.drag, k.empty);
		this.s_title = elements.s_element_for(ancestry, T_Detectable.title, k.empty);
		this.s_reveal = elements.s_element_for(ancestry, T_Detectable.reveal, k.empty);
	}

	get update_state_didChange(): boolean {
		const wantsFocus = this.ancestry.isFocus;
		const wantsEdit = this.ancestry.isEditing;
		const wantsGrab = this.ancestry.isGrabbed;
		const change = (this.isEditing != wantsEdit || this.isGrabbed != wantsGrab || this.isFocus != wantsFocus);
		this.isGrabbed = wantsGrab;
		this.isEditing = wantsEdit;
		this.isFocus = wantsFocus;
		return change;
	}

	colorFor_grabbed_andEditing(isGrabbed: boolean, isEditing: boolean): string {
		const isLight = colors.luminance_ofColor(this.thing_color) > 0.5;
		return isLight
			? ((!isGrabbed && !isEditing) ? this.thing_color : 'black')
			: (isGrabbed && !isEditing) ? 'white' : this.thing_color;
	}
} 