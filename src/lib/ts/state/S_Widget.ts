import { Ancestry, S_Element, T_Hit_Target } from '../common/Global_Imports';
import { k, colors, controls, elements } from '../common/Global_Imports';
import { styles } from '../managers/Styles';
import { get } from 'svelte/store';
import S_Color from './S_Color';

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
	
	constructor(ancestry: Ancestry) {
		super(ancestry, T_Hit_Target.widget, k.empty);
		this.s_drag = elements.s_element_for(ancestry, T_Hit_Target.drag, k.empty);
		this.s_title = elements.s_element_for(ancestry, T_Hit_Target.title, k.empty);
		this.s_reveal = elements.s_element_for(ancestry, T_Hit_Target.reveal, k.empty);
	}

	get stroke(): string { return this.color; }
	get fill(): string { return this.background_color; }
	get background(): string { return `background-color: ${this.background_color}`; }
	
	get color(): string {
		const state = new S_Color(this, this.isDisabled, this.isSelected, this.isInverted, this.subtype);
		const computed = styles.get_widgetColors_for(state, this.thing_color, get(colors.w_background_color));
		return computed.color;
	}
	
	get background_color(): string {
		const state = new S_Color(this, this.isDisabled, this.isSelected, this.isInverted, this.subtype);
		const computed = styles.get_widgetColors_for(state, this.thing_color, get(colors.w_background_color));
		return computed.background_color;
	}
	
	get border(): string {
		const state = new S_Color(this, this.isDisabled, this.isSelected, this.isInverted, this.subtype);
		const computed = styles.get_widgetColors_for(state, this.thing_color, get(colors.w_background_color));
		return computed.border;
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

}
