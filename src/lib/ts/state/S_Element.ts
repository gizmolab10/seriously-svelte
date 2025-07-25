import { w_ancestries_grabbed, w_control_key_down, w_background_color } from '../../ts/common/Stores';
import { k, ux, colors, Ancestry, T_Element } from '../common/Global_Imports';
import Identifiable from '../runtime/Identifiable';
import { get } from 'svelte/store';

	//////////////////////////////////////////
	//										//
	//	single point of truth for			//
	//	  stroke, fill, cursor & border of	//
	//	  buttons, segments & widget dots	//
	//	  using hover, grabbed, expanded	//
	//										//
	//	NEED to move dots to S_Widget?		//
	//										//
	//////////////////////////////////////////

export default class S_Element {
	responder: HTMLElement | null = null;
	defaultDisabledColor = '#999999';
	defaultCursor = k.cursor_default;
	hoverCursor = k.cursor_default;
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
		if (this.isADot) {
			w_ancestries_grabbed.subscribe((grabbed) => {
				this.isInverted = grabbed.includes(this.ancestry);
			});
			this.color_background = get(w_background_color);
		}
	}

	static empty() { return {}; }
	get ancestry(): Ancestry { return this.identifiable as Ancestry; }
	get color_isInverted(): boolean { return this.isInverted != this.isHovering; }
	get description(): string { return `${this.isOut ? 'out' : 'in '} '${this.name}'`; }
	get isADot(): boolean { return this.type == T_Element.drag || this.type == T_Element.reveal; }
	get show_help_cursor(): boolean { return get(w_control_key_down) && this.type == T_Element.action; }
	get isHovering(): boolean { return this.ignore_hover ? false : this.isOut == this.isHoverInverted; }
	get stroke(): string { return this.isDisabled ? this.disabledTextColor : this.color_isInverted ? this.color_background : this.hoverColor; }
	get cursor(): string { return (this.isHovering && !this.isDisabled) ? this.show_help_cursor ? 'help' : this.hoverCursor : this.defaultCursor; }
	get disabledTextColor(): string { return colors.specialBlend(this.color_background, this.defaultDisabledColor, 0.3) ?? this.defaultDisabledColor; }
	get fill(): string { return this.isDisabled ? 'transparent' : this.color_isInverted ? this.hoverColor : this.isSelected ? 'lightblue' : this.color_background; }

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

	set_forHovering(hoverColor: string, hoverCursor: string) {
		this.hoverCursor = hoverCursor;
		this.hoverColor = hoverColor;
	}

	get isHoverInverted(): boolean {
		if (this.isADot) {
			const a = this.ancestry;
			switch (this.type) {
				case T_Element.reveal: return ux.inTreeMode && a.isExpanded == a.isEditing;
				default:			   return a.isEditing;
			}
		} else {
			return this.isInverted;
		}
	}
	
	get border(): string {
		const color = this.ancestry.thing?.color;
		if (!!color) {
			if (this.ancestry.isEditing) {
				return `dashed ${color} 1px`;
			}
			if (this.ancestry.isFocus || !this.isOut) {
				return `solid ${color} 1px`;
			}
		}
		return 'solid transparent 1px';
	}

}
