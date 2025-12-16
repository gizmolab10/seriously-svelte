import { S_Hit_Target, T_Hit_Target, T_Control, controls } from '../common/Global_Imports';
import { k, s, colors, elements } from '../common/Global_Imports';
import Identifiable from '../runtime/Identifiable';
import { get } from 'svelte/store';

	//////////////////////////////////////////
	//										//
	//	single point of truth for			//
	//	  stroke, fill, cursor & border of	//
	//	  buttons, segments & widget dots	//
	//	  grabbed, expanded					//
	//										//
	//////////////////////////////////////////

export default class S_Element extends S_Hit_Target {
	color_background = 'transparent';
	defaultDisabledColor = '#999999'
	isDisabled = false;
	isSelected = false;
	isInverted = false;		// means color for hover == as though not hovering (and vice versa)
	subtype = k.empty;
	isFocus = false;
	name = k.empty;

	constructor(identifiable: Identifiable, type: T_Hit_Target, subtype: string) {
		super(type, identifiable);
		this.name = elements.name_from(identifiable, type, subtype);
		this.subtype = subtype;
		if (this.isADot) { 
			this.color_background = subtype == T_Control.search ? 'transparent' : get(colors.w_background_color);
		}
	}

	get color_isInverted(): boolean { return this.isInverted != this.isHovering; }
	get show_help_cursor(): boolean { return get(s.w_control_key_down) && this.type == T_Hit_Target.action; }
	get fill():				 string { return this.isDisabled ? 'transparent' : this.color_isInverted ? this.hoverColor : this.isSelected ? 'lightblue' : this.color_background; }
	get cursor():			 string { return (this.isHovering && !this.isDisabled) ? this.show_help_cursor ? 'help' : this.hoverCursor : this.defaultCursor; }
	get stroke():			 string { return this.isDisabled ? this.disabledTextColor : this.color_isInverted ? this.color_background : this.element_color; }
	get disabledTextColor(): string { return colors.specialBlend(this.color_background, this.defaultDisabledColor, 0.3) ?? this.defaultDisabledColor; }
	get description():		 string { return `${this.isHovering ? 'in' : 'out '} '${this.name}'`; }
	
	get svg_outline_color(): string {
		const thing_color = this.ancestry.thing?.color ?? k.empty;
		const isLight = colors.luminance_ofColor(thing_color) > 0.5;
		return (!this.ancestry.isGrabbed && !this.ancestry.isEditing)
			? thing_color
			: (this.ancestry.isGrabbed && !this.ancestry.isEditing)
			? this.color_background
			: isLight
			? 'black'
			: this.hoverColor	;
	}
	
	get border(): string {
		const color = this.ancestry.thing?.color;
		if (!!color) {
			if (this.ancestry.isEditing) {
				return `dashed ${color} 1px`;
			}
			if (controls.inRadialMode && this.ancestry.isFocus && !this.ancestry.isGrabbed) {
				return `solid ${color} 1px`;
			}
			if (this.isHovering) {
				return `solid ${colors.ofBackgroundFor(color)} 1px`;
			}
		}
		return 'solid transparent 1px';
	}

}
