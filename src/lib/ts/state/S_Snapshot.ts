import { k, S_Element, T_Hit_Target } from '../common/Global_Imports';

	//////////////////////////////////////
	//									//
	//  snapshot of s_element			//
	//	  occupying user's attention	//
	//	used by Styles manager			//
	//	  to compute colors				//
	//									//
	//////////////////////////////////////

export default class S_Snapshot {
	t_hover_target: T_Hit_Target | null;
	isInverted: 	boolean;
	isDisabled: 	boolean;
	isSelected: 	boolean;
	isHovering: 	boolean;
	isGrabbed:  	boolean;
	isEditing:  	boolean;
	isFocus:    	boolean;
	subtype:    	string;
	thing_color:	string;

	constructor(s_element: S_Element) {
		// snapshot the state of the element
		this.subtype		= s_element.subtype;
		this.isDisabled 	= s_element.isDisabled;
		this.isSelected 	= s_element.isSelected;
		this.isInverted 	= s_element.isInverted;
		this.isHovering 	= s_element.isHovering;
		this.isFocus		= s_element.ancestry.isFocus;
		this.isGrabbed  	= s_element.ancestry.isGrabbed;
		this.isEditing  	= s_element.ancestry.isEditing;
		this.thing_color	= s_element.ancestry.thing?.color ?? k.empty;
		this.t_hover_target = s_element.isHovering ? s_element.type : null;
	}

}

