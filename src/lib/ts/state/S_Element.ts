import { k, ux, debug, colors, Ancestry, T_Element, layout } from '../common/Global_Imports';
import { w_background_color } from '../../ts/common/Stores';
import Identifiable from '../runtime/Identifiable';
import { get } from 'svelte/store';

	//////////////////////////////////////////
	//										//
	//	single point of truth for			//
	//	 stroke, fill, cursor & border of	//
	//	 buttons, segments & widget dots	//
	//	 using hover, grabbed, expanded		//
	//										//
	//	NEED to move dots to S_Widget?		//
	//										//
	//////////////////////////////////////////

export default class S_Element {
	responder: HTMLElement | null = null;
	dot_outline_color = 'transparent';
	defaultDisabledColor = '#999999';
	defaultCursor = k.cursor_default;
	hoverCursor = k.cursor_default;
	uses_background_color = false;
	identifiable!: Identifiable;
	color_background = 'white';
	hoverColor = 'transparent';
	type = T_Element.none;
	ignore_hover = false;
	isDisabled = false;
	isSelected = false;
	isInverted = false;
	subtype = k.empty;
	name = k.empty;
	isOut = true;
	constructor(identifiable: Identifiable, type: T_Element, subtype: string) {
		this.name = ux.name_from(identifiable, type, subtype);
		this.identifiable = identifiable;
		this.subtype = subtype;
		this.type = type;
		if (this.uses_background_color) {
			w_background_color.subscribe((background_color: string) => {
				this.color_background = background_color;
			})
		}
	}

	static empty() { return {}; }
	get ancestry(): Ancestry { return this.identifiable as Ancestry; }
	get color_isInverted(): boolean { return this.isInverted || this.isHovering; }
	get description(): string { return `${this.isOut ? 'out' : 'in '} '${this.name}'`; }
	get isHovering(): boolean { return this.ignore_hover ? false : this.isOut == this.isHoverInverted; }
	get cursor(): string { return (this.isHovering && !this.isDisabled) ? this.hoverCursor : this.defaultCursor; }
	get stroke(): string { return this.isDisabled ? this.disabledTextColor : this.color_isInverted ? this.color_background : this.hoverColor; }
	get disabledTextColor(): string { return colors.specialBlend(this.color_background, this.defaultDisabledColor, 0.3) ?? this.defaultDisabledColor; }
	get fill(): string { return this.isDisabled ? 'transparent' : this.color_isInverted ? this.hoverColor : this.isSelected ? 'lightblue' : this.color_background; }

	set_forHovering(hoverColor: string, hoverCursor: string) {
		console.log(`set_forHovering "${this.name}" "${hoverColor}" "${hoverCursor}"`);
		this.hoverCursor = hoverCursor;
		this.hoverColor = hoverColor;
	}

	get isHoverInverted(): boolean {
		const a = this.ancestry;
		const isInverted = a.isGrabbed || a.isEditing;
		switch (this.type) {
			case T_Element.reveal: return layout.inTreeMode && a.isExpanded == isInverted;
			default: return isInverted;
		}
	}
	
	get border(): string {
		const color = this.ancestry.thing?.color;
		if (!!color) {
			if (this.ancestry.isEditing) {
				return `dashed ${color} 1px`;
			}
			if (this.ancestry.isFocus) {
				return `solid ${color} 1px`;
			}
		}
		return 'solid transparent 1px';
	}

}
